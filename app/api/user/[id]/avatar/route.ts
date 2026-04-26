import { db } from '@/lib/db';
import { NextRequest, NextResponse } from 'next/server';

export async function GET(
  _req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params;

  const user = await db.user.findUnique({
    where: { id },
    select: { avatar: true },
  });

  if (!user?.avatar) {
    return new NextResponse(null, { status: 404 });
  }

  // Stored as a base64 data URL — decode and return as binary
  if (user.avatar.startsWith('data:')) {
    const commaIndex = user.avatar.indexOf(',');
    const header = user.avatar.slice(0, commaIndex);
    const base64Data = user.avatar.slice(commaIndex + 1);
    const mimeType = header.match(/data:([^;]+)/)?.[1] ?? 'image/jpeg';
    const binary = Buffer.from(base64Data, 'base64');

    return new Response(binary, {
      headers: {
        'Content-Type': mimeType,
        'Cache-Control': 'no-store',
        'Content-Length': String(binary.length),
      },
    });
  }

  // Plain URL — fetch and stream to bypass browser security blocks (like Firefox HTTPS-Only)
  try {
    const response = await fetch(user.avatar);
    if (!response.ok) throw new Error('Failed to fetch from storage');
    
    const blob = await response.blob();
    return new Response(blob, {
      headers: {
        'Content-Type': response.headers.get('Content-Type') || 'image/jpeg',
        'Cache-Control': 'private, max-age=3600',
      },
    });
  } catch (error) {
    console.error('Avatar proxy error:', error);
    return new NextResponse(null, { status: 404 });
  }
}
