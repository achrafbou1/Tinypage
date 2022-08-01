import {Controller} from "./controller";
import {FastifyInstance, FastifyReply, FastifyRequest} from "fastify";
import {DatabaseManager} from "../data/database-manager";
import Mixpanel from "mixpanel";
import {config} from "../config/config";
import {Stripe} from "stripe";
import {SubscriptionService} from "../services/subscription-service";
import {StatusCodes} from "http-status-codes";
import {UserService} from "../services/user-service";
import {PermissionUtils} from "../utils/permission-utils";

/**
 * Contains routes for stripe webhook callbacks.
 */
export class StripeCallbacksController extends Controller {
    private readonly userService: UserService;
    private readonly subService: SubscriptionService;

    private readonly stripe: Stripe;
    private readonly mixpanel = config.analytics.mixpanelToken ? Mixpanel.init(config.analytics.mixpanelToken) : null;

    constructor(fastify: FastifyInstance, databaseManager: DatabaseManager) {
        super(fastify, databaseManager);

        this.stripe = new Stripe(config.payments.stripeSecret, {
            apiVersion: '2020-08-27',
        });

        this.userService = new UserService(databaseManager);
        this.subService = new SubscriptionService(databaseManager, this.stripe);

        console.log("Stripe callbacks controller enabled");
    }

    registerRoutes(): void {
        // Unauthenticated
        this.fastify.all(
            '/stripe/webhooks',
            {
                config: {
                    rawBody: true
                }
            }, async (request, reply) => {
                return await this.ParseWebhooks(request, reply);
            }
        );
    }

    async ParseWebhooks(request: FastifyRequest, reply: FastifyReply): Promise<any> {
        const sig: string | string[] | undefined = request.headers['stripe-signature'];
        let rawBody: Buffer = (<any>request).rawBody;
        let event: Stripe.Event;

        reply.type("application/json");

        if (!sig) {
            console.log("Payload signature was invalid for request: " + request.id);
            reply.status(StatusCodes.BAD_REQUEST);
            return {error: "Payload didn't contain signature!"};
        }

        try {
            event = this.stripe.webhooks.constructEvent(rawBody, sig, config.payments.stripeWebhookSecret);
        } catch (err) {
            console.error(`Error while constructing event: ${err}`);
            reply.status(StatusCodes.BAD_REQUEST);
            return {error: err.message};
        }

        if (await this.hasEventBeenLogged(event)) {
            reply.status(StatusCodes.ACCEPTED);
            return {message: "The event has already been logged."};
        }

        const eventObject: any = event.data.object;

        if (!eventObject.customer) {
            reply.status(StatusCodes.OK);
            return reply.send({received: true});
        }

        let customerId = eventObject.customer;
        let customer: Stripe.Customer | Stripe.DeletedCustomer = await this.stripe.customers.retrieve(customerId);

        if (customer.deleted) {
            reply.status(StatusCodes.OK);
            return {error: "User deleted."};
        }

        let user = await this.userService.getSensitiveUserByStripeId(customer.id);

        if (!user) {
            reply.status(StatusCodes.OK);
            console.log(`User not found for id: ${customer.id}`);
            return {error: "User not found."};
        }

        // Handle the event
        switch (event.type) {
            case 'invoice.payment_action_required':
            case 'invoice.payment_failed': {
                await this.subService.setDbSubscriptionTier(user, 'free', true, eventObject, false);
                await this.subService.checkProfilesForOverLimit(user.id);
            }
                break;

            case 'customer.subscription.deleted': {
                // If the subscription was a downgrade, resubscribe, otherwise, cancel
                await this.subService.setDbSubscriptionTier(user, 'free', true, eventObject, false);
                await this.subService.checkProfilesForOverLimit(user.id);
            }
                break;

            case 'customer.subscription.created': {
                await this.subService.createOrUpdateSubscription(user, eventObject, true);
            }
                break;
            case 'customer.subscription.updated': {
                await this.subService.createOrUpdateSubscription(user, eventObject, false);
            }
                break;

            case 'invoice.paid': {
                let item = eventObject.lines.data[0].price.product;
                let product = await this.stripe.products.retrieve(item);

                let tier = product?.metadata.permission;

                if (tier) {
                    // await this.subService.setDbSubscriptionTier(user, tier, true, false , eventObject, product.id);
                    await this.subService.checkProfilesForOverLimit(user.id);
                } else {
                    console.error("[invoice.paid] Couldn't set subscription for user: " + user.id + " to tier " + tier);
                }
            }
                break;

            // For cases where the product is a one-time payment
            case 'checkout.session.completed': {
                let dehydratedSession: any = event.data.object;

                let session = await this.stripe.checkout.sessions.retrieve(dehydratedSession.id, {expand: ["line_items"]});

                if (session.line_items) {
                    let lineItem = session.line_items.data[0];
                    let price = lineItem.price;
                    let lineItemProduct = <string>price?.product;

                    if (lineItemProduct && price) {
                        let product = await this.stripe.products.retrieve(lineItemProduct);

                        let tier = product?.metadata.permission;

                        if (tier) {
                            await PermissionUtils.addProductPurchase(user, tier, product.id);

                            await this.subService.checkProfilesForOverLimit(user.id);
                        }
                    }
                }

                break;
            }

        }

        // Return a response to acknowledge receipt of the event
        reply.status(StatusCodes.OK);
        return reply.send({received: true});
    }

    /**
     * Check if the event has already been logged by another server.
     * This is necessary to prevent an event from firing multiple times.
     *
     * @param event
     * @returns True if the event has been logged before
     */
    async hasEventBeenLogged(event: Stripe.Event): Promise<boolean> {
        let queryResult = await this.pool.query("select event_id from enterprise.stripe_history_events where event_id=$1", [event.id]);

        if (queryResult.rowCount <= 0) {
            await this.pool.query("insert into enterprise.stripe_history_events(event_id) values ($1)", [event.id]);
            return false;
        }

        return true;
    }
}
