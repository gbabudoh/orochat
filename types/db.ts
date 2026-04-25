import type { User, Connection, Compass, Message, FeedPost, TESLog, CompassMembership } from '.prisma/client';

export type UserWithConnections = User & {
  sentConnections: Connection[];
  receivedConnections: Connection[];
};

export type CompassWithMembers = Compass & {
  memberships: (CompassMembership & {
    user: User;
  })[];
  _count?: {
    memberships: number;
  };
};

export type MessageWithUsers = Message & {
  sender: User;
  receiver: User;
};

export type FeedPostWithAuthor = FeedPost & {
  author: User;
  compass?: Compass;
};

export type ConnectionWithUsers = Connection & {
  sender: User;
  receiver: User;
};

