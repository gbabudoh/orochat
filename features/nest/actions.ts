'use server';

import { db } from '@/lib/db';
import { z } from 'zod';

const ALLOWED_NEST_DURATION_DAYS = [7, 14, 30, 90];

const MEMBER_SELECT = {
  id: true,
  name: true,
  avatar: true,
  title: true,
} as const;

async function assertNestMember(nestId: string, userId: string) {
  const member = await db.nestMember.findUnique({
    where: { nestId_userId: { nestId, userId } },
  });
  if (!member) throw new Error('Not a member of this Nest');
  return member;
}

async function assertNestOwner(nestId: string, userId: string) {
  const nest = await db.nest.findUnique({ where: { id: nestId } });
  if (!nest) throw new Error('Nest not found');
  if (nest.ownerId !== userId) throw new Error('Only the Nest owner can do this');
  return nest;
}

/**
 * Creates a new Nest (project workspace) with a backing group Conversation
 * for chat/calls. Any Oro can create one; invitees must be accepted
 * connections (same gate as starting a group chat), but unlike a group chat
 * a Nest can start solo with zero invitees.
 */
export async function createNest(ownerId: string, name: string, participantIds: string[] = [], durationDays?: number) {
  if (!name.trim()) return { error: 'Nest name is required' };

  if (durationDays !== undefined && !ALLOWED_NEST_DURATION_DAYS.includes(durationDays)) {
    return { error: 'Invalid Nest duration' };
  }
  const expiresAt = durationDays ? new Date(Date.now() + durationDays * 24 * 60 * 60 * 1000) : null;

  const uniqueInviteeIds = Array.from(new Set(participantIds.filter((id) => id !== ownerId)));

  if (uniqueInviteeIds.length > 0) {
    const connections = await db.connection.findMany({
      where: {
        status: 'ACCEPTED',
        OR: [
          { senderId: ownerId, receiverId: { in: uniqueInviteeIds } },
          { receiverId: ownerId, senderId: { in: uniqueInviteeIds } },
        ],
      },
    });
    const connectedIds = new Set(
      connections.map((c) => (c.senderId === ownerId ? c.receiverId : c.senderId))
    );
    const invalid = uniqueInviteeIds.filter((id) => !connectedIds.has(id));
    if (invalid.length > 0) return { error: 'You can only invite Oros you are connected with' };
  }

  const allMemberIds = Array.from(new Set([ownerId, ...uniqueInviteeIds]));

  try {
    const nest = await db.$transaction(async (tx) => {
      const conversation = await tx.conversation.create({
        data: {
          isGroup: true,
          name: name.trim(),
          participants: { create: allMemberIds.map((userId) => ({ userId })) },
        },
      });

      return tx.nest.create({
        data: {
          name: name.trim(),
          ownerId,
          conversationId: conversation.id,
          expiresAt,
          members: { create: allMemberIds.map((userId) => ({ userId })) },
        },
      });
    });

    return { success: true, nestId: nest.id };
  } catch (error) {
    const err = error as Error;
    return { error: err.message || 'Failed to create Nest' };
  }
}

/**
 * Adds connected Oros to an existing Nest and its backing conversation.
 */
export async function addNestMembers(nestId: string, actingUserId: string, userIds: string[]) {
  try {
    const nest = await db.nest.findUnique({ where: { id: nestId } });
    if (!nest) return { error: 'Nest not found' };
    await assertNestMember(nestId, actingUserId);

    const connections = await db.connection.findMany({
      where: {
        status: 'ACCEPTED',
        OR: [
          { senderId: actingUserId, receiverId: { in: userIds } },
          { receiverId: actingUserId, senderId: { in: userIds } },
        ],
      },
    });
    const connectedIds = new Set(
      connections.map((c) => (c.senderId === actingUserId ? c.receiverId : c.senderId))
    );
    const invalid = userIds.filter((id) => !connectedIds.has(id));
    if (invalid.length > 0) return { error: 'You can only add Oros you are connected with' };

    await db.$transaction([
      ...userIds.map((userId) =>
        db.nestMember.upsert({
          where: { nestId_userId: { nestId, userId } },
          update: {},
          create: { nestId, userId },
        })
      ),
      ...userIds.map((userId) =>
        db.conversationParticipant.upsert({
          where: { conversationId_userId: { conversationId: nest.conversationId, userId } },
          update: {},
          create: { conversationId: nest.conversationId, userId },
        })
      ),
    ]);

    return { success: true };
  } catch (error) {
    const err = error as Error;
    return { error: err.message || 'Failed to add members' };
  }
}

