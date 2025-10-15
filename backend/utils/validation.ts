/**
 * Validation Schemas for Backend
 * Comprehensive Zod schemas for all input validation
 */

import { z } from 'zod';

/**
 * Email validation schema with sanitization
 */
export const emailSchema = z
  .string({ required_error: 'Email tələb olunur' })
  .email('Etibarlı email daxil edin')
  .max(254, 'Email maksimum 254 simvol ola bilər')
  .transform(email => email.toLowerCase().trim());

/**
 * Strong password validation schema
 */
export const passwordSchema = z
  .string({ required_error: 'Şifrə tələb olunur' })
  .min(8, 'Şifrə ən azı 8 simvol olmalıdır')
  .max(128, 'Şifrə maksimum 128 simvol ola bilər')
  .regex(/[A-Z]/, 'Şifrə ən azı 1 böyük hərf olmalıdır')
  .regex(/[a-z]/, 'Şifrə ən azı 1 kiçik hərf olmalıdır')
  .regex(/[0-9]/, 'Şifrə ən azı 1 rəqəm olmalıdır');

/**
 * Phone number validation (Azerbaijan format)
 */
export const phoneSchema = z
  .string()
  .regex(
    /^(\+?994|0)?[0-9]{9}$/,
    'Etibarlı telefon nömrəsi daxil edin (+994XXXXXXXXX)'
  )
  .transform(phone => {
    // Normalize phone number
    const cleaned = phone.replace(/[\s-]/g, '');
    if (cleaned.startsWith('0')) {
      return '+994' + cleaned.substring(1);
    }
    if (cleaned.startsWith('994')) {
      return '+' + cleaned;
    }
    if (cleaned.startsWith('+994')) {
      return cleaned;
    }
    return '+994' + cleaned;
  });

/**
 * Name validation schema
 */
export const nameSchema = z
  .string({ required_error: 'Ad tələb olunur' })
  .min(2, 'Ad ən azı 2 simvol olmalıdır')
  .max(100, 'Ad maksimum 100 simvol ola bilər')
  .regex(/^[a-zA-ZəƏıİüÜöÖşŞğĞçÇ\s-]+$/, 'Ad yalnız hərflərdən ibarət olmalıdır')
  .transform(name => name.trim());

/**
 * Amount validation schema
 */
export const amountSchema = (options?: { min?: number; max?: number }) =>
  z
    .number({ required_error: 'Məbləğ tələb olunur' })
    .positive('Məbləğ müsbət olmalıdır')
    .min(options?.min ?? 0.01, `Minimum məbləğ ${options?.min ?? 0.01} olmalıdır`)
    .max(options?.max ?? 1000000, `Maksimum məbləğ ${options?.max ?? 1000000} olmalıdır`)
    .finite('Məbləğ sonlu rəqəm olmalıdır');

/**
 * UUID validation schema
 */
export const uuidSchema = z
  .string()
  .uuid('Etibarlı UUID formatı tələb olunur');

/**
 * Token validation schema
 */
export const tokenSchema = z
  .string({ required_error: 'Token tələb olunur' })
  .min(32, 'Token ən azı 32 simvol olmalıdır')
  .max(512, 'Token maksimum 512 simvol ola bilər')
  .regex(/^[a-fA-F0-9]+$/, 'Token yalnız hex simvollardan ibarət olmalıdır');

/**
 * URL validation schema
 */
export const urlSchema = z
  .string()
  .url('Etibarlı URL daxil edin')
  .max(2048, 'URL maksimum 2048 simvol ola bilər');

/**
 * Date validation schema (ISO 8601)
 */
export const dateSchema = z
  .string()
  .datetime('Etibarlı tarix formatı tələb olunur (ISO 8601)');

/**
 * Pagination schema
 */
export const paginationSchema = z.object({
  page: z.number().int().positive().default(1),
  limit: z.number().int().positive().max(100).default(20),
});

/**
 * Sort order schema
 */
export const sortOrderSchema = z.enum(['asc', 'desc']).default('desc');

/**
 * User registration schema
 */
export const userRegistrationSchema = z.object({
  email: emailSchema,
  password: passwordSchema,
  name: nameSchema,
  phone: phoneSchema.optional(),
});

/**
 * User login schema
 */
export const userLoginSchema = z.object({
  email: emailSchema,
  password: z.string().min(1, 'Şifrə tələb olunur'),
});

/**
 * Password reset request schema
 */
export const passwordResetRequestSchema = z.object({
  email: emailSchema,
});

/**
 * Password reset schema
 */
export const passwordResetSchema = z.object({
  token: tokenSchema,
  password: passwordSchema,
});

/**
 * Email verification schema
 */
export const emailVerificationSchema = z.object({
  token: tokenSchema,
});

/**
 * Payment amount schema
 */
export const paymentAmountSchema = z.object({
  amount: amountSchema({ min: 1, max: 100000 }),
  currency: z.enum(['AZN', 'USD', 'EUR']).default('AZN'),
});

/**
 * Card details schema (last 4 digits only for display)
 */
export const cardDisplaySchema = z.object({
  last4: z.string().length(4).regex(/^\d{4}$/, 'Kartın son 4 rəqəmi'),
  brand: z.enum(['visa', 'mastercard', 'amex']),
});

/**
 * Sanitize string input
 */
export function sanitizeString(input: string, maxLength: number = 1000): string {
  return input
    .trim()
    .replace(/[<>\"'`]/g, '')
    .substring(0, maxLength);
}

/**
 * Validate and sanitize object keys
 */
export function sanitizeObjectKeys<T extends Record<string, unknown>>(obj: T): T {
  const sanitized = {} as T;
  
  for (const [key, value] of Object.entries(obj)) {
    // Skip prototype pollution attempts
    if (key === '__proto__' || key === 'constructor' || key === 'prototype') {
      continue;
    }
    
    sanitized[key as keyof T] = value as T[keyof T];
  }
  
  return sanitized;
}

/**
 * Validate pagination parameters
 */
export function validatePagination(page?: number, limit?: number) {
  const validatedPage = Math.max(1, Math.floor(page ?? 1));
  const validatedLimit = Math.min(100, Math.max(1, Math.floor(limit ?? 20)));
  
  return {
    page: validatedPage,
    limit: validatedLimit,
    offset: (validatedPage - 1) * validatedLimit,
  };
}
