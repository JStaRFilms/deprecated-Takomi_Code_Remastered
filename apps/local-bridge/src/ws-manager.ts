import type { Socket } from 'node:net';
import type { IncomingMessage } from 'node:http';
import { createHash, randomUUID } from 'node:crypto';
import type { BridgeWsMessage, BridgeWsSubscriptionRequest, BridgeWsChannel } from '@takomi/contracts';

const WS_MAGIC_KEY = '258EAFA5-E914-47DA-95CA-C5AB0DC85B11';

interface WsClient {
  readonly id: string;
  readonly socket: Socket;
  readonly subscriptions: Set<string>;
  alive: boolean;
}

interface Subscription {
  readonly id: string;
  readonly clientId: string;
  readonly channel: string;
  readonly sessionId: string | undefined;
  readonly runId: string | undefined;
}

export class WebSocketManager {
  private clients = new Map<string, WsClient>();
  private subscriptions = new Map<string, Subscription>();
  private heartbeatInterval: ReturnType<typeof setInterval> | null = null;

  constructor() {
    this.heartbeatInterval = setInterval(() => this.heartbeat(), 30_000);
  }

  handleUpgrade(req: IncomingMessage, socket: Socket, _head: Buffer): void {
    const key = req.headers['sec-websocket-key'];
    if (!key || typeof key !== 'string') {
      socket.write('HTTP/1.1 400 Bad Request\r\n\r\n');
      socket.destroy();
      return;
    }

    const headers = [
      'HTTP/1.1 101 Switching Protocols',
      'Upgrade: websocket',
      'Connection: Upgrade',
      `Sec-WebSocket-Accept: ${this.computeAcceptKey(key)}`,
      '',
      ''
    ].join('\r\n');

    socket.write(headers);

    const clientId = this.generateId();
    const client: WsClient = {
      id: clientId,
      socket,
      subscriptions: new Set(),
      alive: true
    };

    this.clients.set(clientId, client);

    socket.on('data', (data: Buffer) => {
      this.handleFrame(client, data);
    });

    socket.on('close', () => {
      this.removeClient(clientId);
    });

    socket.on('error', () => {
      this.removeClient(clientId);
    });

    this.sendToClient(client, {
      type: 'response',
      payload: {
        clientId,
        message: 'Connected to Takomi local bridge'
      },
      timestamp: new Date().toISOString()
    });
  }

  broadcast(event: BridgeWsMessage): void {
    const frame = this.encodeFrame(JSON.stringify(event));

    for (const client of this.clients.values()) {
      if (!client.socket.writable) {
        continue;
      }

      const targetSubscriptions = this.getMatchingSubscriptions(client, event);
      if (targetSubscriptions.length > 0) {
        client.socket.write(frame);
      }
    }
  }

  closeAll(): void {
    if (this.heartbeatInterval) {
      clearInterval(this.heartbeatInterval);
      this.heartbeatInterval = null;
    }

    for (const client of this.clients.values()) {
      if (client.socket.writable) {
        client.socket.write(Buffer.from([0x88, 0x00]));
      }
      client.socket.destroy();
    }

    this.clients.clear();
    this.subscriptions.clear();
  }

  private sendToClient(client: WsClient, message: BridgeWsMessage): void {
    if (client.socket.writable) {
      client.socket.write(this.encodeFrame(JSON.stringify(message)));
    }
  }

  private handleFrame(client: WsClient, data: Buffer): void {
    if (data.length < 2) {
      return;
    }

    const opcode = data[0]! & 0x0f;

    if (opcode === 0x09) {
      if (client.socket.writable) {
        client.socket.write(Buffer.from([0x8a, 0x00]));
      }
      return;
    }

    if (opcode === 0x0a) {
      client.alive = true;
      return;
    }

    if (opcode === 0x08) {
      this.removeClient(client.id);
      return;
    }

    if (opcode === 0x01) {
      const payload = this.decodeFrame(data);
      if (payload) {
        this.processMessage(client, payload);
      }
    }
  }

  private processMessage(client: WsClient, raw: string): void {
    let message: BridgeWsSubscriptionRequest | { type: 'unsubscribe'; subscriptionId: string };
    try {
      message = JSON.parse(raw) as BridgeWsSubscriptionRequest | { type: 'unsubscribe'; subscriptionId: string };
    } catch {
      this.sendToClient(client, {
        type: 'error',
        payload: null,
        error: {
          code: 'INVALID_JSON',
          message: 'Message must be valid JSON'
        },
        timestamp: new Date().toISOString()
      });
      return;
    }

    if (message.type === 'subscribe') {
      this.handleSubscribe(client, message);
    } else if (message.type === 'unsubscribe') {
      this.handleUnsubscribe(client, message.subscriptionId);
    }
  }

