/**
 * Dumps the database (from DATABASE_URL) to a timestamped, gzipped SQL file
 * under backups/. Requires the PostgreSQL client tools (pg_dump) to be
 * installed and on PATH.
 *
 * Local ad-hoc use: npm run db:backup
 * Scheduled automated use: .github/workflows/backup.yml (runs pg_dump on a
 * GitHub-hosted runner, no local installation needed).
 */
import { spawn } from 'child_process';
import { createWriteStream, mkdirSync } from 'fs';
import { createGzip } from 'zlib';
import { join } from 'path';

const databaseUrl = process.env.DATABASE_URL;
if (!databaseUrl) {
  console.error('DATABASE_URL is not set.');
  process.exit(1);
}

const backupsDir = join(process.cwd(), 'backups');
mkdirSync(backupsDir, { recursive: true });

const timestamp = new Date().toISOString().replace(/[:.]/g, '-');
const outPath = join(backupsDir, `orochat-${timestamp}.sql.gz`);

console.log(`Backing up database to ${outPath} ...`);

const pgDump = spawn('pg_dump', [databaseUrl, '--no-owner', '--no-privileges'], {
  stdio: ['ignore', 'pipe', 'inherit'],
});

const gzip = createGzip();
const out = createWriteStream(outPath);

pgDump.stdout.pipe(gzip).pipe(out);

pgDump.on('error', (err) => {
  console.error('Failed to start pg_dump — is it installed and on PATH?', err.message);
  process.exit(1);
});

pgDump.on('close', (code) => {
  if (code !== 0) {
    console.error(`pg_dump exited with code ${code}`);
    process.exit(code ?? 1);
  }
});

out.on('finish', () => {
  console.log('Backup complete:', outPath);
});
