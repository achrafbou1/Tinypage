import {Controller} from "./controller";
import {DatabaseManager} from "../data/database-manager";
import {FastifyInstance, FastifyReply, FastifyRequest} from "fastify";
import {HttpError} from "../utils/http-error";
import {ReplyUtils} from "../utils/reply-utils";
import {StatusCodes} from "http-status-codes";
import {UserService} from "../services/user-service";
import {ProfileService} from "../services/profile-service";
import {Auth, AuthenticatedRequest} from "../utils/auth";
import {TeamService} from "../services/team-service";

interface AddTeamMemberRequest extends AuthenticatedRequest {
    Body: {
        email: string,
        role?: string
    } & AuthenticatedRequest["Body"];
}

interface RemoveTeamMemberRequest extends AuthenticatedRequest {
    Body: {
        email: string,
        profileId: string
    } & AuthenticatedRequest["Body"];
}

/**
 * This controller maps and provides for all the controllers under /payments and /seats.
 */
export class TeamController extends Controller {
    private readonly userService: UserService;
    private readonly profileService: ProfileService;
    private readonly teamService: TeamService;

    constructor(fastify: FastifyInstance, databaseManager: DatabaseManager) {
        super(fastify, databaseManager);

        this.userService = new UserService(databaseManager);
        this.profileService = new ProfileService(databaseManager);
        this.teamService = new TeamService(databaseManager);
    }

    registerRoutes(): void {
        this.fastify.post<AuthenticatedRequest>('/team', Auth.ValidateWithData, this.ListTeamUsers.bind(this));

        this.fastify.post<AddTeamMemberRequest>('/team/add', Auth.ValidateWithData, this.AddTeamUser.bind(this));
        this.fastify.post<RemoveTeamMemberRequest>('/team/remove', Auth.ValidateWithData, this.RemoveTeamUser.bind(this));
    }

    async ListTeamUsers(request: FastifyRequest<AuthenticatedRequest>, reply: FastifyReply) {
        try {
            let profileMembers = await this.teamService.listTeamMembers(request.body.authUser.id);

            let members = [];

            for (let profileMember of profileMembers) {
                let userId = profileMember.user_id;
                let profile = await this.profileService.getProfile(profileMember.profile_id);
                let sensitiveUser = await this.userService.getSensitiveUser(userId);

                members.push({
                    userId: userId,
                    profileId: profileMember.profile_id,
                    profileHandle: profile.handle,
                    email: sensitiveUser.email,
                    role: profileMember.role
                });
            }

            return members;
        } catch (e) {
            if (e instanceof HttpError) {
                if (e.statusCode !== StatusCodes.NOT_FOUND) {
                    reply.code(e.statusCode);
                    return ReplyUtils.error(e.message, e);
                }
            }
        }
    }

    async AddTeamUser(request: FastifyRequest<AddTeamMemberRequest>, reply: FastifyReply) {
        try {
            let user = await this.userService.getUserByEmail(request.body.email);

            if (user.id === request.body.authUser.id) {
                reply.status(StatusCodes.BAD_REQUEST);
                return ReplyUtils.error("You can't add yourself as a team member!");
            }

            await this.teamService.addTeamMember(request.body.authProfile.id, user.id, request.body.role);

            reply.status(StatusCodes.OK);
            return ReplyUtils.success("Success.");
        } catch (e) {
            if (e instanceof HttpError) {
                reply.code(e.statusCode);
                return ReplyUtils.error(e.message, e);
            }
        }
    }

    async RemoveTeamUser(request: FastifyRequest<RemoveTeamMemberRequest>, reply: FastifyReply) {
        let user;
        try {
            if (request.body.email) {
                user = await this.userService.getUserByEmail(request.body.email);

                if (user.id === request.body.authUser.id) {
                    if (await Auth.checkProfileOwnership(this.pool, request.body.profileId, request.body.authUser.id, false)) {
                        reply.status(StatusCodes.BAD_REQUEST);
                        return ReplyUtils.error("You can't remove yourself from your own team!");
                    }
                }
            } else {
                user = {id: request.body.authUser.id};
            }

            if (!await Auth.checkProfileOwnership(this.pool, request.body.profileId, request.body.authUser.id, true)) {
                reply.status(StatusCodes.UNAUTHORIZED);
                return ReplyUtils.error("The user doesn't own this profile.");
            }

            await this.teamService.removeTeamMember(request.body.profileId, user.id);
            reply.status(StatusCodes.OK);
            return ReplyUtils.success("Success.");
        } catch (e) {
            if (e instanceof HttpError) {
                if (e.statusCode !== StatusCodes.NOT_FOUND) {
                    reply.code(e.statusCode);
                    return ReplyUtils.error(e.message, e);
                }
            }
        }
    }
}
