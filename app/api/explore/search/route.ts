import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/lib/db';

export async function GET(request: NextRequest) {
  try {
    const searchParams = request.nextUrl.searchParams;
    const query = searchParams.get('q') || '';
    const category = searchParams.get('category') || '';

    let whereClause: any = {};

    if (query) {
      whereClause.OR = [
        { name: { contains: query, mode: 'insensitive' } },
        { email: { contains: query, mode: 'insensitive' } },
        { title: { contains: query, mode: 'insensitive' } },
        { company: { contains: query, mode: 'insensitive' } },
        { location: { contains: query, mode: 'insensitive' } },
      ];
    }

    if (category) {
      // Search in title or company for category matches
      whereClause.OR = [
        { title: { contains: category, mode: 'insensitive' } },
        { company: { contains: category, mode: 'insensitive' } },
      ];
    }

    const users = await db.user.findMany({
      where: whereClause,
      select: {
        id: true,
        name: true,
        email: true,
        avatar: true,
        title: true,
        company: true,
        location: true,
        bio: true,
        isPartner: true,
        verifiedOrosCount: true,
        currentTES: true,
      },
      orderBy: [
        { isPartner: 'desc' },
        { verifiedOrosCount: 'desc' },
        { createdAt: 'desc' },
      ],
      take: 50,
    });

    return NextResponse.json({ success: true, users });
  } catch (error) {
    console.error('Search error:', error);
    return NextResponse.json(
      { error: 'Failed to search users' },
      { status: 500 }
    );
  }
}

