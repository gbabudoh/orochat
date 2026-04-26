'use server';

import { db } from '@/lib/db';
import bcrypt from 'bcryptjs';
import { z } from 'zod';
import crypto from 'crypto';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';

import { Prisma } from '@prisma/client';

const signupSchema = z.object({
  email: z.string().min(1),
  password: z.string().min(8, 'Password must be at least 8 characters'),
  name: z.string().min(2, 'Name must be at least 2 characters'),
});

const loginSchema = z.object({
  email: z.string().min(1),
  password: z.string().min(1, 'Password is required'),
});

export async function signup(formData: FormData) {
  const rawData = {
    email: formData.get('email') as string,
    password: formData.get('password') as string,
    name: formData.get('name') as string,
  };

  try {
    const validatedData = signupSchema.parse(rawData);

    const existingUser = await db.user.findUnique({
      where: { email: validatedData.email },
    });

    if (existingUser) {
      return { error: 'User with this email already exists' };
    }

    const hashedPassword = await bcrypt.hash(validatedData.password, 10);

    const user = await db.user.create({
      data: {
        email: validatedData.email,
        password: hashedPassword,
        name: validatedData.name,
      },
    });

    return { success: true, userId: user.id };
  } catch (error) {
    if (error instanceof z.ZodError) {
      return { error: error.issues[0].message };
    }
    return { error: 'Failed to create account' };
  }
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

    if (!user) {
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

  // TODO: replace with your email provider (Resend, Nodemailer, etc.)
  console.log(`[Password Reset] ${email} → ${resetUrl}`);

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
  const qualifications = formData.get('qualifications') as string;
  const workHistory = formData.get('workHistory') as string;
  const avatar = formData.get('avatar') as string;

  try {
    const basicUpdateData: Prisma.UserUpdateInput = {
      name: name || undefined,
      bio: bio || null,
      title: title || null,
      company: company || null,
      location: location || null,
      avatar: avatar || null,
    };

    try {
      const fullUpdateData = {
        ...basicUpdateData,
        qualifications: qualifications || null,
        workHistory: workHistory || null,
      };

      await db.user.update({
        where: { id: userId },
        data: fullUpdateData,
      });

      return { success: true };
    } catch (fieldError) {
      const error = fieldError as Error;
      if (error?.message?.includes('Unknown') || error?.message?.includes('Available options')) {
        await db.user.update({
          where: { id: userId },
          data: basicUpdateData,
        });

        return {
          success: true,
          warning: 'Profile updated, but qualifications and work history could not be saved. Please restart the server after running: npx prisma generate'
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
        qualifications: true,
        workHistory: true,
        isPartner: true,
      }
    });

    if (!user) return { error: 'User not found' };
    return { success: true, user };
  } catch (error) {
    console.error('Fetch profile error:', error);
    return { error: 'Failed to fetch profile' };
  }
}

