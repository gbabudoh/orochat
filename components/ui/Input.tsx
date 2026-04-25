'use client';

import { InputHTMLAttributes, forwardRef } from 'react';

interface InputProps extends InputHTMLAttributes<HTMLInputElement> {
  label?: string;
  error?: string;
}

const Input = forwardRef<HTMLInputElement, InputProps>(
  ({ label, error, className = '', ...props }, ref) => {
    return (
      <div className="w-full">
        {label && (
          <label className="block text-sm font-medium text-[#333333] mb-1.5">
            {label}
          </label>
        )}
        <input
          ref={ref}
          className={`
            w-full px-4 py-2.5 rounded-lg border-2 transition-all duration-200
            bg-white text-[#333333] placeholder:text-gray-400
            border-gray-200 focus:border-[#458B9E] focus:ring-2 focus:ring-[#458B9E]/20
            ${error ? 'border-[#D32F2F] focus:border-[#D32F2F] focus:ring-[#D32F2F]/20' : ''}
            ${className}
          `}
          {...props}
        />
        {error && (
          <p className="mt-1.5 text-sm text-[#D32F2F]">{error}</p>
        )}
      </div>
    );
  }
);

Input.displayName = 'Input';

export default Input;

