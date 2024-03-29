import {FastifyInstance, FastifyReply, FastifyRequest, preHandlerHookHandler, RequestGenericInterface} from "fastify";
import {UserService} from "../services/user-service";
import {DatabaseManager} from "../data/database-manager";
import {Controller} from "./controller";
import {ReplyUtils} from "../utils/reply-utils";
import {StatusCodes} from "http-status-codes";
import {HttpError} from "../utils/http-error";
import {ProfileService} from "../services/profile-service";
import {config} from "../config/config";
import {Auth, AuthenticatedRequest, SensitiveAuthenticatedRequest} from "../utils/auth";
import Mixpanel from "mixpanel";
import {Readable} from "stream";
import {IpUtils} from "../utils/ip-utils";
import {SubscriptionService} from "../services/subscription-service";
import {Stripe} from "stripe";

interface UserRequestResetPasswordRequest extends RequestGenericInterface {
    Body: {
        email?: string
    };
}

interface ResetUserPasswordRequest extends RequestGenericInterface {
    Body: {
        token?: string,
        password?: string
    };
}

interface UpdateUserRequest extends AuthenticatedRequest {
    Body: {
        id: string,
        email: string,
        fullName?: string
    } & AuthenticatedRequest["Body"];
}

interface DeleteUserRequest extends SensitiveAuthenticatedRequest {
    Body: {} & SensitiveAuthenticatedRequest["Body"];
}

interface SetActiveProfileRequest extends AuthenticatedRequest {
    Body: {
        newProfileId?: string,
        random?: boolean
    } & AuthenticatedRequest["Body"];
}

interface GetUserDataPackageRequest extends AuthenticatedRequest {
    Body: {} & AuthenticatedRequest["Body"];
}

interface SetEmailNotifications extends AuthenticatedRequest {
    Body: {
        emailNotifications: {
            major: true,
            minor: true,
            marketing: true,
            leaderboard: true
        }
    } & AuthenticatedRequest["Body"];
}

const userRequestResetPasswordOpts = {
    config: {
        rateLimit: {
            max: 3,
            timeWindow: '4 hours'
        }
    }
};

const userDataPackageRateLimit = {
    config: {
        rateLimit: {
            max: 5,
            timeWindow: '30 min'
        }
    },
    preHandler: <preHandlerHookHandler>Auth.validateAuthWithData
};

/**
 * This controller maps and provides for all the controllers under /user.
 */
export class UserController extends Controller {
    private readonly userService: UserService;
    private readonly profileService: ProfileService;
    private readonly subService: SubscriptionService;
    private readonly stripe: Stripe;
    private readonly mixpanel = config.analytics.mixpanelToken ? Mixpanel.init(config.analytics.mixpanelToken) : null;

    constructor(fastify: FastifyInstance, databaseManager: DatabaseManager) {
        super(fastify, databaseManager);

        this.stripe = new Stripe(config.payments.stripeSecret, {
            apiVersion: '2020-08-27',
        });

        this.userService = new UserService(databaseManager);
        this.profileService = new ProfileService(databaseManager);
        this.subService = new SubscriptionService(databaseManager, this.stripe);
    }

    registerRoutes(): void {
        // Unauthenticated
        this.fastify.post<UserRequestResetPasswordRequest>('/user/request-reset-password', userRequestResetPasswordOpts, this.UserRequestResetPassword.bind(this));
        this.fastify.post<ResetUserPasswordRequest>('/user/reset-password', this.ResetUserPassword.bind(this));

        // Authenticated
        this.fastify.post<AuthenticatedRequest>('/user', Auth.ValidateWithData, this.GetUser.bind(this));
        this.fastify.post<AuthenticatedRequest>('/user/private-metadata', Auth.ValidateWithData, this.GetPrivateMetadata.bind(this));

        this.fastify.post<UpdateUserRequest>('/user/update', Auth.ValidateWithData, this.UpdateUser.bind(this));
        this.fastify.post<DeleteUserRequest>('/user/delete', Auth.ValidateSensitiveWithData, this.DeleteUser.bind(this));
        this.fastify.post<SetActiveProfileRequest>('/user/set-active-profile', Auth.ValidateWithData, this.SetActiveProfile.bind(this));

        this.fastify.post<GetUserDataPackageRequest>('/user/data-package', userDataPackageRateLimit, this.GetUserDataPackage.bind(this));

        this.fastify.post<SetEmailNotifications>('/user/set-email-notifications', Auth.ValidateWithData, this.SetEmailNotifications.bind(this));
    }

