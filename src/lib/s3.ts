import { S3Client, PutObjectCommand } from '@aws-sdk/client-s3';
import { getSignedUrl } from '@aws-sdk/s3-request-presigner';
import crypto from 'crypto';

const s3Client = new S3Client({
  region: process.env.S3_REGION!,
  endpoint: process.env.S3_ENDPOINT!,
  credentials: {
    accessKeyId: process.env.S3_ACCESS_KEY_ID!,
    secretAccessKey: process.env.S3_SECRET_ACCESS_KEY!,
  },
});

const acceptedFileTypes = [
  'image/jpeg',
  'image/png',
  'image/webp',
  'image/gif',
];
const maxFileSize = 1024 * 1024 * 5; // 5 MB

export async function getSignedURL(fileType: string, fileSize: number) {
  if (!acceptedFileTypes.includes(fileType)) {
    throw new Error('Invalid file type');
  }

  if (fileSize > maxFileSize) {
    throw new Error('File size too large');
  }

  const randomBytes = crypto.randomBytes(16);
  const imageName = randomBytes.toString('hex');

  const putObjectCommand = new PutObjectCommand({
    Bucket: process.env.S3_BUCKET_NAME!,
    Key: imageName,
    ContentType: fileType,
    ContentLength: fileSize,
  });

  const signedUrl = await getSignedUrl(s3Client, putObjectCommand, {
    expiresIn: 60, // 60 seconds
  });

  const fileUrl = `https://${process.env.S3_BUCKET_NAME}.${process.env.S3_ENDPOINT?.split('//')[1]}/${imageName}`;

  return { signedUrl, fileUrl };
}
