'use server';

import { db } from '@/lib/db';

const TONE_INSTRUCTIONS = {
  professional: 'Professional and courteous',
  casual: 'Casual and friendly',
  pitch: 'Pitch-focused — briefly state a concrete reason to connect',
} as const;

export type WarmIntroTone = keyof typeof TONE_INSTRUCTIONS;

const MAX_LENGTH = 300;

function roleClause(person: { title: string | null; company: string | null }): string {
  if (person.title && person.company) return `, ${person.title} at ${person.company}`;
  if (person.title) return `, ${person.title}`;
  if (person.company) return ` at ${person.company}`;
  return '';
}

function formatList(items: string[]): string {
  if (items.length === 1) return items[0];
  if (items.length === 2) return `${items[0]} and ${items[1]}`;
  return `${items.slice(0, -1).join(', ')}, and ${items[items.length - 1]}`;
}

function groundClause(
  sharedCompassNames: string[],
  recipient: { title: string | null; company: string | null }
): string {
  if (sharedCompassNames.length > 0) {
    return `We're both part of ${formatList(sharedCompassNames)} on Orochat.`;
  }
  if (recipient.title) {
    return `I noticed you're ${recipient.title}${recipient.company ? ` at ${recipient.company}` : ''} and wanted to reach out.`;
  }
  return "I wanted to reach out and connect.";
}

/**
 * Drafts a short connection-request note from one Oro to another, grounded
 * only in real shared context (mutual Compass communities, titles) fetched
 * from the DB. Template-based — no LLM call.
 */
export async function generateWarmIntro(senderId: string, recipientId: string, tone: WarmIntroTone) {
  try {
    const [sender, recipient] = await Promise.all([
      db.user.findUnique({ where: { id: senderId }, select: { name: true, title: true, company: true, bio: true } }),
      db.user.findUnique({
        where: { id: recipientId },
        select: { name: true, title: true, company: true, bio: true },
      }),
    ]);
    if (!sender || !recipient) return { error: 'User not found' };

    const memberships = await db.compassMembership.findMany({
      where: { userId: { in: [senderId, recipientId] } },
      include: { compass: { select: { id: true, name: true } } },
    });
    const compassCountById = new Map<string, { name: string; count: number }>();
    memberships.forEach((m) => {
      const entry = compassCountById.get(m.compassId) ?? { name: m.compass.name, count: 0 };
      entry.count += 1;
      compassCountById.set(m.compassId, entry);
    });
    const sharedCompassNames = Array.from(compassCountById.values())
      .filter((c) => c.count === 2)
      .map((c) => c.name);

    const ground = groundClause(sharedCompassNames, recipient);
    const intro = `Hi ${recipient.name}, I'm ${sender.name}${roleClause(sender)}.`;

    let body: string;
    if (tone === 'casual') {
      body = `${intro} ${ground} Would love to connect!`;
    } else if (tone === 'pitch') {
      body = `${intro} ${ground} I think there could be a great opportunity for us to collaborate — would you be open to a quick chat?`;
    } else {
      body = `${intro} ${ground} I'd like to connect and learn more about your work.`;
    }

    return {
      success: true,
      draft: {
        draft_text: body.slice(0, MAX_LENGTH),
        common_ground_used: sharedCompassNames,
      },
    };
  } catch (error) {
    const err = error as Error;
    return { error: err.message || 'Failed to draft a warm intro' };
  }
}