    /**
     * Route for /user/request-reset-password
     * @param request
     * @param reply
     */
    async UserRequestResetPassword(request: FastifyRequest<UserRequestResetPasswordRequest>, reply: FastifyReply) {
        try {
            let body = request.body;

            if (!body.email) {
                reply.status(StatusCodes.NOT_FOUND).send(ReplyUtils.error("No email was provided."));
                return;
            }

            let user = await this.userService.sendPasswordResetEmail(body.email);

            if (this.mixpanel) {
                let ip = IpUtils.GetFirstIp(IpUtils.GrabIps(request));

                this.mixpanel.track('user requested password reset', {
                    distinct_id: user.id,
                    $ip: ip
                });

            }

            return ReplyUtils.success("Successfully sent password reset email.");
        } catch (e) {
            if (e instanceof HttpError) {
                reply.code(e.statusCode);
                return ReplyUtils.error(e.message, e);
            }

            throw e;
        }
    }

    /**
     * Route for /user/reset-password
     * @param request
     * @param reply
     */
    async ResetUserPassword(request: FastifyRequest<ResetUserPasswordRequest>, reply: FastifyReply) {
        try {
            let body = request.body;

            if (!body.token) {
                reply.status(StatusCodes.BAD_REQUEST).send(ReplyUtils.error("No email was provided."));
                return;
            }

            if (!body.password) {
                reply.status(StatusCodes.BAD_REQUEST).send(ReplyUtils.error("No email was provided."));
                return;
            }

            await this.userService.setPasswordWithToken(body.token, body.password);

            return ReplyUtils.success("Successfully changed password.");
        } catch (e) {
            if (e instanceof HttpError) {
                reply.code(e.statusCode);
                return ReplyUtils.error(e.message, e);
            }

            throw e;
        }
    }

    /**
     * Route for /user
     * @param request
     * @param reply
     */
    async GetUser(request: FastifyRequest<AuthenticatedRequest>, reply: FastifyReply) {
        return request.body.authUser;
    }

    /**
     * Route for /user/private-metadata
     * @param request
     * @param reply
     */
    async GetPrivateMetadata(request: FastifyRequest<AuthenticatedRequest>, reply: FastifyReply) {
        try {
            let sensitiveUser = await this.userService.getSensitiveUser(request.body.authUser.id);

            return sensitiveUser.privateMetadata;
        } catch (e) {
            if (e instanceof HttpError) {
                reply.code(e.statusCode);
                return ReplyUtils.error(e.message, e);
            }

            throw e;
        }
    }

    //TODO Implement UpdateUser
    /**
     * Route for /user/update
     * @param request
     * @param reply
     */
    async UpdateUser(request: FastifyRequest<UpdateUserRequest>, reply: FastifyReply) {
        try {
            reply.code(StatusCodes.NOT_IMPLEMENTED);

            // this.mixpanel.track('user updated', {
            //   distinct_id: request.body.id,
            //   $ip: (config.allowXForwardHeader ?
            //       request.headers['cf-connecting-ip'] || request.headers['x-forwarded-for'] || request.socket.remoteAddress :
            //       request.socket.remoteAddress),
            // });

            return ReplyUtils.error("Sorry, this is not implemented yet.");
        } catch (e) {
            if (e instanceof HttpError) {
                reply.code(e.statusCode);
                return ReplyUtils.error(e.message, e);
            }

            throw e;
        }
    }

