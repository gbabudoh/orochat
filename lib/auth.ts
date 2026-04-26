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
    async jwt({ token, user, trigger, session: updateData }) {
      // On sign in, set user data
      if (user) {
        const u = user as unknown as ExtendedUser;
        token.id = u.id;
        token.name = u.name;
        token.avatar = u.avatar;
        token.isPartner = u.isPartner || false;
      }
      
      // Refresh essential user data when session is updated
      if (trigger === 'update') {
        // If data was passed to update(), use it
        if (updateData) {
          if (updateData.name) token.name = updateData.name;
          if (updateData.avatar) token.avatar = updateData.avatar;
          if (updateData.isPartner !== undefined) token.isPartner = updateData.isPartner;
        } else if (token.id) {
          // Fallback: Refresh from DB if no data passed to update()
          const freshUser = await db.user.findUnique({
            where: { id: token.id as string },
            select: { avatar: true, isPartner: true, name: true }
          });
          
          if (freshUser) {
            token.avatar = freshUser.avatar;
            token.isPartner = freshUser.isPartner;
            token.name = freshUser.name;
          }
        }
      }
      
      return token;
    },
    async session({ session, token }) {
      if (session.user) {
        session.user.id = token.id as string;
        session.user.name = token.name as string;
        session.user.avatar = token.avatar as string | null;
        session.user.isPartner = token.isPartner as boolean;
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

