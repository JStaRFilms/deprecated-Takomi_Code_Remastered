import http from 'node:http';
import type { Socket } from 'node:net';
import type {
  BridgeServerConfig,
  BridgeCapabilityReport,
  BridgeHttpRequest,
  BridgeHttpResponse,
  BridgeError
} from '@takomi/contracts';
import { IPC_CHANNELS } from '@takomi/contracts';
import { createChannelRouter } from './handlers.js';
import { WebSocketManager } from './ws-manager.js';

const BRIDGE_VERSION = '0.1.0';

export interface BridgeServer {
  readonly config: BridgeServerConfig;
  start(): Promise<void>;
  stop(): Promise<void>;
  getCapabilityReport(): BridgeCapabilityReport;
}

export function createBridgeServer(
  config: BridgeServerConfig
): BridgeServer {
  const wsManager = new WebSocketManager();
  const channelRouter = createChannelRouter(wsManager);
  let server: http.Server | null = null;

  function getCapabilityReport(): BridgeCapabilityReport {
    const base = `http://${config.host}:${config.port}`;
    return {
      available: true,
      version: BRIDGE_VERSION,
      mode: 'web-local',
      transport: ['http', 'websocket'],
      channels: Object.values(IPC_CHANNELS),
      capabilities: {
        workspaceAccess: true,
        filesystemAccess: false,
        gitAccess: false,
        worktreeSwitching: false,
        sessionManagement: true,
        runtimeControl: true,
        eventStreaming: true,
        interventionDelivery: true,
        auditLog: true
      },
      endpoints: {
        http: `${base}${config.httpPrefix}`,
        ws: `ws://${config.host}:${config.port}${config.wsPath}`,
        health: `${base}/health`,
        capabilities: `${base}/capabilities`
      }
    };
  }

  function handleCors(req: http.IncomingMessage, res: http.ServerResponse): void {
    const requestOrigin = req.headers.origin;
    const resolvedOrigin =
      typeof requestOrigin === 'string' && config.corsOrigins.includes(requestOrigin)
        ? requestOrigin
        : config.corsOrigins[0];

    if (resolvedOrigin) {
      res.setHeader('Access-Control-Allow-Origin', resolvedOrigin);
      res.setHeader('Vary', 'Origin');
    }

    res.setHeader('Access-Control-Allow-Methods', 'GET, POST, OPTIONS');
    res.setHeader('Access-Control-Allow-Headers', 'Content-Type, X-Bridge-Request-Id');
    res.setHeader('Access-Control-Max-Age', '86400');
  }

  function sendJson(req: http.IncomingMessage, res: http.ServerResponse, status: number, body: unknown): void {
    handleCors(req, res);
    res.writeHead(status, { 'content-type': 'application/json; charset=utf-8' });
    res.end(JSON.stringify(body));
  }

  function readBody(req: http.IncomingMessage): Promise<string> {
    return new Promise((resolve, reject) => {
      const chunks: Buffer[] = [];
      req.on('data', (chunk: Buffer) => chunks.push(chunk));
      req.on('end', () => resolve(Buffer.concat(chunks).toString('utf8')));
      req.on('error', reject);
    });
  }

  function makeErrorResponse(channel: string, error: BridgeError, requestId?: string): BridgeHttpResponse {
    const response: BridgeHttpResponse = {
      ok: false,
      channel: channel as BridgeHttpResponse['channel'],
      payload: null,
      error,
      timestamp: new Date().toISOString()
    };

    return requestId !== undefined ? { ...response, requestId } : response;
  }

  async function handleBridgeRequest(req: http.IncomingMessage, res: http.ServerResponse): Promise<void> {
    if (req.method === 'OPTIONS') {
      handleCors(req, res);
      res.writeHead(204);
      res.end();
      return;
    }

    if (req.method !== 'POST') {
      sendJson(req, res, 405, makeErrorResponse('unknown', {
        code: 'METHOD_NOT_ALLOWED',
        message: 'Only POST is supported for bridge requests'
      }));
      return;
    }

    let body: string;
    try {
      body = await readBody(req);
    } catch {
      sendJson(req, res, 400, makeErrorResponse('unknown', {
        code: 'BAD_REQUEST',
        message: 'Failed to read request body'
      }));
      return;
    }

    let parsed: BridgeHttpRequest;
    try {
      parsed = JSON.parse(body) as BridgeHttpRequest;
    } catch {
      sendJson(req, res, 400, makeErrorResponse('unknown', {
        code: 'INVALID_JSON',
        message: 'Request body is not valid JSON'
      }));
      return;
    }

    if (!parsed.channel) {
      sendJson(req, res, 400, makeErrorResponse('unknown', {
        code: 'MISSING_CHANNEL',
        message: 'Request must include a channel field'
      }));
      return;
    }

    try {
      const result = await channelRouter.route(parsed);
      sendJson(req, res, result.ok ? 200 : 400, result);
    } catch (error) {
      const message = error instanceof Error ? error.message : 'Internal bridge error';
      sendJson(req, res, 500, makeErrorResponse(parsed.channel, {
        code: 'INTERNAL_ERROR',
        message
      }, parsed.requestId));
    }
  }

  function handleHealth(req: http.IncomingMessage, res: http.ServerResponse): void {
    sendJson(req, res, 200, {
      ok: true,
      name: 'takomi-local-bridge',
      version: BRIDGE_VERSION,
      port: config.port,
      timestamp: new Date().toISOString()
    });
  }

  function handleCapabilities(req: http.IncomingMessage, res: http.ServerResponse): void {
    sendJson(req, res, 200, getCapabilityReport());
  }

  function handleUpgrade(req: http.IncomingMessage, socket: Socket, head: Buffer): void {
    if (req.url === config.wsPath) {
      wsManager.handleUpgrade(req, socket, head);
    } else {
      socket.destroy();
    }
  }

  async function start(): Promise<void> {
    server = http.createServer(async (req, res) => {
      const url = req.url ?? '/';

      if (url === '/health' || url === '/healthz') {
        handleHealth(req, res);
        return;
      }

      if (url === '/capabilities' || url === '/bridge/capabilities') {
        handleCapabilities(req, res);
        return;
      }

      if (url.startsWith(config.httpPrefix)) {
        await handleBridgeRequest(req, res);
        return;
      }

      sendJson(req, res, 200, getCapabilityReport());
    });

    server.on('upgrade', handleUpgrade);

    await new Promise<void>((resolve, reject) => {
      server!.listen(config.port, config.host, () => {
        console.log(`[takomi-local-bridge] listening on ${config.host}:${config.port}`);
        console.log(`[takomi-local-bridge] HTTP: http://${config.host}:${config.port}${config.httpPrefix}`);
        console.log(`[takomi-local-bridge] WS:   ws://${config.host}:${config.port}${config.wsPath}`);
        resolve();
      });
      server!.on('error', reject);
    });
  }

  async function stop(): Promise<void> {
    wsManager.closeAll();
    if (server) {
      await new Promise<void>((resolve) => {
        server!.close(() => resolve());
      });
      server = null;
    }
  }

  return {
    get config() {
      return config;
    },
    start,
    stop,
    getCapabilityReport
  };
}
