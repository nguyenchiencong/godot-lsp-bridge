/**
 * Configuration for the LSP bridge
 */
export interface BridgeConfig {
  /** Godot LSP host (default: 127.0.0.1) */
  host: string;
  /** Godot LSP port (default: 6005) */
  port: number;
  /** Fallback ports to try if main port fails */
  fallbackPorts: number[];
  /** Enable debug logging */
  debug: boolean;
}

/**
 * Get configuration from environment variables
 */
export function getConfig(): BridgeConfig {
  const envPort = process.env.GODOT_LSP_PORT;
  // Godot 4.x uses port 6005 for LSP by default
  // Port 6007 is the debugger port, NOT LSP - do not use as fallback!
  let port = 6005;
  let fallbackPorts: number[] = []; // No fallbacks - 6005 is the only LSP port

  if (envPort) {
    const parsed = parseInt(envPort, 10);
    if (isNaN(parsed) || parsed < 1 || parsed > 65535) {
      throw new Error(`Invalid GODOT_LSP_PORT: ${envPort} (must be 1-65535)`);
    }
    port = parsed;
    fallbackPorts = []; // Don't use fallbacks if port is explicitly set
  }

  return {
    host: process.env.GODOT_LSP_HOST || '127.0.0.1',
    port,
    fallbackPorts,
    debug: process.env.GODOT_LSP_DEBUG === '1' || process.env.GODOT_LSP_DEBUG === 'true',
  };
}
