import {DatabaseManager} from "../data/database-manager";
import {DatabaseService} from "./database-service";
import {config} from "../config/config";
import {DbTypeConverter} from "../utils/db-type-converter";
import {HttpError} from "../utils/http-error";
import {StatusCodes} from "http-status-codes";
import {StringUtils} from "../utils/string-utils";
import {QueryResult} from "pg";
import {DatabaseError} from 'pg-protocol/dist/messages';
import {ScreenshotUtils} from "../utils/screenshot-utils";
import {Options as PageresOptions} from "pageres";

/**
 * This service takes care of transactional tasks related to Profiles.
 */
export class ProfileService extends DatabaseService {

    constructor(databaseManager: DatabaseManager) {
        super(databaseManager);
    }

    /**
     * Gets a profile by id.
     *
     * @param profileId
     * @param checkVisibility
     */
    async getProfile(profileId: string, checkVisibility: boolean = false): Promise<Profile> {
        let profileResult = await this.pool.query<DbProfile>("select * from app.profiles where id=$1", [profileId]);

        if (profileResult.rowCount < 1) {
            throw new HttpError(StatusCodes.NOT_FOUND, "The profile couldn't be found.");
        }

        let profileRow = profileResult.rows[0];

        if (checkVisibility) {
            if (profileRow.visibility === 'unpublished') {
                throw new HttpError(StatusCodes.FORBIDDEN, "This profile is unpublished.");
            }
        }

        return DbTypeConverter.toProfile(profileRow);
    }

    /**
     * Gets a profile by handle.
     *
     * @param handle The handle of the profile.
     * @param checkVisibility Throw an HttpError if the profile is unpublished.
     */
    async getProfileByHandle(handle: string, checkVisibility: boolean): Promise<Profile> {
        let profileResult = await this.pool.query<DbProfile>("select * from app.profiles where handle ILIKE $1", [handle]);

        if (profileResult.rowCount < 1) {
            throw new HttpError(StatusCodes.NOT_FOUND, "The profile couldn't be found.");
        }

        let profileRow = profileResult.rows[0];

        if (checkVisibility) {
            if (profileRow.visibility === 'unpublished') {
                throw new HttpError(StatusCodes.FORBIDDEN, "This profile is unpublished.");
            }
        }

        return DbTypeConverter.toProfile(profileRow);
    }

    /**
     * Generates a thumbnail image of a profile.
     *
     * @param handle
     */
    async getThumbnailByHandle(handle: string): Promise<Buffer> {
        let scale = 3;

        let final_size = {
            x: 1200,
            y: 630
        };

        let resolution = {
            x: final_size.x / scale,
            y: final_size.y / scale
        };

        try {
            let screenshotOptions: PageresOptions = {
                scale: scale,
                crop: true,
                hide: [
                    '.share-menu-container',
                ],
                css: "img.nc-avatar {margin-top: 10px !important;}",
                launchOptions: {
                    args: [
                        '--no-sandbox',
                        '--disable-setuid-sandbox'
                    ]
                }
            };
            let url = `${config.rendererUrl}/${handle}`;

            return await ScreenshotUtils.getOrCreateScreenshot(
                url,
                [`${resolution.x}x${resolution.y}`],
                ScreenshotUtils.DEFAULT_TTL,
                false,
                screenshotOptions
            );
        } catch (err) {
            console.error(err);
            throw new HttpError(StatusCodes.INTERNAL_SERVER_ERROR, "An internal error occurred while fetching the thumbnail.");
        }
    }

    /**
     * Generates a thumbnail image of a profile.
     *
     * @param handle
     * @param token
     */
    async getImagePreviewByHandle(handle: string, token: string | undefined | null): Promise<Buffer> {
        let final_size = {
            x: 592,
            y: 1184
        };

        if (token) {
            token = `?token=${token}`;
        } else {
            token = "";
        }

        try {
            let screenshotOptions: PageresOptions = {
                crop: true,
                hide: [
                    '.share-menu-container'
                ],
                launchOptions: {
                    args: [
                        '--no-sandbox',
                        '--disable-setuid-sandbox'
                    ]
                }
            };
            let url = `${config.rendererUrl}/${handle}${token}`;

            return await ScreenshotUtils.getOrCreateScreenshot(
                url,
                [`${final_size.x}x${final_size.y}`],
                ScreenshotUtils.DEFAULT_TTL,
                false,
                screenshotOptions
            );
        } catch (err) {
            console.error(err);
            throw new HttpError(StatusCodes.INTERNAL_SERVER_ERROR, "An internal error occurred while fetching the thumbnail.");
        }
    }