  private handleSubscribe(client: WsClient, request: BridgeWsSubscriptionRequest): void {
    const subId = this.generateId();
    const subscription: Subscription = {
      id: subId,
      clientId: client.id,
      channel: request.channel,
      sessionId: request.sessionId,
      runId: request.runId
    };

    this.subscriptions.set(subId, subscription);
    client.subscriptions.add(subId);

    const wsChannel: BridgeWsChannel = request.channel;
    this.sendToClient(client, {
      type: 'response',
      channel: wsChannel,
      payload: {
        subscriptionId: subId,
        channel: request.channel,
        sessionId: request.sessionId,
        runId: request.runId
      },
      timestamp: new Date().toISOString()
    });
  }

  private handleUnsubscribe(client: WsClient, subscriptionId: string): void {
    const sub = this.subscriptions.get(subscriptionId);
    if (!sub || sub.clientId !== client.id) {
      return;
    }

    this.subscriptions.delete(subscriptionId);
    client.subscriptions.delete(subscriptionId);
    this.sendToClient(client, {
      type: 'response',
      payload: { unsubscribed: subscriptionId },
      timestamp: new Date().toISOString()
    });
  }

  private getMatchingSubscriptions(client: WsClient, event: BridgeWsMessage): Subscription[] {
    const matches: Subscription[] = [];

    for (const subId of client.subscriptions) {
      const sub = this.subscriptions.get(subId);
      if (!sub) {
        continue;
      }

      if (event.channel && sub.channel !== event.channel) {
        continue;
      }
      if (event.sessionId && sub.sessionId && sub.sessionId !== event.sessionId) {
        continue;
      }
      if (event.runId && sub.runId && sub.runId !== event.runId) {
        continue;
      }

      matches.push(sub);
    }

    return matches;
  }

  private removeClient(clientId: string): void {
    const client = this.clients.get(clientId);
    if (!client) {
      return;
    }

    for (const subId of client.subscriptions) {
      this.subscriptions.delete(subId);
    }

    this.clients.delete(clientId);
  }

  private heartbeat(): void {
    for (const client of this.clients.values()) {
      if (!client.alive) {
        this.removeClient(client.id);
        continue;
      }

      client.alive = false;
      if (client.socket.writable) {
        client.socket.write(Buffer.from([0x89, 0x00]));
      }
    }
  }

  private computeAcceptKey(key: string): string {
    return createHash('sha1')
      .update(key + WS_MAGIC_KEY)
      .digest('base64');
  }

  private encodeFrame(payload: string): Buffer {
    const payloadBuffer = Buffer.from(payload, 'utf8');
    const payloadLength = payloadBuffer.length;

    let header: Buffer;
    if (payloadLength < 126) {
      header = Buffer.from([0x81, payloadLength]);
    } else if (payloadLength < 65536) {
      header = Buffer.alloc(4);
      header[0] = 0x81;
      header[1] = 126;
      header.writeUInt16BE(payloadLength, 2);
    } else {
      header = Buffer.alloc(10);
      header[0] = 0x81;
      header[1] = 127;
      header.writeBigUInt64BE(BigInt(payloadLength), 2);
    }

    return Buffer.concat([header, payloadBuffer]);
  }

  private decodeFrame(data: Buffer): string | null {
    if (data.length < 2) {
      return null;
    }

    const secondByte = data[1]!;
    const isMasked = (secondByte & 0x80) !== 0;
    let payloadLength = secondByte & 0x7f;
    let offset = 2;

    if (payloadLength === 126) {
      if (data.length < 4) {
        return null;
      }
      payloadLength = data.readUInt16BE(2);
      offset = 4;
    } else if (payloadLength === 127) {
      if (data.length < 10) {
        return null;
      }
      payloadLength = Number(data.readBigUInt64BE(2));
      offset = 10;
    }

    if (isMasked) {
      if (data.length < offset + 4) {
        return null;
      }
      const mask = data.subarray(offset, offset + 4);
      offset += 4;
      const payload = Buffer.alloc(payloadLength);
      for (let index = 0; index < payloadLength; index += 1) {
        payload[index] = data[offset + index]! ^ mask[index % 4]!;
      }
      return payload.toString('utf8');
    }

    if (data.length < offset + payloadLength) {
      return null;
    }

    return data.subarray(offset, offset + payloadLength).toString('utf8');
  }

  private generateId(): string {
    return randomUUID();
  }
}
