import { execSync } from 'node:child_process';

function shortCommit(): string {
  try {
    return execSync('git rev-parse --short HEAD', { stdio: ['ignore', 'pipe', 'ignore'] })
      .toString()
      .trim();
  } catch {
    const sha = process.env.GITHUB_SHA;
    return sha ? sha.slice(0, 7) : 'local';
  }
}

function stamp(d: Date): string {
  const p = (n: number) => String(n).padStart(2, '0');
  return `${d.getUTCFullYear()}${p(d.getUTCMonth() + 1)}${p(d.getUTCDate())}.${p(d.getUTCHours())}${p(d.getUTCMinutes())}`;
}

/** Build identifier `YYYYMMDD.HHMM.<short commit>` (UTC), fixed once per build. */
export const BUILD_ID = `${stamp(new Date())}.${shortCommit()}`;
