import React, { forwardRef } from 'react';

const SIZE_STYLES = {
  sm: 'p-3 text-xs',
  md: 'p-4 text-sm',
} as const;

type TextAreaProps = React.TextareaHTMLAttributes<HTMLTextAreaElement> & {
  size?: keyof typeof SIZE_STYLES;
  minHeight?: number | string;
};

const TextArea = forwardRef<HTMLTextAreaElement, TextAreaProps>(
  ({ size = 'sm', className = '', spellCheck = false, minHeight, style, ...props }, ref) => {
    const base =
      'w-full bg-zinc-950 border border-zinc-700 rounded-lg font-mono text-zinc-300 focus:outline-none focus:border-orange-500 focus:ring-1 focus:ring-orange-500';
    const sizeStyle = SIZE_STYLES[size] ?? SIZE_STYLES.sm;
    return (
      <textarea
        ref={ref}
        className={`${base} ${sizeStyle} ${className}`.trim()}
        spellCheck={spellCheck}
        style={{ ...(minHeight ? { minHeight } : {}), ...style }}
        {...props}
      />
    );
  },
);

TextArea.displayName = 'TextArea';

export default TextArea;
