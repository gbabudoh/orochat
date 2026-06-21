import { PrismaClient } from '@prisma/client';
import bcrypt from 'bcryptjs';

const prisma = new PrismaClient();

const accounts = [
  { email: 'godwin@egobas.com', password: 'password101', name: 'Godwin' },
  { email: 'godwinbabs@egobas.com', password: 'password101', name: 'Godwin Babs' },
];

function baseUsername(name, email) {
  return (
    (name || email.split('@')[0])
      .toLowerCase()
      .replace(/[^a-z0-9]/g, '')
      .slice(0, 16) || 'user'
  );
}

async function uniqueUsername(name, email) {
  const base = baseUsername(name, email);
  let candidate = base;
  let suffix = 0;
  while (await prisma.user.findUnique({ where: { username: candidate } })) {
    suffix += 1;
    candidate = `${base}${suffix}`;
  }
  return candidate;
}

async function main() {
  for (const acc of accounts) {
    const existing = await prisma.user.findUnique({ where: { email: acc.email } });
    if (existing) {
      console.log(`Skipping ${acc.email}, already exists`);
      continue;
    }
    const hashedPassword = await bcrypt.hash(acc.password, 10);
    const username = await uniqueUsername(acc.name, acc.email);
    const user = await prisma.user.create({
      data: {
        email: acc.email,
        password: hashedPassword,
        name: acc.name,
        username,
      },
    });
    console.log(`Created ${user.email} (username: ${user.username})`);
  }
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(() => prisma.$disconnect());
