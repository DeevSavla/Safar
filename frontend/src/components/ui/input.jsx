import React, { forwardRef } from 'react';

const Input = forwardRef(({ 
  type = 'text', 
  placeholder = '', 
  value = '', 
  onChange = () => {}, 
  className = '', 
  disabled = false,
  ...props 
}, ref) => {
  return (
    <input
      ref={ref}
      type={type}
      value={value}
      onChange={onChange}
      placeholder={placeholder}
      className={`px-4 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-[#56288A] disabled:bg-gray-100 disabled:text-gray-400 ${className}`}
      disabled={disabled}
      {...props}
    />
  );
});

Input.displayName = 'Input';

export { Input }; 