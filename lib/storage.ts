import * as Minio from 'minio';

// S3_ENDPOINT is a full URL (e.g. https://s3.feendesk.com) rather than a bare
// host, so pull the hostname/port/protocol Minio.Client actually wants out of
// it — tolerating a bare host:port value too, in case it's ever set that way.
function parseS3Endpoint() {
  const raw = process.env.S3_ENDPOINT || 'http://localhost:9000';
  const withProtocol = /^https?:\/\//i.test(raw)
    ? raw
    : `http${process.env.S3_USE_SSL === 'true' ? 's' : ''}://${raw}`;
  const url = new URL(withProtocol);
  const useSSL = process.env.S3_USE_SSL !== undefined ? process.env.S3_USE_SSL === 'true' : url.protocol === 'https:';
  const port = url.port ? parseInt(url.port, 10) : undefined;
  return { hostname: url.hostname, useSSL, port };
}

const { hostname, useSSL, port } = parseS3Endpoint();
const region = process.env.S3_REGION || 'us-east-1';
const bucketName = process.env.S3_BUCKET || 'orochat';

const minioClient = new Minio.Client({
  endPoint: hostname,
  ...(port !== undefined ? { port } : {}),
  useSSL,
  accessKey: process.env.S3_ACCESS_KEY || '',
  secretKey: process.env.S3_SECRET_KEY || '',
  region,
  pathStyle: process.env.S3_FORCE_PATH_STYLE === 'true',
});

/**
 * Ensures the bucket exists, creating it if it doesn't.
 */
export async function ensureBucket() {
  const exists = await minioClient.bucketExists(bucketName);
  if (!exists) {
    await minioClient.makeBucket(bucketName, region);
  }

  // Always ensure the bucket policy is set for public read access to objects
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

  try {
    await minioClient.setBucketPolicy(bucketName, JSON.stringify(policy));
  } catch (error) {
    console.error('Error setting S3 bucket policy:', error);
  }
}

/**
 * Uploads a file to S3-compatible storage.
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

  const baseUrl = (process.env.S3_ENDPOINT || 'http://localhost:9000').replace(/\/+$/, '');
  return `${baseUrl}/${bucketName}/${encodeURIComponent(objectName)}`;
}

/**
 * Deletes a file from S3-compatible storage.
 */
export async function deleteFile(objectName: string) {
  try {
    await minioClient.removeObject(bucketName, objectName);
  } catch (error) {
    console.error('Error deleting file from storage:', error);
  }
}
