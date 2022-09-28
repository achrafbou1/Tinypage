/**
 * This service takes care of transactional tasks for Subscriptions.
 */
import {DatabaseService} from "./database-service";
import {DatabaseManager} from "../data/database-manager";
import Stripe from "stripe";
import {HttpError} from "../utils/http-error";
import {StatusCodes} from "http-status-codes";
import {Permission, PermissionUtils} from "../utils/permission-utils";
import {config} from "../config/config";
import {ReplyUtils} from "../utils/reply-utils";
import {Auth} from "../utils/auth";
import {FastifyReply} from "fastify";

/**
 * Handles payment stuff.
 */
export class SubscriptionService extends DatabaseService {
    stripe: Stripe;

    constructor(databaseManager: DatabaseManager, stripe: Stripe) {
        super(databaseManager);

        this.stripe = stripe;
    }

    /**
     * Sets the Stripe Id for an account.
     * Set null to disable.
     *
     * @param userId
     * @param stripeId
     */
    async setStripeId(userId: string, stripeId?: string) {
        let queryResult = await this.pool.query<{ stripe_id: string | null | undefined }>("update app.users set private_metadata = jsonb_set(private_metadata::jsonb, '{stripeId}', $1, true) where id=$2 returning private_metadata->>'stripeId' as stripe_id",
            [
                JSON.stringify(stripeId),
                userId
            ]);

        if (queryResult.rowCount < 1)
            throw new HttpError(StatusCodes.NOT_FOUND, "The user couldn't be found.");

        return queryResult.rows[0].stripe_id;
    }

    async getBillingInfo(user: SensitiveUser) {
        let customer = await this.getOrCreateStripeCustomer(user);

        if (!customer || customer.deleted)
            throw new HttpError(StatusCodes.NOT_FOUND, "The customer data couldn't be found for this user!");

        return {
            fullName: customer.name,
            companyName: customer.metadata.company,
            phone: customer.phone,
            address: customer.address?.line1,
            city: customer.address?.city,
            zipCode: customer.address?.postal_code,
            country: customer.address?.country,
        };
    }

    async createOrUpdateSubscription(user: User, eventObject: any, create: boolean) {
        let item = eventObject.plan.product;
        let product = await this.stripe.products.retrieve(item);
        let tier = product?.metadata.permission;
        let allowDowngrade = false;
        if (eventObject.cancel_at) {
            tier = 'free';
            allowDowngrade = true;
        }


        if (tier) {
            await this.setDbSubscriptionTier(user, tier, allowDowngrade, create, eventObject, product.id);
            await this.checkProfilesForOverLimit(user.id);
        } else {
            console.error("[customer.subscription.updated] Couldn't set subscription for user: " + user.id + " to tier " + tier);
        }
    }

    async getProducts() {
        let products: Stripe.Product[] = (await this.stripe.products.list({active: true})).data;

        let data = [];

        for (let product of products) {
            if (product.metadata?.tinypage?.toLowerCase() !== "true")
                continue;

            let prices = (await this.stripe.prices.list({
                product: product.id,
                limit: 1
            })).data;
            let price = prices[0];

            data.push({
                id: product.id,
                name: product.name,
                metadata: product.metadata,
                order: product.metadata?.order ?? -1,
                price: price
            });
        }

        data.sort((a, b) => {
            if (a.order === b.order) return 0;
            if (a.order < b.order) return -1;
            if (a.order > b.order) return 1;

            return 0;
        });

        return data;
    }

    async getCardInfo(user: SensitiveUser) {
        let customer = await this.getOrCreateStripeCustomer(user);

        if (!customer)
            throw new HttpError(StatusCodes.NOT_FOUND, "The customer data couldn't be found for this user!");

        if (customer.deleted) {
            return {
                deleted: true
            };
        }

        let payments = (await this.stripe.paymentMethods.list({
            type: "card",
            customer: customer.id,
            limit: 1
        })).data;

        let paymentInfo;

        for (let payment of payments) {
            let card = payment.card as Stripe.PaymentMethod.Card & { name: string } | undefined;

            let name = card?.name;
            let last4 = card?.last4;
            let expMonth = String(card?.exp_month ?? "0");
            let expYear = String(card?.exp_year ?? "0000");

            paymentInfo = {
                name,
                last4,
                expDate: expMonth + '/' + expYear.substr(-2)
            };
        }

        return paymentInfo;
    }