    /**
     * Creates a new profile.
     *
     * @param userId The userId that owns this profile.
     * @param handle The handle that is given to the newly created profile for this account Ex: singlel.ink/neutroncreative
     * @param imageUrl
     * @param headline
     * @param subtitle
     */
    async createProfile(userId: string, handle?: string, imageUrl?: string, headline?: string, subtitle?: string): Promise<Profile> {
        if (!handle) {
            handle = StringUtils.generateRandomSlug();
        }

        let profileResult = await this.pool.query<DbProfile>("select 1 from app.profiles where handle ILIKE $1 limit 1", [handle]);

        if (profileResult.rowCount > 0) {
            throw new HttpError(StatusCodes.CONFLICT, "The profile couldn't be added because the handle is already being used.");
        }

        let queryResult = await this.pool.query<DbProfile>("insert into app.profiles (handle, user_id, image_url, headline, subtitle, metadata) values ($1, $2, $3, $4, $5, $6) on conflict do nothing returning *",
            [
                handle,
                userId,
                imageUrl,
                headline,
                subtitle,
                {
                    privacyMode: false,
                    unlisted: false,
                    coverImage: null,
                    pageHtml: null,
                    shareMenu: true,
                    showAvatar: true
                }
            ]);

        if (queryResult.rowCount < 1)
            throw new HttpError(StatusCodes.CONFLICT, "The profile couldn't be added because the handle is already being used.");


        return DbTypeConverter.toProfile(queryResult.rows[0]);
    }

    /**
     * Gets all the profiles that an account is associated with.
     *
     * @param userId
     * @param listMemberOf List the profiles that this user is a member of?
     * @param includePaymentInfoAndAnalytics
     */
    async listProfiles(userId: string, listMemberOf: boolean = false, includePaymentInfoAndAnalytics: boolean = false): Promise<Profile[]> {
        let query = "select * from app.profiles where user_id=$1";

        if (listMemberOf) {
            query = "select * from app.profiles where user_id=$1 or exists(select 1 from enterprise.profile_members where user_id=$1 and profile_id=profiles.id)";
            if (includePaymentInfoAndAnalytics) {
                query = "select distinct p.*,s.tier as status from app.profiles as p left join enterprise.subscriptions as s on p.id=s.profile_id where p.user_id=$1 or exists(select 1 from enterprise.profile_members where user_id=$1 and profile_id=p.id)";
            }
        }

        let queryResult = await this.pool.query<ProfileWithAnalytics>(query, [userId]);

        if (queryResult.rowCount < 1)
            throw new HttpError(StatusCodes.NOT_FOUND, "The profiles couldn't be found.");


        if (includePaymentInfoAndAnalytics) {
            const profileIds = queryResult.rows.map(x => x.id);
            const analyticsQuery = "select referral_id, COUNT(*) as page_views from analytics.visits where type='page' and referral_id = ANY($1::bigint[]) GROUP BY referral_id;";
            let analyticsQueryResult = await this.pool.query<VisitCount>(analyticsQuery, [profileIds]);
            return queryResult.rows.map(x => {
                x.page_views = analyticsQueryResult.rows.find(y => x.id === y.referral_id?.toString())?.page_views || "0";
                return DbTypeConverter.snakeToCamel(x);
            });
        }

        return queryResult.rows.map(x => {
            return DbTypeConverter.snakeToCamel(x);
        });
    }

    /**
     * Sets the active theme for a profile. Clears it if the themeId is null.
     *
     * @param profileId
     * @param themeId
     */
    async setActiveTheme(profileId: string, themeId: string): Promise<Profile> {
        let queryResult = await this.pool.query<DbProfile>("update app.profiles set theme_id=$1 where id=$2 returning *", [themeId, profileId]);

        if (queryResult.rowCount < 1)
            throw new HttpError(StatusCodes.NOT_FOUND, "The profile couldn't be found.");

        return DbTypeConverter.toProfile(queryResult.rows[0]);
    }

    /**
     * Returns the amounts on an account.
     *
     * @param userId The user id associated with the profiles.
     */
    async getProfileCount(userId: string): Promise<number> {
        return (await this.pool.query<{ count: number }>("select count(*) from app.profiles " +
            "where user_id=$1", [userId])).rows[0].count;
    }

    async countPublishedProfiles(userId: string): Promise<number> {
        let queryResult = await this.pool.query<{ count: number }>("select count(*) from app.profiles where user_id=$1 and visibility != 'unpublished'", [userId]);

        return queryResult.rows[0].count;
    }

