import { NextRequest, NextResponse } from 'next/server';
import { Prisma } from '@prisma/client';
import { db } from '@/lib/db';
import { embedText, cosineSimilarity } from '@/lib/ai/embeddings';
import { getCategoryEmbedding } from '@/lib/ai/categoryEmbedding';

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
    const searchParams = request.nextUrl.searchParams;
    const query = searchParams.get('q')?.trim() || '';
    const category = searchParams.get('category') || '';
    const country = searchParams.get('country') || '';

    const where: { countryCode?: string; isPaused: boolean } = { isPaused: false };
    if (country) where.countryCode = country.toUpperCase();

    if (!query && !category) {
      const users = await db.user.findMany({
        where,
        select: SELECT_FIELDS,
        orderBy: [
          { isPartner: 'desc' },
          { verifiedOrosCount: 'desc' },
          { createdAt: 'desc' },
        ],
        take: 50,
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
      .slice(0, 50)
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
