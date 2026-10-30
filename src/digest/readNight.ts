import { readFileSync } from 'node:fs';
import { join } from 'node:path';
import type { DigestRow, JobStatus, NightDigest, ReadNight } from './types.js';

type LogLine = {
  at: string;
  job: string;
  status: JobStatus;
  owner: string | null;
  error?: string;
};

const STATUSES = new Set<JobStatus>(['ok', 'retry', 'fail']);

function parseLine(raw: string): LogLine | null {
  let parsed: unknown;
  try {
    parsed = JSON.parse(raw);
  } catch {
    return null;
  }
  if (!parsed || typeof parsed !== 'object') return null;
  const o = parsed as Record<string, unknown>;
  if (typeof o.at !== 'string' || typeof o.job !== 'string') return null;
  if (typeof o.status !== 'string' || !STATUSES.has(o.status as JobStatus)) return null;
  if (!(o.owner === null || typeof o.owner === 'string')) return null;
  if (o.error !== undefined && typeof o.error !== 'string') return null;
  return {
    at: o.at,
    job: o.job,
    status: o.status as JobStatus,
    owner: o.owner,
    error: typeof o.error === 'string' ? o.error : undefined,
  };
}

export const readNight: ReadNight = (runsDir, night) => {
  const path = join(runsDir, `${night}.jsonl`);
  let text: string;
  try {
    text = readFileSync(path, 'utf8');
  } catch {
    return null;
  }

  const byJob = new Map<string, DigestRow>();
  let badLines = 0;
  const counts = { ok: 0, retry: 0, fail: 0 };

  for (const line of text.split('\n')) {
    if (line.trim() === '') continue;
    const event = parseLine(line);
    if (!event) {
      badLines += 1;
      continue;
    }

    counts[event.status] += 1;

    const existing = byJob.get(event.job);
    if (!existing) {
      byJob.set(event.job, {
        job: event.job,
        owner: event.owner,
        runs: 1,
        retries: event.status === 'retry' ? 1 : 0,
        lastStatus: event.status,
        lastError: event.error ?? null,
        firstAt: event.at,
        lastAt: event.at,
      });
      continue;
    }

    existing.runs += 1;
    if (event.status === 'retry') existing.retries += 1;
    existing.owner = event.owner;
    existing.lastStatus = event.status;
    existing.lastError = event.error ?? null;
    existing.lastAt = event.at;
  }

  const rows = [...byJob.values()].sort((a, b) => a.job.localeCompare(b.job));
  return { night, rows, badLines, counts };
};