/**
 * Owner-only: deletes the Nest (cascades members/tasks/note) but leaves the
 * backing chat conversation and its message history intact.
 */
export async function deleteNest(nestId: string, userId: string) {
  try {
    await assertNestOwner(nestId, userId);
    await db.nest.delete({ where: { id: nestId } });
    return { success: true };
  } catch (error) {
    const err = error as Error;
    return { error: err.message || 'Failed to delete Nest' };
  }
}

/**
 * Owner-only: archives a Nest (hides it from the active list, reversible).
 */
export async function archiveNest(nestId: string, userId: string) {
  try {
    await assertNestOwner(nestId, userId);
    await db.nest.update({ where: { id: nestId }, data: { archived: true } });
    return { success: true };
  } catch (error) {
    const err = error as Error;
    return { error: err.message || 'Failed to archive Nest' };
  }
}

export async function unarchiveNest(nestId: string, userId: string) {
  try {
    await assertNestOwner(nestId, userId);
    await db.nest.update({ where: { id: nestId }, data: { archived: false, expiresAt: null } });
    return { success: true };
  } catch (error) {
    const err = error as Error;
    return { error: err.message || 'Failed to unarchive Nest' };
  }
}

export async function getNests(userId: string, includeArchived = false) {
  // Lazy expiry: any Nest past its time limit gets auto-archived right
  // before listing, rather than relying on a scheduled job (none exists
  // in this app — TES decay/qualification checks use the same pattern).
  await db.nest.updateMany({
    where: { members: { some: { userId } }, archived: false, expiresAt: { lt: new Date() } },
    data: { archived: true },
  });

  const memberships = await db.nestMember.findMany({
    where: { userId, nest: { archived: includeArchived } },
    include: {
      nest: {
        include: {
          members: { include: { user: { select: MEMBER_SELECT } } },
          _count: { select: { tasks: true } },
        },
      },
    },
    orderBy: { nest: { updatedAt: 'desc' } },
  });

  return memberships.map((m) => m.nest);
}

export async function getNest(nestId: string, userId: string) {
  try {
    await assertNestMember(nestId, userId);

    const nest = await db.nest.findUnique({
      where: { id: nestId },
      include: {
        members: { include: { user: { select: MEMBER_SELECT } } },
      },
    });

    if (!nest) return { error: 'Nest not found' };
    return { success: true, nest };
  } catch (error) {
    const err = error as Error;
    return { error: err.message || 'Failed to load Nest' };
  }
}

const taskSchema = z.object({
  title: z.string().min(1, 'Task title is required'),
  description: z.string().optional(),
  assigneeId: z.string().optional(),
  dueDate: z.string().optional(),
});

export async function createTask(nestId: string, userId: string, input: { title: string; description?: string; assigneeId?: string; dueDate?: string }) {
  try {
    await assertNestMember(nestId, userId);
    const validated = taskSchema.parse(input);

    const task = await db.nestTask.create({
      data: {
        nestId,
        title: validated.title,
        description: validated.description || null,
        assigneeId: validated.assigneeId || null,
        dueDate: validated.dueDate ? new Date(validated.dueDate) : null,
        createdById: userId,
      },
      include: { assignee: { select: MEMBER_SELECT } },
    });

    return { success: true, task };
  } catch (error) {
    if (error instanceof z.ZodError) return { error: error.issues[0].message };
    const err = error as Error;
    return { error: err.message || 'Failed to create task' };
  }
}

async function assertTaskMember(taskId: string, userId: string) {
  const task = await db.nestTask.findUnique({ where: { id: taskId } });
  if (!task) throw new Error('Task not found');
  await assertNestMember(task.nestId, userId);
  return task;
}

export async function updateTask(taskId: string, userId: string, input: { title?: string; description?: string; assigneeId?: string | null; dueDate?: string | null }) {
  try {
    await assertTaskMember(taskId, userId);

    const task = await db.nestTask.update({
      where: { id: taskId },
      data: {
        ...(input.title !== undefined ? { title: input.title } : {}),
        ...(input.description !== undefined ? { description: input.description || null } : {}),
        ...(input.assigneeId !== undefined ? { assigneeId: input.assigneeId || null } : {}),
        ...(input.dueDate !== undefined ? { dueDate: input.dueDate ? new Date(input.dueDate) : null } : {}),
      },
      include: { assignee: { select: MEMBER_SELECT } },
    });

    return { success: true, task };
  } catch (error) {
    const err = error as Error;
    return { error: err.message || 'Failed to update task' };
  }
}

