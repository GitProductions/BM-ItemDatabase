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
  const base = 'w-full rounded-md border border-zinc-700 bg-zinc-900 text-zinc-100 focus:outline-none focus:border-orange-500 focus:ring-1 focus:ring-orange-500';
  return <input ref={ref} className={`${base} ${sizeStyle} ${className}`.trim()} {...props} />;
});

Input.displayName = 'Input';

export default Input;
