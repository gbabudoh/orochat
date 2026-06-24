import { NextAuthOptions } from 'next-auth';
import CredentialsProvider from 'next-auth/providers/credentials';
import GoogleProvider from 'next-auth/providers/google';
import { db } from './db';
import bcrypt from 'bcryptjs';
import { generateUniqueUsername } from '@/features/auth/actions';

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
  providers: [
    GoogleProvider({
      clientId: process.env.GOOGLE_CLIENT_ID!,
      clientSecret: process.env.GOOGLE_CLIENT_SECRET!,
      // Google verifies its users' email addresses, so it's safe to link a
      // Google sign-in to an existing email/password account automatically.
      allowDangerousEmailAccountLinking: true,
    }),
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

        if (!user || !user.password) {
          return null;
        }

        const isPasswordValid = await bcrypt.compare(
          credentials.password,
          user.password
        );

        if (!isPasswordValid) {
          return null;
        }

        if (!user.emailVerified) {
          throw new Error('EMAIL_NOT_VERIFIED');
        }

        // Reactivate paused account on login
        if (user.isPaused) {
          await db.user.update({
            where: { id: user.id },
            data: { isPaused: false },
          });
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
    async jwt({ token, user, account, trigger, session: updateData }) {
      // Google sign-in: `user` here is the OAuth profile (id = Google's
      // "sub", not our DB id), so find-or-create our own User row by email
      // and use that instead.
      if (user && account?.provider === 'google' && user.email) {
        let dbUser = await db.user.findUnique({ where: { email: user.email } });

        if (!dbUser) {
          const username = await generateUniqueUsername(user.name || 'Orochat User', user.email);
          dbUser = await db.user.create({
            data: {
              email: user.email,
              name: user.name || 'Orochat User',
              avatar: user.image || null,
              googleId: account.providerAccountId,
              username,
              emailVerified: new Date(), // Google already verifies its users' emails
            },
          });
        } else if (!dbUser.googleId || !dbUser.emailVerified) {
          dbUser = await db.user.update({
            where: { id: dbUser.id },
            data: {
              googleId: dbUser.googleId ?? account.providerAccountId,
              // Linking to Google confirms this email is real, even if the
              // account originally signed up via Credentials and never
              // clicked its verification link.
              emailVerified: dbUser.emailVerified ?? new Date(),
            },
          });
        }

        if (dbUser.isPaused) {
          dbUser = await db.user.update({ where: { id: dbUser.id }, data: { isPaused: false } });
        }

        token.id = dbUser.id;
        token.name = dbUser.name;
        token.avatar = dbUser.avatar;
        token.isPartner = dbUser.isPartner;
        token.verifiedOrosCount = dbUser.verifiedOrosCount;
        token.compassMembershipsCount = dbUser.compassMembershipsCount;
        return token;
      }

      // On sign in, set user data
      if (user) {
        const u = user as unknown as ExtendedUser;
        token.id = u.id;
        token.name = u.name;
        token.avatar = u.avatar;
        token.isPartner = u.isPartner || false;
        token.verifiedOrosCount = u.verifiedOrosCount || 0;
        token.compassMembershipsCount = u.compassMembershipsCount || 0;
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
            select: { avatar: true, isPartner: true, name: true, verifiedOrosCount: true, compassMembershipsCount: true }
          });

          if (freshUser) {
            token.avatar = freshUser.avatar;
            token.isPartner = freshUser.isPartner;
            token.name = freshUser.name;
            token.verifiedOrosCount = freshUser.verifiedOrosCount;
            token.compassMembershipsCount = freshUser.compassMembershipsCount;
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
        session.user.verifiedOrosCount = token.verifiedOrosCount as number;
        session.user.compassMembershipsCount = token.compassMembershipsCount as number;
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