export async function updateTaskStatus(taskId: string, userId: string, status: 'TODO' | 'IN_PROGRESS' | 'DONE') {
  try {
    await assertTaskMember(taskId, userId);
    const task = await db.nestTask.update({
      where: { id: taskId },
      data: { status },
      include: { assignee: { select: MEMBER_SELECT } },
    });
    return { success: true, task };
  } catch (error) {
    const err = error as Error;
    return { error: err.message || 'Failed to update task status' };
  }
}

export async function deleteTask(taskId: string, userId: string) {
  try {
    await assertTaskMember(taskId, userId);
    await db.nestTask.delete({ where: { id: taskId } });
    return { success: true };
  } catch (error) {
    const err = error as Error;
    return { error: err.message || 'Failed to delete task' };
  }
}

export async function getTasks(nestId: string, userId: string) {
  await assertNestMember(nestId, userId);
  return db.nestTask.findMany({
    where: { nestId },
    include: { assignee: { select: MEMBER_SELECT } },
    orderBy: { createdAt: 'asc' },
  });
}

const NOTE_AUTHOR_SELECT = { id: true, name: true } as const;

/**
 * The Notes tab is a log of separate entries (not one continuously-edited
 * doc) — each save creates or updates its own entry, displayed with its
 * own "last updated by / when" footer, divided from the others.
 */
export async function getNotes(nestId: string, userId: string) {
  try {
    await assertNestMember(nestId, userId);
    const notes = await db.nestNote.findMany({
      where: { nestId },
      orderBy: { createdAt: 'desc' },
    });
    const authorIds = Array.from(new Set(notes.map((n) => n.updatedById).filter((id): id is string => !!id)));
    const authors = authorIds.length
      ? await db.user.findMany({ where: { id: { in: authorIds } }, select: NOTE_AUTHOR_SELECT })
      : [];
    const authorNameById = new Map(authors.map((a) => [a.id, a.name]));

    return {
      success: true,
      notes: notes.map((n) => ({
        id: n.id,
        content: n.content,
        updatedAt: n.updatedAt,
        updatedByName: n.updatedById ? authorNameById.get(n.updatedById) ?? null : null,
      })),
    };
  } catch (error) {
    const err = error as Error;
    return { error: err.message || 'Failed to load notes' };
  }
}

export async function createNoteEntry(nestId: string, userId: string, content: string) {
  try {
    await assertNestMember(nestId, userId);
    const note = await db.nestNote.create({
      data: { nestId, content, updatedById: userId },
    });
    const author = await db.user.findUnique({ where: { id: userId }, select: NOTE_AUTHOR_SELECT });
    return { success: true, id: note.id, updatedAt: note.updatedAt, updatedByName: author?.name ?? null };
  } catch (error) {
    const err = error as Error;
    return { error: err.message || 'Failed to save note' };
  }
}

async function assertNoteMember(noteId: string, userId: string) {
  const note = await db.nestNote.findUnique({ where: { id: noteId } });
  if (!note) throw new Error('Note not found');
  await assertNestMember(note.nestId, userId);
  return note;
}

export async function updateNoteEntry(noteId: string, userId: string, content: string) {
  try {
    await assertNoteMember(noteId, userId);
    const note = await db.nestNote.update({
      where: { id: noteId },
      data: { content, updatedById: userId },
    });
    const author = await db.user.findUnique({ where: { id: userId }, select: NOTE_AUTHOR_SELECT });
    return { success: true, updatedAt: note.updatedAt, updatedByName: author?.name ?? null };
  } catch (error) {
    const err = error as Error;
    return { error: err.message || 'Failed to save note' };
  }
}

export async function deleteNoteEntry(noteId: string, userId: string) {
  try {
    await assertNoteMember(noteId, userId);
    await db.nestNote.delete({ where: { id: noteId } });
    return { success: true };
  } catch (error) {
    const err = error as Error;
    return { error: err.message || 'Failed to delete note' };
  }
}
