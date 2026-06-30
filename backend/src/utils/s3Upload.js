const AWS = require('aws-sdk');
const { v4: uuidv4 } = require('uuid');

// Configure AWS
AWS.config.update({
    accessKeyId: process.env.AWS_ACCESS_KEY_ID,
    secretAccessKey: process.env.AWS_SECRET_ACCESS_KEY,
    region: process.env.AWS_REGION
});

const s3 = new AWS.S3();

const uploadToS3 = async (file) => {
    const fileExtension = file.originalname.split('.').pop();
    const fileName = `recipes/${uuidv4()}.${fileExtension}`;

    const params = {
        Bucket: process.env.AWS_S3_BUCKET,
        Key: fileName,
        Body: file.buffer,
        ContentType: file.mimetype,
        ACL: 'public-read'
    };

    try {
        const result = await s3.upload(params).promise();
        return result.Location;
    } catch (error) {
        console.error('S3 Upload Error:', error);
        throw new Error('Failed to upload image to S3');
    }
};

const deleteFromS3 = async (fileUrl) => {
    if (!fileUrl) return;

    try {
        const key = fileUrl.split('/').pop();
        const params = {
            Bucket: process.env.AWS_S3_BUCKET,
            Key: key
        };
        await s3.deleteObject(params).promise();
    } catch (error) {
        console.error('S3 Delete Error:', error);
    }
};

module.exports = { uploadToS3, deleteFromS3 };