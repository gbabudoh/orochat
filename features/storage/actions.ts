'use server';

import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { uploadFile } from '@/lib/storage';

export async function uploadImage(formData: FormData) {
  const session = await getServerSession(authOptions);
  if (!session) return { error: 'Not authenticated' };

  const file = formData.get('file') as File;
  if (!file) return { error: 'No file provided' };

  try {
    const buffer = Buffer.from(await file.arrayBuffer());
    const fileName = file.name;
    const contentType = file.type;

    const url = await uploadFile(buffer, fileName, contentType);
    
    return { success: true, url };
  } catch (error) {
    console.error('Upload error:', error);
    return { error: 'Failed to upload image' };
  }
}
