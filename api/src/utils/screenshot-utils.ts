import {config} from "../config/config";
import {Client} from "minio";
import * as ObjectHash from "object-hash";
import {StatusCodes} from "http-status-codes";
import {HttpError} from "./http-error";
import * as fs from "fs";
import Pageres, {Options as PageresOptions} from "pageres";

/**
 * This represents a query coming in from a user.
 */

export class ScreenshotUtils {
    /**
     * One day in seconds
     */
    static readonly DEFAULT_TTL: number = 84600;

    static minio: Client | null = null;
    static bucketEnabled: boolean = false;

    static async initialize() {
        if (config.s3Bucket) {
            this.minio = new Client({
                endPoint: config.s3Bucket.endPoint,
                port: config.s3Bucket.port,
                useSSL: config.s3Bucket.useSSL,
                accessKey: config.s3Bucket.accessKey,
                secretKey: config.s3Bucket.secretKey
            });

            this.bucketEnabled = await this.minio.bucketExists(config.s3Bucket.bucketName);

            if (!this.bucketEnabled) {
                console.log(`S3 Bucket was configured, but no bucket with the name ${config.s3Bucket.bucketName} exists! You need to make this bucket first before you can use it.`);
                return;
            } else {
                console.log(`S3 Bucket is ready!`);
            }
        }
    }

    /**
     * Gets a screenshot, or creates it if it doesn't exist.
     * If noCache is enabled, then it creates a new screenshot every time.
     *
     * @param url The url of the page to be captured
     * @param sizes The sizes of the screenshots
     * @param ttl The time to live until the cached screenshot expires
     * @param noCache Whether we should cache the screenshot or not
     * @param options The screenshot options
     */
    static async getOrCreateScreenshot(url: string, sizes: string[], ttl: number = ScreenshotUtils.DEFAULT_TTL, noCache: boolean = false, options: PageresOptions): Promise<Buffer> {
        let hash1 = ObjectHash.sha1(url);
        let hash2 = ObjectHash.sha1(options);
        let hash = ObjectHash.sha1(hash1 + hash2);

        if (!url.startsWith("http")) {
            throw new HttpError(StatusCodes.BAD_REQUEST, `Only http protocol is supported when creating screenshots. URL received: ${url}`);
        }

        if (!noCache && this.bucketEnabled && this.minio) {
            let bucketName = config.s3Bucket.bucketName;

            try {
                let stats = await this.minio.statObject(bucketName, "imageCache/" + hash);
                let expires: Date = new Date(Date.parse(JSON.parse(stats.metaData.expires)));
                let date = new Date();

                if (expires > date) {
                    console.log(`Pulling from S3 bucket: imageCache/${hash}`);

                    let readableStream = await this.minio.getObject(bucketName, "imageCache/" + hash);

                    const chunks = [];
                    for await (let chunk of readableStream) {
                        chunks.push(chunk);
                    }

                    return Buffer.concat(chunks);
                }
            } catch (e) {
                console.log("No s3 cache found for pageresQuery: " + hash + ", downloading instead.");
            }
        }

        let screenshot = (await new Pageres(options)
            .src(url, sizes)
            .dest("captures")
            .run())[0];

        try {
            console.log(`Generated screenshot ${hash} of length ${screenshot.byteLength}`);

            if (!noCache && this.bucketEnabled && this.minio) {
                console.log("Caching to S3 Bucket");

                let expires = new Date();
                expires.setSeconds(expires.getSeconds() + ttl);

                await this.minio.fPutObject(
                    config.s3Bucket.bucketName, "imageCache/" + hash,
                    `captures/${screenshot.filename}`,
                    {
                        "expires": JSON.stringify(expires),
                        "filename": screenshot.filename
                    }
                );
            }

            let readStream = fs.createReadStream(`captures/${screenshot.filename}`);

            const chunks = [];
            for await (let chunk of readStream) {
                chunks.push(chunk);
            }

            return Buffer.concat(chunks);
        } finally {
            fs.unlink(`captures/${screenshot.filename}`, err => {
                if (err != null)
                    console.error("Error unlinking file: " + err);
            });
        }
    }
}
