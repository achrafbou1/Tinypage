import {config} from "../config/config";
import {BucketItem, Client, UploadedObjectInfo} from "minio";
import * as ObjectHash from "object-hash";
import {StatusCodes} from "http-status-codes";
import {HttpError} from "./http-error";
import Pageres, {Options as PageresOptions} from "pageres";
import fs from "fs";
import {File} from "fastify-multer/lib/interfaces";
import isSvg from "is-svg";

/**
 * This represents a query coming in from a user.
 */

export class ImageUtils {

    /**
     * One day in seconds
     */
    static readonly DEFAULT_TTL: number = 84600;

    static minio: Client | null = null;

    static publicBucketURL: string | null = null;
    static bucketEnabled: boolean[] = [false, false];

    static async initialize() {
        if (config.s3Bucket) {
            this.minio = new Client({
                endPoint: config.s3Bucket.endPoint,
                port: config.s3Bucket.port ? config.s3Bucket.port : 80,
                useSSL: config.s3Bucket.useSSL,
                accessKey: config.s3Bucket.accessKey,
                secretKey: config.s3Bucket.secretKey
            });

            const scheme = config.s3Bucket.useSSL ? 'https' : 'http';
            const port = config.s3Bucket.endPoint === 'localhost' ? `:${config.s3Bucket.port}` : "";
            this.publicBucketURL = `${scheme}://${config.s3Bucket.endPoint + port}/${config.s3Bucket.publicBucketName}`;

            this.bucketEnabled = await Promise.all([this.minio.bucketExists(config.s3Bucket.privateBucketName), this.minio.bucketExists(config.s3Bucket.publicBucketName)]);

            if (!this.bucketEnabled.every(Boolean)) {
                console.log(`S3 Buckets were configured, but no bucket with the name ${config.s3Bucket.privateBucketName}
                 or ${config.s3Bucket.publicBucketName} exists! You need to make this bucket first before you can use it.`);
                return;
            } else {
                console.log(`S3 Buckets are ready!`);
            }
        }
    }

    /**
     * Given an array of svg icons,
     * appends file contents to social icon settings.
     *
     * @param files The files to upload
     * @param siSettings Social icons settings
     */
    static async saveSvgIcons(files: File[], siSettings: { customSvg: string | null }[]): Promise<{ customSvg: string | null }[]> {
        const fileUploadRequests: Promise<UploadedObjectInfo>[] = [];
        if (this.minio && this.bucketEnabled) {
            for (const [i, file] of files.entries()) {
                if (!file.path) {
                    throw new Error('File path is required');
                }
                if (file.size === undefined) {
                    throw new Error('File size is required');
                }
                if (file.size === 0) {
                    continue;
                }
                if (file.size > 10485760) {
                    throw new Error('File size is greater than 10Mb.');
                }
                const fileData = await fs.promises.readFile(file.path);
                const fileContent = fileData.toString();

                if (!(isSvg(fileContent) && file.mimetype === 'image/svg+xml')) {
                    throw new Error('Only svg icons are accepted');
                }
                const savedPath = `svgIcons/${file.filename}.svg`;
                fileUploadRequests.push(
                    this.minio.putObject(config.s3Bucket.publicBucketName, savedPath, fileData.toString(), {
                        "filename": file.originalname,
                        "Content-Type": "image/svg+xml"
                    })
                );
                siSettings[i].customSvg = `${ImageUtils.publicBucketURL}/${savedPath}`;
            }
        }
        try {
            await Promise.all(fileUploadRequests);
        } catch (e) {
            console.error(e);
            throw new HttpError(StatusCodes.INTERNAL_SERVER_ERROR, 'An error occurred while saving files');
        }
        return siSettings;
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
    static async getOrCreateScreenshot(url: string,
                                       sizes: string[],
                                       ttl: number = ImageUtils.DEFAULT_TTL,
                                       noCache: boolean = false,
                                       options: PageresOptions
    ):
        Promise<Buffer> {
        let hash1 = ObjectHash.sha1(url);
        let hash2 = ObjectHash.sha1(options);
        let hash = ObjectHash.sha1(hash1 + hash2);

        if (!
            url.startsWith("http")
        ) {
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

    static async listFiles(bucket: string, folder: string): Promise<string[]> {
        return await new Promise((resolve, reject) => {
            const objectsList: string[] = [];
            if (this.bucketEnabled && this.minio) {
                const objectsStream = this.minio.listObjects(config.s3Bucket.publicBucketName, folder);
                objectsStream.on('data', function (obj: BucketItem) {
                    objectsList.push(`${ImageUtils.publicBucketURL}/${obj.name}`);
                });
                objectsStream.on('error', function (e) {
                    console.error(e);
                    reject(e);
                });

                objectsStream.on('end', function () {
                    resolve(objectsList);
                });
            }
        });
    }

    static async deleteFiles(bucket: string, svgIcons: string[]): Promise<void> {
        if (this.minio && this.bucketEnabled) {
            return this.minio.removeObjects(bucket, svgIcons);
        }
    }
}
