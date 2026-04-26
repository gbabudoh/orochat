import { PrismaClient } from '@prisma/client';
const prisma = new PrismaClient();

async function main() {
  const email = 'godwin@egobas.com';
  const user = await prisma.user.findUnique({
    where: { email },
    select: { id: true, email: true, avatar: true }
  });

  console.log('Current user data in DB:');
  console.log(JSON.stringify(user, null, 2));
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
