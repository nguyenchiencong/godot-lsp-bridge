import { EventEmitter } from 'events';

const HEADER_DELIMITER = '\r\n\r\n';
const CONTENT_LENGTH_REGEX = /Content-Length:\s*(\d+)/i;
const MAX_BUFFER_SIZE = 10 * 1024 * 1024; // 10MB

/**
 * Parser for LSP messages with Content-Length framing.
 * 
 * LSP message format:
 * ```
 * Content-Length: 123\r\n
 * \r\n
 * {"jsonrpc":"2.0",...}
 * ```
 */
export class MessageParser extends EventEmitter {
  private buffer = '';

  /**
   * Feed data into the parser. Complete messages will be emitted as 'message' events.
   */
  feed(data: Buffer | string): void {
    const chunk = typeof data === 'string' ? data : data.toString('utf8');
    
    // Prevent unbounded buffer growth
    if (this.buffer.length + chunk.length > MAX_BUFFER_SIZE) {
      this.emit('error', new Error('Buffer size exceeded maximum limit'));
      this.buffer = '';
      return;
    }

    this.buffer += chunk;
    this.parseMessages();
  }

  /**
   * Parse complete messages from the buffer
   */
  private parseMessages(): void {
    while (true) {
      const headerEnd = this.buffer.indexOf(HEADER_DELIMITER);
      if (headerEnd === -1) break;

      const header = this.buffer.slice(0, headerEnd);
      const contentLengthMatch = header.match(CONTENT_LENGTH_REGEX);

      if (!contentLengthMatch) {
        // Invalid header, skip to next potential message
        this.buffer = this.buffer.slice(headerEnd + HEADER_DELIMITER.length);
        continue;
      }

      const contentLength = parseInt(contentLengthMatch[1], 10);
      const messageStart = headerEnd + HEADER_DELIMITER.length;
      const messageEnd = messageStart + contentLength;

      // Wait for complete message
      if (this.buffer.length < messageEnd) break;

      const content = this.buffer.slice(messageStart, messageEnd);
      this.buffer = this.buffer.slice(messageEnd);

      // Emit raw content (we're a passthrough bridge, no parsing needed)
      this.emit('message', content);
    }
  }

  /**
   * Reset the parser state
   */
  reset(): void {
    this.buffer = '';
  }

  /**
   * Get current buffer size (for debugging)
   */
  getBufferSize(): number {
    return this.buffer.length;
  }
}

/**
 * Encode a message with LSP Content-Length header
 */
export function encodeMessage(content: string): string {
  return `Content-Length: ${Buffer.byteLength(content, 'utf8')}${HEADER_DELIMITER}${content}`;
}

/**
 * Encode raw bytes with LSP Content-Length header
 */
export function encodeMessageBuffer(content: Buffer): Buffer {
  const header = Buffer.from(`Content-Length: ${content.length}${HEADER_DELIMITER}`, 'utf8');
  return Buffer.concat([header, content]);
}
