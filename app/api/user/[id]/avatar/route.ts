import { db } from '@/lib/db';
import { NextRequest, NextResponse } from 'next/server';

export const dynamic = 'force-dynamic';

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

  // Stored as a data URL — decode and return as binary or raw string
  if (user.avatar.startsWith('data:')) {
    const commaIndex = user.avatar.indexOf(',');
    const header = user.avatar.slice(0, commaIndex);
    const rawData = user.avatar.slice(commaIndex + 1);
    const mimeType = header.match(/data:([^;]+)/)?.[1] ?? 'image/jpeg';
    
    let body: Uint8Array | string;
    if (header.includes(';base64')) {
      body = new Uint8Array(Buffer.from(rawData, 'base64'));
    } else {
      body = decodeURIComponent(rawData);
    }

    return new Response(body as BodyInit, {
      headers: {
        'Content-Type': mimeType,
        'Cache-Control': 'no-store, no-cache, must-revalidate',
        'Content-Length': String(Buffer.byteLength(body)),
      },
    });
  }

  // Plain URL — fetch and stream to bypass browser security blocks (like Firefox HTTPS-Only)
  try {
    const response = await fetch(user.avatar, { cache: 'no-store' });
    if (!response.ok) throw new Error('Failed to fetch from storage');
    
    const blob = await response.blob();
    return new Response(blob, {
      headers: {
        'Content-Type': response.headers.get('Content-Type') || 'image/jpeg',
        'Cache-Control': 'no-store, no-cache, must-revalidate',
      },
    });
  } catch (error) {
    console.error('Avatar proxy error:', error);
    return new NextResponse(null, { status: 404 });
  }
}
