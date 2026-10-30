import type { DigestRow, NightDigest } from '../digest/types.js';

function ownerCell(owner: string | null): string {
  return owner ?? '—';
}

function rowClass(row: DigestRow): string | undefined {
  if (row.lastStatus === 'fail' || row.retries >= 3) return 'warn';
  return undefined;
}

export function DigestPage({ digest }: { digest: NightDigest }) {
  if (digest.rows.length === 0) {
    return (
      <>
        <h1>digest · {digest.night}</h1>
        <p class="mute">nothing ran</p>
      </>
    );
  }

  return (
    <>
      <h1>digest · {digest.night}</h1>
      <table>
        <thead>
          <tr>
            <th>job</th>
            <th>owner</th>
            <th>runs</th>
            <th>retries</th>
            <th>last</th>
            <th>error</th>
            <th>first</th>
            <th>last</th>
          </tr>
        </thead>
        <tbody>
          {digest.rows.map((row) => (
            <tr class={rowClass(row)}>
              <td>{row.job}</td>
              <td>{ownerCell(row.owner)}</td>
              <td>{row.runs}</td>
              <td>{row.retries}</td>
              <td>{row.lastStatus}</td>
              <td>{row.lastError ?? '—'}</td>
              <td>{row.firstAt}</td>
              <td>{row.lastAt}</td>
            </tr>
          ))}
        </tbody>
      </table>
    </>
  );
}

export function digestRowsJson(digest: NightDigest) {
  return digest.rows.map((row) => ({
    job: row.job,
    owner: row.owner,
    runs: row.runs,
    retries: row.retries,
    lastStatus: row.lastStatus,
    lastError: row.lastError,
    firstAt: row.firstAt,
    lastAt: row.lastAt,
  }));
}
