# godot-lsp-bridge

A TCP-to-stdio bridge that allows standard LSP clients to communicate with Godot's embedded LSP server.

## Why?

Godot's LSP server only accepts TCP connections, but many LSP clients (like OpenCode, Neovim's built-in LSP, etc.) expect to communicate with language servers via stdio. This bridge translates between the two.

## Installation

```bash
npm install -g godot-lsp-bridge
```

## Usage

### With OpenCode

Add to your project's `opencode.json`:

**macOS / Linux:**

```json
{
  "$schema": "https://opencode.ai/config.json",
  "lsp": {
    "godot": {
      "command": ["godot-lsp-bridge"],
      "extensions": [".gd"]
    }
  }
}
```

**Windows:**

```json
{
  "$schema": "https://opencode.ai/config.json",
  "lsp": {
    "godot": {
      "command": ["godot-lsp-bridge.cmd"],
      "extensions": [".gd"]
    }
  }
}
```

> **Note:** On Windows, npm creates `.cmd` wrapper scripts for global packages, so you must use `godot-lsp-bridge.cmd` instead of `godot-lsp-bridge`.

### With Neovim

```lua
vim.lsp.start({
  name = 'godot',
  cmd = { 'godot-lsp-bridge' },  -- or 'godot-lsp-bridge.cmd' on Windows
  root_dir = vim.fn.getcwd(),
})
```

### With Local Build

```json
{
  "lsp": {
    "godot": {
      "command": ["node", "/path/to/godot-lsp-bridge/dist/index.js"],
      "extensions": [".gd"]
    }
  }
}
```

## Requirements

- **Node.js 18+**
- **Godot Editor must be running** with your project open
- Godot's LSP server runs on port 6005 by default (configurable in Editor Settings)

## Environment Variables

| Variable | Description | Default |
|----------|-------------|---------|
| `GODOT_LSP_HOST` | Godot LSP host | `127.0.0.1` |
| `GODOT_LSP_PORT` | Godot LSP port | `6005` (tries 6007, 6008 as fallback) |
| `GODOT_LSP_DEBUG` | Enable debug logging | `false` |

## Features

- **Zero runtime dependencies** - Uses only Node.js built-ins
- **Auto-reconnection** - Automatically reconnects if Godot restarts
- **Port discovery** - Tries common Godot LSP ports if default fails
- **Graceful degradation** - Waits for Godot if not running at startup
- **Message buffering** - Handles race conditions between client and server

## How It Works

```
┌─────────────────┐         ┌─────────────────────┐         ┌────────────────┐
│   OpenCode /    │         │  godot-lsp-bridge   │         │     Godot      │
│   Any LSP       │◄─stdio─►│                     │◄──TCP──►│     Editor     │
│   Client        │         │                     │         │   (Port 6005)  │
└─────────────────┘         └─────────────────────┘         └────────────────┘
```

The bridge:
1. Accepts LSP messages via stdin
2. Forwards them to Godot's TCP LSP server
3. Returns responses back via stdout

## Troubleshooting

### LSP not connecting

1. Make sure Godot Editor is running with your project open
2. Check that the LSP server is enabled in Godot (Editor Settings > Network > Language Server)
3. Try setting `GODOT_LSP_DEBUG=true` to see detailed logs

### Windows: Command not found

Use `godot-lsp-bridge.cmd` instead of `godot-lsp-bridge` in your configuration.

## Development

```bash
# Install dependencies
npm install

# Build
npm run build

# Run in development mode
npm run dev
```

## License

MIT
