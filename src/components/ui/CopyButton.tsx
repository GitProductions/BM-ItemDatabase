"use client";

import { useState } from 'react';
import { Check, Copy } from 'lucide-react';
import Button, { ButtonSize, ButtonVariant } from './Button';

type CopyButtonProps = {
  value: string;
  label?: string;
  size?: ButtonSize;
  variant?: ButtonVariant;
  className?: string;
};

export function CopyButton({
  value,
  label = 'Copy link',
  size = 'sm',
  variant = 'secondary',
  className,
}: CopyButtonProps) {
  const [status, setStatus] = useState<'idle' | 'copied' | 'error'>('idle');

  const handleCopy = async () => {
    try {
      await navigator.clipboard.writeText(value);
      setStatus('copied');
      setTimeout(() => setStatus('idle'), 1500);
    } catch {
      setStatus('error');
      setTimeout(() => setStatus('idle'), 1500);
    }
  };

  const icon = status === 'copied' ? <Check size={14} /> : <Copy size={14} />;

  return (
    <Button
      size={size}
      variant={variant}
      className={className}
      onClick={handleCopy}
      startIcon={icon}
      aria-live="polite"
    >
      {status === 'copied' ? 'Copied' : status === 'error' ? 'Copy failed' : label}
    </Button>
  );
}

export default CopyButton;
