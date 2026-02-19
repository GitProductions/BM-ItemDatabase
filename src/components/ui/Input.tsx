import React, { forwardRef } from 'react';

const SIZE_STYLES = {
  sm: 'min-h-[32px] px-2 py-1 text-xs',
  md: 'min-h-[40px] px-3 py-2 text-sm',
} as const;

type InputProps = React.InputHTMLAttributes<HTMLInputElement> & {
  size?: keyof typeof SIZE_STYLES;
};

const Input = forwardRef<HTMLInputElement, InputProps>(({ size = 'sm', className = '', ...props }, ref) => {
  const sizeStyle = SIZE_STYLES[size as keyof typeof SIZE_STYLES] ?? SIZE_STYLES.sm;
  return <input ref={ref} className={`input-base ${sizeStyle} ${className}`.trim()} {...props} />;
});

Input.displayName = 'Input';

export default Input;
