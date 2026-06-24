'use server';

import { db } from '@/lib/db';
import bcrypt from 'bcryptjs';
import { z } from 'zod';
import crypto from 'crypto';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';

import { Prisma } from '@prisma/client';
import { regenerateUserEmbedding } from '@/lib/ai/userEmbedding';
import { sendPasswordResetEmail, sendVerificationEmail } from '@/lib/email';

import dns from 'dns';

// static blacklist of common disposable/temporary email providers
const DISPOSABLE_DOMAINS = new Set([
  'mailinator.com',
  'tempmail.com',
  'yopmail.com',
  'guerrillamail.com',
  'sharklasers.com',
  'dispostable.com',
  'getairmail.com',
  'maildrop.cc',
  'throwawaymail.com',
  'temp-mail.org',
  '10minutemail.com',
  'trashmail.com',
]);

async function checkMXRecords(domain: string): Promise<boolean> {
  return new Promise((resolve) => {
    dns.resolveMx(domain, (err, addresses) => {
      if (err || !addresses || addresses.length === 0) {
        // Fallback: check if there's an A record as a backup (sometimes mail server is direct host)
        dns.resolve(domain, 'A', (aErr, aAddresses) => {
          if (aErr || !aAddresses || aAddresses.length === 0) {
            resolve(false);
          } else {
            resolve(true);
          }
        });
      } else {
        resolve(true);
      }
    });
  });
}

const signupSchema = z.object({
  email: z.string().min(1).email('Please enter a valid email address'),
  password: z.string().min(8, 'Password must be at least 8 characters'),
  name: z.string().min(2, 'Name must be at least 2 characters'),
});

const loginSchema = z.object({
  email: z.string().min(1),
  password: z.string().min(1, 'Password is required'),
});

export async function generateUniqueUsername(name: string, email: string) {
  const base = (name || email.split('@')[0])
    .replace(/[^a-zA-Z0-9_]/g, '')
    .slice(0, 16) || 'User';

  const randomSuffix = Math.floor(Math.random() * 10000).toString().padStart(4, '0');
  let candidate = `${base}${randomSuffix}`;

  while (await db.user.findUnique({ where: { username: candidate } })) {
    const nextSuffix = Math.floor(Math.random() * 10000).toString().padStart(4, '0');
    candidate = `${base}${nextSuffix}`;
  }
  return candidate;
}

async function createAndSendVerificationToken(userId: string, email: string) {
  await db.emailVerificationToken.updateMany({
    where: { userId, used: false },
    data: { used: true },
  });

  const token = crypto.randomBytes(32).toString('hex');
  const expiresAt = new Date(Date.now() + 24 * 60 * 60 * 1000); // 24 hours

  await db.emailVerificationToken.create({
    data: { token, userId, expiresAt },
  });

  const verifyUrl = `${process.env.NEXTAUTH_URL}/verify-email?token=${token}`;

  try {
    await sendVerificationEmail(email, verifyUrl);
  } catch (error) {
    console.error('Failed to send verification email:', error);
  }
}

export async function signup(formData: FormData) {
  const rawData = {
    email: formData.get('email') as string,
    password: formData.get('password') as string,
    name: formData.get('name') as string,
  };

  try {
    const validatedData = signupSchema.parse(rawData);

    const emailParts = validatedData.email.split('@');
    if (emailParts.length !== 2) {
      return { error: 'Invalid email address format' };
    }
    const domain = emailParts[1].toLowerCase();

    if (DISPOSABLE_DOMAINS.has(domain)) {
      return { error: 'Disposable email domains are not allowed.' };
    }

    // Bypass check during local development/tests with fake domains
    const isDevBypass = process.env.NODE_ENV === 'development' && 
      (domain === 'localhost' || domain.endsWith('.test') || domain === 'example.com');

    if (!isDevBypass) {
      const hasMailServer = await checkMXRecords(domain);
      if (!hasMailServer) {
        return { error: 'Email domain does not appear to have valid mail servers.' };
      }
    }

    const existingUser = await db.user.findUnique({
      where: { email: validatedData.email },
    });

    if (existingUser) {
      return { error: 'User with this email already exists' };
    }

    const hashedPassword = await bcrypt.hash(validatedData.password, 10);
    const username = await generateUniqueUsername(validatedData.name, validatedData.email);

    const user = await db.user.create({
      data: {
        email: validatedData.email,
        password: hashedPassword,
        name: validatedData.name,
        username,
      },
    });

    await createAndSendVerificationToken(user.id, user.email);

    return { success: true, userId: user.id, requiresVerification: true };
  } catch (error) {
    if (error instanceof z.ZodError) {
      return { error: error.issues[0].message };
    }
    return { error: 'Failed to create account' };
  }
}

