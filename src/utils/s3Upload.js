// const { S3Client, PutObjectCommand } = require("@aws-sdk/client-s3");
const { Upload } = require("@aws-sdk/lib-storage");
const aws4 = require("aws4");
const fs = require("fs");
const path = require("path");
require("dotenv").config();
const s3 = require("../config/s3");

exports.uploadToS3 = async (file) => {
    const fileKey = `insta/${Date.now()}_${file.originalname}`;
    const params = {
        Bucket: process.env.AWS_BUCKET_NAME,
        Key: fileKey,
        Body: file.buffer,
        ContentType: file.mimetype
    };

    try {
        const upload = new Upload({
            client: s3,
            params,
        });

        await upload.done();
        return `https://${process.env.AWS_BUCKET_NAME}.s3.${process.env.AWS_REGION}.amazonaws.com/${fileKey}`;
    } catch (error) {
        console.error("S3 Upload Error:", error);
        throw new Error("File upload failed");
    }
};

exports.uploadQrToS3 = async (fileBuffer, fileKey, contentType = "application/octet-stream") => {
    const params = {
        Bucket: process.env.AWS_BUCKET_NAME,
        Key: fileKey,
        Body: fileBuffer,
        ContentType: contentType,
    };

    const upload = new Upload({
        client: s3,
        params,
    });
    await upload.done();

    return `https://${process.env.AWS_BUCKET_NAME}.s3.${process.env.AWS_REGION}.amazonaws.com/${fileKey}`;
};

function signS3GetUrl({ key, expiresInSeconds = 24 * 60 * 60, downloadFileName = null }) {
    const bucket = process.env.AWS_BUCKET_NAME;
    const region = process.env.AWS_REGION;
    const accessKeyId = process.env.AWS_ACCESS_KEY_ID;
    const secretAccessKey = process.env.AWS_SECRET_ACCESS_KEY;

    if (!bucket || !region || !accessKeyId || !secretAccessKey) {
        throw new Error("Missing AWS env vars for signed URL generation.");
    }

    const encodedKey = key
        .split("/")
        .map((part) => encodeURIComponent(part))
        .join("/");

    const host = `${bucket}.s3.${region}.amazonaws.com`;
    const queryParams = [`X-Amz-Expires=${expiresInSeconds}`];
    if (downloadFileName) {
        queryParams.push(
            `response-content-disposition=${encodeURIComponent(`attachment; filename="${downloadFileName}"`)}`
        );
    }

    const request = {
        service: "s3",
        region,
        method: "GET",
        host,
        path: `/${encodedKey}?${queryParams.join("&")}`,
        signQuery: true
    };

    aws4.sign(request, {
        accessKeyId,
        secretAccessKey
    });

    return `https://${host}${request.path}`;
}

exports.uploadLocalFileToS3 = async (filePath, options = {}) => {
    const {
        keyPrefix = "insta/final-videos",
        expiresInSeconds = 24 * 60 * 60,
        contentType = "video/mp4"
    } = options;

    const fileName = path.basename(filePath);
    const fileKey = `${keyPrefix}/${Date.now()}_${fileName}`;
    const params = {
        Bucket: process.env.AWS_BUCKET_NAME,
        Key: fileKey,
        Body: fs.createReadStream(filePath),
        ContentType: contentType,
        CacheControl: "private, max-age=86400",
        Expires: new Date(Date.now() + expiresInSeconds * 1000)
    };

    const upload = new Upload({
        client: s3,
        params
    });

    await upload.done();

    return {
        bucket: process.env.AWS_BUCKET_NAME,
        key: fileKey,
        s3Url: `https://${process.env.AWS_BUCKET_NAME}.s3.${process.env.AWS_REGION}.amazonaws.com/${fileKey}`,
        expiresAt: new Date(Date.now() + expiresInSeconds * 1000).toISOString(),
        viewUrl: signS3GetUrl({ key: fileKey, expiresInSeconds }),
        downloadUrl: signS3GetUrl({ key: fileKey, expiresInSeconds, downloadFileName: fileName })
    };
};
