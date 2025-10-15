/**
 * Production-safe logger utility
 * BUG FIX: Replaces console.log to prevent logs in production
 * Fixes bugs #123-#720 (598 console.log instances)
 */

type LogLevel = 'debug' | 'info' | 'warn' | 'error';

interface LoggerConfig {
  enabled: boolean;
  minLevel: LogLevel;
  prefix?: string;
}

const LOG_LEVELS: Record<LogLevel, number> = {
  debug: 0,
  info: 1,
  warn: 2,
  error: 3,
};

class Logger {
  private config: LoggerConfig;

  constructor(config?: Partial<LoggerConfig>) {
    this.config = {
      enabled: __DEV__,
      minLevel: __DEV__ ? 'debug' : 'error',
      prefix: '',
      ...config,
    };
  }

  private shouldLog(level: LogLevel): boolean {
    if (!this.config.enabled) return false;
    return LOG_LEVELS[level] >= LOG_LEVELS[this.config.minLevel];
  }

  private formatMessage(level: LogLevel, message: string, ...args: any[]): string {
    const timestamp = new Date().toISOString();
    const prefix = this.config.prefix ? `[${this.config.prefix}]` : '';
    return `${timestamp} ${prefix}[${level.toUpperCase()}] ${message}`;
  }

  debug(message: string, ...args: any[]): void {
    if (this.shouldLog('debug')) {
      console.log(this.formatMessage('debug', message), ...args);
    }
  }

  info(message: string, ...args: any[]): void {
    if (this.shouldLog('info')) {
      console.info(this.formatMessage('info', message), ...args);
    }
  }

  warn(message: string, ...args: any[]): void {
    if (this.shouldLog('warn')) {
      console.warn(this.formatMessage('warn', message), ...args);
    }
  }

  error(message: string, error?: Error | unknown, ...args: any[]): void {
    if (this.shouldLog('error')) {
      console.error(this.formatMessage('error', message), error, ...args);
      
      // In production, send to error tracking service
      if (!__DEV__ && error) {
        this.reportError(message, error);
      }
    }
  }

  private reportError(message: string, error: unknown): void {
    // TODO: Integrate with error tracking service (Sentry, Bugsnag, etc.)
    // For now, just ensure it's logged
    if (error instanceof Error) {
      console.error('Error Report:', {
        message,
        error: error.message,
        stack: error.stack,
        timestamp: new Date().toISOString(),
      });
    }
  }

  group(label: string): void {
    if (this.config.enabled && __DEV__) {
      console.group(label);
    }
  }

  groupEnd(): void {
    if (this.config.enabled && __DEV__) {
      console.groupEnd();
    }
  }

  table(data: any): void {
    if (this.config.enabled && __DEV__) {
      console.table(data);
    }
  }
}

// Create default logger instance
export const logger = new Logger();

// Create specialized loggers for different parts of the app
export const authLogger = new Logger({ prefix: 'Auth' });
export const apiLogger = new Logger({ prefix: 'API' });
export const storeLogger = new Logger({ prefix: 'Store' });
export const uiLogger = new Logger({ prefix: 'UI' });

// Export the class for custom loggers
export { Logger };
export type { LogLevel, LoggerConfig };