export async function verifyEmailToken(token: string) {
  if (!token) return { error: 'Invalid verification link.' };

  const record = await db.emailVerificationToken.findUnique({ where: { token } });

  if (!record || record.used || record.expiresAt < new Date()) {
    return { error: 'This verification link is invalid or has expired.' };
  }

  await db.user.update({
    where: { id: record.userId },
    data: { emailVerified: new Date() },
  });

  await db.emailVerificationToken.update({
    where: { id: record.id },
    data: { used: true },
  });

  return { success: true };
}

export async function resendVerificationEmail(formData: FormData) {
  const email = (formData.get('email') as string)?.trim().toLowerCase();
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

  if (!email || !emailRegex.test(email)) {
    return { error: 'Please enter a valid email address.' };
  }

  const user = await db.user.findUnique({ where: { email } });

  // Always return success — never reveal whether an email is registered
  if (!user || user.emailVerified) return { success: true };

  await createAndSendVerificationToken(user.id, user.email);

  return { success: true };
}

export async function login(formData: FormData) {
  const rawData = {
    email: formData.get('email') as string,
    password: formData.get('password') as string,
  };

  try {
    const validatedData = loginSchema.parse(rawData);

    const user = await db.user.findUnique({
      where: { email: validatedData.email },
    });

    if (!user || !user.password) {
      return { error: 'Invalid email or password' };
    }

    const isPasswordValid = await bcrypt.compare(
      validatedData.password,
      user.password
    );

    if (!isPasswordValid) {
      return { error: 'Invalid email or password' };
    }

    return { success: true, userId: user.id };
  } catch (error) {
    if (error instanceof z.ZodError) {
      return { error: error.issues[0].message };
    }
    return { error: 'Failed to login' };
  }
}



export async function requestPasswordReset(formData: FormData) {
  const email = (formData.get('email') as string)?.trim().toLowerCase();
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

  if (!email || !emailRegex.test(email)) {
    return { error: 'Please enter a valid email address.' };
  }

  const user = await db.user.findUnique({ where: { email } });

  // Always return success — never reveal whether an email is registered
  if (!user) return { success: true };

  await db.passwordResetToken.updateMany({
    where: { userId: user.id, used: false },
    data: { used: true },
  });

  const token = crypto.randomBytes(32).toString('hex');
  const expiresAt = new Date(Date.now() + 60 * 60 * 1000); // 1 hour

  await db.passwordResetToken.create({
    data: { token, userId: user.id, expiresAt },
  });

  const resetUrl = `${process.env.NEXTAUTH_URL}/reset-password?token=${token}`;

  try {
    await sendPasswordResetEmail(email, resetUrl);
  } catch (error) {
    console.error('Failed to send password reset email:', error);
  }

  return { success: true };
}

export async function resetPassword(formData: FormData) {
  const token = formData.get('token') as string;
  const password = formData.get('password') as string;

  if (!token || !password) {
    return { error: 'Invalid request.' };
  }

  if (password.length < 8) {
    return { error: 'Password must be at least 8 characters.' };
  }

  const record = await db.passwordResetToken.findUnique({ where: { token } });

  if (!record || record.used || record.expiresAt < new Date()) {
    return { error: 'This reset link is invalid or has expired.' };
  }

  const hashedPassword = await bcrypt.hash(password, 10);

  await db.user.update({
    where: { id: record.userId },
    data: { password: hashedPassword },
  });

  await db.passwordResetToken.update({
    where: { id: record.id },
    data: { used: true },
  });

  return { success: true };
}

