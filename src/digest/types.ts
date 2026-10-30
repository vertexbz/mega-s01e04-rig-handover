export type JobStatus = 'ok' | 'retry' | 'fail';

export type DigestRow = {
  job: string;
  owner: string | null;
  runs: number;
  retries: number;
  lastStatus: JobStatus;
  lastError: string | null;
  firstAt: string;
  lastAt: string;
};

export type NightDigest = {
  night: string;
  rows: DigestRow[];
  badLines: number;
  /** Event counts across the night (for the status board). */
  counts: { ok: number; retry: number; fail: number };
};

/** Read `runs/<night>.jsonl` into one row per job. Missing file → null. */
export type ReadNight = (runsDir: string, night: string) => NightDigest | null;
