import { Novu } from '@novu/api';

const novuApiKey = process.env.NOVU_API_KEY;

export const novu = novuApiKey ? new Novu({
  secretKey: novuApiKey
}) : null;

export const triggerNotification = async (
  workflowId: string,
  subscriberId: string,
  payload: Record<string, unknown>,
  actorId?: string
) => {
  if (!novu) {
    console.warn('Novu API key not found. Notification not triggered.');
    return;
  }

  try {
    await novu.trigger({
      workflowId,
      to: subscriberId,
      payload,
      ...(actorId && { actor: { subscriberId: actorId } }),
    });
  } catch (error) {
    console.error('Error triggering Novu notification:', error);
  }
};
