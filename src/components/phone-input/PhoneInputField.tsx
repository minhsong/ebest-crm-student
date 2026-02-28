'use client';

/**
 * Phone input field – aligned with CRM client (Customer Create/Edit).
 * Uses react-phone-number-input, defaultCountry VN, international format.
 */

import React from 'react';
import PhoneInput from 'react-phone-number-input';
import type { E164Number } from 'libphonenumber-js';
import 'react-phone-number-input/style.css';

export interface PhoneInputFieldProps {
  value?: string;
  onChange?: (value: string | undefined) => void;
  className?: string;
  disabled?: boolean;
  placeholder?: string;
}

export function PhoneInputField({
  value,
  onChange,
  className = 'phone-input',
  disabled = false,
  placeholder,
}: PhoneInputFieldProps) {
  const handleChange = React.useCallback(
    (v: E164Number | undefined) => {
      onChange?.(v ?? undefined);
    },
    [onChange]
  );

  return (
    <PhoneInput
      international
      defaultCountry="VN"
      value={value}
      onChange={handleChange}
      className={className}
      disabled={disabled}
      placeholder={placeholder}
    />
  );
}
