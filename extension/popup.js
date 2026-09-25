import { CORE_KEYS, CORE_LABELS } from './core.js';

const send = (msg) => chrome.runtime.sendMessage(msg).then((r) => (r && r.ok ? r.result : Promise.reject(r && r.error)));

const STATE_TEXT = {
  live: 'open',
  unloaded: 'unloaded — will reload',
  drifted: 'navigated away',
  missing: 'not open — Go will open it',
  unconfigured: 'not set up — see Settings',
};

async function render() {
  const { rows, workWindowId, config } = await send({ type: 'status' });
  const box = document.getElementById('rows');
  box.textContent = '';
  for (const key of CORE_KEYS) {
    const r = rows[key];
    const row = document.createElement('div');
    row.className = 'row';
    const name = document.createElement('span');
    name.className = 'name';
    name.textContent = CORE_LABELS[key] + ' ';
    const st = document.createElement('span');
    st.className = 'state ' + r.state;
    st.textContent = STATE_TEXT[r.state] + (r.inWorkWindow ? ' · in work window' : '');
    name.appendChild(st);
    row.appendChild(name);
    if (r.state === 'drifted') {
      const b = document.createElement('button');
      b.className = 'warn';
      b.textContent = 'Restore';
      b.onclick = () => send({ type: 'restore', key }).then(() => window.close());
      row.appendChild(b);
    }
    if (r.state !== 'unconfigured') {
      const b = document.createElement('button');
      b.className = 'primary';
      b.textContent = 'Go';
      b.onclick = () => send({ type: 'focus', key }).then(() => window.close());
      row.appendChild(b);
    }
    box.appendChild(row);
  }
  const current = await chrome.windows.getCurrent();
  document.getElementById('work').textContent =
    workWindowId == null ? 'Not set — created on first routed link' : workWindowId === current.id ? 'This window' : 'Another window';
  document.getElementById('route').checked = !!config.routeLinks;
}

document.getElementById('setWork').onclick = async () => {
  const w = await chrome.windows.getCurrent();
  const r = await send({ type: 'setWorkWindow', windowId: w.id });
  await render();
  if (r.holdsCore) document.getElementById('work').textContent = 'This window (holds a core tab: its links will stay here)';
};

document.getElementById('route').onchange = async (e) => {
  const { config } = await chrome.storage.local.get('config');
  await chrome.storage.local.set({ config: { ...(config || {}), routeLinks: e.target.checked } });
};

document.getElementById('diag').onclick = async () => {
  const d = await send({ type: 'diagnostics' });
  await navigator.clipboard.writeText(JSON.stringify(d, null, 2));
  document.getElementById('diagMsg').textContent = 'Copied. Paste it into the chat with your test result.';
};

document.getElementById('opts').onclick = (e) => { e.preventDefault(); chrome.runtime.openOptionsPage(); };
document.getElementById('keys').onclick = (e) => { e.preventDefault(); chrome.tabs.create({ url: 'chrome://extensions/shortcuts' }); };

render();
