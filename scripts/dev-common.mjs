import http from 'node:http';
import { readFile } from 'node:fs/promises';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const repoRoot = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');

export function getRepoRoot() {
  return repoRoot;
}

export async function readJson(relativePath) {
  const filePath = path.join(repoRoot, relativePath);
  return JSON.parse(await readFile(filePath, 'utf8'));
}

export function renderStatusPage({ title, subtitle, details }) {
  const rows = details.map(({ label, value }) => `<li><strong>${label}</strong>: ${value}</li>`).join('');
  return `<!doctype html>
<html lang="en">
  <head>
    <meta charset="utf-8" />
    <meta name="viewport" content="width=device-width, initial-scale=1" />
    <title>${title}</title>
    <style>
      :root { color-scheme: dark; }
      body { margin: 0; font-family: ui-sans-serif, system-ui, sans-serif; background: #0b1221; color: #e5eefc; }
      main { max-width: 72rem; margin: 0 auto; padding: 3rem 1.5rem; }
      .card { border: 1px solid rgba(148,163,184,.24); border-radius: 24px; padding: 1.5rem; background: rgba(15,23,42,.78); box-shadow: 0 24px 80px rgba(0,0,0,.28); }
      h1 { margin: 0 0 .5rem; font-size: clamp(2rem, 4vw, 3.5rem); }
      p { color: #94a3b8; line-height: 1.6; }
      ul { margin: 1.25rem 0 0; padding-left: 1.25rem; line-height: 1.8; }
      code { color: #93c5fd; }
    </style>
  </head>
  <body>
    <main>
      <section class="card">
        <h1>${title}</h1>
        <p>${subtitle}</p>
        <ul>${rows}</ul>
      </section>
    </main>
  </body>
</html>`;
}

export function renderAppPage({ title, body, description }) {
  return `<!doctype html>
<html lang="en">
  <head>
    <meta charset="utf-8" />
    <meta name="viewport" content="width=device-width, initial-scale=1" />
    <meta name="description" content="${description}" />
    <title>${title}</title>
    <link rel="preconnect" href="https://fonts.googleapis.com" />
    <link rel="preconnect" href="https://fonts.gstatic.com" crossorigin />
    <link href="https://fonts.googleapis.com/css2?family=Inter:wght@400;500;600;700;800&family=JetBrains+Mono:wght@400;500;700&display=swap" rel="stylesheet" />
    <style>
      :root { color-scheme: dark; }
      * { box-sizing: border-box; }
      html, body { margin: 0; min-height: 100%; background: #0c0c0d; }
      body { font-family: Inter, sans-serif; color: #e5e5e5; }
      [data-component="app-shell"] { min-height: 100vh; }
      @media (max-width: 1180px) {
        [data-component="inspector"] { display: none !important; }
      }
      @media (max-width: 920px) {
        [data-component="sessions-sidebar"] { display: none !important; }
        [data-component="transcript-pane"] { padding-left: 20px !important; padding-right: 20px !important; }
        [data-component="floating-composer"] { padding-left: 16px !important; padding-right: 16px !important; }
      }
      @media (max-width: 720px) {
        [data-component="workspace-header"] { padding-left: 16px !important; padding-right: 16px !important; }
        [data-component="primary-rail"] { width: 48px !important; min-width: 48px !important; }
      }
    </style>
  </head>
  <body>${body}</body>
</html>`;
}

export async function startStatusServer({ name, port, title, subtitle, details, routes = {} }) {
  const server = http.createServer(async (req, res) => {
    const url = req.url ?? '/';
    const route = routes[url];

    if (route) {
      const response = await route();
      res.writeHead(response.status, response.headers);
      res.end(response.body);
      return;
    }

    if (url === '/health') {
      res.writeHead(200, { 'content-type': 'application/json; charset=utf-8' });
      res.end(JSON.stringify({ ok: true, name, port }));
      return;
    }

    res.writeHead(200, { 'content-type': 'text/html; charset=utf-8' });
    res.end(renderStatusPage({ title, subtitle, details }));
  });

  await new Promise((resolve) => server.listen(port, resolve));
  console.log(`[${name}] ready at http://localhost:${port}`);

  return {
    close: () => new Promise((resolve) => server.close(() => resolve())),
  };
}
