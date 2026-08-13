'use server';

import { SafetyService } from '@/services/safety.service';

export async function blockUser(blockerId: string, blockedId: string, reason?: string) {
  try {
    await SafetyService.block(blockerId, blockedId, reason);
    return { success: true };
  } catch (error) {
    const err = error as Error;
    return { error: err.message || 'Failed to block user' };
  }
}

export async function unblockUser(blockerId: string, blockedId: string) {
  try {
    await SafetyService.unblock(blockerId, blockedId);
    return { success: true };
  } catch (error) {
    const err = error as Error;
    return { error: err.message || 'Failed to unblock user' };
  }
}

export async function getBlockedUsers(blockerId: string) {
  try {
    const blocks = await SafetyService.getBlockedUsers(blockerId);
    return { success: true, blocks };
  } catch (error) {
    const err = error as Error;
    return { error: err.message || 'Failed to fetch blocked users' };
  }
}

export async function reportUser(
  reporterId: string,
  reportedUserId: string,
  context: 'DIRECT_NOTE' | 'PROFILE' | 'MESSAGE',
  reason: 'SPAM' | 'HARASSMENT' | 'INAPPROPRIATE_CONTENT' | 'FAKE_PROFILE' | 'OTHER',
  contextId?: string,
  details?: string
) {
  try {
    await SafetyService.createReport(reporterId, reportedUserId, context, reason, contextId, details);
    return { success: true };
  } catch (error) {
    const err = error as Error;
    return { error: err.message || 'Failed to submit report' };
  }
}
