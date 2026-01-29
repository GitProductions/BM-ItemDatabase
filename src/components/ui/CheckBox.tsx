import React, { forwardRef, useEffect, useRef } from 'react';

type CheckBoxProps = Omit<React.InputHTMLAttributes<HTMLInputElement>, 'type'> & {
  indeterminate?: boolean;
};

const CheckBox = forwardRef<HTMLInputElement, CheckBoxProps>(
  ({ className = '', indeterminate = false, ...props }, ref) => {
    const internalRef = useRef<HTMLInputElement | null>(null);
    const resolvedRef = (ref as React.MutableRefObject<HTMLInputElement | null>) ?? internalRef;

    useEffect(() => {
      if (resolvedRef && resolvedRef.current) {
        resolvedRef.current.indeterminate = indeterminate;
      }
    }, [indeterminate, resolvedRef]);

    const base =
      'h-4 w-4 rounded border border-zinc-600 bg-zinc-900 text-orange-500 focus:ring-orange-500 focus:ring-1 focus:outline-none';

    return <input ref={resolvedRef} type="checkbox" className={`${base} ${className}`.trim()} {...props} />;
  },
);

CheckBox.displayName = 'CheckBox';

export default CheckBox;
