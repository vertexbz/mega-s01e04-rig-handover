import { readNight } from '../digest/readNight.js';
import type { RigConfig } from '../config.js';
import type { Status } from '../status.js';

export function StatusBoard({ status, config }: { status: Status; config: RigConfig }) {
  return (
    <>
      <h1>status</h1>
      <table>
        <tbody>
          <tr><th>adapter</th><td>{status.adapter}</td></tr>
          <tr><th>installed</th><td>{status.installed}</td></tr>
          <tr>
            <th>last beat</th>
            <td>{status.lastBeat ? `${status.lastBeat.at} · pid ${status.lastBeat.pid}` : <span class="warn">none</span>}</td>
          </tr>
        </tbody>
      </table>
      <h2>nights on disk</h2>
      {status.nights.length === 0 ? (
        <p class="mute">nothing in runs/</p>
      ) : (
        <ul>
          {status.nights.map((n) => {
            const digest = readNight(config.runsDir, n);
            const counts = digest?.counts ?? { ok: 0, retry: 0, fail: 0 };
            return (
              <li>
                <a href={`/digest/${n}`}>{n}</a>
                {' '}
                <span class="mute">
                  {counts.ok} ok / {counts.retry} retry / {counts.fail} fail
                </span>
              </li>
            );
          })}
        </ul>
      )}
    </>
  );
}
