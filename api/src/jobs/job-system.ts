import {Pool} from "pg";
import cron from "node-cron";
import {DbLocks} from "../utils/db-locks";
import {ImageUtils} from "../utils/image-utils";
import {config} from "../config/config";
import {URL} from "url";

export class JobSystem {
    static LOCK_REFRESH_MATERIAL_VIEW: number = 1;
    static LOCK_DELETE_EXPIRED_NONCES: number = 2;

    /**
     * Private pool instance for Job Manager.
     * @private
     */
    private static pool: Pool;

    /**
     * Initialize Job System.
     * @param pool
     */
    static async initialize(pool: Pool) {
        this.pool = pool;

        await this.scheduleMaintenanceTasks();
    }

    static async scheduleMaintenanceTasks() {
        // Refresh material view
        cron.schedule("*/10 * * * *", this.refreshMaterialView.bind(this));

        // Delete unused files from do spaces
        cron.schedule("0 0 * * 0", this.cleanupUnusedFilesFromSpaces.bind(this));

        // Delete expired nonces
        cron.schedule("*/5 * * * *", this.deleteExpiredNonces.bind(this));
    }


    /**
     * This is a weekly cronjob that removes unused svg icons from S3
     * to free up space.
     */
    static async cleanupUnusedFilesFromSpaces() {
        let allSvgIcons = await ImageUtils.listFiles(config.s3Bucket.publicBucketName, 'svgIcons/');
        if (allSvgIcons.length == 0) {
            return;
        }
        let queryResults = await this.pool.query(
            "select socialIcons->'customSvg' as customsvg FROM app.links, jsonb_array_elements(metadata->'socialIcons') socialIcons");
        queryResults.rows = queryResults.rows.map(row => row.customsvg);
        const toRemove: string[] = allSvgIcons.filter(function (el) {
            return queryResults.rows.indexOf(el) < 0;
        }).map(fileToRemove => new URL(fileToRemove).pathname.replace(`/${config.s3Bucket.publicBucketName}/`, ""));

        if (toRemove.length == 0) {
            return;
        }

        await ImageUtils.deleteFiles(config.s3Bucket.publicBucketName, toRemove);
    }

    static async refreshMaterialView() {
        let lock = await DbLocks.requestLock(JobSystem.LOCK_REFRESH_MATERIAL_VIEW);

        if (!lock)
            return;

        //language=PostgreSQL
        await this.pool.query("refresh materialized view analytics.global_stats");

        await DbLocks.releaseLock(JobSystem.LOCK_REFRESH_MATERIAL_VIEW);
    }

    static async deleteExpiredNonces() {
        let lock = await DbLocks.requestLock(JobSystem.LOCK_DELETE_EXPIRED_NONCES);

        if (!lock)
            return;

        //language=PostgreSQL
        await this.pool.query("delete from security.nonces where expires < now()");

        await DbLocks.releaseLock(JobSystem.LOCK_DELETE_EXPIRED_NONCES);
    }
}