    /**
     * Updates a profile.
     *
     * @param profileId
     * @param imageUrl
     * @param headline
     * @param subtitle
     * @param handle
     * @param visibility
     * @param showWatermark
     * @param customCss
     * @param customHtml
     * @param customDomain
     * @param metadata
     */
    async updateProfile(profileId: string, imageUrl ?: string, headline ?: string, subtitle ?: string, handle?: string,
                        visibility ?: string,
                        showWatermark ?: boolean,
                        customCss ?: string,
                        customHtml ?: string,
                        customDomain: string | null | undefined = null,
                        metadata: any = null
    ):
        Promise<Profile> {

        if (handle) {
            let profileResult = await this.pool.query<DbProfile>("select 1 from app.profiles where handle ILIKE $1 and id != $2 limit 1",
                [handle, profileId]);

            if (profileResult.rowCount > 0) {
                throw new HttpError(StatusCodes.CONFLICT, "The profile couldn't be added because the handle is already being used.");
            }
        }

        let queryResult
            :
            QueryResult<DbProfile>;

        try {
            queryResult = await this.pool.query<DbProfile>("update app.profiles\nset image_url=coalesce($1, image_url),\n    headline=coalesce($2, headline),\n    subtitle=coalesce($3, subtitle),\n    handle=coalesce($4, handle),\n    visibility=coalesce($5, visibility),\n    show_watermark=coalesce($6, show_watermark),\n    custom_css=coalesce($7, custom_css),\n    custom_html=coalesce($8, custom_html),\n    custom_domain=$9,\n    metadata=coalesce($10, metadata)\nwhere id = $11\nreturning *;",
                [
                    imageUrl,
                    headline,
                    subtitle,
                    handle,
                    visibility,
                    showWatermark,
                    customCss,
                    customHtml,
                    customDomain ?? null,
                    metadata,
                    profileId
                ]);
        } catch (err) {
            if (err instanceof DatabaseError) {
                if (err.message.includes("duplicate key")) {
                    throw new HttpError(StatusCodes.CONFLICT, "This handle is already being used.");
                }
            }

            throw err;
        }

        if (queryResult.rowCount < 1)
            throw new HttpError(StatusCodes.NOT_FOUND, "The profile couldn't be found.");

        return DbTypeConverter.toProfile(queryResult.rows[0]);
    }

    /**
     * Deletes a profile. The user cannot delete a profile if they only have one.
     *
     * @param userId
     * @param profileId
     */
    async deleteProfile(userId: string, profileId: string): Promise<Profile> {
        let profilesResult = await this.listProfiles(userId);

        let profileRow: Profile | undefined = profilesResult.find(x => x.id === profileId);

        if (!profileRow) {
            throw new HttpError(StatusCodes.NOT_FOUND, "The user doesn't own this profile.");
        }

        profilesResult.splice(profilesResult.indexOf(profileRow), 1);

        if (await this.getProfileCount(userId) <= 1) {
            throw new HttpError(StatusCodes.BAD_REQUEST, "You cannot delete your only profile.");
        }

        let deletedProfile = await this.pool.query<DbProfile>("delete from app.profiles where id=$1", [profileId]);

        if (deletedProfile.rowCount < 1) {
            throw new HttpError(StatusCodes.INTERNAL_SERVER_ERROR, "Unable to delete the profile because of an internal error.");
        }

        let nextProfile = profilesResult[0];

        await this.pool.query("update app.users set active_profile_id=$1 where id=$2", [nextProfile.id, userId]);

        return nextProfile;
    }

    /**
     * Enables/Disables privacy mode for a profile. (Hide from analytics and visibility from certain areas.)
     *
     * @param profileId
     * @param privacyModeEnabled
     */
    async setPrivacyMode(profileId: string, privacyModeEnabled: boolean): Promise<Profile> {
        let queryResult = await this.pool.query<DbProfile>(`update app.profiles
                                                            set metadata = jsonb_set(metadata::jsonb, '{privacyMode}', $1, true)
                                                            where id = $2
                                                            returning *;`,
            [JSON.stringify(privacyModeEnabled), profileId]);

        if (queryResult.rowCount < 1) {
            throw new HttpError(StatusCodes.INTERNAL_SERVER_ERROR, "Unable to update the profile because of an internal error.");
        }

        return DbTypeConverter.toProfile(queryResult.rows[0]);
    }

    /**
     * Gets the top profiles by views. Also returns total link clicks.
     *
     * You can only get a max of 500 results.
     * @param limit
     */
    async getTopProfiles(limit ?: number): Promise<(Profile & { totalViews: number, totalClicks: number })[]> {
        if (!limit) {
            limit = 25;
        }

        if (limit > 500) {
            limit = 500;
        }

        let profileQueryResult = await this.pool.query<DbProfile & { total_views: string }>(`select *,
                                                                                                    (select count(*)
                                                                                                     from analytics.visits
                                                                                                     where referral_id = app.profiles.id
                                                                                                       and type = 'page') as total_views
                                                                                             from app.profiles
                                                                                             where ((metadata -> 'unlisted')::bool = true or metadata -> 'unlisted' is null)
                                                                                               and visibility = 'published'
                                                                                             order by total_views desc
                                                                                             limit $1;`,
            [limit]);

        let profiles: (Profile & { totalViews: number, totalClicks: number })[] = [];

        for (let dbProfile of profileQueryResult.rows) {
            let profile = <Profile & { totalViews: number, totalClicks: number }>DbTypeConverter.toProfile(dbProfile);
            profile.totalViews = Number.parseInt(dbProfile.total_views);
            profile.totalClicks = 0;

            let linkQueryResult = await this.pool.query<DbLink>("select id from app.links where profile_id=$1",
                [profile.id]);

            if (linkQueryResult.rowCount > 0) {
                let linkIds = linkQueryResult.rows.map(x => x.id);

                let queryResult = await this.pool.query<{ count: string }>("select count(*) from analytics.visits where referral_id=any($1) and type='link'",
                    [linkIds]);

                let count: number = Number.parseInt(queryResult.rows[0].count);
                profile.totalClicks += count;
            }

            profiles.push(profile);
        }

        return profiles;
    }
}
