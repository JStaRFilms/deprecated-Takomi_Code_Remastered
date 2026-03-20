import assert from 'node:assert/strict';
import net from 'node:net';
import { spawn } from 'node:child_process';

const repoRoot = process.cwd();
const webPort = await getFreePort();
const bridgePort = await getFreePort();

const child = spawn(
  process.execPath,
  ['--import', 'tsx/esm', 'scripts/dev-web-local.mjs'],
  {
    cwd: repoRoot,
    env: {
      ...process.env,
      TAKOMI_WEB_LOCAL_PORT: String(webPort),
      TAKOMI_BRIDGE_PORT: String(bridgePort),
      TAKOMI_BRIDGE_HOST: '127.0.0.1',
    },
    stdio: 'pipe',
  }
);

let stdout = '';
let stderr = '';
child.stdout?.on('data', (chunk) => {
  stdout += chunk.toString();
});
child.stderr?.on('data', (chunk) => {
  stderr += chunk.toString();
});

try {
  await waitForUrl(`http://127.0.0.1:${bridgePort}/health`);
  await waitForUrl(`http://127.0.0.1:${webPort}/transport/status`);

  const rootHtml = await fetchText(`http://127.0.0.1:${webPort}/`);
  assert.match(rootHtml, /data-component="app-shell"/, 'Expected web-local root to render the shared Takomi app shell');
  assert.match(rootHtml, /Project Chat 1/, 'Expected web-local root to include the shared session workspace content');

  const health = await fetchJson(`http://127.0.0.1:${bridgePort}/health`);
  assert.equal(health.ok, true, 'Expected bridge health endpoint to return ok');

  const capabilities = await fetchJson(`http://127.0.0.1:${bridgePort}/capabilities`);
  assert.equal(capabilities.available, true, 'Expected bridge capabilities to report availability');
  assert.equal(capabilities.capabilities.eventStreaming, true, 'Expected event streaming to be enabled');

  const workspace = await bridgeRequest(bridgePort, {
    channel: 'takomi:workspace:list',
    payload: {},
    requestId: 'verify-workspace-list',
  });
  assert.equal(workspace.ok, true, 'Expected workspace list bridge request to succeed');
  assert.ok(Array.isArray(workspace.payload?.workspaces), 'Expected workspace list payload');

  const agentDefaults = await bridgeRequest(bridgePort, {
    channel: 'takomi:agents:defaults:load',
    payload: {},
    requestId: 'verify-agent-defaults',
  });
  assert.equal(agentDefaults.ok, true, 'Expected agent defaults bridge request to succeed');
  assert.ok(Array.isArray(agentDefaults.payload?.modes), 'Expected Takomi agent defaults bundle payload');
  assert.ok(agentDefaults.payload.modes.length > 0, 'Expected real Takomi modes from .agent/Takomi-Agents');

  const transportStatus = await fetchJson(`http://127.0.0.1:${webPort}/transport/status`);
  assert.equal(transportStatus.mode, 'web-local', 'Expected web-local transport status');
  assert.equal(transportStatus.bridgeUrl, `http://127.0.0.1:${bridgePort}`, 'Expected transport status to reflect dynamic bridge port');

  const runtimeEvent = await receiveRuntimeEvent(bridgePort);
  assert.equal(runtimeEvent.type, 'event', 'Expected runtime websocket event message');
  assert.equal(runtimeEvent.channel, 'runtime-events', 'Expected runtime-events websocket channel');
  assert.equal(runtimeEvent.payload.kind, 'run.starting', 'Expected synthetic runtime start event');

  console.log('Web-local bridge verification passed.');
} finally {
  child.kill();
}

function bridgeRequest(port, body) {
  return fetchJson(`http://127.0.0.1:${port}/bridge`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(body),
  });
}

async function receiveRuntimeEvent(bridgePort) {
  return await new Promise((resolve, reject) => {
    const ws = new WebSocket(`ws://127.0.0.1:${bridgePort}/ws`);
    const timeout = setTimeout(() => {
      ws.close();
      reject(new Error('Timed out waiting for runtime websocket event'));
    }, 8000);
    let subscribed = false;

    ws.addEventListener('open', () => {
      ws.send(JSON.stringify({
        type: 'subscribe',
        channel: 'runtime-events',
        sessionId: 'sess-01',
      }));
    });

    ws.addEventListener('message', async (event) => {
      const message = JSON.parse(event.data.toString());
      if (!subscribed && message.type === 'response' && message.payload?.subscriptionId) {
        subscribed = true;
        await bridgeRequest(bridgePort, {
          channel: 'takomi:runtime:subscribe',
          payload: { sessionId: 'sess-01' },
          requestId: 'verify-runtime-subscribe',
        });
        return;
      }

      if (message.type === 'event' && message.channel === 'runtime-events') {
        clearTimeout(timeout);
        ws.close();
        resolve(message);
      }
    });

    ws.addEventListener('error', () => {
      clearTimeout(timeout);
      reject(new Error('WebSocket bridge connection failed'));
    });
  });
}

async function fetchJson(url, init) {
  const response = await fetch(url, init);
  if (!response.ok) {
    throw new Error(`Request failed for ${url}: ${response.status}`);
  }
  return await response.json();
}

async function fetchText(url, init) {
  const response = await fetch(url, init);
  if (!response.ok) {
    throw new Error(`Request failed for ${url}: ${response.status}`);
  }
  return await response.text();
}

async function waitForUrl(url) {
  const deadline = Date.now() + 15_000;

  while (Date.now() < deadline) {
    try {
      const response = await fetch(url);
      if (response.ok) {
        return;
      }
    } catch {
      // Retry until deadline.
    }

    await delay(250);
  }

  throw new Error(`Timed out waiting for ${url}\nstdout:\n${stdout}\nstderr:\n${stderr}`);
}

function delay(ms) {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

function getFreePort() {
  return new Promise((resolve, reject) => {
    const server = net.createServer();
    server.listen(0, '127.0.0.1', () => {
      const address = server.address();
      if (!address || typeof address === 'string') {
        server.close();
        reject(new Error('Failed to allocate a free port'));
        return;
      }
      const { port } = address;
      server.close(() => resolve(port));
    });
    server.on('error', reject);
  });
}
