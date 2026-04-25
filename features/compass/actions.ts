'use server';

import { db } from '@/lib/db';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { revalidatePath } from 'next/cache';
import { z } from 'zod';

const createCommunitySchema = z.object({
  name: z.string().min(3, 'Name must be at least 3 characters'),
  slug: z.string().min(3, 'Slug must be at least 3 characters').regex(/^[a-z0-9-]+$/, 'Slug must be lowercase alphanumeric with hyphens'),
  description: z.string().min(10, 'Description must be at least 10 characters'),
});

export async function joinCommunity(compassId: string) {
  const session = await getServerSession(authOptions);
  if (!session?.user?.id) return { error: 'Not authenticated' };

  try {
    const existing = await db.compassMembership.findUnique({
      where: {
        userId_compassId: {
          userId: session.user.id,
          compassId,
        },
      },
    });

    if (existing) return { error: 'Already a member' };

    await db.compassMembership.create({
      data: {
        userId: session.user.id,
        compassId,
        role: 'MEMBER',
      },
    });

    // Update user's membership count
    await db.user.update({
      where: { id: session.user.id },
      data: {
        compassMembershipsCount: { increment: 1 }
      }
    });

    revalidatePath(`/compass`);
    revalidatePath(`/compass/[slug]`, 'page');
    
    return { success: true };
  } catch (error) {
    console.error('Join community error:', error);
    return { error: 'Failed to join community' };
  }
}

export async function createCommunity(formData: FormData) {
  const session = await getServerSession(authOptions);
  if (!session?.user?.id) return { error: 'Not authenticated' };

  const user = await db.user.findUnique({
    where: { id: session.user.id }
  });

  if (!user?.isPartner) {
    return { error: 'Only Orochat Partners can create communities' };
  }

  const rawData = {
    name: formData.get('name') as string,
    slug: (formData.get('slug') as string)?.toLowerCase(),
    description: formData.get('description') as string,
  };

  try {
    const validatedData = createCommunitySchema.parse(rawData);

    // Check if slug is taken
    const existing = await db.compass.findUnique({
      where: { slug: validatedData.slug }
    });

    if (existing) return { error: 'This slug is already taken' };

    const community = await db.compass.create({
      data: {
        name: validatedData.name,
        slug: validatedData.slug,
        description: validatedData.description,
        creatorId: session.user.id,
      },
    });

    // Creator automatically becomes an ADMIN member
    await db.compassMembership.create({
      data: {
        userId: session.user.id,
        compassId: community.id,
        role: 'ADMIN',
      },
    });

    revalidatePath('/compass');
    
    return { success: true, slug: community.slug };
  } catch (error) {
    if (error instanceof z.ZodError) {
      return { error: error.issues[0].message };
    }
    console.error('Create community error:', error);
    return { error: 'Failed to create community' };
  }
}
