import { OKXWebSocket } from '../src/layers/L1-data/okx-ws';
import { EventEmitter } from 'events';

// Mock WebSocket
jest.mock('ws', () => {
  const { EventEmitter } = require('events');
  class MockWS extends EventEmitter {
    static OPEN = 1;
    readyState = MockWS.OPEN;
    send = jest.fn();
    close = jest.fn(() => { this.emit('close', 1000, Buffer.from('')); });
    ping = jest.fn();
  }
  return MockWS;
});

describe('WebSocket Reconnect Tests', () => {
  let okxWs: OKXWebSocket;

  beforeEach(() => {
    jest.useFakeTimers();
    okxWs = new OKXWebSocket();
  });

  afterEach(() => {
    jest.useRealTimers();
    okxWs.disconnect();
  });

  test('OKXWebSocket instance is created', () => {
    expect(okxWs).toBeInstanceOf(OKXWebSocket);
  });

  test('OKXWebSocket inherits from EventEmitter', () => {
    expect(okxWs).toBeInstanceOf(EventEmitter);
  });

  test('OKXWebSocket has connect method', () => {
    expect(typeof okxWs.connect).toBe('function');
  });

  test('OKXWebSocket has subscribe method', () => {
    expect(typeof okxWs.subscribe).toBe('function');
  });

  test('OKXWebSocket has disconnect method', () => {
    expect(typeof okxWs.disconnect).toBe('function');
  });

  test('OKXWebSocket starts disconnected', () => {
    expect(okxWs.connected).toBe(false);
  });
});
