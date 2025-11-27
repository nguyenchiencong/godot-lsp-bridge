import { Socket } from 'net';
import { EventEmitter } from 'events';
import { BridgeConfig } from './types.js';

/**
 * TCP connection to Godot's LSP server.
 * 
 * Events:
 * - 'connect': Connected to Godot LSP
 * - 'data': Raw data received from Godot
 * - 'close': Connection closed
 * - 'error': Connection error
 */
export class LSPConnection extends EventEmitter {
  private socket: Socket | null = null;
  private config: BridgeConfig;
  private isShuttingDown = false;
  private connectedPort: number | null = null;

  constructor(config: BridgeConfig) {
    super();
    this.config = config;
  }

  private log(...args: unknown[]): void {
    if (this.config.debug) {
      console.error('[LSP-Connection]', ...args);
    }
  }

  /**
   * Get all ports to try (main port + fallbacks)
   */
  private getPortsToTry(): number[] {
    return [this.config.port, ...this.config.fallbackPorts];
  }

  /**
   * Connect to Godot LSP server (tries multiple ports)
   */
  async connect(): Promise<number> {
    const ports = this.getPortsToTry();

    for (const port of ports) {
      try {
        await this.tryConnect(port);
        this.connectedPort = port;
        this.log(`Connected to Godot LSP on port ${port}`);
        return port;
      } catch {
        this.log(`Failed to connect on port ${port}`);
      }
    }

    throw new Error(
      `Could not connect to Godot LSP server. Tried ports: ${ports.join(', ')}. ` +
      `Make sure Godot Editor is running with the project open.`
    );
  }

  /**
   * Try connecting to a specific port
   */
  private async tryConnect(port: number): Promise<void> {
    return new Promise((resolve, reject) => {
      const socket = new Socket();
      const timeout = setTimeout(() => {
        socket.destroy();
        reject(new Error(`Connection timeout on port ${port}`));
      }, 5000);

      socket.once('connect', () => {
        clearTimeout(timeout);
        this.socket = socket;
        this.setupSocketHandlers(socket);
        this.emit('connect', port);
        resolve();
      });

      socket.once('error', (err) => {
        clearTimeout(timeout);
        socket.destroy();
        reject(err);
      });

      socket.connect(port, this.config.host);
    });
  }

  /**
   * Setup event handlers for the socket
   */
  private setupSocketHandlers(socket: Socket): void {
    socket.on('data', (data) => {
      this.log('Received', data.length, 'bytes from Godot');
      this.emit('data', data);
    });

    socket.on('close', () => {
      this.log('Connection closed');
      if (this.socket === socket) {
        this.socket = null;
        this.connectedPort = null;
        this.emit('close');
      }
    });

    socket.on('error', (err) => {
      this.log('Socket error:', err.message);
      this.emit('error', err);
    });
  }

  /**
   * Send data to Godot LSP server
   */
  write(data: Buffer | string): boolean {
    if (!this.socket) {
      this.log('Cannot write - no connection');
      return false;
    }

    this.log('Sending', typeof data === 'string' ? data.length : data.length, 'bytes to Godot');
    return this.socket.write(data);
  }

  /**
   * Check if connected
   */
  isConnected(): boolean {
    return this.socket !== null && !this.socket.destroyed;
  }

  /**
   * Get the port we're connected to
   */
  getConnectedPort(): number | null {
    return this.connectedPort;
  }

  /**
   * Disconnect from LSP server
   */
  disconnect(): void {
    this.isShuttingDown = true;
    if (this.socket) {
      this.socket.destroy();
      this.socket = null;
      this.connectedPort = null;
    }
  }

  /**
   * Check if reconnection is allowed (not during shutdown)
   */
  shouldReconnect(): boolean {
    return !this.isShuttingDown;
  }
}
