#!/usr/bin/env node

import { getConfig } from './types.js';
import { LSPConnection } from './lsp-connection.js';
import { MessageParser, encodeMessage } from './message-parser.js';

const RECONNECT_DELAY = 5000; // 5 seconds

/**
 * Main entry point for the Godot LSP Bridge.
 * 
 * This bridge connects LSP clients (via stdio) to Godot's LSP server (via TCP).
 * 
 * Data flow:
 *   LSP Client (stdin) -> Bridge -> Godot LSP (TCP port 6007)
 *   Godot LSP (TCP) -> Bridge -> LSP Client (stdout)
 */
async function main(): Promise<void> {
  const config = getConfig();
  const connection = new LSPConnection(config);
  const stdinParser = new MessageParser();
  
  let isConnected = false;
  let reconnectTimer: NodeJS.Timeout | null = null;

  const log = (...args: unknown[]): void => {
    if (config.debug) {
      console.error('[Bridge]', ...args);
    }
  };

  // Connect stdin parser to TCP connection
  stdinParser.on('message', (content: string) => {
    log('stdin -> Godot:', content.slice(0, 100) + (content.length > 100 ? '...' : ''));
    
    if (!isConnected) {
      log('Dropping message - not connected');
      return;
    }

    // Re-encode with Content-Length header and send to Godot
    const encoded = encodeMessage(content);
    connection.write(encoded);
  });

  stdinParser.on('error', (err: Error) => {
    console.error('Parser error:', err.message);
  });

  // Forward TCP data directly to stdout (already has Content-Length headers)
  connection.on('data', (data: Buffer) => {
    log('Godot -> stdout:', data.length, 'bytes');
    process.stdout.write(data);
  });

  // Handle connection close with auto-reconnect
  connection.on('close', () => {
    isConnected = false;
    console.error('Connection to Godot LSP closed');

    if (!connection.shouldReconnect()) {
      return;
    }

    console.error(`Attempting to reconnect in ${RECONNECT_DELAY / 1000}s...`);
    
    const reconnect = async (): Promise<void> => {
      if (!connection.shouldReconnect()) return;

      try {
        const port = await connection.connect();
        console.error(`Reconnected to Godot LSP on port ${port}`);
        isConnected = true;
      } catch (err) {
        const error = err as Error;
        log('Reconnect failed:', error.message);
        reconnectTimer = setTimeout(reconnect, RECONNECT_DELAY);
      }
    };

    reconnectTimer = setTimeout(reconnect, RECONNECT_DELAY);
  });

  connection.on('error', (err: Error) => {
    log('Connection error:', err.message);
  });

  // Initial connection
  try {
    const port = await connection.connect();
    console.error(`Godot LSP Bridge started (connected to port ${port})`);
    isConnected = true;
  } catch (err) {
    const error = err as Error;
    console.error(`Error: ${error.message}`);
    console.error('Bridge will wait for Godot to become available...');
    
    // Start reconnection loop
    const reconnect = async (): Promise<void> => {
      if (!connection.shouldReconnect()) return;

      try {
        const port = await connection.connect();
        console.error(`Connected to Godot LSP on port ${port}`);
        isConnected = true;
      } catch {
        reconnectTimer = setTimeout(reconnect, RECONNECT_DELAY);
      }
    };

    reconnectTimer = setTimeout(reconnect, RECONNECT_DELAY);
  }

  // Read from stdin and feed to parser
  process.stdin.setEncoding('utf8');
  process.stdin.on('data', (chunk: string) => {
    log('Received from stdin:', chunk.length, 'bytes');
    stdinParser.feed(chunk);
  });

  // Cleanup on exit
  let cleanupCalled = false;
  const cleanup = (signal: string): void => {
    if (cleanupCalled) return;
    cleanupCalled = true;

    console.error(`Shutting down (${signal})...`);

    if (reconnectTimer) {
      clearTimeout(reconnectTimer);
      reconnectTimer = null;
    }

    connection.disconnect();
    process.exit(0);
  };

  // Register cleanup handlers
  process.on('SIGINT', () => cleanup('SIGINT'));
  process.on('SIGTERM', () => cleanup('SIGTERM'));
  process.on('SIGHUP', () => cleanup('SIGHUP'));
  
  // Detect stdio close (LSP client disconnect)
  process.stdin.on('close', () => cleanup('stdin-close'));
  process.stdin.on('end', () => cleanup('stdin-end'));
}

main().catch((err) => {
  console.error('Fatal error:', err);
  process.exit(1);
});