export async function updateProfile(userId: string, formData: FormData) {
  const name = formData.get('name') as string;
  const bio = formData.get('bio') as string;
  const title = formData.get('title') as string;
  const company = formData.get('company') as string;
  const location = formData.get('location') as string;
  const username = (formData.get('username') as string)?.trim();
  const countryCode = formData.get('countryCode') as string;
  const qualifications = formData.get('qualifications') as string;
  const workHistory = formData.get('workHistory') as string;
  const education = formData.get('education') as string;
  const avatar = formData.get('avatar') as string;

  const currentUser = await db.user.findUnique({
    where: { id: userId },
    select: { username: true },
  });

  if (username) {
    if (!/^[a-zA-Z0-9_]{3,20}$/.test(username)) {
      return { error: 'Handle must be 3-20 characters: letters, numbers, and underscores only.' };
    }
    if (currentUser?.username && currentUser.username !== username) {
      return { error: 'Handles cannot be changed once created. Please contact an admin to request a change.' };
    }
    const existing = await db.user.findUnique({ where: { username } });
    if (existing && existing.id !== userId) {
      return { error: 'That handle is already taken.' };
    }
  }

  try {
    const basicUpdateData: Prisma.UserUpdateInput = {
      name: name || undefined,
      bio: bio || null,
      title: title || null,
      company: company || null,
      location: location || null,
      username: username || null,
      countryCode: countryCode || null,
      avatar: avatar || null,
    };

    try {
      const fullUpdateData = {
        ...basicUpdateData,
        qualifications: qualifications || null,
        workHistory: workHistory || null,
        education: education || null,
      };

      await db.user.update({
        where: { id: userId },
        data: fullUpdateData,
      });

      regenerateUserEmbedding(userId).catch((err) =>
        console.error('Embedding regeneration failed:', err)
      );

      return { success: true };
    } catch (fieldError) {
      const error = fieldError as Error;
      if (error?.message?.includes('Unknown') || error?.message?.includes('Available options')) {
        await db.user.update({
          where: { id: userId },
          data: basicUpdateData,
        });

        regenerateUserEmbedding(userId).catch((err) =>
          console.error('Embedding regeneration failed:', err)
        );

        return {
          success: true,
          warning: 'Profile updated, but qualifications, work history, and education could not be saved. Please restart the server after running: npx prisma generate'
        };
      }
      throw fieldError;
    }
  } catch (error) {
    console.error('Profile update error:', error);
    const err = error as Error;
    return { error: err?.message || 'Failed to update profile' };
  }
}

export async function changePassword(formData: FormData) {
  const session = await getServerSession(authOptions);
  if (!session?.user?.id) return { error: 'Not authenticated' };

  const currentPassword = formData.get('currentPassword') as string;
  const newPassword = formData.get('newPassword') as string;
  const confirmPassword = formData.get('confirmPassword') as string;

  if (newPassword !== confirmPassword) {
    return { error: 'New passwords do not match' };
  }

  if (newPassword.length < 8) {
    return { error: 'Password must be at least 8 characters' };
  }

  try {
    const user = await db.user.findUnique({
      where: { id: session.user.id }
    });

    if (!user) return { error: 'User not found' };
    if (!user.password) {
      return { error: 'Your account signs in with Google and has no password to change.' };
    }

    const isPasswordValid = await bcrypt.compare(currentPassword, user.password);
    if (!isPasswordValid) return { error: 'Current password is incorrect' };

    const hashedPassword = await bcrypt.hash(newPassword, 10);
    await db.user.update({
      where: { id: session.user.id },
      data: { password: hashedPassword }
    });

    return { success: true };
  } catch (error) {
    return { error: 'Failed to update password' };
  }
}

export async function getProfile(userId: string) {
  try {
    const user = await db.user.findUnique({
      where: { id: userId },
      select: {
        id: true,
        name: true,
        email: true,
        bio: true,
        avatar: true,
        title: true,
        company: true,
        location: true,
        username: true,
        countryCode: true,
        qualifications: true,
        workHistory: true,
        education: true,
        isPartner: true,
        isPaused: true,
      }
    });

    if (!user) return { error: 'User not found' };
    return { success: true, user };
  } catch (error) {
    console.error('Fetch profile error:', error);
    return { error: 'Failed to fetch profile' };
  }
}

export async function getUserStats(userId: string) {
  try {
    const user = await db.user.findUnique({
      where: { id: userId },
      select: { verifiedOrosCount: true, compassMembershipsCount: true, isPartner: true },
    });
    if (!user) return { success: false as const, error: 'User not found' };

    const postsCount = await db.feedPost.count({
      where: { authorId: userId },
    });

    return {
      success: true as const,
      verifiedOrosCount: user.verifiedOrosCount,
      compassMembershipsCount: user.compassMembershipsCount,
      isPartner: user.isPartner,
      postsCount,
    };
  } catch (error) {
    console.error('Fetch user stats error:', error);
    return { success: false as const, error: 'Failed to fetch user stats' };
  }
}

export async function pauseAccount(userId: string) {
  try {
    await db.user.update({
      where: { id: userId },
      data: { isPaused: true },
    });
    return { success: true };
  } catch (error) {
    console.error('Pause account error:', error);
    return { error: 'Failed to pause account' };
  }
}

export async function reactivateAccount(userId: string) {
  try {
    await db.user.update({
      where: { id: userId },
      data: { isPaused: false },
    });
    return { success: true };
  } catch (error) {
    console.error('Reactivate account error:', error);
    return { error: 'Failed to reactivate account' };
  }
}

export async function deleteAccount(userId: string) {
  try {
    await db.user.delete({
      where: { id: userId },
    });
    return { success: true };
  } catch (error) {
    console.error('Delete account error:', error);
    return { error: 'Failed to delete account' };
  }
}

