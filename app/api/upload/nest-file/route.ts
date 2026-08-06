import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { uploadFile } from '@/lib/storage';

const MAX_FILE_SIZE = 25 * 1024 * 1024; // 25MB — documents/zips, not just images

export async function POST(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const formData = await request.formData();
    const file = formData.get('file') as File;

    if (!file) {
      return NextResponse.json({ error: 'No file provided' }, { status: 400 });
    }

    if (file.size > MAX_FILE_SIZE) {
      return NextResponse.json({ error: 'File size must be less than 25MB' }, { status: 400 });
    }

    const buffer = Buffer.from(await file.arrayBuffer());
    const { url, objectName } = await uploadFile(buffer, file.name, file.type);

    return NextResponse.json({
      success: true,
      url,
      objectName,
      fileName: file.name,
      contentType: file.type || 'application/octet-stream',
      size: file.size,
    });
  } catch (error) {
    console.error('Nest file upload error:', error);
    return NextResponse.json({ error: 'Failed to upload file to cloud storage' }, { status: 500 });
  }
}
