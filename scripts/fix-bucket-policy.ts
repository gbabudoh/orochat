import { ensureBucket } from '@/lib/storage';

async function main() {
  console.log('Manually updating S3 bucket policy...');
  await ensureBucket();
  console.log('Bucket policy updated successfully.');
}

main().catch(console.error);
