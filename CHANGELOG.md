# Changelog

All notable changes to this project will be documented in this file.

## [0.2.4] - 2025-11-30

### Fixed

- Fixed Godot debugger errors (`remote_debugger_peer.cpp:138`) caused by fallback port misconfiguration
  - Removed port 6007 from fallback ports - this is Godot's debugger port, not LSP
  - The bridge was accidentally connecting to the debugger port and sending LSP messages, causing protocol mismatch errors
  - Now only connects to port 6005 (the correct LSP port)

### Changed

- Added 1-second warmup delay after reconnection before forwarding messages to Godot
  - Gives Godot time to fully initialize its LSP server
  - Prevents message flooding that could cause instability

## [0.2.3] - 2025-11-29

### Fixed

- Fixed thousands of Godot debugger errors on reconnect
  - When Godot was closed while OpenCode was active, the bridge would buffer all client messages
  - On reconnect, these stale messages would flood Godot, causing thousands of debugger errors
  - Now clears buffered client messages on disconnect since they're outdated and irrelevant after Godot restarts

## [0.2.2] - 2025-11-28

### Fixed

- Fixed Godot restart causing errors and hangs
  - When Godot restarts, the bridge now properly resets its initialization state
  - Previously, the bridge would forward requests to a freshly-restarted Godot before it received an `initialize` request, causing Godot to error and hang
  - The bridge now buffers client messages until a new `initialize` request is received after reconnection

### Added

- Warning notification sent to LSP client when Godot restarts, informing user they may need to reopen files for diagnostics

## [0.2.1] - 2025-11-27

### Fixed

- Fixed Windows file URI compatibility with Godot's LSP server
  - Godot expects `file:///C:/path` format but some clients send `file://C:\path` or `file://C:/path`
  - The bridge now automatically normalizes all file URIs to the correct format
  - Converts backslashes to forward slashes
  - Ensures three slashes after `file:` prefix

## [0.2.0] - 2025-11-27

### Fixed

- Fixed default LSP port from 6007 to 6005 (6007 is the debugger port, not LSP)
- Fixed race condition where messages from the LSP client could be lost if they arrived before the TCP connection to Godot was established
- Fixed race condition where Godot's initial messages could confuse the LSP client by buffering them until the initialize request is received

### Changed

- Messages from the LSP client are now buffered until the Godot connection is established, then flushed in order
- Messages from Godot are now buffered until the client sends an initialize request, preventing unsolicited notifications from confusing the client

### Documentation

- Added Windows-specific instructions (use `godot-lsp-bridge.cmd` instead of `godot-lsp-bridge`)
- Added Neovim configuration example
- Added troubleshooting section
- Updated diagram to show correct default port (6005)

## [0.1.0] - 2025-11-27

### Added

- Initial release
- TCP-to-stdio bridge for Godot's LSP server
- Auto-reconnection when Godot restarts
- Graceful degradation when Godot is not running
- Zero runtime dependencies
