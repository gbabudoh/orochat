'use server';

import { db } from '@/lib/db';
import { requireSuperAdmin } from '@/lib/auth.admin';
import { logAdminAction } from '@/lib/adminAudit';
import { revalidatePath } from 'next/cache';
import bcrypt from 'bcryptjs';
import { z } from 'zod';

const createAdminSchema = z.object({
  email: z.string().email('Enter a valid email'),
  password: z.string().min(8, 'Password must be at least 8 characters'),
  name: z.string().min(1, 'Name is required'),
  role: z.enum(['ADMIN', 'SUPER_ADMIN']),
});

export async function createAdmin(formData: FormData) {
  const adminId = await requireSuperAdmin();

  try {
    const data = createAdminSchema.parse({
      email: formData.get('email'),
      password: formData.get('password'),
      name: formData.get('name'),
      role: formData.get('role'),
    });

    const existing = await db.adminUser.findUnique({ where: { email: data.email } });
    if (existing) return { error: 'An admin with this email already exists' };

    const hashed = await bcrypt.hash(data.password, 10);
    const admin = await db.adminUser.create({
      data: { email: data.email, password: hashed, name: data.name, role: data.role },
    });

    logAdminAction(adminId, 'admin.create', { targetType: 'AdminUser', targetId: admin.id, metadata: { email: data.email, role: data.role } });
    revalidatePath('/admin/admins');
    return { success: true };
  } catch (error) {
    if (error instanceof z.ZodError) return { error: error.issues[0].message };
    const err = error as Error;
    return { error: err.message || 'Failed to create admin' };
  }
}
