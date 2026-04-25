import { PrismaClient } from '@prisma/client';
import bcrypt from 'bcryptjs';

const prisma = new PrismaClient();

async function main() {
  console.log('Seeding database...');

  // Create sample users
  const password = await bcrypt.hash('password123', 10);

  const user1 = await prisma.user.create({
    data: {
      email: 'demo@orochat.com',
      password,
      name: 'Demo User',
      title: 'Senior Software Engineer',
      company: 'Tech Corp',
      location: 'San Francisco, CA',
      bio: 'Passionate about building great products.',
    },
  });

  const user2 = await prisma.user.create({
    data: {
      email: 'partner@orochat.com',
      password,
      name: 'Orochat Partner',
      title: 'Product Manager',
      company: 'Innovation Labs',
      location: 'New York, NY',
      bio: 'Building the future of professional networking.',
      isPartner: true,
      verifiedOrosCount: 1500,
      currentTES: 2500,
    },
  });

  console.log('Created users:', { user1: user1.email, user2: user2.email });

  // Create sample Compass communities
  const compass1 = await prisma.compass.create({
    data: {
      slug: 'fintech',
      name: 'FinTech Professionals',
      description: 'A community for professionals working in financial technology.',
      creatorId: user2.id,
    },
  });

  const compass2 = await prisma.compass.create({
    data: {
      slug: 'startups',
      name: 'Startup Founders',
      description: 'Connect with fellow entrepreneurs and startup founders.',
      creatorId: user2.id,
    },
  });

  console.log('Created communities:', { compass1: compass1.slug, compass2: compass2.slug });

  console.log('Seeding completed!');
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });

