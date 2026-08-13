import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { Prisma } from '@prisma/client';
import { authOptions } from '@/lib/auth';
import { db } from '@/lib/db';
import { embedText, cosineSimilarity } from '@/lib/ai/embeddings';
import { getCategoryEmbedding } from '@/lib/ai/categoryEmbedding';
import { checkRateLimit } from '@/lib/rateLimit';
import { SafetyService } from '@/services/safety.service';

// Below this, a "match" is just noise (unrelated profile that happens to
// share generic vocabulary with the query/category).
const MIN_SIMILARITY = 0.4;

// No pgvector on this Postgres instance, so similarity is computed in app
// code against a capped candidate set rather than in SQL.
const CANDIDATE_LIMIT = 1000;

const SELECT_FIELDS = {
  id: true,
  name: true,
  username: true,
  avatar: true,
  title: true,
  company: true,
  location: true,
  countryCode: true,
  bio: true,
  isPartner: true,
  verifiedOrosCount: true,
  currentTES: true,
  embedding: true,
} as const;

type SearchCandidate = Prisma.UserGetPayload<{ select: typeof SELECT_FIELDS }>;

function stripEmbedding<T extends { embedding: number[] }>(user: T) {
  const { embedding, ...rest } = user;
  return rest;
}

export async function GET(request: NextRequest) {
  try {
    const ip = request.headers.get('x-forwarded-for')?.split(',')[0]?.trim() || 'unknown';
    const rateLimit = await checkRateLimit(`search:${ip}`, 60_000, 30);
    if (!rateLimit.allowed) {
      return NextResponse.json({ error: 'Too many search requests. Please slow down.' }, { status: 429 });
    }

    const searchParams = request.nextUrl.searchParams;
    const query = searchParams.get('q')?.trim() || '';
    const category = searchParams.get('category') || '';
    const country = searchParams.get('country') || '';
    const limit = Math.min(Math.max(parseInt(searchParams.get('limit') || '20', 10) || 20, 1), 50);

    // Route stays usable anonymously — this only adds mutual-block filtering
    // when a session happens to be present.
    const session = await getServerSession(authOptions);
    let excludedIds: string[] = [];
    if (session?.user?.id) {
      const blocks = await SafetyService.getBlockedUsers(session.user.id);
      const blockedByMe = blocks.map((b) => b.blockedId);
      const blockedMe = await db.block.findMany({ where: { blockedId: session.user.id }, select: { blockerId: true } });
      excludedIds = [...blockedByMe, ...blockedMe.map((b) => b.blockerId)];
    }

    const where: { countryCode?: string; isPaused: boolean; id?: { notIn: string[] } } = { isPaused: false };
    if (country) where.countryCode = country.toUpperCase();
    if (excludedIds.length) where.id = { notIn: excludedIds };

    // Handle-intent short-circuit: an exact @handle (or bare exact username)
    // match should be THE result, not one candidate among fuzzy/semantic
    // matches. An explicit "@" prefix additionally unlocks prefix matching.
    if (query) {
      const isHandleQuery = query.startsWith('@');
      const handle = isHandleQuery ? query.slice(1) : query;

      if (handle && /^[a-zA-Z0-9_.]+$/.test(handle)) {
        const exact = await db.user.findFirst({
          where: { ...where, username: { equals: handle, mode: 'insensitive' } },
          select: SELECT_FIELDS,
        });
        if (exact) {
          return NextResponse.json({ success: true, users: [stripEmbedding(exact)] });
        }

        if (isHandleQuery) {
          const prefixed = await db.user.findMany({
            where: { ...where, username: { startsWith: handle, mode: 'insensitive' } },
            select: SELECT_FIELDS,
            take: limit,
            orderBy: [{ isPartner: 'desc' }, { verifiedOrosCount: 'desc' }],
          });
          if (prefixed.length) {
            return NextResponse.json({ success: true, users: prefixed.map(stripEmbedding) });
          }
        }
      }
    }

    if (!query && !category) {
      const users = await db.user.findMany({
        where,
        select: SELECT_FIELDS,
        orderBy: [
          { isPartner: 'desc' },
          { verifiedOrosCount: 'desc' },
          { createdAt: 'desc' },
        ],
        take: limit,
      });
      return NextResponse.json({ success: true, users: users.map(stripEmbedding) });
    }

    let keywordCandidates: SearchCandidate[] = [];
    let generalCandidates: SearchCandidate[] = [];

    if (query) {
      const searchWhere = {
        ...where,
        OR: [
          { name: { contains: query, mode: 'insensitive' as const } },
          { username: { contains: query, mode: 'insensitive' as const } },
          { title: { contains: query, mode: 'insensitive' as const } },
          { company: { contains: query, mode: 'insensitive' as const } },
          { bio: { contains: query, mode: 'insensitive' as const } },
          { location: { contains: query, mode: 'insensitive' as const } },
        ]
      };

      [keywordCandidates, generalCandidates] = await Promise.all([
        db.user.findMany({ where: searchWhere, select: SELECT_FIELDS, take: 250 }),
        db.user.findMany({
          where,
          select: SELECT_FIELDS,
          take: 250,
          orderBy: [
            { isPartner: 'desc' },
            { currentTES: 'desc' },
            { verifiedOrosCount: 'desc' },
          ],
        }),
      ]);
    } else {
      generalCandidates = await db.user.findMany({
        where,
        select: SELECT_FIELDS,
        take: CANDIDATE_LIMIT,
        orderBy: [
          { isPartner: 'desc' },
          { currentTES: 'desc' },
          { verifiedOrosCount: 'desc' },
        ],
      });
    }

    // Merge General and Keyword candidates uniquely
    const candidatesMap = new Map<string, SearchCandidate>();
    generalCandidates.forEach((u) => candidatesMap.set(u.id, u));
    keywordCandidates.forEach((u) => candidatesMap.set(u.id, u));
    const combinedCandidates = Array.from(candidatesMap.values());

    const [queryVector, categoryVector] = await Promise.all([
      query ? embedText(query) : null,
      category ? getCategoryEmbedding(category) : null,
    ]);

    const lowerQuery = query.toLowerCase();

    const scored = combinedCandidates
      .map((user) => {
        const scores: number[] = [];

        if (queryVector) {
          const exactMatch = [user.name, user.username, user.title, user.company, user.bio, user.location].some((field) =>
            field?.toLowerCase().includes(lowerQuery)
          );
          const semanticScore = user.embedding.length
            ? cosineSimilarity(queryVector, user.embedding)
            : 0;
          scores.push(exactMatch ? 1.0 : semanticScore);
        }

        if (categoryVector) {
          scores.push(user.embedding.length ? cosineSimilarity(categoryVector, user.embedding) : 0);
        }

        const score = scores.reduce((a, b) => a + b, 0) / scores.length;
        return { user, score };
      })
      .filter(({ score }) => score >= MIN_SIMILARITY)
      .sort((a, b) => b.score - a.score)
      .slice(0, limit)
      .map(({ user }) => stripEmbedding(user));

    return NextResponse.json({ success: true, users: scored });
  } catch (error) {
    console.error('Search error:', error);
    return NextResponse.json(
      { error: 'Failed to search users' },
      { status: 500 }
    );
  }
}
