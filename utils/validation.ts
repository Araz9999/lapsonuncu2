/**
 * Input validation utilities
 * BUG FIX: Provides validation for user inputs
 * Fixes bugs #1160-#1309 (missing input validation)
 */

import { ValidationError } from './errorHandler';

/**
 * Email validation
 */
export function validateEmail(email: string): boolean {
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  return emailRegex.test(email);
}

/**
 * Phone number validation (Azerbaijan format)
 */
export function validatePhone(phone: string): boolean {
  // Accepts: +994XXXXXXXXX, 994XXXXXXXXX, or 0XXXXXXXXX
  const phoneRegex = /^(\+?994|0)?[0-9]{9}$/;
  return phoneRegex.test(phone.replace(/[\s-]/g, ''));
}

/**
 * Password strength validation
 */
export function validatePassword(
  password: string
): { valid: boolean; errors: string[] } {
  const errors: string[] = [];
  
  if (password.length < 8) {
    errors.push('Şifrə ən azı 8 simvol olmalıdır');
  }
  
  if (!/[A-Z]/.test(password)) {
    errors.push('Şifrə ən azı 1 böyük hərf olmalıdır');
  }
  
  if (!/[a-z]/.test(password)) {
    errors.push('Şifrə ən azı 1 kiçik hərf olmalıdır');
  }
  
  if (!/[0-9]/.test(password)) {
    errors.push('Şifrə ən azı 1 rəqəm olmalıdır');
  }
  
  return {
    valid: errors.length === 0,
    errors,
  };
}

/**
 * Amount validation
 */
export function validateAmount(
  amount: number | string,
  options: {
    min?: number;
    max?: number;
    required?: boolean;
  } = {}
): { valid: boolean; error?: string } {
  const { min = 0, max = Number.MAX_SAFE_INTEGER, required = true } = options;
  
  const numAmount = typeof amount === 'string' ? parseFloat(amount) : amount;
  
  if (required && (amount === '' || amount === null || amount === undefined)) {
    return { valid: false, error: 'Məbləğ daxil edilməlidir' };
  }
  
  if (isNaN(numAmount)) {
    return { valid: false, error: 'Etibarlı məbləğ daxil edin' };
  }
  
  if (numAmount < min) {
    return { valid: false, error: `Minimum məbləğ ${min} olmalıdır` };
  }
  
  if (numAmount > max) {
    return { valid: false, error: `Maksimum məbləğ ${max} olmalıdır` };
  }
  
  return { valid: true };
}

/**
 * Date validation
 */
export function validateDate(date: Date | string): {
  valid: boolean;
  error?: string;
} {
  const dateObj = typeof date === 'string' ? new Date(date) : date;
  
  if (!(dateObj instanceof Date) || isNaN(dateObj.getTime())) {
    return { valid: false, error: 'Etibarlı tarix daxil edin' };
  }
  
  return { valid: true };
}

/**
 * Future date validation
 */
export function validateFutureDate(date: Date | string): {
  valid: boolean;
  error?: string;
} {
  const dateValidation = validateDate(date);
  if (!dateValidation.valid) {
    return dateValidation;
  }
  
  const dateObj = typeof date === 'string' ? new Date(date) : date;
  const now = new Date();
  
  if (dateObj <= now) {
    return { valid: false, error: 'Tarix gələcəkdə olmalıdır' };
  }
  
  return { valid: true };
}

/**
 * URL validation
 */
export function validateURL(url: string): boolean {
  try {
    new URL(url);
    return true;
  } catch {
    return false;
  }
}

/**
 * Safe parseInt with validation
 */
export function safeParseInt(
  value: string | number,
  fallback: number = 0
): number {
  const parsed = typeof value === 'string' ? parseInt(value, 10) : value;
  return isNaN(parsed) ? fallback : parsed;
}

/**
 * Safe parseFloat with validation
 */
export function safeParseFloat(
  value: string | number,
  fallback: number = 0
): number {
  const parsed = typeof value === 'string' ? parseFloat(value) : value;
  return isNaN(parsed) ? fallback : parsed;
}

/**
 * Sanitize string input
 */
export function sanitizeString(input: string): string {
  return input
    .trim()
    .replace(/[<>]/g, '') // Remove potential HTML tags
    .substring(0, 1000); // Limit length
}

/**
 * Validate file upload
 */
export function validateFile(
  file: { size: number; type: string; name: string },
  options: {
    maxSize?: number; // in bytes
    allowedTypes?: string[];
  } = {}
): { valid: boolean; error?: string } {
  const { maxSize = 10 * 1024 * 1024, allowedTypes = [] } = options;
  
  if (file.size > maxSize) {
    return {
      valid: false,
      error: `Fayl ölçüsü maksimum ${Math.round(maxSize / 1024 / 1024)}MB olmalıdır`,
    };
  }
  
  if (allowedTypes.length > 0 && !allowedTypes.includes(file.type)) {
    return {
      valid: false,
      error: `Yalnız ${allowedTypes.join(', ')} formatları qəbul edilir`,
    };
  }
  
  return { valid: true };
}

/**
 * Validate array bounds
 */
export function validateArrayIndex(
  array: any[],
  index: number
): { valid: boolean; error?: string } {
  if (!Array.isArray(array)) {
    return { valid: false, error: 'Array deyil' };
  }
  
  if (index < 0 || index >= array.length) {
    return { valid: false, error: 'İndeks sərhədlərdən kənardır' };
  }
  
  return { valid: true };
}

/**
 * Generic required field validation
 */
export function validateRequired<T>(
  value: T,
  fieldName: string
): asserts value is NonNullable<T> {
  if (value === null || value === undefined || value === '') {
    throw new ValidationError(`${fieldName} tələb olunur`);
  }
}
