import { PrismaClient } from '@prisma/client';
import bcrypt from 'bcryptjs';

const prisma = new PrismaClient();

async function generateUniqueUsername(name: string, email: string) {
  const base = (name || email.split('@')[0])
    .replace(/[^a-zA-Z0-9_]/g, '')
    .slice(0, 16) || 'User';

  const randomSuffix = Math.floor(Math.random() * 10000).toString().padStart(4, '0');
  let candidate = `${base}${randomSuffix}`;

  while (await prisma.user.findUnique({ where: { username: candidate } })) {
    const nextSuffix = Math.floor(Math.random() * 10000).toString().padStart(4, '0');
    candidate = `${base}${nextSuffix}`;
  }
  return candidate;
}

async function main() {
  console.log('Seeding database...');

  // Create user-specified accounts if not already present
  const godwinPassword = await bcrypt.hash('password101', 10);

  let godwin = await prisma.user.findUnique({ where: { email: 'godwin@egobas.com' } });
  if (!godwin) {
    const username = await generateUniqueUsername('Godwin', 'godwin@egobas.com');
    godwin = await prisma.user.create({
      data: {
        email: 'godwin@egobas.com',
        password: godwinPassword,
        name: 'Godwin',
        username,
        title: 'Lead Architect',
        company: 'Egobas',
        location: 'Lagos, Nigeria',
        bio: 'Passionate about engineering clean, secure systems.',
        avatar: 'data:image/svg+xml;utf8,<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="%23458B9E"><circle cx="12" cy="8" r="4"/><path d="M12 14c-4 0-7 2-7 6v1h14v-1c0-4-3-6-7-6z"/></svg>',
        isPartner: true,
      },
    });
    console.log('Created godwin@egobas.com seed user');
  } else {
    const username = godwin.username || await generateUniqueUsername('Godwin', 'godwin@egobas.com');
    const avatar = godwin.avatar && godwin.avatar.startsWith('http')
      ? godwin.avatar
      : 'data:image/svg+xml;utf8,<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="%23458B9E"><circle cx="12" cy="8" r="4"/><path d="M12 14c-4 0-7 2-7 6v1h14v-1c0-4-3-6-7-6z"/></svg>';
    godwin = await prisma.user.update({
      where: { email: 'godwin@egobas.com' },
      data: {
        name: 'Godwin',
        avatar,
        username,
        isPartner: true,
      }
    });
    console.log('Updated godwin@egobas.com seed user with handle:', godwin.username);
  }

  let godwinbabs = await prisma.user.findUnique({ where: { email: 'godwinbabs@egobas.com' } });
  if (!godwinbabs) {
    const username = await generateUniqueUsername('Godwin Babs', 'godwinbabs@egobas.com');
    godwinbabs = await prisma.user.create({
      data: {
        email: 'godwinbabs@egobas.com',
        password: godwinPassword,
        name: 'Godwin Babs',
        username,
        title: 'Senior Developer',
        company: 'Egobas Solutions',
        location: 'Lagos, Nigeria',
        bio: 'Focused on React, Node.js, and high performance databases.',
        avatar: 'data:image/svg+xml;utf8,<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="%235BA3B8"><circle cx="12" cy="8" r="4"/><path d="M12 14c-4 0-7 2-7 6v1h14v-1c0-4-3-6-7-6z"/></svg>',
        isPartner: true,
      },
    });
    console.log('Created godwinbabs@egobas.com seed user');
  } else {
    const username = godwinbabs.username || await generateUniqueUsername('Godwin Babs', 'godwinbabs@egobas.com');
    const avatar = godwinbabs.avatar && godwinbabs.avatar.startsWith('http')
      ? godwinbabs.avatar
      : 'data:image/svg+xml;utf8,<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="%235BA3B8"><circle cx="12" cy="8" r="4"/><path d="M12 14c-4 0-7 2-7 6v1h14v-1c0-4-3-6-7-6z"/></svg>';
    godwinbabs = await prisma.user.update({
      where: { email: 'godwinbabs@egobas.com' },
      data: {
        name: 'Godwin Babs',
        avatar,
        username,
        isPartner: true,
      }
    });
    console.log('Updated godwinbabs@egobas.com seed user with handle:', godwinbabs.username);
  }
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

