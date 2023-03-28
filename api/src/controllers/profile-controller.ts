import {FastifyInstance, FastifyReply, FastifyRequest, preHandlerHookHandler, RequestGenericInterface} from "fastify";
import {DatabaseManager} from "../data/database-manager";
import {Auth, AuthenticatedRequest} from "../utils/auth";
import {ProfileService} from "../services/profile-service";
import {StatusCodes} from "http-status-codes";
import {ReplyUtils} from "../utils/reply-utils";
import {LinkService} from "../services/link-service";
import {UserService} from "../services/user-service";
import {ThemeService} from "../services/theme-service";
import {Controller} from "./controller";
import {HttpError} from "../utils/http-error";
import Mixpanel from "mixpanel";
import {config} from "../config/config";
import Scraper from 'linktree-scraper';

import dns from "dns";
import {IpUtils} from "../utils/ip-utils";
import jwt from "jsonwebtoken";
import {ProfileSerializer} from "../utils/profile-serializer";
import {Readable} from "stream";
import {PermissionUtils} from "../utils/permission-utils";

interface ProfileQRCodeUrlRequest extends RequestGenericInterface {
    Params: {
        profileId?: string
    };
}

interface ProfileHandleRequest extends RequestGenericInterface {
    Params: {
        handle?: string
    },
    Body: {
        token?: string
    }
}

interface ProfilePreviewImageRequest extends RequestGenericInterface {
    Params: {
        handle?: string
    },
    Body: {
        token?: string
    }
}

interface GetTopProfilesRequest extends RequestGenericInterface {
    Params: {
        limit?: number
    };
}

interface CreateProfileRequest extends AuthenticatedRequest {
    Body: {
        handle: string,
        imageUrl: string,
        headline: string,
        subtitle: string
    } & AuthenticatedRequest["Body"];
}

interface ActivateProfileThemeRequest extends AuthenticatedRequest {
    Body: {
        id: string
    } & AuthenticatedRequest["Body"];
}

interface UpdateProfileRequest extends AuthenticatedRequest {
    Body: {
        imageUrl: string,
        headline: string,
        subtitle: string,
        handle: string,
        visibility: string,
        showWatermark: boolean,
        customCss: string,
        customHtml: string,
        customDomain: string,
        metadata: any
    } & AuthenticatedRequest["Body"];
}

interface LinktreeRequest extends AuthenticatedRequest {
    Body: {
        handle: string,
    } & AuthenticatedRequest["Body"];
}

interface ILinktreeLink {
    id: string,
    title: string,
    url: string,
    position: number
}

interface ImportProfileRequest extends AuthenticatedRequest {
    Body: {
        token?: string,
        profileData: string
    } & AuthenticatedRequest["Body"];
}

interface ExportProfileRequest extends AuthenticatedRequest {
    Body: {
        token?: string
    } & AuthenticatedRequest["Body"];
}

const getTopProfilesRequestRateLimit = {
    config: {
        rateLimit: {
            max: 30,
            timeWindow: '1 minute'
        }
    }
};

const createProfileRequestOpts = {
    config: {
        rateLimit: {
            max: 10,
            timeWindow: '5 minutes'
        }
    },
    preHandler: <preHandlerHookHandler>Auth.validateAuthWithData
};

/**
 * This controller maps and provides for all the controllers under /profile.
 */
export class ProfileController extends Controller {
    private readonly linkService: LinkService;
    private readonly profileService: ProfileService;
    private readonly userService: UserService;
    private readonly themeService: ThemeService;
    private readonly mixpanel = config.analytics.mixpanelToken ? Mixpanel.init(config.analytics.mixpanelToken) : null;

    constructor(fastify: FastifyInstance, databaseManager: DatabaseManager) {
        super(fastify, databaseManager);

        this.profileService = new ProfileService(databaseManager);
        this.linkService = new LinkService(databaseManager);
        this.userService = new UserService(databaseManager);
        this.themeService = new ThemeService(databaseManager);
    }

