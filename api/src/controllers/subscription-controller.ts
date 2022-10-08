import {Auth, AuthenticatedRequest, SensitiveAuthenticatedRequest} from "../utils/auth";
import {Controller} from "./controller";
import {SubscriptionService} from "../services/subscription-service";
import {DatabaseManager} from "../data/database-manager";
import {FastifyInstance, FastifyReply, FastifyRequest} from "fastify";
import Stripe from "stripe";
import {HttpError} from "../utils/http-error";
import {ReplyUtils} from "../utils/reply-utils";
import {config} from "../config/config";
import {StatusCodes} from "http-status-codes";
import Mixpanel from "mixpanel";
import {UserService} from "../services/user-service";
import {ProfileService} from "../services/profile-service";
import {PermissionUtils} from "../utils/permission-utils";

interface DeleteSubscriptionRequest extends SensitiveAuthenticatedRequest {
    Body: {
        profileId: string
    } & SensitiveAuthenticatedRequest["Body"];
}

interface CreateCheckoutSessionRequest extends SensitiveAuthenticatedRequest {
    Body: {
        profileId: string
    } & SensitiveAuthenticatedRequest["Body"];
}

/**
 * This controller maps and provides for all the controllers under /payments and /seats.
 */
export class SubscriptionController extends Controller {
    private readonly subService: SubscriptionService;
    private readonly userService: UserService;
    private readonly profileService: ProfileService;

    private readonly mixpanel = config.analytics.mixpanelToken ? Mixpanel.init(config.analytics.mixpanelToken) : null;

    private readonly stripe: Stripe;

    constructor(fastify: FastifyInstance, databaseManager: DatabaseManager) {
        super(fastify, databaseManager);

        this.stripe = new Stripe(config.payments.stripeSecret, {
            apiVersion: '2020-08-27',
        });

        this.subService = new SubscriptionService(databaseManager, this.stripe);
        this.userService = new UserService(databaseManager);
        this.profileService = new ProfileService(databaseManager);

        console.log("Stripe subscription controller enabled");
    }

    registerRoutes(): void {
        // Authenticated
        // Payments
        this.fastify.all('/products', {
            config: {
                rateLimit: {
                    max: 20,
                    timeWindow: '1 minute'
                }
            }
        }, this.GetProducts.bind(this));

        this.fastify.post<AuthenticatedRequest>('/payments/sub-info', Auth.ValidateWithData, this.GetSubInfo.bind(this));

        this.fastify.post<CreateCheckoutSessionRequest>('/stripe/create-checkout-session', Auth.ValidateSensitiveWithData, this.CreateCheckoutSession.bind(this));
        this.fastify.post<DeleteSubscriptionRequest>('/stripe/delete-subscription', Auth.ValidateSensitiveWithData, this.DeleteSubscription.bind(this));

        this.fastify.post<SensitiveAuthenticatedRequest>('/profile/allowed-pages', Auth.ValidateSensitiveWithData, this.GetProfileCount.bind(this));
    }

    async GetProfileCount(request: FastifyRequest<SensitiveAuthenticatedRequest>, reply: FastifyReply) {
        try {
            let count = await this.profileService.countPublishedProfiles(request.body.authUser.id);
            let perm = await PermissionUtils.getCurrentPermission(request.body.authUser.id);
            let numOfAllowedPages = await this.userService.getNumOfAllowedPages(perm, request.body.authUser.id);

            return {
                published: count,
                allowed: numOfAllowedPages
            };
        } catch (e) {
            if (e instanceof HttpError) {
                if (e.statusCode !== StatusCodes.NOT_FOUND) {
                    reply.code(e.statusCode);
                    return ReplyUtils.error(e.message, e);
                }
            }
        }
    }

    async CreateCheckoutSession(request: FastifyRequest<CreateCheckoutSessionRequest>, reply: FastifyReply) {
        try {
            let profileId = request.body.profileId;

            let customer = await this.subService.getOrCreateStripeCustomer(request.body.authUser);

            if (!customer || customer.deleted) {
                reply.status(StatusCodes.NOT_FOUND);
                return ReplyUtils.error("A stripe customer does not exist for the provided user.");
            }

            const products = await this.stripe.products.list({
                limit: 1,
            });
            const pagePlan = products.data.find(x => x.name === 'Page plan');

            if (!pagePlan) {
                reply.status(StatusCodes.NOT_FOUND);
                return ReplyUtils.error("No corresponding stripe plan was found.");
            }

            let prices = (await this.stripe.prices.list({
                active: true,
                expand: ['data.product'],
                product: pagePlan.id,
            })).data;

            let price = prices.length > 0 ? prices[0] : null;

            if (!price) {
                reply.status(StatusCodes.NOT_FOUND);
                return ReplyUtils.error("The user requested a price that does not exist or is not setup with the correct metadata.");
            }

            let type = price.type;

            let mode: 'payment' | 'setup' | 'subscription';

            switch (type) {
                case 'one_time':
                    mode = 'payment';
                    break;
                case 'recurring':
                    mode = 'subscription';
                    break;
                default:
                    mode = 'subscription';
            }

            const ownsProfile = await Auth.checkProfileOwnership(this.pool, profileId, request.body.authUser.id, false);

            if (!ownsProfile) {
                reply.status(StatusCodes.UNAUTHORIZED);
                return ReplyUtils.error("You do not own this profile.");
            }

            let session = await this.stripe.checkout.sessions.create({
                payment_method_types: ['card'],
                customer: customer.id,
                line_items: [{
                    price: price.id,
                    quantity: 1
                }],
                mode: mode,
                subscription_data: {
                    metadata: {
                        profileId
                    }
                },
                allow_promotion_codes: true,
                success_url: `${config.editorUrl}/dashboard/account`,
                cancel_url: `${config.editorUrl}/dashboard/account`,
            });

            if (!session.url) {
                reply.code(StatusCodes.INTERNAL_SERVER_ERROR);
                return ReplyUtils.error("Failed to create checkout link.");
            }

            reply.status(StatusCodes.OK);
            return session.url;
        } catch (e) {
            if (e instanceof HttpError) {
                if (e.statusCode !== StatusCodes.NOT_FOUND) {
                    reply.code(e.statusCode);
                    return ReplyUtils.error(e.message, e);
                }
            }
        }
    }

    async DeleteSubscription(request: FastifyRequest<DeleteSubscriptionRequest>, reply: FastifyReply) {
        const profileId = request.body.profileId;
        reply.status(StatusCodes.OK);
        return this.subService.deleteSubscription(profileId, request.body.authUser, reply);
    }

    async GetProducts(request: FastifyRequest, reply: FastifyReply) {
        try {
            let subs = await this.subService.getProducts();
            reply.status(StatusCodes.OK);

            return subs;
        } catch (e) {
            if (e instanceof HttpError) {
                if (e.statusCode !== StatusCodes.NOT_FOUND) {
                    reply.code(e.statusCode);
                    return ReplyUtils.error(e.message, e);
                }
            }
        }
    }

    /**
     * Route for /payment/sub-info
     *
     * @param request
     * @param reply
     * @constructor
     */
    async GetSubInfo(request: FastifyRequest<AuthenticatedRequest>, reply: FastifyReply) {
        reply.type('application/json');
        return this.subService.getDetailedPurchaseInfo(request.body.authUser);
    }
}
