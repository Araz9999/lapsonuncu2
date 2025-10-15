/**
 * Centralized error handling utility
 * BUG FIX: Provides consistent error handling across the app
 * Fixes bugs #776-#1159 (missing error handling)
 */

import { logger } from './logger';

export class AppError extends Error {
  constructor(
    message: string,
    public code?: string,
    public statusCode?: number,
    public details?: Record<string, any>
  ) {
    super(message);
    this.name = 'AppError';
    
    // Maintains proper stack trace for where our error was thrown (only available on V8)
    if (Error.captureStackTrace) {
      Error.captureStackTrace(this, AppError);
    }
  }

  toJSON() {
    return {
      name: this.name,
      message: this.message,
      code: this.code,
      statusCode: this.statusCode,
      details: this.details,
    };
  }
}

export class NetworkError extends AppError {
  constructor(message: string, details?: Record<string, any>) {
    super(message, 'NETWORK_ERROR', 0, details);
    this.name = 'NetworkError';
  }
}

export class ValidationError extends AppError {
  constructor(message: string, details?: Record<string, any>) {
    super(message, 'VALIDATION_ERROR', 400, details);
    this.name = 'ValidationError';
  }
}

export class AuthenticationError extends AppError {
  constructor(message: string = 'Authentication required') {
    super(message, 'AUTH_ERROR', 401);
    this.name = 'AuthenticationError';
  }
}

export class AuthorizationError extends AppError {
  constructor(message: string = 'Permission denied') {
    super(message, 'AUTHORIZATION_ERROR', 403);
    this.name = 'AuthorizationError';
  }
}

export class NotFoundError extends AppError {
  constructor(resource: string) {
    super(`${resource} not found`, 'NOT_FOUND', 404);
    this.name = 'NotFoundError';
  }
}

/**
 * Global error handler for async functions
 */
export async function handleAsync<T>(
  promise: Promise<T>,
  errorMessage?: string
): Promise<[T | null, Error | null]> {
  try {
    const data = await promise;
    return [data, null];
  } catch (error) {
    const err = error instanceof Error ? error : new Error(String(error));
    if (errorMessage) {
      logger.error(errorMessage, err);
    }
    return [null, err];
  }
}

/**
 * Wraps a function to catch and handle errors
 */
export function withErrorHandler<T extends (...args: any[]) => any>(
  fn: T,
  errorHandler?: (error: Error) => void
): T {
  return ((...args: Parameters<T>) => {
    try {
      const result = fn(...args);
      
      // If result is a promise, handle async errors
      if (result instanceof Promise) {
        return result.catch((error) => {
          const err = error instanceof Error ? error : new Error(String(error));
          logger.error(`Error in ${fn.name || 'anonymous function'}`, err);
          errorHandler?.(err);
          throw err;
        });
      }
      
      return result;
    } catch (error) {
      const err = error instanceof Error ? error : new Error(String(error));
      logger.error(`Error in ${fn.name || 'anonymous function'}`, err);
      errorHandler?.(err);
      throw err;
    }
  }) as T;
}

/**
 * Retry logic with exponential backoff
 */
export async function retryWithBackoff<T>(
  fn: () => Promise<T>,
  options: {
    maxRetries?: number;
    initialDelay?: number;
    maxDelay?: number;
    backoffFactor?: number;
  } = {}
): Promise<T> {
  const {
    maxRetries = 3,
    initialDelay = 1000,
    maxDelay = 10000,
    backoffFactor = 2,
  } = options;

  let lastError: Error;
  
  for (let attempt = 0; attempt < maxRetries; attempt++) {
    try {
      return await fn();
    } catch (error) {
      lastError = error instanceof Error ? error : new Error(String(error));
      
      if (attempt < maxRetries - 1) {
        const delay = Math.min(
          initialDelay * Math.pow(backoffFactor, attempt),
          maxDelay
        );
        
        logger.warn(
          `Attempt ${attempt + 1}/${maxRetries} failed, retrying in ${delay}ms`,
          lastError
        );
        
        await new Promise(resolve => setTimeout(resolve, delay));
      }
    }
  }

  logger.error(`All ${maxRetries} attempts failed`, lastError!);
  throw lastError!;
}

/**
 * Safe JSON parse with error handling
 */
export function safeJSONParse<T = any>(
  json: string,
  fallback?: T
): T | null {
  try {
    return JSON.parse(json) as T;
  } catch (error) {
    logger.warn('JSON parse failed', error);
    return fallback ?? null;
  }
}

/**
 * Safe JSON stringify with error handling
 */
export function safeJSONStringify(
  data: any,
  fallback: string = '{}'
): string {
  try {
    return JSON.stringify(data);
  } catch (error) {
    logger.warn('JSON stringify failed', error);
    return fallback;
  }
}

/**
 * Get user-friendly error message
 */
export function getUserFriendlyError(error: unknown): string {
  if (error instanceof AppError) {
    return error.message;
  }
  
  if (error instanceof Error) {
    // Map common error patterns to user-friendly messages
    if (error.message.includes('network') || error.message.includes('fetch')) {
      return 'Şəbəkə xətası. Zəhmət olmasa internet bağlantınızı yoxlayın.';
    }
    
    if (error.message.includes('timeout')) {
      return 'Əməliyyat çox uzun çəkdi. Zəhmət olmasa yenidən cəhd edin.';
    }
    
    return error.message;
  }
  
  return 'Naməlum xəta baş verdi. Zəhmət olmasa yenidən cəhd edin.';
}
