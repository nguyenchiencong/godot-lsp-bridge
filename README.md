# godot-lsp-bridge

A TCP-to-stdio bridge that connects AI coding assistants to Godot's LSP server for GDScript diagnostics.

## Purpose

This bridge is designed for **AI coding tools** like [OpenCode](https://opencode.ai) that need GDScript error feedback. It forwards diagnostics (errors and warnings) from Godot's LSP server to the AI, enabling it to detect and fix issues in your GDScript code.

**Note:** This bridge focuses on diagnostics for AI workflows. Features like code completion, go-to-definition, and hover documentation are passed through but are not the primary use case.

## Installation

```bash
npm install -g godot-lsp-bridge
```

## Usage with OpenCode

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

## Requirements

- **Node.js 18+**
- **Godot Editor must be running** with your project open
- Godot's LSP server runs on port 6005 by default (configurable in Editor Settings)

## Environment Variables

| Variable | Description | Default |
|----------|-------------|---------|
| `GODOT_LSP_HOST` | Godot LSP host | `127.0.0.1` |
| `GODOT_LSP_PORT` | Godot LSP port | `6005` |
| `GODOT_LSP_DEBUG` | Enable debug logging | `false` |

## Features

- **Zero runtime dependencies** - Uses only Node.js built-ins
- **Auto-reconnection** - Automatically reconnects if Godot restarts
- **Connection retry** - Retries connection 3 times with 1-second delays before entering reconnect loop
- **Graceful degradation** - Waits for Godot if not running at startup
- **Windows URI normalization** - Fixes file path compatibility issues

## How It Works

```
┌─────────────────┐         ┌─────────────────────┐         ┌────────────────┐
│    OpenCode     │         │  godot-lsp-bridge   │         │     Godot      │
│   (AI Agent)    │◄─stdio─►│                     │◄──TCP──►│     Editor     │
│                 │         │                     │         │   (Port 6005)  │
└─────────────────┘         └─────────────────────┘         └────────────────┘
```

The bridge:
1. Accepts LSP messages via stdin from the AI tool
2. Forwards them to Godot's TCP LSP server
3. Returns diagnostics (errors/warnings) back via stdout

## Troubleshooting

### LSP not connecting

1. Make sure Godot Editor is running with your project open
2. Check that the LSP server is enabled in Godot (Editor Settings > Network > Language Server)
3. Try setting `GODOT_LSP_DEBUG=true` to see detailed logs

### Windows: Command not found

Use `godot-lsp-bridge.cmd` instead of `godot-lsp-bridge` in your configuration.

## License

MIT
