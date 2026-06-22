import { db } from './db';

const SINGLETON_ID = 'singleton';

export async function getPlatformConfig() {
  const existing = await db.platformConfig.findUnique({ where: { id: SINGLETON_ID } });
  if (existing) return existing;
  return db.platformConfig.create({ data: { id: SINGLETON_ID } });
}

export async function updateOroSharePercent(oroSharePercent: number) {
  return db.platformConfig.upsert({
    where: { id: SINGLETON_ID },
    update: { oroSharePercent },
    create: { id: SINGLETON_ID, oroSharePercent },
  });
}
