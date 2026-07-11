const AWS = require("aws-sdk");
const { v4: uuidv4 } = require("uuid");

AWS.config.update({
  accessKeyId: process.env.AWS_ACCESS_KEY_ID,
  secretAccessKey: process.env.AWS_SECRET_ACCESS_KEY,
  region: process.env.AWS_REGION,
});

const s3 = new AWS.S3();

const uploadToS3 = async (file, folder = "recipes") => {
  const extension = file.originalname.split(".").pop();

  const key = `${folder}/${uuidv4()}.${extension}`;

  const result = await s3
    .upload({
      Bucket: process.env.AWS_S3_BUCKET,
      Key: key,
      Body: file.buffer,
      ContentType: file.mimetype,
    })
    .promise();

  return result.Location;
};

const deleteFromS3 = async (imageUrl) => {
  if (!imageUrl) return;

  const url = new URL(imageUrl);

  const key = decodeURIComponent(url.pathname.substring(1));

  await s3
    .deleteObject({
      Bucket: process.env.AWS_S3_BUCKET,
      Key: key,
    })
    .promise();
};

module.exports = {
  uploadToS3,
  deleteFromS3,
};