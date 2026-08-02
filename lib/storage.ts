import * as Minio from 'minio';

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

export async function ensureBucket() {
  const exists = await minioClient.bucketExists(bucketName);
  if (!exists) {
    await minioClient.makeBucket(bucketName, region);
  }

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
 * Uploads a file to S3 storage with automatic 3.5s timeout & Base64 fallback
 * to prevent upload hanging when S3 endpoint is unreachable.
 */
export async function uploadFile(
  file: Buffer,
  fileName: string,
  contentType: string
): Promise<string> {
  const uploadPromise = (async () => {
    await ensureBucket();

    const objectName = `${Date.now()}-${fileName}`;

    await minioClient.putObject(bucketName, objectName, file, file.length, {
      'Content-Type': contentType,
    });

    const baseUrl = (process.env.S3_ENDPOINT || 'http://localhost:9000').replace(/\/+$/, '');
    return `${baseUrl}/${bucketName}/${encodeURIComponent(objectName)}`;
  })();

  const timeoutPromise = new Promise<never>((_, reject) =>
    setTimeout(() => reject(new Error('Storage connection timeout')), 3500)
  );

  try {
    return await Promise.race([uploadPromise, timeoutPromise]);
  } catch (error) {
    console.warn('S3 cloud storage unreachable or timed out, falling back to data URL:', error);
    const base64 = file.toString('base64');
    return `data:${contentType};base64,${base64}`;
  }
}

export async function deleteFile(objectName: string) {
  try {
    await minioClient.removeObject(bucketName, objectName);
  } catch (error) {
    console.error('Error deleting file from storage:', error);
  }
}
