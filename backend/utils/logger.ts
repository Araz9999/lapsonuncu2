/**
 * Structured Logging Utility
 * Provides consistent logging across the backend
 */

type LogLevel = 'info' | 'warn' | 'error' | 'debug';

interface LogMetadata {
  [key: string]: unknown;
}

interface LogEntry {
  level: LogLevel;
  message: string;
  timestamp: string;
  metadata?: LogMetadata;
}

class Logger {
  private isDevelopment = process.env.NODE_ENV !== 'production';

  /**
   * Format log entry
   */
  private formatEntry(level: LogLevel, message: string, metadata?: LogMetadata): LogEntry {
    return {
      level,
      message,
      timestamp: new Date().toISOString(),
      metadata: this.sanitizeMetadata(metadata),
    };
  }

  /**
   * Sanitize metadata to remove sensitive information
   */
  private sanitizeMetadata(metadata?: LogMetadata): LogMetadata | undefined {
    if (!metadata) return undefined;

    const sanitized: LogMetadata = {};
    const sensitiveKeys = ['password', 'token', 'secret', 'apiKey', 'apikey', 'authorization'];

    for (const [key, value] of Object.entries(metadata)) {
      // Check if key contains sensitive information
      const isSensitive = sensitiveKeys.some(sensitiveKey =>
        key.toLowerCase().includes(sensitiveKey)
      );

      if (isSensitive) {
        sanitized[key] = '[REDACTED]';
      } else if (value instanceof Error) {
        sanitized[key] = {
          name: value.name,
          message: value.message,
          stack: this.isDevelopment ? value.stack : undefined,
        };
      } else {
        sanitized[key] = value;
      }
    }

    return sanitized;
  }

  /**
   * Output log entry
   */
  private output(entry: LogEntry): void {
    const prefix = `[${entry.level.toUpperCase()}] ${entry.timestamp}`;
    const message = entry.metadata
      ? `${prefix} ${entry.message} ${JSON.stringify(entry.metadata, null, 2)}`
      : `${prefix} ${entry.message}`;

    switch (entry.level) {
      case 'error':
        console.error(message);
        break;
      case 'warn':
        console.warn(message);
        break;
      case 'debug':
        if (this.isDevelopment) {
          console.debug(message);
        }
        break;
      default:
        console.log(message);
    }
  }

  /**
   * Log info message
   */
  info(message: string, metadata?: LogMetadata): void {
    const entry = this.formatEntry('info', message, metadata);
    this.output(entry);
  }

  /**
   * Log warning message
   */
  warn(message: string, metadata?: LogMetadata): void {
    const entry = this.formatEntry('warn', message, metadata);
    this.output(entry);
  }

  /**
   * Log error message
   */
  error(message: string, metadata?: LogMetadata): void {
    const entry = this.formatEntry('error', message, metadata);
    this.output(entry);
  }

  /**
   * Log debug message (only in development)
   */
  debug(message: string, metadata?: LogMetadata): void {
    const entry = this.formatEntry('debug', message, metadata);
    this.output(entry);
  }

  /**
   * Log authentication event
   */
  auth(action: string, metadata?: LogMetadata): void {
    this.info(`[AUTH] ${action}`, metadata);
  }

  /**
   * Log database operation
   */
  db(operation: string, metadata?: LogMetadata): void {
    this.info(`[DB] ${operation}`, metadata);
  }

  /**
   * Log API request
   */
  api(method: string, path: string, metadata?: LogMetadata): void {
    this.info(`[API] ${method} ${path}`, metadata);
  }

  /**
   * Log payment transaction
   */
  payment(action: string, metadata?: LogMetadata): void {
    this.info(`[PAYMENT] ${action}`, metadata);
  }

  /**
   * Log security event
   */
  security(event: string, metadata?: LogMetadata): void {
    this.warn(`[SECURITY] ${event}`, metadata);
  }
}

export const logger = new Logger();

/**
 * Create a logger instance with a specific context
 */
export function createContextLogger(context: string) {
  return {
    info: (message: string, metadata?: LogMetadata) =>
      logger.info(`[${context}] ${message}`, metadata),
    warn: (message: string, metadata?: LogMetadata) =>
      logger.warn(`[${context}] ${message}`, metadata),
    error: (message: string, metadata?: LogMetadata) =>
      logger.error(`[${context}] ${message}`, metadata),
    debug: (message: string, metadata?: LogMetadata) =>
      logger.debug(`[${context}] ${message}`, metadata),
  };
}
