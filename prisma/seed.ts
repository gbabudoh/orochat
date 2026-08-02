import { PrismaClient } from '@prisma/client';
import bcrypt from 'bcryptjs';

const prisma = new PrismaClient();

async function generateUniqueUsername(name: string, email: string) {
  const base = (name || email.split('@')[0])
    .replace(/[^a-zA-Z0-9_]/g, '')
    .slice(0, 16) || 'User';

  let candidate = base.toLowerCase();
  let counter = 1;

  while (await prisma.user.findUnique({ where: { username: candidate } })) {
    candidate = `${base.toLowerCase()}${counter}`;
    counter++;
  }
  return candidate;
}

const SEED_ACCOUNTS = [
  {
    email: 'godwin@egobas.com',
    passwordRaw: 'F1r3work$2026',
    name: 'Godwin Babudoh',
    title: 'Lead Architect & Founder',
    company: 'Egobas Solutions',
    location: 'Lagos, Nigeria',
    bio: 'Passionate about engineering clean, secure systems.',
    isPartner: true,
    currentTES: 3.3,
  },
  {
    email: 'godwinbabs@egobas.com',
    passwordRaw: 'password101',
    name: 'Godwin Babs',
    title: 'Senior Developer',
    company: 'Egobas Solutions',
    location: 'Lagos, Nigeria',
    bio: 'Focused on React, Node.js, and high performance databases.',
    isPartner: true,
    currentTES: 2.0,
  },
  {
    email: 'gbabudoh@gmail.com',
    passwordRaw: 'password101',
    name: 'Godwin Babudoh',
    title: 'Software Engineer',
    company: 'Orochat',
    location: 'Lagos, Nigeria',
    bio: 'Building verified professional networks.',
    isPartner: false,
    currentTES: 0.0,
  },
  {
    email: 'ruthderi80@gmail.com',
    passwordRaw: 'password101',
    name: 'Wuese Ruth Deri',
    title: 'Product Designer',
    company: 'Orochat',
    location: 'Abuja, Nigeria',
    bio: 'Designing intuitive user interfaces.',
    isPartner: false,
    currentTES: 0.0,
  },
  {
    email: 'godwinbabs@hotmail.com',
    passwordRaw: 'password101',
    name: 'Amaebi James Babudoh',
    title: 'Engineering Manager',
    company: 'Egobas',
    location: 'London, UK',
    bio: 'Scaling teams and infrastructure.',
    isPartner: false,
    currentTES: 1.0,
  },
  {
    email: 'kolaelebe@aol.com',
    passwordRaw: 'password101',
    name: 'Kola Elebe',
    title: 'Full Stack Engineer',
    company: 'Orochat',
    location: 'Lagos, Nigeria',
    bio: 'Full stack web development & systems.',
    isPartner: false,
    currentTES: 1.0,
  },
];

async function main() {
  console.log('Seeding database with verified accounts...');

  for (const acc of SEED_ACCOUNTS) {
    const existing = await prisma.user.findUnique({ where: { email: acc.email } });
    const hashedPassword = await bcrypt.hash(acc.passwordRaw, 10);

    if (existing) {
      const username = existing.username || (await generateUniqueUsername(acc.name, acc.email));
      await prisma.user.update({
        where: { id: existing.id },
        data: {
          name: acc.name,
          username,
          password: hashedPassword,
          emailVerified: existing.emailVerified ?? new Date(),
          isPartner: acc.isPartner,
          currentTES: acc.currentTES,
        },
      });
      console.log(`Updated ${acc.email}`);
    } else {
      const username = await generateUniqueUsername(acc.name, acc.email);
      await prisma.user.create({
        data: {
          email: acc.email,
          password: hashedPassword,
          emailVerified: new Date(),
          name: acc.name,
          username,
          title: acc.title,
          company: acc.company,
          location: acc.location,
          bio: acc.bio,
          isPartner: acc.isPartner,
          currentTES: acc.currentTES,
        },
      });
      console.log(`Created ${acc.email}`);
    }
  }

  console.log('Seeding completed successfully!');
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