    registerRoutes(): void {
        // Unauthenticated controllers
        this.fastify.all<ProfileHandleRequest>('/profile/:handle', this.GetProfile.bind(this));
        this.fastify.all<ProfileHandleRequest>('/profile/thumbnail/:handle', this.GetProfileThumbnail.bind(this));
        this.fastify.all<ProfilePreviewImageRequest>('/profile/preview-image/:handle', this.GetProfilePreviewImage.bind(this));

        this.fastify.post<GetTopProfilesRequest>('/profile/leaderboards/top/', getTopProfilesRequestRateLimit, this.GetTopProfiles.bind(this));
        this.fastify.post<GetTopProfilesRequest>('/profile/leaderboards/top/:limit', getTopProfilesRequestRateLimit, this.GetTopProfiles.bind(this));

        this.fastify.all<ProfileQRCodeUrlRequest>('/profile/qr/:profileId', this.ResolveQRCodeURL.bind(this));

        // Authenticated
        this.fastify.post<AuthenticatedRequest>('/profile/preview', Auth.ValidateWithData, this.GetProfilePreview.bind(this));
        this.fastify.post<AuthenticatedRequest>('/profiles', Auth.ValidateWithData, this.ListProfiles.bind(this));
        this.fastify.post<AuthenticatedRequest>('/profile/links', Auth.ValidateWithData, this.ListProfileLinks.bind(this));

        this.fastify.post<CreateProfileRequest>('/profile/create', createProfileRequestOpts, this.CreateProfile.bind(this));
        this.fastify.post<UpdateProfileRequest>('/profile/update', Auth.ValidateWithData, this.UpdateProfile.bind(this));
        this.fastify.post<AuthenticatedRequest>('/profile/delete', Auth.ValidateWithData, this.DeleteProfile.bind(this));

        this.fastify.post<ImportProfileRequest>('/profile/import', Auth.ValidateWithData, this.ImportProfile.bind(this));
        this.fastify.post<ExportProfileRequest>('/profile/export', Auth.ValidateWithData, this.ExportProfile.bind(this));
        this.fastify.post<LinktreeRequest>('/profile/linktree_import', Auth.ValidateWithData, this.LinktreeImport.bind(this));

        this.fastify.post<AuthenticatedRequest>('/profile/active-profile', Auth.ValidateWithData, this.GetActiveProfile.bind(this));
        this.fastify.post<ActivateProfileThemeRequest>('/profile/activate-theme', Auth.ValidateWithData, this.ActivateProfileTheme.bind(this));
    }

    /**
     * Route for /profile
     * /profile/:handle
     *
     * Fetches a user's profile.
     *
     * @param request
     * @param reply
     */
    async GetProfile(request: FastifyRequest<ProfileHandleRequest>, reply: FastifyReply) {
        try {
            let params = request.params;

            if (!params.handle) {
                reply.status(StatusCodes.BAD_REQUEST).send(ReplyUtils.error("No handle was provided."));
                return;
            }

            let profile: Profile | undefined;

            if (request.body?.token) {
                let decoded = jwt.verify(
                    request.body.token,
                    config.secret,
                    {
                        maxAge: '90d'
                    });

                if (!decoded) {
                    reply.status(StatusCodes.UNAUTHORIZED).send(ReplyUtils.error("Unable to verify user, invalid token."));
                    return;
                }

                let dAuthToken = <{ userId: string, type: TokenType }>decoded;

                if (!dAuthToken?.userId) {
                    reply.status(StatusCodes.UNAUTHORIZED).send(ReplyUtils.error("Unable to verify user, invalid token."));
                    return;
                }

                if (dAuthToken?.type !== "auth") {
                    reply.status(StatusCodes.UNAUTHORIZED).send(ReplyUtils.error("Invalid token type."));
                    return;
                }

                let toCheck = await this.profileService.getProfileByHandle(params.handle, false);

                if (await Auth.checkProfileOwnership(this.profileService, toCheck.id, dAuthToken.userId, true)) {
                    profile = toCheck;
                }
            }

            if (!profile)
                profile = await this.profileService.getProfileByHandle(params.handle, true);

            let links;
            let user;
            let theme;

            try {
                links = await this.linkService.listLinks(profile.id);
            } catch (err) {
                // ignore, we don't care why these properties don't exist
            }

            try {
                user = await this.userService.getUser(profile.userId);
            } catch (err) {
                // ignore, we don't care why these properties don't exist
            }

            try {
                theme = await this.themeService.getTheme(profile.themeId);
            } catch (err) {
                // ignore, we don't care why these properties don't exist
            }

            return {
                profile,
                links,
                user,
                theme
            };
        } catch (e) {
            if (e instanceof HttpError) {
                reply.code(e.statusCode);
                return ReplyUtils.error(e.message, e);
            }

            throw e;
        }
    }

    /**
     * Route for /profile/thumbnail/:handle
     *
     * @param request
     * @param reply
     */
    async GetProfileThumbnail(request: FastifyRequest<ProfileHandleRequest>, reply: FastifyReply) {
        try {
            let params = request.params;

            if (!params.handle) {
                reply.status(StatusCodes.BAD_REQUEST).send(ReplyUtils.error("No handle was provided."));
                return;
            }

            let thumbnail = await this.profileService.getThumbnailByHandle(params.handle);

            reply.code(StatusCodes.OK).headers({
                "Content-Type": "image/png",
                "Content-Length": thumbnail.byteLength
            });

            reply.send(thumbnail);
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
     * Route for /profile/preview-image/:handle
     *
     * @param request
     * @param reply
     */
    async GetProfilePreviewImage(request: FastifyRequest<ProfilePreviewImageRequest>, reply: FastifyReply) {
        try {
            let params = request.params;

            if (!params.handle) {
                reply.status(StatusCodes.BAD_REQUEST).send(ReplyUtils.error("No handle was provided."));
                return;
            }

            let profilePreview = await this.profileService.getImagePreviewByHandle(params.handle, request.body?.token);

            reply.code(StatusCodes.OK).headers({
                "Content-Type": "image/png",
                "Content-Length": profilePreview.byteLength
            });

            reply.send(profilePreview);
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
     * Route for /profile/leaderboards/top/ &
     * /profile/leaderboards/top/:limit
     *
     * @param request
     * @param reply
     */
    async GetTopProfiles(request: FastifyRequest<GetTopProfilesRequest>, reply: FastifyReply) {
        try {
            let params = request.params;

            return await this.profileService.getTopProfiles(params.limit);
        } catch (e) {
            if (e instanceof HttpError) {
                reply.code(e.statusCode);
                return ReplyUtils.error(e.message, e);
            }

            throw e;
        }
    }

    /**
     * Route for /profile/preview
     *
     * @param request
     * @param reply
     */
    async GetProfilePreview(request: FastifyRequest<AuthenticatedRequest>, reply: FastifyReply) {
        try {
            if (!request.body.authProfile) {
                reply.status(StatusCodes.BAD_REQUEST).send(ReplyUtils.error("This account doesn't have an active profile."));
                return;
            }

            let user = request.body.authUser;
            let profile = request.body.authProfile;
            let profiles = await this.profileService.listProfiles(user.id);
            let links;
            let theme;

            try {
                links = await this.linkService.listLinks(profile.id);
            } catch (err) {
                // ignore, we don't care why these properties don't exist
            }

            try {
                theme = await this.themeService.getTheme(profile.themeId);
            } catch (err) {
                // ignore, we don't care why these properties don't exist
            }

            return {
                profile,
                profiles,
                links,
                user,
                theme
            };
        } catch (e) {
            if (e instanceof HttpError) {
                reply.code(e.statusCode);
                return ReplyUtils.error(e.message, e);
            }

            throw e;
        }
    }

    /**
     * Route for /profiles
     *
     * @param request
     * @param reply
     */
    async ListProfiles(request: FastifyRequest<AuthenticatedRequest>, reply: FastifyReply) {
        try {
            if (!request.body.authProfile) {
                reply.status(StatusCodes.BAD_REQUEST).send(ReplyUtils.error("This account doesn't have an active profile."));
                return;
            }

            return this.profileService.listProfiles(request.body.authUser.id, true);
        } catch (e) {
            if (e instanceof HttpError) {
                reply.code(e.statusCode);
                return ReplyUtils.error(e.message, e);
            }

            throw e;
        }
    }

    /**
     * Route for /profile/links
     *
     * @param request
     * @param reply
     */
    async ListProfileLinks(request: FastifyRequest<AuthenticatedRequest>, reply: FastifyReply) {
        try {
            if (!request.body.authProfile) {
                reply.status(StatusCodes.BAD_REQUEST).send(ReplyUtils.error("This account doesn't have an active profile."));
                return;
            }

            return this.linkService.listLinks(request.body.authProfile.id, true);
        } catch (e) {
            if (e instanceof HttpError) {
                reply.code(e.statusCode);
                return ReplyUtils.error(e.message, e);
            }

            throw e;
        }
    }

    /**
     * Route for /profile/create/
     *
     * @param request
     * @param reply
     */
    async CreateProfile(request: FastifyRequest<CreateProfileRequest>, reply: FastifyReply) {
        try {
            let body = request.body;

            let newProfile = await this.profileService.createProfile(body.authUser.id, body.handle, body.imageUrl, body.headline, body.subtitle);

            if (this.mixpanel) {
                let ip = IpUtils.GetFirstIp(IpUtils.GrabIps(request));

                this.mixpanel.track('new profile created', {
                    distinct_id: newProfile.userId,
                    $ip: ip,
                    profile: newProfile.id,
                    profileObject: newProfile
                });
            }

            return newProfile;
        } catch (e) {
            if (e instanceof HttpError) {
                reply.code(e.statusCode);
                return ReplyUtils.error(e.message, e);
            }

            throw e;
        }
    }

    /**
     * Route for /profile/update
     *
     * @param request
     * @param reply
     */
    async UpdateProfile(request: FastifyRequest<UpdateProfileRequest>, reply: FastifyReply) {
        try {
            let body = request.body;

            if (!body.authProfile) {
                reply.status(StatusCodes.BAD_REQUEST).send(ReplyUtils.error("This account doesn't have an active profile."));
                return;
            }

            let visibility = body.visibility as Visibility;

            if (config.payments.stripeSecret) {
                // Check for sub tier and limit published profile count
                if (body.authProfile.visibility === "unpublished") {
                    let ownerId = body.authProfile.userId;
                    let published = await this.profileService.countPublishedProfiles(ownerId);
                    let perm = await PermissionUtils.getCurrentPermission(ownerId);
                    let numOfAllowedPages = await this.userService.getNumOfAllowedPages(perm, ownerId);
                    if (published >= numOfAllowedPages) {
                        visibility = "unpublished";
                    }
                }
            }

            // Check custom domain and see if the profile owns it
            let hasCustomDomain = !!body.customDomain;

            try {
                if (hasCustomDomain) {
                    // Check if the custom domain is changing
                    if (body.customDomain !== body.authProfile.customDomain) {
                        let records = await dns.promises.resolveTxt(body.customDomain);

                        const slVerificationTag = "sl-verification-id=";

                        let txtRecord = records[0].find(x => {
                            return x.startsWith(slVerificationTag);
                        });

                        if (!txtRecord) {
                            reply.status(StatusCodes.BAD_REQUEST).send(ReplyUtils.error("Failed to set custom domain! Make sure your TXT and CNAME records are setup correctly!"));
                            return;
                        }

                        let profileId = txtRecord.substring(slVerificationTag.length);

                        if (profileId !== body.authProfile.id) {
                            reply.status(StatusCodes.BAD_REQUEST).send(ReplyUtils.error("Failed to set custom domain! Make sure your TXT and CNAME records are setup correctly!"));
                            return;
                        }
                    }
                }
            } catch (e) {
                reply.status(StatusCodes.BAD_REQUEST).send(ReplyUtils.error("Failed to set custom domain! Make sure your TXT and CNAME records are setup correctly!"));
                return;
            }

            let prevWatermarkStatus = body.authProfile.showWatermark;
            let newProfile = await this.profileService.updateProfile(
                body.authProfile.id,
                body.imageUrl,
                body.headline,
                body.subtitle,
                body.handle,
                visibility,
                body.showWatermark,
                body.customCss,
                body.customHtml,
                hasCustomDomain ? body.customDomain : null,
                body.metadata
            );

            if (this.mixpanel) {
                let ip = IpUtils.GetFirstIp(IpUtils.GrabIps(request));

                this.mixpanel.track('profile updated', {
                    distinct_id: newProfile.userId,
                    $ip: ip,
                    profile: newProfile.id,
                    profileObject: newProfile
                });

                if (prevWatermarkStatus !== newProfile.showWatermark) {
                    this.mixpanel.track('watermark status toggled', {
                        distinct_id: newProfile.userId,
                        $ip: ip,
                        profile: newProfile.id,
                        showWatermark: newProfile.showWatermark
                    });
                }
            }

            return newProfile;
        } catch (e) {
            if (e instanceof HttpError) {
                reply.code(e.statusCode);
                return ReplyUtils.error(e.message, e);
            }

            throw e;
        }
    }

    async LinktreeImport(request: FastifyRequest<LinktreeRequest>, reply: FastifyReply) {
        try {
            const profile = await Scraper(request.body.handle);
            const links = await this.linkService.listLinks(request.body.authProfile.id);
            const deleteLink = async (link: Link) => {
                if (!await Auth.checkLinkOwnership(this.linkService, link.id, request.body.authProfile)) {
                    return Promise.resolve();
                }
                return this.linkService.deleteLink(link.id);
            };

            await Promise.all(links.map(deleteLink));

            const createLink = (link: ILinktreeLink) => {
                return this.linkService.createLink({
                    id: link.id,
                    profileId: request.body.authProfile.id,
                    type: 'link',
                    url: link.url,
                    sortOrder: link.position,
                    label: link.title,
                });
            };
            await Promise.all(profile.props.pageProps.links.map(createLink));
            return ReplyUtils.success('New links added');
        } catch (e) {
            if (e instanceof HttpError) {
                reply.code(e.statusCode);
                return ReplyUtils.error(e.message, e);
            }

            throw e;
        }
    }

    /**
     * Route for /profile/delete
     *
     * @param request
     * @param reply
     */
    async DeleteProfile(request: FastifyRequest<AuthenticatedRequest>, reply: FastifyReply) {
        try {
            if (!request.body.authProfile) {
                reply.status(StatusCodes.BAD_REQUEST).send(ReplyUtils.error("This account doesn't have an active profile."));
                return;
            }

            let deletedProfile = await this.profileService.deleteProfile(request.body.authUser.id, request.body.authProfile.id);

            if (this.mixpanel) {
                let ip = IpUtils.GetFirstIp(IpUtils.GrabIps(request));

                this.mixpanel.track('profile deleted', {
                    distinct_id: deletedProfile.userId,
                    $ip: ip,
                    profile: deletedProfile.id,
                    profileObject: deletedProfile
                });
            }

            return deletedProfile;
        } catch (e) {
            if (e instanceof HttpError) {
                reply.code(e.statusCode);
                return ReplyUtils.error(e.message, e);
            }

            throw e;
        }
    }

    /**
     * Route for /profile/import
     *
     * @param request
     * @param reply
     */
    async ImportProfile(request: FastifyRequest<ImportProfileRequest>, reply: FastifyReply) {
        try {
            if (!request.body.authProfile) {
                reply.status(StatusCodes.BAD_REQUEST).send(ReplyUtils.error("This account doesn't have an active profile."));
                return;
            }

            let parse = JSON.parse(request.body.profileData);
            await ProfileSerializer.importProfile(request.body.authUser.id, request.body.authProfile.id, parse);

            reply.status(StatusCodes.OK);
            return ReplyUtils.success("Imported.");
        } catch (e) {
            if (e instanceof HttpError) {
                reply.code(e.statusCode);
                return ReplyUtils.error(e.message, e);
            }

            throw e;
        }
    }

    /**
     * Route for /profile/export
     *
     * @param request
     * @param reply
     */
    async ExportProfile(request: FastifyRequest<ExportProfileRequest>, reply: FastifyReply) {
        try {
            if (!request.body.authProfile) {
                reply.status(StatusCodes.BAD_REQUEST).send(ReplyUtils.error("This account doesn't have an active profile."));
                return;
            }

            let serializedProfile = await ProfileSerializer.exportProfile(request.body.authProfile.id);

            let filename = request.body.authProfile.id + '-profile-export.json';

            reply.type('application/octet-stream').status(StatusCodes.OK);
            reply.header('Content-Disposition', `inline; filename=${filename}`);

            const stream = Readable.from(JSON.stringify(serializedProfile));
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
     * Route for /profile/active-profile
     *
     * @param request
     * @param reply
     */
    async GetActiveProfile(request: FastifyRequest<AuthenticatedRequest>, reply: FastifyReply) {
        try {
            if (!request.body.authProfile) {
                reply.status(StatusCodes.BAD_REQUEST).send(ReplyUtils.error("This account doesn't have an active profile."));
                return;
            }

            return request.body.authProfile;
        } catch (e) {
            if (e instanceof HttpError) {
                reply.code(e.statusCode);
                return ReplyUtils.error(e.message, e);
            }

            throw e;
        }
    }

    /**
     * Route for /profile/activate-theme
     *
     * @param request
     * @param reply
     */
    async ActivateProfileTheme(request: FastifyRequest<ActivateProfileThemeRequest>, reply: FastifyReply) {
        try {
            let body = request.body;

            if (!body.authProfile) {
                reply.status(StatusCodes.BAD_REQUEST).send(ReplyUtils.error("This account doesn't have an active profile."));
                return;
            }

            if (body.id) {
                if (!await Auth.checkThemeOwnership(this.linkService, body.id, body.authUser, true)) {
                    return ReplyUtils.errorOnly(new HttpError(StatusCodes.UNAUTHORIZED, "The profile isn't authorized to access the requested resource"));
                }
            }

            let theme = await this.profileService.setActiveTheme(body.authProfile.id, body.id);

            if (this.mixpanel) {
                let ip = IpUtils.GetFirstIp(IpUtils.GrabIps(request));

                this.mixpanel.track('set profile active theme', {
                    distinct_id: request.body.authUser.id,
                    $ip: ip,
                    profile: request.body.authProfile.id,
                    theme: theme
                });

            }

            return theme;
        } catch (e) {
            if (e instanceof HttpError) {
                reply.code(e.statusCode);
                return ReplyUtils.error(e.message, e);
            }

            throw e;
        }
    }

    async ResolveQRCodeURL(request: FastifyRequest<ProfileQRCodeUrlRequest>, reply: FastifyReply) {
        try {
            const profileId = request.params.profileId;

            if (profileId === undefined || profileId === null) {
                reply.status(StatusCodes.BAD_REQUEST).send(ReplyUtils.error("No profile id was provided."));
                return;
            }

            return await this.profileService.getProfile(profileId, true);
        } catch (e) {
            if (e instanceof HttpError) {
                reply.code(e.statusCode);
                return ReplyUtils.error(e.message, e);
            }

            throw e;
        }
    }
}