    async deleteSubscription(profileId: string, user: SensitiveUser, reply: FastifyReply) {
        try {
            let customer = await this.getOrCreateStripeCustomer(user);

            if (!customer || customer.deleted) {
                reply.status(StatusCodes.NOT_FOUND);
                return ReplyUtils.error("A stripe customer does not exist for the provided user.");
            }

            const ownsProfile = await Auth.checkProfileOwnership(this.pool, profileId, user.id, false);

            if (!ownsProfile) {
                reply.status(StatusCodes.UNAUTHORIZED);
                return ReplyUtils.error("You do not own this profile.");
            }

            const queryResult = await this.pool.query<{ subscription_id: string }>("select subscription_id from enterprise.subscriptions WHERE profile_id=$1 AND tier='pro'", [profileId]);
            if (queryResult.rowCount < 1) {
                reply.status(StatusCodes.UNAUTHORIZED);
                return ReplyUtils.error("This profile is not subscribed.");
            }
            try {
            const deleted = await this.stripe.subscriptions.del(
                queryResult.rows[0].subscription_id
            );
                if (deleted.cancel_at_period_end) {
                    reply.status(StatusCodes.UNAUTHORIZED);
                    return ReplyUtils.success("Successfully downgraded !");
                }
            } catch (err: any) {
                if (err.code === "resource_missing") {
                    reply.status(StatusCodes.NOT_FOUND);
                    return ReplyUtils.success("Subscription not found.");
                }
                console.log(err);
            }


        } catch (e) {
            if (e instanceof HttpError) {
                if (e.statusCode !== StatusCodes.NOT_FOUND) {
                    reply.code(e.statusCode);
                    return ReplyUtils.error(e.message, e);
                }
            }
        }
        return ReplyUtils.success("Successfully unsubscribed");
    }

    async setCardInfo(user: SensitiveUser, card?: { number: string | null; expDate: string | null; cvc: string | null; }) {
        let customer = await this.getOrCreateStripeCustomer(user);

        if (!customer)
            throw new HttpError(StatusCodes.NOT_FOUND, "The customer data couldn't be found for this user!");

        await this.setStripeId(user.id, customer.id);

        let payments = (await this.stripe.paymentMethods.list({
            type: "card",
            customer: customer.id,
            limit: 1
        })).data;

        if (!card || !card.number || !card.expDate || !card.cvc) {
            let promises = [];

            for (let payment of payments) {
                promises.push(this.stripe.paymentMethods.detach(payment.id));
            }

            await Promise.all(promises);

            console.log("Payment methods deleted for user: " + user.id);
            return;
        }

        let expirations = card.expDate.split("/");

        let paymentParams: Stripe.PaymentMethodCreateParams = {
            card: {
                number: card.number,
                exp_month: Number.parseInt(expirations[0]),
                exp_year: Number.parseInt(expirations[1]),
                cvc: card.cvc,
            },
            type: "card"
        };

        let paymentMethod = await this.stripe.paymentMethods.create(paymentParams);

        if (paymentMethod.created)
            console.log("New payment method created at: " + paymentMethod.created);

        await this.stripe.paymentMethods.attach(paymentMethod.id, {customer: customer.id});
        await this.stripe.customers.update(customer.id, {
            invoice_settings: {
                default_payment_method: paymentMethod.id
            }
        });

        let promises = [];

        for (let payment of payments) {
            promises.push(this.stripe.paymentMethods.detach(payment.id));
        }

        await Promise.all(promises);

        console.log("Payment method attached to customer: " + customer.id);
    }

    async getSubscription(user: User): Promise<DbSubscription | DbProduct> {
        let currentPermission = await PermissionUtils.getCurrentPermission(user.id);
        if (currentPermission.permLevel >= Permission.GODMODE.permLevel) {
            return {
                user_id: user.id,
                tier: currentPermission.name,
                product_id: null,
                created_on: null,
                purchase_type: 'recurring'
            };
        }

        let sub = await PermissionUtils.getSubscription(user.id);
        let purchase = await PermissionUtils.getGreatestProductPurchase(user.id);

        let subPerm = Permission.parse(sub.tier);
        let purchasePerm = Permission.parse(purchase.tier);

        if (subPerm.permLevel > purchasePerm.permLevel) {
            return {
                user_id: user.id,
                tier: sub.tier,
                product_id: sub.product_id,
                created_on: sub.created_on,
                purchase_type: sub.purchase_type
            };
        } else {
            return {
                user_id: user.id,
                tier: purchase.tier,
                product_id: purchase.product_id,
                created_on: purchase.created_on,
                purchase_type: purchase.purchase_type
            };
        }
    }

