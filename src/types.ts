/**
 * Configuration for the LSP bridge
 */
export interface BridgeConfig {
  /** Godot LSP host (default: 127.0.0.1) */
  host: string;
  /** Godot LSP port (default: 6005) */
  port: number;
  /** Number of connection retry attempts before giving up (default: 3) */
  connectRetries: number;
  /** Delay between retry attempts in ms (default: 1000) */
  retryDelay: number;
  /** Enable debug logging */
  debug: boolean;
}

/**
 * Get configuration from environment variables
 */
export function getConfig(): BridgeConfig {
  const envPort = process.env.GODOT_LSP_PORT;
  // Godot 4.x uses port 6005 for LSP by default
  // Port 6007 is the debugger port, NOT LSP - never connect to it!
  let port = 6005;

  if (envPort) {
    const parsed = parseInt(envPort, 10);
    if (isNaN(parsed) || parsed < 1 || parsed > 65535) {
      throw new Error(`Invalid GODOT_LSP_PORT: ${envPort} (must be 1-65535)`);
    }
    port = parsed;
  }

  return {
    host: process.env.GODOT_LSP_HOST || '127.0.0.1',
    port,
    connectRetries: 3,
    retryDelay: 1000,
    debug: process.env.GODOT_LSP_DEBUG === '1' || process.env.GODOT_LSP_DEBUG === 'true',
  };
}
