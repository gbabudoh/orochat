import { DefaultSession } from 'next-auth';

declare module 'next-auth' {
  interface Session {
    user: {
      id: string;
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
    } & DefaultSession['user'];
  }
}

declare module 'next-auth/jwt' {
  interface JWT {
    id: string;
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
}

