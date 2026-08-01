'use server';

import { z } from 'zod';
import { zodOutputFormat } from '@anthropic-ai/sdk/helpers/zod';
import { db } from '@/lib/db';
import { getAnthropicClient, ORO_AI_MODEL } from '@/lib/ai/anthropic';

const ChannelSummarySchema = z.object({
  summary_text: z.string(),
  decisions_made: z.array(z.string()),
  action_items: z.array(z.object({ assignee: z.string(), task: z.string() })),
});

/**
 * "Catch Up" — summarizes the last 50 messages of a chat into a short
 * overview, decisions made, and action items a member can turn into Slate
 * tasks. Restricted to members of the conversation, same as reading its
 * messages via the Collab feature.
 */
export async function generateChannelSummary(conversationId: string, userId: string) {
  try {
    const participant = await db.conversationParticipant.findUnique({
      where: { conversationId_userId: { conversationId, userId } },
    });
    if (!participant) return { error: 'Not a participant of this chat' };

    const messages = await db.message.findMany({
      where: { conversationId },
      orderBy: { createdAt: 'desc' },
      take: 50,
      include: { sender: { select: { name: true } } },
    });
    if (messages.length === 0) return { error: 'No recent messages to summarize' };

    const transcript = messages
      .reverse()
      .map((m) => `${m.sender.name}: ${m.content}`)
      .join('\n');

    const response = await getAnthropicClient().messages.parse({
      model: ORO_AI_MODEL,
      max_tokens: 2048,
      output_config: { effort: 'low', format: zodOutputFormat(ChannelSummarySchema) },
      messages: [
        {
          role: 'user',
          content: `You are an AI collaboration assistant inside Orochat. Summarize the following chat transcript into a short factual overview, any concrete decisions that were made, and any action items with who owns them. Only use information present in the transcript — never invent names, decisions, or tasks.\n\nTranscript:\n${transcript}`,
        },
      ],
    });

    if (!response.parsed_output) return { error: 'Failed to generate summary' };
    return { success: true, summary: response.parsed_output };
  } catch (error) {
    const err = error as Error;
    return { error: err.message || 'Failed to generate summary' };
  }
}

const WarmIntroSchema = z.object({
  draft_text: z.string(),
  common_ground_used: z.array(z.string()),
});

const TONE_INSTRUCTIONS = {
  professional: 'Professional and courteous',
  casual: 'Casual and friendly',
  pitch: 'Pitch-focused — briefly state a concrete reason to connect',
} as const;

export type WarmIntroTone = keyof typeof TONE_INSTRUCTIONS;

/**
 * Drafts a short connection-request note from one Oro to another, grounded
 * only in real shared context (mutual Compass communities, titles) fetched
 * from the DB — the model is explicitly told not to fabricate common ground.
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

    const response = await getAnthropicClient().messages.parse({
      model: ORO_AI_MODEL,
      max_tokens: 1024,
      output_config: { effort: 'low', format: zodOutputFormat(WarmIntroSchema) },
      messages: [
        {
          role: 'user',
          content: `Draft a short (under 300 characters) connection-request note from ${sender.name} to ${recipient.name} on Orochat, a professional network for verified Oros.

Sender: ${sender.title ?? 'no title given'}${sender.company ? ` at ${sender.company}` : ''}. ${sender.bio ?? ''}
Recipient: ${recipient.title ?? 'no title given'}${recipient.company ? ` at ${recipient.company}` : ''}. ${recipient.bio ?? ''}
Shared Compass communities: ${sharedCompassNames.join(', ') || 'none found'}

Tone: ${TONE_INSTRUCTIONS[tone]}. Only reference common ground that's actually listed above — never invent shared communities, skills, or interests that weren't provided. If there is no real common ground, write a warm note based on the recipient's role instead.`,
        },
      ],
    });

    if (!response.parsed_output) return { error: 'Failed to draft a warm intro' };
    return { success: true, draft: response.parsed_output };
  } catch (error) {
    const err = error as Error;
    return { error: err.message || 'Failed to draft a warm intro' };
  }
}
