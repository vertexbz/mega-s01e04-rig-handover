import { mkdtempSync, writeFileSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import { describe, expect, it } from 'vitest';
import { createApp } from '../src/app.js';

function appWithRuns(dir: string) {
  return createApp({
    adapter: 'shim',
    installed: '2026-10-29T14:06:00+01:00',
    beatEverySeconds: 60,
    runsDir: dir,
  });
}

describe('digest routes', () => {
  it('renders /digest/:night and matches /api/digest/:night job order', async () => {
    process.env.LANE_MARKER = 'TEST-MARKER';
    const app = appWithRuns('runs');

    const page = await app.request('/digest/2026-10-28');
    const html = await page.text();
    expect(page.status).toBe(200);
    expect(html).toContain('TEST-MARKER');
    expect(html).toContain('digest/render');
    expect(html).toContain('—');

    const api = await app.request('/api/digest/2026-10-28');
    expect(api.status).toBe(200);
    const body = (await api.json()) as { rows: { job: string }[] };
    expect(body.rows.map((r) => r.job)).toEqual([
      'digest/render',
      'fixtures/refresh',
      'lane/sync',
      'notes/backup',
      'rig/rotate-logs',
    ]);

    // Same jobs, same order as the page (first appearance of each job name in HTML order).
    const orderInHtml = body.rows.map((r) => html.indexOf(r.job));
    expect(orderInHtml.every((i) => i >= 0)).toBe(true);
    expect([...orderInHtml].sort((a, b) => a - b)).toEqual(orderInHtml);
  });

  it('returns 404 for a night with no file', async () => {
    const app = appWithRuns('runs');
    expect((await app.request('/digest/1999-01-01')).status).toBe(404);
    expect((await app.request('/api/digest/1999-01-01')).status).toBe(404);
  });

  it('renders empty night as nothing ran', async () => {
    const dir = mkdtempSync(join(tmpdir(), 'rig-runs-'));
    writeFileSync(join(dir, '2026-01-01.jsonl'), '');
    const app = appWithRuns(dir);
    const res = await app.request('/digest/2026-01-01');
    expect(res.status).toBe(200);
    expect(await res.text()).toContain('nothing ran');
  });

  it('still renders a night that has a bad line', async () => {
    const dir = mkdtempSync(join(tmpdir(), 'rig-runs-'));
    writeFileSync(
      join(dir, '2026-01-02.jsonl'),
      [
        '{"at":"2026-01-02T01:00:00+01:00","job":"a/job","status":"ok","owner":"rook"}',
        'not-json',
        '',
      ].join('\n'),
    );
    const app = appWithRuns(dir);
    const page = await app.request('/digest/2026-01-02');
    expect(page.status).toBe(200);
    expect(await page.text()).toContain('a/job');

    const api = await app.request('/api/digest/2026-01-02');
    const body = (await api.json()) as { badLines: number; rows: unknown[] };
    expect(body.badLines).toBe(1);
    expect(body.rows).toHaveLength(1);
  });
});

describe('status board digest links', () => {
  it('links both nights with ok/retry/fail counts', async () => {
    const app = appWithRuns('runs');
    const html = await (await app.request('/')).text();
    expect(html).toContain('href="/digest/2026-10-28"');
    expect(html).toContain('href="/digest/2026-10-27"');
    expect(html).toMatch(/2026-10-28[\s\S]*?\d+ ok \/ \d+ retry \/ \d+ fail/);
  });
});
