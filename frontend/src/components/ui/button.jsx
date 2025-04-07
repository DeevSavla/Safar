import React from 'react';
import { motion } from 'framer-motion';

const Button = ({ 
  children, 
  onClick, 
  type = 'button', 
  className = '', 
  disabled = false, 
  variant = 'default',
  size = 'default',
  icon,
  iconPosition = 'left',
  animate = true
}) => {
  const baseClasses = 'inline-flex items-center justify-center font-medium rounded-lg transition-all focus:outline-none';
  
  const variantClasses = {
    default: 'bg-gradient-to-r from-[#56288A] to-[#864BD8] text-white hover:shadow-lg disabled:opacity-70',
    outline: 'border border-[#56288A]/30 bg-white text-[#56288A] hover:bg-[#56288A]/5 hover:border-[#56288A]/60 disabled:opacity-70',
    glass: 'glass text-white border border-white/20 hover:bg-white/20 disabled:opacity-70',
    destructive: 'bg-gradient-to-r from-red-500 to-red-600 text-white hover:shadow-lg disabled:opacity-70',
    ghost: 'bg-transparent hover:bg-[#56288A]/5 text-[#56288A] disabled:opacity-70',
    link: 'bg-transparent text-[#56288A] hover:underline underline-offset-4 p-0 h-auto disabled:opacity-70'
  };
  
  const sizeClasses = {
    xs: 'text-xs px-2 py-1 rounded gap-1',
    sm: 'text-sm px-3 py-1.5 rounded-md gap-1.5',
    default: 'text-sm px-4 py-2.5 rounded-md gap-2',
    lg: 'text-base px-6 py-3 rounded-lg gap-2',
    xl: 'text-lg px-8 py-4 rounded-xl gap-3 font-semibold'
  };
  
  const classes = `${baseClasses} ${variantClasses[variant]} ${sizeClasses[size]} ${className}`;

  const buttonContent = (
    <>
      {icon && iconPosition === 'left' && (
        <span className="inline-flex shrink-0">{icon}</span>
      )}
      <span>{children}</span>
      {icon && iconPosition === 'right' && (
        <span className="inline-flex shrink-0">{icon}</span>
      )}
    </>
  );
  
  if (animate) {
    return (
      <motion.button
        type={type}
        className={classes}
        onClick={onClick}
        disabled={disabled}
        whileHover={{ scale: disabled ? 1 : 1.03 }}
        whileTap={{ scale: disabled ? 1 : 0.97 }}
        transition={{ duration: 0.2 }}
      >
        {buttonContent}
      </motion.button>
    );
  }
  
  return (
    <button
      type={type}
      className={classes}
      onClick={onClick}
      disabled={disabled}
    >
      {buttonContent}
    </button>
  );
};

// Premium export with fancy gradient effect
export const PremiumButton = ({ children, ...props }) => (
  <Button 
    variant="default" 
    className="btn-premium" 
    {...props}
  >
    {children}
  </Button>
);

export { Button }; 