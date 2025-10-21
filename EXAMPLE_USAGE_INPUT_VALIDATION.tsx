/**
 * Example: How to use input validation in discount screen
 * This shows best practices for input validation
 */

import React, { useState } from 'react';
import { TextInput, Alert } from 'react-native';
import {
  sanitizeNumericInput,
  validateDiscountPercentage,
  validateTimeInput,
  formatDecimal,
  validatePrice,
} from '@/utils/inputValidation';

export default function DiscountScreenExample() {
  const [discountValue, setDiscountValue] = useState('');
  const [customDays, setCustomDays] = useState('0');
  const [customHours, setCustomHours] = useState('6');
  const [customMinutes, setCustomMinutes] = useState('0');
  const [price, setPrice] = useState('');

  // ✅ CORRECT: Sanitize input on change
  const handleDiscountChange = (text: string) => {
    const sanitized = sanitizeNumericInput(text);
    setDiscountValue(sanitized);
  };

  // ✅ CORRECT: Validate on submit
  const handleSubmit = () => {
    // Validate discount
    const discountError = validateDiscountPercentage(discountValue);
    if (discountError) {
      Alert.alert('Error', discountError);
      return;
    }

    // Validate time inputs
    const daysError = validateTimeInput(customDays, 'days');
    if (daysError) {
      Alert.alert('Error', daysError);
      return;
    }

    const hoursError = validateTimeInput(customHours, 'hours');
    if (hoursError) {
      Alert.alert('Error', hoursError);
      return;
    }

    const minutesError = validateTimeInput(customMinutes, 'minutes');
    if (minutesError) {
      Alert.alert('Error', minutesError);
      return;
    }

    // Validate price
    const priceValidation = validatePrice(price);
    if (!priceValidation.isValid) {
      Alert.alert('Error', priceValidation.error || 'Invalid price');
      return;
    }

    // All validation passed
    const formattedDiscount = formatDecimal(parseFloat(discountValue), 2);
    const formattedPrice = priceValidation.sanitized;

    console.log('Validated data:', {
      discount: formattedDiscount,
      price: formattedPrice,
      days: parseInt(customDays, 10),
      hours: parseInt(customHours, 10),
      minutes: parseInt(customMinutes, 10),
    });

    // Proceed with API call or navigation
  };

  return (
    <>
      {/* ✅ CORRECT: Discount Input with Validation */}
      <TextInput
        value={discountValue}
        onChangeText={handleDiscountChange} // Sanitizes input
        keyboardType="numeric"
        placeholder="0"
        maxLength={5} // Prevent too long input
      />

      {/* ✅ CORRECT: Time Inputs with Validation */}
      <TextInput
        value={customDays}
        onChangeText={(text) => {
          const sanitized = sanitizeNumericInput(text);
          setCustomDays(sanitized);
        }}
        keyboardType="numeric"
        placeholder="0"
        maxLength={3}
      />

      <TextInput
        value={customHours}
        onChangeText={(text) => {
          const sanitized = sanitizeNumericInput(text);
          const num = parseInt(sanitized, 10);
          // Real-time validation feedback
          if (!isNaN(num) && num > 23) {
            Alert.alert('Error', 'Hours must be between 0 and 23');
            return;
          }
          setCustomHours(sanitized);
        }}
        keyboardType="numeric"
        placeholder="0"
        maxLength={2}
      />

      <TextInput
        value={customMinutes}
        onChangeText={(text) => {
          const sanitized = sanitizeNumericInput(text);
          const num = parseInt(sanitized, 10);
          // Real-time validation feedback
          if (!isNaN(num) && num > 59) {
            Alert.alert('Error', 'Minutes must be between 0 and 59');
            return;
          }
          setCustomMinutes(sanitized);
        }}
        keyboardType="numeric"
        placeholder="0"
        maxLength={2}
      />

      {/* ✅ CORRECT: Price Input with Validation */}
      <TextInput
        value={price}
        onChangeText={(text) => {
          const sanitized = sanitizeNumericInput(text);
          setPrice(sanitized);
        }}
        keyboardType="decimal-pad"
        placeholder="0.00"
      />
    </>
  );
}

// ❌ WRONG Examples (Don't do this!)

function WrongExamples() {
  const [discount, setDiscount] = useState('');

  // ❌ WRONG: No input sanitization
  const wrongExample1 = (
    <TextInput
      value={discount}
      onChangeText={setDiscount} // User can type letters!
      keyboardType="numeric"
    />
  );

  // ❌ WRONG: No validation before submit
  const wrongSubmit = () => {
    const num = parseFloat(discount); // Could be NaN!
    if (num > 100) { // What if num is NaN?
      // Bug: NaN > 100 is always false
    }
  };

  // ❌ WRONG: Floating point arithmetic without rounding
  const wrongCalculation = () => {
    const result = 0.1 + 0.2; // 0.30000000000000004
    // Should use: formatDecimal(0.1 + 0.2, 2)
  };

  return null;
}
