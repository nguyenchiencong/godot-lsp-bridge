# Changelog

All notable changes to this project will be documented in this file.

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
- Port discovery (tries 6005, 6007, 6008)
- Graceful degradation when Godot is not running
- Zero runtime dependencies