    /**
     * Route for /user/delete
     * @param request
     * @param reply
     */
    async DeleteUser(request: FastifyRequest<DeleteUserRequest>, reply: FastifyReply) {
        try {
            let user = request.body.authUser;

            let deletedUser = await this.userService.deleteUser(user.id);

            if (this.mixpanel) {
                let ip = IpUtils.GetFirstIp(IpUtils.GrabIps(request));

                this.mixpanel.track('user deleted', {
                    distinct_id: user.id,
                    $ip: ip,
                });
            }

            await this.subService.deleteStripeCustomer(user);

            return deletedUser;
        } catch (e) {
            if (e instanceof HttpError) {
                reply.code(e.statusCode);
                return ReplyUtils.error(e.message, e);
            }

            throw e;
        }
    }

    /**
     * Route for /user/data-package
     *
     * Compiles and sends the user a package of their data.
     */
    async GetUserDataPackage(request: FastifyRequest<GetUserDataPackageRequest>, reply: FastifyReply) {
        try {
            let user = request.body.authUser;

            let data = await this.userService.generateDataPackage(user);

            if (this.mixpanel) {
                let ip = IpUtils.GetFirstIp(IpUtils.GrabIps(request));

                this.mixpanel.track('user requested GDPR data', {
                    distinct_id: request.body.authUser.id,
                    $ip: ip,
                });
            }

            let filename = user.id + '-data-package.json';

            reply.type('application/octet-stream').code(StatusCodes.OK);
            reply.header('Content-Disposition', `inline; filename=${filename}`);

            const stream = Readable.from(data);
            reply.send(stream);

            return;
        } catch (e) {
            if (e instanceof HttpError) {
                reply.code(e.statusCode);
                return ReplyUtils.error(e.message, e);
            }

            throw e;
        }
    }

    /**
     * Route for /user/set-active
     *
     * @param request
     * @param reply
     */
    async SetActiveProfile(request: FastifyRequest<SetActiveProfileRequest>, reply: FastifyReply) {
        try {
            let body = request.body;
            let user = body.authUser;
            let newProfileId = body.newProfileId;
            let random = body.random;

            let newProfile;


            if (!newProfileId) {
                reply.status(StatusCodes.BAD_REQUEST).send(ReplyUtils.error("No email was provided."));
                return;
            }
            if (random) {
                const profiles = await this.profileService.listProfiles(user.id);
                newProfile = profiles[Math.floor(Math.random()*profiles.length)];
                newProfileId = newProfile.id;
            } else {
                newProfile = await this.profileService.getProfile(newProfileId);
            }

            if (!await Auth.checkProfileOwnership(this.pool, newProfile.id, user.id, true)) {
                reply.status(StatusCodes.UNAUTHORIZED).send(ReplyUtils.error("The user is not a member of the profile."));
                return;
            }

            if (this.mixpanel) {
                let ip = IpUtils.GetFirstIp(IpUtils.GrabIps(request));

                this.mixpanel.track('user set active profile', {
                    distinct_id: user.id,
                    $ip: ip,
                    profile: newProfileId
                });

            }

            return this.userService.setActiveProfile(user.id, newProfileId);
        } catch (e) {
            if (e instanceof HttpError) {
                reply.code(e.statusCode);
                return ReplyUtils.error(e.message, e);
            }

            throw e;
        }
    }

    /**
     * Route for /profile/set-email-notifications
     *
     * @param request
     * @param reply
     */
    async SetEmailNotifications(request: FastifyRequest<SetEmailNotifications>, reply: FastifyReply) {
        try {
            let user = await this.userService.setEmailNotifications(request.body.authUser.id, request.body.emailNotifications);

            if (this.mixpanel) {
                let ip = IpUtils.GetFirstIp(IpUtils.GrabIps(request));

                this.mixpanel.track('toggle email notifications', {
                    distinct_id: user.id,
                    $ip: ip,
                    emailNotifications: request.body.emailNotifications
                });
            }

            return user;
        } catch (e) {
            if (e instanceof HttpError) {
                reply.code(e.statusCode);
                return ReplyUtils.error(e.message, e);
            }

            throw e;
        }
    }
}
