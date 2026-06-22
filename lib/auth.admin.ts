import { NextAuthOptions } from 'next-auth';
import CredentialsProvider from 'next-auth/providers/credentials';
import { getServerSession } from 'next-auth';
import { db } from './db';
import bcrypt from 'bcryptjs';

// Fully isolated from lib/auth.ts (consumer auth): separate table, separate
// secret, separate session cookie name. A compromised/leaked consumer
// session or User row can never grant admin access.
export const adminAuthOptions: NextAuthOptions = {
  providers: [
    CredentialsProvider({
      name: 'Admin Credentials',
      credentials: {
        email: { label: 'Email', type: 'email' },
        password: { label: 'Password', type: 'password' },
      },
      async authorize(credentials) {
        if (!credentials?.email || !credentials?.password) {
          return null;
        }

        const admin = await db.adminUser.findUnique({
          where: { email: credentials.email },
        });
        if (!admin) return null;

        const isPasswordValid = await bcrypt.compare(credentials.password, admin.password);
        if (!isPasswordValid) return null;

        return {
          id: admin.id,
          email: admin.email,
          name: admin.name,
          role: admin.role,
        };
      },
    }),
  ],
  session: {
    strategy: 'jwt',
  },
  cookies: {
    sessionToken: {
      name: 'admin-session-token',
      options: {
        httpOnly: true,
        sameSite: 'lax',
        path: '/',
        secure: process.env.NODE_ENV === 'production',
      },
    },
  },
  callbacks: {
    async jwt({ token, user }) {
      if (user) {
        const u = user as unknown as { id: string; role: 'ADMIN' | 'SUPER_ADMIN' };
        token.id = u.id;
        token.role = u.role;
      }
      return token;
    },
    async session({ session, token }) {
      if (session.user) {
        session.user.id = token.id as string;
        session.user.role = token.role as 'ADMIN' | 'SUPER_ADMIN';
      }
      return session;
    },
  },
  pages: {
    signIn: '/admin/login',
  },
  secret: process.env.ADMIN_NEXTAUTH_SECRET,
};

export async function getAdminSession() {
  return getServerSession(adminAuthOptions);
}

// Throws unless the caller is a SUPER_ADMIN — gates the platform revenue
// split and admin-management actions, both of which affect every other
// admin/partner, not just the caller's own scope.
export async function requireSuperAdmin() {
  const session = await getAdminSession();
  if (!session) throw new Error('Not authenticated as admin');
  if (session.user.role !== 'SUPER_ADMIN') throw new Error('Only Super Admins can do this');
  return session.user.id;
}
