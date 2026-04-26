import * as Minio from 'minio';

const minioClient = new Minio.Client({
  endPoint: '149.102.155.247',
  port: 9000,
  useSSL: false,
  accessKey: 'admin',
  secretKey: 'G1veMePass2026',
});

const bucketName = 'orochat';

async function main() {
  console.log('Manually updating MinIO bucket policy...');
  
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
  
  console.log('Bucket policy updated successfully.');
}

main().catch(console.error);
