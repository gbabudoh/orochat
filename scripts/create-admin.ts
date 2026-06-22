// One-off CLI script to seed the first AdminUser — there is no public admin
// signup page by design. Usage:
//   npx tsx scripts/create-admin.ts you@example.com 'password' "Your Name"
import { PrismaClient } from '@prisma/client';
import bcrypt from 'bcryptjs';

const prisma = new PrismaClient();

async function main() {
  const [email, password, name] = process.argv.slice(2);
  if (!email || !password || !name) {
    console.error('Usage: npx tsx scripts/create-admin.ts <email> <password> "<name>"');
    process.exit(1);
  }
  if (password.length < 8) {
    console.error('Password must be at least 8 characters');
    process.exit(1);
  }

  const existing = await prisma.adminUser.findUnique({ where: { email } });
  if (existing) {
    console.error(`An admin with email ${email} already exists`);
    process.exit(1);
  }

  const hashed = await bcrypt.hash(password, 10);
  const admin = await prisma.adminUser.create({
    data: { email, password: hashed, name, role: 'SUPER_ADMIN' },
  });

  console.log(`Created admin user: ${admin.email} (${admin.id})`);
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
