export const PAGE_SIZE = 20;

export function parsePage(pageParam?: string): number {
  const page = Number(pageParam);
  return Number.isFinite(page) && page > 0 ? Math.floor(page) : 1;
}

export function parseDir(dirParam?: string): 'asc' | 'desc' {
  return dirParam === 'asc' ? 'asc' : 'desc';
}
