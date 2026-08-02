import { db } from '../lib/db';

async function listUsers() {
  const users = await db.user.findMany({
    select: {
      id: true,
      name: true,
      email: true,
      username: true,
      isPartner: true,
      isPaused: true,
      createdAt: true,
    },
    orderBy: { createdAt: 'desc' },
  });
  console.log('Current DB Users Count:', users.length);
  console.log(JSON.stringify(users, null, 2));
}

listUsers().finally(() => db.$disconnect());
