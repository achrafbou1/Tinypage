import {DatabaseManager} from "../data/database-manager";
import {DatabaseService} from "./database-service";
import {DbTypeConverter} from "../utils/db-type-converter";
import {logger} from 'bs-logger';

interface AnalyticsProfileData {
    totalProfileViews: number,
    linkVisits: {
        link: Link,
        views: number,
        subLinkVisits: LinkVisit[]
    }[],
    clickThroughRate: number
}

/**
 * This service takes care of transactional tasks for Analytics.
 */
export class AnalyticsService extends DatabaseService {

    constructor(databaseManager: DatabaseManager) {
        super(databaseManager);
    }

    /**
     * Returns analytics data from the database.
     *
     * Returns all data as -1 if the database was unable to be queried.
     */
    async getAnalytics(): Promise<AnalyticsGlobalStats> {
        let queryResult = await this.pool.query<DbAnalyticsGlobalStats>("select * from analytics.global_stats");

        if (queryResult.rowCount < 1) {
            return {
                totalUsers: -1,
                totalProfiles: -1,
                profilesPublished: -1,
                totalLinks: -1,
                totalThemes: -1,
            };
        }

        return DbTypeConverter.toAnalytics(queryResult.rows[0]);
    }

    /**
     * Creates a visit analytics record in the database.
     *
     * @param referralId The id of the VisitType that is being visited
     * @param socialIconUrl the social icon url if its a social icon
     * @param visitType The type of the visit
     */
    async createVisit(referralId: string, socialIconUrl: string | null = null, visitType: VisitType) {
        logger.debug(`insert into analytics
                      values (${referralId}, ${socialIconUrl}, ${visitType}) type, social_icon_url, referral_id`);
        await this.pool.query("insert into analytics.visits(type, social_icon_url, referral_id) values ($1, $2, $3)", [visitType, socialIconUrl, referralId]);
    }

    /**
     * Creates a visit anonymous analytics record in the database.
     * This does not contain any referral data.
     *
     * @param visitType The type of the visit
     */
    async createAnonymousVisit(visitType: VisitType) {
        await this.pool.query("insert into analytics.anonymous_visits(type) values ($1)", [visitType]);
    }

    /**
     * Gets the analytics data for a specific profile.
     *
     * @param profileId
     * @param dayRange The number of days to limit the range by, default is 30
     */
    async getProfileAnalyticsData(profileId: string, dayRange: number = 30): Promise<AnalyticsProfileData> {
        let profileViewQuery = await this.pool.query<{ profile_views: string | number }>(
            `select count(*) filter (where type = 'page') as profile_views
             from analytics.visits
             where referral_id = $1
               and created_on > current_date - interval '1 day' * $2
            `,
            [
                profileId,
                dayRange
            ]);

        if (profileViewQuery.rowCount < 1) {
            return {
                totalProfileViews: 0,
                linkVisits: [],
                clickThroughRate: 0
            };
        }

        let linksQuery = await this.pool.query<DbLink>("select * from app.links where profile_id=$1", [profileId]);

        let profileViews: number;

        if (typeof (profileViewQuery.rows[0].profile_views) === "string") {
            profileViews = Number.parseFloat(profileViewQuery.rows[0].profile_views);
        } else {
            profileViews = profileViewQuery.rows[0].profile_views;
        }

        if (linksQuery.rowCount < 1) {
            return {
                totalProfileViews: profileViews,
                linkVisits: [],
                clickThroughRate: 0
            };
        }

        let linkVisits: { link: Link, views: number, subLinkVisits: LinkVisit[] }[] = [];
        let totalLinks = 0;

        for (let i = 0; i < linksQuery.rowCount; i++) {
            let link = linksQuery.rows[i];
            let linkVisitQuery = await this.pool.query<DbAnalyticsVisit>(
                `select *
                 from analytics.visits
                 where referral_id = $1
                   and created_on > current_date - interval '1 day' * $2`,
                [
                    link.id,
                    dayRange
                ]);

            totalLinks++;

            let linkVisitCount = 0;
            let subLinkVisits = [];
            for (const visit of linkVisitQuery.rows) {
                linkVisitCount++;
                if (link.type === 'social' && visit.social_icon_url) {
                    subLinkVisits.push(link.metadata.socialIcons.find((x: { url: string }) => x.url === visit.social_icon_url).type);
                }
            }

            const subLinkCounts = subLinkVisits.reduce(function (r, a) {
                r[a] = r[a] || [];
                r[a].push(1);
                return r;
            }, Object.create(null));
            for (let [key, value] of Object.entries(subLinkCounts)) {
                // @ts-ignore
                subLinkCounts[key] = value.reduce(
                    (previousValue: number, currentValue: number) => previousValue + currentValue,
                    0
                );
            }

            const linkVisit = {
                link: DbTypeConverter.toLink(link),
                views: linkVisitCount,
                subLinkVisits: subLinkCounts
            };
            linkVisits.push(linkVisit);
        }

        let totalProfileViews = profileViews;
        let clickThroughRate = totalLinks / totalProfileViews * 100;

        return {
            totalProfileViews,
            linkVisits,
            clickThroughRate
        };
    }
}
