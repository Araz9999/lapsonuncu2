/**
 * Input Validation Utilities
 * @module utils/inputValidation
 * 
 * Robust input validation and sanitization for forms
 */

/**
 * Sanitize numeric input - only allows numbers and decimal point
 * Prevents multiple decimal points
 * 
 * @example
 * sanitizeNumericInput("123.45.67") // "123.45"
 * sanitizeNumericInput("abc123") // "123"
 * sanitizeNumericInput("12.34") // "12.34"
 */
export function sanitizeNumericInput(value: string): string {
  if (!value) return '';
  
  // Remove all non-numeric characters except decimal point
  let cleaned = value.replace(/[^0-9.]/g, '');
  
  // Ensure only one decimal point
  const parts = cleaned.split('.');
  if (parts.length > 2) {
    cleaned = parts[0] + '.' + parts.slice(1).join('');
  }
  
  return cleaned;
}

/**
 * Sanitize integer input - only allows numbers
 * 
 * @example
 * sanitizeIntegerInput("123abc") // "123"
 * sanitizeIntegerInput("12.34") // "1234"
 */
export function sanitizeIntegerInput(value: string): string {
  if (!value) return '';
  return value.replace(/[^0-9]/g, '');
}

/**
 * Validate numeric range
 * 
 * @param value - Value to validate
 * @param min - Minimum allowed value
 * @param max - Maximum allowed value
 * @returns Error message or null if valid
 */
export function validateNumericRange(
  value: string | number,
  min: number,
  max: number,
  fieldName: string = 'Value'
): string | null {
  const num = typeof value === 'string' ? parseFloat(value) : value;
  
  if (isNaN(num)) {
    return `${fieldName} must be a valid number`;
  }
  
  if (num < min) {
    return `${fieldName} must be at least ${min}`;
  }
  
  if (num > max) {
    return `${fieldName} must be at most ${max}`;
  }
  
  return null;
}

/**
 * Validate discount percentage (0-100)
 */
export function validateDiscountPercentage(value: string | number): string | null {
  return validateNumericRange(value, 0, 100, 'Discount percentage');
}

/**
 * Validate time input (hours, minutes, etc.)
 */
export function validateTimeInput(
  value: string | number,
  unit: 'hours' | 'minutes' | 'days'
): string | null {
  const num = typeof value === 'string' ? parseInt(value, 10) : value;
  
  if (isNaN(num) || num < 0) {
    return `${unit} must be a positive number`;
  }
  
  switch (unit) {
    case 'hours':
      if (num > 23) return 'Hours must be between 0 and 23';
      break;
    case 'minutes':
      if (num > 59) return 'Minutes must be between 0 and 59';
      break;
    case 'days':
      if (num > 365) return 'Days must be less than 365';
      break;
  }
  
  return null;
}

/**
 * Format decimal number to specific precision
 * Prevents floating point arithmetic issues
 * 
 * @example
 * formatDecimal(0.1 + 0.2, 2) // "0.30"
 * formatDecimal(10.12345, 2) // "10.12"
 */
export function formatDecimal(value: number, decimals: number = 2): string {
  return (Math.round(value * Math.pow(10, decimals)) / Math.pow(10, decimals)).toFixed(decimals);
}

/**
 * Validate and sanitize price input
 */
export function validatePrice(value: string): {
  isValid: boolean;
  sanitized: string;
  error?: string;
} {
  const sanitized = sanitizeNumericInput(value);
  
  if (!sanitized) {
    return {
      isValid: false,
      sanitized: '',
      error: 'Price is required'
    };
  }
  
  const num = parseFloat(sanitized);
  
  if (isNaN(num) || num <= 0) {
    return {
      isValid: false,
      sanitized,
      error: 'Price must be greater than 0'
    };
  }
  
  if (num > 1000000) {
    return {
      isValid: false,
      sanitized,
      error: 'Price is too large'
    };
  }
  
  return {
    isValid: true,
    sanitized: formatDecimal(num, 2)
  };
}

/**
 * Validate email format
 */
export function validateEmail(email: string): boolean {
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  return emailRegex.test(email.trim());
}

/**
 * Validate phone number (Azerbaijan format)
 */
export function validateAzerbaijanPhone(phone: string): boolean {
  // Azerbaijan phone: +994XXXXXXXXX or 994XXXXXXXXX or 0XXXXXXXXX
  const cleaned = phone.replace(/[^0-9+]/g, '');
  
  if (cleaned.startsWith('+994') && cleaned.length === 13) return true;
  if (cleaned.startsWith('994') && cleaned.length === 12) return true;
  if (cleaned.startsWith('0') && cleaned.length === 10) return true;
  
  return false;
}

/**
 * Sanitize text input (remove XSS, trim whitespace)
 */
export function sanitizeTextInput(value: string, maxLength?: number): string {
  let sanitized = value
    .trim()
    .replace(/<script\b[^<]*(?:(?!<\/script>)<[^<]*)*<\/script>/gi, '')
    .replace(/<[^>]*>/g, '');
  
  if (maxLength && sanitized.length > maxLength) {
    sanitized = sanitized.substring(0, maxLength);
  }
  
  return sanitized;
}

/**
 * Validate required field
 */
export function validateRequired(value: string, fieldName: string = 'Field'): string | null {
  if (!value || !value.trim()) {
    return `${fieldName} is required`;
  }
  return null;
}

/**
 * Comprehensive form validation
 */
export function validateForm(fields: Record<string, {
  value: string;
  required?: boolean;
  type?: 'email' | 'phone' | 'number' | 'text';
  min?: number;
  max?: number;
}>): { isValid: boolean; errors: Record<string, string> } {
  const errors: Record<string, string> = {};
  
  for (const [fieldName, config] of Object.entries(fields)) {
    const { value, required, type, min, max } = config;
    
    // Check required
    if (required) {
      const error = validateRequired(value, fieldName);
      if (error) {
        errors[fieldName] = error;
        continue;
      }
    }
    
    // Skip type validation if field is empty and not required
    if (!value && !required) continue;
    
    // Type-specific validation
    switch (type) {
      case 'email':
        if (!validateEmail(value)) {
          errors[fieldName] = `Invalid email format`;
        }
        break;
        
      case 'phone':
        if (!validateAzerbaijanPhone(value)) {
          errors[fieldName] = `Invalid phone number`;
        }
        break;
        
      case 'number':
        const num = parseFloat(value);
        if (isNaN(num)) {
          errors[fieldName] = `${fieldName} must be a number`;
        } else {
          const rangeError = validateNumericRange(
            num,
            min ?? -Infinity,
            max ?? Infinity,
            fieldName
          );
          if (rangeError) {
            errors[fieldName] = rangeError;
          }
        }
        break;
    }
  }
  
  return {
    isValid: Object.keys(errors).length === 0,
    errors
  };
}

export default {
  sanitizeNumericInput,
  sanitizeIntegerInput,
  validateNumericRange,
  validateDiscountPercentage,
  validateTimeInput,
  formatDecimal,
  validatePrice,
  validateEmail,
  validateAzerbaijanPhone,
  sanitizeTextInput,
  validateRequired,
  validateForm,
};
