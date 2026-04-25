import { NextAuthOptions } from 'next-auth';
import { PrismaAdapter } from '@auth/prisma-adapter';
import CredentialsProvider from 'next-auth/providers/credentials';
import { db } from './db';
import bcrypt from 'bcryptjs';

interface ExtendedUser {
  id: string;
  email: string;
  name: string;
  bio?: string | null;
  avatar?: string | null;
  title?: string | null;
  company?: string | null;
  location?: string | null;
  qualifications?: string | null;
  workHistory?: string | null;
  isPartner: boolean;
  verifiedOrosCount: number;
  compassMembershipsCount: number;
}

export const authOptions: NextAuthOptions = {
  adapter: PrismaAdapter(db) as NextAuthOptions['adapter'],
  providers: [
    CredentialsProvider({
      name: 'Credentials',
      credentials: {
        email: { label: 'Email', type: 'email' },
        password: { label: 'Password', type: 'password' },
      },
      async authorize(credentials) {
        if (!credentials?.email || !credentials?.password) {
          return null;
        }

        const user = await db.user.findUnique({
          where: { email: credentials.email },
        });

        if (!user) {
          return null;
        }

        const isPasswordValid = await bcrypt.compare(
          credentials.password,
          user.password
        );

        if (!isPasswordValid) {
          return null;
        }

        return {
          id: user.id,
          email: user.email,
          name: user.name,
          bio: user.bio,
          avatar: user.avatar,
          title: user.title,
          company: user.company,
          location: user.location,
          qualifications: user.qualifications,
          workHistory: user.workHistory,
          isPartner: user.isPartner,
          verifiedOrosCount: user.verifiedOrosCount,
          compassMembershipsCount: user.compassMembershipsCount,
        };
      },
    }),
  ],
  session: {
    strategy: 'jwt',
  },
  callbacks: {
    async jwt({ token, user, trigger }) {
      // On sign in, set user data
      if (user) {
        const u = user as unknown as ExtendedUser;
        token.id = u.id;
        token.bio = u.bio;
        token.avatar = u.avatar;
        token.title = u.title;
        token.company = u.company;
        token.location = u.location;
        token.qualifications = u.qualifications;
        token.workHistory = u.workHistory;
        token.isPartner = u.isPartner || false;
        token.verifiedOrosCount = u.verifiedOrosCount || 0;
        token.compassMembershipsCount = u.compassMembershipsCount || 0;
      }
      
      // Refresh user data from database when session is updated
      if (trigger === 'update' && token.id) {
        const freshUser = await db.user.findUnique({
          where: { id: token.id as string },
        });
        
        if (freshUser) {
          const u = freshUser as unknown as ExtendedUser;
          token.bio = u.bio;
          token.avatar = u.avatar;
          token.title = u.title;
          token.company = u.company;
          token.location = u.location;
          token.qualifications = u.qualifications;
          token.workHistory = u.workHistory;
          token.isPartner = u.isPartner;
          token.verifiedOrosCount = u.verifiedOrosCount;
          token.compassMembershipsCount = u.compassMembershipsCount;
        }
      }
      
      return token;
    },
    async session({ session, token }) {
      if (session.user) {
        session.user.id = token.id;
        session.user.bio = token.bio;
        session.user.avatar = token.avatar;
        session.user.title = token.title;
        session.user.company = token.company;
        session.user.location = token.location;
        session.user.qualifications = token.qualifications;
        session.user.workHistory = token.workHistory;
        session.user.isPartner = token.isPartner;
        session.user.verifiedOrosCount = token.verifiedOrosCount;
        session.user.compassMembershipsCount = token.compassMembershipsCount;
      }
      return session;
    },
  },
  pages: {
    signIn: '/login',
    signOut: '/',
  },
  secret: process.env.NEXTAUTH_SECRET,
};

