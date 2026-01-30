import React, { ComponentPropsWithoutRef, ElementType, forwardRef } from 'react';

const VARIANT_STYLES = {
  primary: 'bg-orange-500 text-black hover:bg-orange-400 hover:text-black focus:ring-orange-500',
  secondary: 'bg-zinc-800 text-zinc-100 hover:bg-zinc-700 focus:ring-zinc-600',
  outline: 'border border-zinc-700 text-zinc-100 hover:border-orange-500 hover:text-orange-100 focus:ring-orange-500',
  ghost: 'text-zinc-200 hover:bg-zinc-800 focus:ring-zinc-700',
  danger: 'bg-red-600 text-white hover:bg-red-500 focus:ring-red-500',
  link: 'text-orange-400 underline-offset-4 hover:underline focus:ring-orange-500',
  subtle: 'bg-zinc-900 text-zinc-100 border border-zinc-800 hover:border-orange-500/60 focus:ring-orange-500/50',
} as const;

const SIZE_STYLES = {
  sm: 'px-3 py-1.5 text-xs',
  md: 'px-4 py-2 text-sm',
  lg: 'px-6 py-3 text-base',
  icon: 'h-10 w-10 p-0',
} as const;

type Variant = keyof typeof VARIANT_STYLES;
type Size = keyof typeof SIZE_STYLES;

type PolymorphicProps<C extends ElementType> = {
  as?: C;
  variant?: Variant;
  size?: Size;
  fullWidth?: boolean;
  loading?: boolean;
  startIcon?: React.ReactNode;
  endIcon?: React.ReactNode;
} & Omit<ComponentPropsWithoutRef<C>, 'as' | 'size'>;

function cn(...parts: Array<string | undefined | false>) {
  return parts.filter(Boolean).join(' ');
}

const Button = forwardRef<HTMLButtonElement, PolymorphicProps<'button'>>(
  (
    {
      as,
      variant = 'primary',
      size = 'md',
      fullWidth = false,
      loading = false,
      startIcon,
      endIcon,
      className,
      children,
      disabled,
      ...props
    },
    ref,
  ) => {
    const Component = (as ?? 'button') as ElementType;
    const base =`
      inline-flex items-center justify-center whitespace-nowrap  font-semibold transition-colors 
      focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-offset-zinc-900
       disabled:opacity-60 disabled:cursor-not-allowed
      `;
    const variantStyle = VARIANT_STYLES[variant] ?? VARIANT_STYLES.primary;
    const sizeStyle = SIZE_STYLES[size] ?? SIZE_STYLES.md;
    const widthStyle = fullWidth ? 'w-full' : '';
    const isDisabled = disabled || loading;

    return (
      <Component
        ref={ref}
        className={cn(base, variantStyle, sizeStyle, widthStyle, className)}
        disabled={isDisabled}
        aria-busy={loading || undefined}
        {...props}
      >
        {loading && (
          <span
            className="mr-2 inline-block h-4 w-4 animate-spin rounded-full border-2 border-white/50 border-t-transparent"
            aria-hidden="true"
          />
        )}
        {startIcon && <span className="mr-2 inline-flex items-center">{startIcon}</span>}
        {children}
        {endIcon && <span className="ml-2 inline-flex items-center">{endIcon}</span>}
      </Component>
    );
  },
);

Button.displayName = 'Button';

export type { PolymorphicProps, Variant as ButtonVariant, Size as ButtonSize };
export default Button;
