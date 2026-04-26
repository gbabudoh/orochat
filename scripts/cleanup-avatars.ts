import { PrismaClient } from '@prisma/client';
const prisma = new PrismaClient();

async function main() {
  console.log('Resetting large avatars to un-crash the server...');
  
  const users = await prisma.user.findMany({
    where: {
      avatar: {
        startsWith: 'data:image/'
      }
    }
  });

  console.log(`Found ${users.length} users with Base64 avatars.`);

  for (const user of users) {
    await prisma.user.update({
      where: { id: user.id },
      data: { avatar: null }
    });
    console.log(`Reset avatar for user: ${user.email}`);
  }

  console.log('Cleanup complete.');
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
