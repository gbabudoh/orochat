import * as Minio from 'minio';

const minioClient = new Minio.Client({
  endPoint: process.env.MINIO_ENDPOINT || 'localhost',
  port: parseInt(process.env.MINIO_PORT || '9000'),
  useSSL: process.env.MINIO_USE_SSL === 'true',
  accessKey: process.env.MINIO_ACCESS_KEY || '',
  secretKey: process.env.MINIO_SECRET_KEY || '',
});

const bucketName = process.env.MINIO_BUCKET || 'orochat';

/**
 * Ensures the bucket exists, creating it if it doesn't.
 */
export async function ensureBucket() {
  const exists = await minioClient.bucketExists(bucketName);
  if (!exists) {
    await minioClient.makeBucket(bucketName, 'us-east-1');
    
    // Set bucket policy for public read access to objects
    const policy = {
      Version: '2012-10-17',
      Statement: [
        {
          Effect: 'Allow',
          Principal: { AWS: ['*'] },
          Action: ['s3:GetObject'],
          Resource: [`arn:aws:s3:::${bucketName}/*`],
        },
      ],
    };
    await minioClient.setBucketPolicy(bucketName, JSON.stringify(policy));
  }
}

/**
 * Uploads a file to MinIO storage.
 */
export async function uploadFile(
  file: Buffer,
  fileName: string,
  contentType: string
): Promise<string> {
  await ensureBucket();
  
  const objectName = `${Date.now()}-${fileName}`;
  
  await minioClient.putObject(bucketName, objectName, file, file.length, {
    'Content-Type': contentType,
  });
  
  const baseUrl = process.env.NEXT_PUBLIC_MINIO_URL || `http://${process.env.MINIO_ENDPOINT}:${process.env.MINIO_PORT}`;
  return `${baseUrl}/${bucketName}/${objectName}`;
}

/**
 * Deletes a file from MinIO storage.
 */
export async function deleteFile(objectName: string) {
  try {
    await minioClient.removeObject(bucketName, objectName);
  } catch (error) {
    console.error('Error deleting file from MinIO:', error);
  }
}