    /**
     * Records the subscription tier into the database.
     *
     * @param user
     * @param tier
     * @param allowDowngrade
     * @param create
     * @param eventObject
     * @param productId
     */
    async setDbSubscriptionTier(user: User, tier: SubscriptionTier, allowDowngrade: boolean, create: boolean, eventObject: any, productId?: string) {
        const subscriptionId = eventObject.object === 'subscription' ? eventObject.id : null;
        if (!allowDowngrade) {
            let oldPerm = await PermissionUtils.getCurrentPermission(user.id);
            let newPerm = Permission.parse(tier);

            if (oldPerm.permLevel > newPerm.permLevel) {
                console.log(`Tried to downgrade subscription tier when it wasn't allowed. User: ${user.id} oldTier: ${oldPerm.name} newTier: ${newPerm.name}`);
                return;
            }
        }
        let queryResult;
        if (create) {
            const profileId = eventObject.metadata.profileId;
            queryResult = await this.pool.query<DbUser>("insert into enterprise.subscriptions(user_id, tier, product_id, last_updated, subscription_id, profile_id) values ($1, $2, $3, $4, $5, $6) ON CONFLICT (profile_id) DO UPDATE SET user_id=$1, tier=$2, product_id=$3, last_updated=$4, subscription_id=$5, profile_id=$6",
                [
                    user.id,
                    tier,
                    productId,
                    new Date(),
                    subscriptionId,
                    profileId
                ]);
        } else {
            let updateQuery = "update enterprise.subscriptions set user_id=$1, tier=$2, product_id=$3, last_updated=$4";
            let updateValues = [
                user.id,
                tier,
                productId,
                new Date()
            ];
            if (subscriptionId) {
                updateQuery += " where subscription_id=$5";
                updateValues.push(subscriptionId);
            } else {
                updateQuery += " where user_id=$1";
            }
            queryResult = await this.pool.query<DbUser>(updateQuery,
                updateValues);
        }
        if (queryResult.rowCount <= 0) {
            throw new HttpError(StatusCodes.NOT_FOUND, "The user couldn't be found.");
        }
    }

    async getDetailedPurchaseInfo(user: User) {
        let sub = await this.getSubscription(user);

        return this.createPurchaseDetails(sub);
    }

    async createPurchaseDetails(subDesc: DbSubscription | DbProduct): Promise<(DbSubscription | DbProduct) & { product: Stripe.Product | null, price: Stripe.Price | null }> {
        (<any>subDesc).product = null;
        (<any>subDesc).price = null;
        let subInfo: DbSubscription & { product: Stripe.Product | null, price: Stripe.Price | null } = <any>subDesc;

        if (subInfo.product_id) {
            subInfo.product = await this.stripe.products.retrieve(subInfo.product_id);
        }

        if (subInfo.product_id) {
            let prices = (await this.stripe.prices.list({
                product: subInfo.product_id,
                limit: 1
            })).data;
            (<any>subDesc).price = prices[0];
        }

        return subInfo;
    }

    async getOrCreateStripeCustomer(user: SensitiveUser): Promise<Stripe.Customer | Stripe.DeletedCustomer | undefined> {
        let id = user.privateMetadata.stripeId ?? null;

        if (id) {
            try {
                let cus = await this.stripe.customers.retrieve(id);

                if (!cus.deleted) {
                    return cus;
                }
            } catch (e) {
                // ignore
            }
        }

        try {
            let newCustomer = await this.stripe.customers.create({
                email: user.email,
                description: 'Tinypage Customer',
                metadata: {
                    product: "Tinypage"
                }
            }, undefined);

            await this.setStripeId(user.id, newCustomer.id);

            return newCustomer;
        } catch (e) {
            await this.setStripeId(user.id);
        }
    }

    async deleteStripeCustomer(user: SensitiveUser) {
        let id = user.privateMetadata.stripeId ?? null;

        if (id) {
            try {
                let cus = await this.stripe.customers.retrieve(id);

                this.stripe.customers.del(cus.id);
            } catch (e) {
                // ignore
            }
        }

        try {
            let customers = (await this.stripe.customers.list({email: user.email})).data;

            for (let customer of customers) {
                if (!customer.deleted) {
                    this.stripe.customers.del(customer.id);
                }
            }
        } catch (e) {

        }
    }

    /**
     * Checks profiles to make sure that the user doesn't have more profiles than permitted published.
     */
    async checkProfilesForOverLimit(userId: string) {
        if (!config.payments.stripeSecret)
            return;

        let perm = await PermissionUtils.getCurrentPermission(userId);

        if (perm.name === Permission.FREE.name) {
            await this.pool.query("update app.profiles set visibility='unpublished' where profiles.user_id=$1", [userId]);
        } else {
            let number = await this.countPublishedProfiles(userId);
            let numOfAllowedPages = await this.getNumOfAllowedPages(perm, userId);
            if (number > numOfAllowedPages) {
                let queryResult = await this.pool.query<{ id: string }>("select id from app.profiles where profiles.user_id=$1 limit $2", [userId, numOfAllowedPages]);
                await this.pool.query("update app.profiles set visibility='unpublished' where profiles.id != all($1) and user_id=$2", [queryResult.rows, userId]);
            }
        }
    }

    private async countPublishedProfiles(userId: string): Promise<number> {
        let queryResult = await this.pool.query<{ count: number }>("select count(*) from app.profiles where user_id=$1 and visibility != 'unpublished'", [userId]);

        return queryResult.rows[0].count;
    }

    private async getNumOfAllowedPages(perm: Permission, userId: string): Promise<number> {
        if (perm.name === Permission.GODMODE.name) {
            return 9999;
        }
        let queryResult = await this.pool.query<{ count: number }>("select count(*) from enterprise.subscriptions where user_id=$1 and tier!='free'", [userId]);
        return queryResult.rows[0].count;
    }
}
