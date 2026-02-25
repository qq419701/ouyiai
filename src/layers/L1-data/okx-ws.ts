import WebSocket from 'ws';
import { EventEmitter } from 'events';
import { logger } from '../../utils/logger';
import { OKXWsMessage } from './types';

const OKX_WS_PUBLIC = 'wss://ws.okx.com:8443/ws/v5/public';
const OKX_WS_PRIVATE = 'wss://ws.okx.com:8443/ws/v5/private';

export class OKXWebSocket extends EventEmitter {
  private ws: WebSocket | null = null;
  private reconnectTimer: NodeJS.Timeout | null = null;
  private heartbeatTimer: NodeJS.Timeout | null = null;
  private isConnected = false;
  private reconnectAttempts = 0;
  private maxReconnectAttempts = 10;
  private subscriptions: string[] = [];
  private lastSeqNum = 0;

  constructor(
    private url: string = OKX_WS_PUBLIC,
    private apiKey?: string,
    private apiSecret?: string,
    private passphrase?: string,
  ) {
    super();
  }

  connect(): void {
    this.ws = new WebSocket(this.url);

    this.ws.on('open', () => {
      this.isConnected = true;
      this.reconnectAttempts = 0;
      logger.info({ url: this.url }, 'OKX WebSocket connected');
      this.startHeartbeat();
      this.resubscribe();
      this.emit('connected');
    });

    this.ws.on('message', (data: WebSocket.Data) => {
      try {
        const msg = JSON.parse(data.toString()) as OKXWsMessage;
        if (msg.event === 'error') {
          logger.error({ code: msg.code, msg: msg.msg }, 'OKX WS error event');
          return;
        }
        if (msg.data) {
          this.emit('data', msg);
        }
      } catch (err) {
        logger.warn({ err }, 'Failed to parse WS message');
      }
    });

    this.ws.on('close', (code, reason) => {
      this.isConnected = false;
      this.stopHeartbeat();
      logger.warn({ code, reason: reason.toString() }, 'OKX WebSocket closed');
      this.scheduleReconnect();
      this.emit('disconnected');
    });

    this.ws.on('error', (err) => {
      logger.error({ err }, 'OKX WebSocket error');
      this.emit('error', err);
    });

    this.ws.on('pong', () => {
      logger.debug('OKX WS pong received');
    });
  }

  subscribe(channels: { channel: string; instId: string }[]): void {
    const msg = { op: 'subscribe', args: channels };
    channels.forEach(c => {
      const key = `${c.channel}:${c.instId}`;
      if (!this.subscriptions.includes(key)) {
        this.subscriptions.push(key);
      }
    });
    this.send(msg);
  }

  private resubscribe(): void {
    if (this.subscriptions.length === 0) return;
    const args = this.subscriptions.map(s => {
      const [channel, instId] = s.split(':');
      return { channel, instId };
    });
    this.send({ op: 'subscribe', args });
  }

  private send(data: unknown): void {
    if (this.ws?.readyState === WebSocket.OPEN) {
      this.ws.send(JSON.stringify(data));
    }
  }

  private startHeartbeat(): void {
    this.heartbeatTimer = setInterval(() => {
      if (this.ws?.readyState === WebSocket.OPEN) {
        this.ws.send('ping');
      }
    }, 25000);
  }

  private stopHeartbeat(): void {
    if (this.heartbeatTimer) {
      clearInterval(this.heartbeatTimer);
      this.heartbeatTimer = null;
    }
  }

  private scheduleReconnect(): void {
    if (this.reconnectAttempts >= this.maxReconnectAttempts) {
      logger.error('Max reconnect attempts reached');
      return;
    }
    const delay = Math.min(1000 * Math.pow(2, this.reconnectAttempts), 30000);
    this.reconnectAttempts++;
    logger.info({ attempt: this.reconnectAttempts, delay }, 'Scheduling WS reconnect');
    this.reconnectTimer = setTimeout(() => {
      this.connect();
    }, delay);
  }

  disconnect(): void {
    if (this.reconnectTimer) clearTimeout(this.reconnectTimer);
    this.stopHeartbeat();
    this.ws?.close();
  }

  get connected(): boolean {
    return this.isConnected;
  }
}
