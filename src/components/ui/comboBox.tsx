import React, { useState, useRef, useEffect, useMemo, useCallback } from 'react';

const SIZE_STYLES = {
  sm: 'min-h-[32px] px-2 py-1 text-xs',
  md: 'min-h-[40px] px-3 py-2 text-sm',
} as const;

type ComboBoxProps = {
  options: string[];
  value: string[];
  onChange: (value: string[]) => void;
  placeholder?: string;
  className?: string;
  allowCustom?: boolean;
  disabled?: boolean;
  size?: keyof typeof SIZE_STYLES;
  singleSelect?: boolean;
  labelForOption?: (value: string) => string;
};

const ComboBox: React.FC<ComboBoxProps> = ({
  options,
  value,
  onChange,
  placeholder = 'Select options...',
  className = '',

  allowCustom = true,
  disabled = false,
  size = 'sm',
  singleSelect = false,
  labelForOption = (v) => v,
}) => {
  const [isOpen, setIsOpen] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');
  const containerRef = useRef<HTMLDivElement | null>(null);
  const inputRef = useRef<HTMLInputElement | null>(null);

  // Track if a remove button was just clicked so we can suppress the toggle
  const suppressToggleRef = useRef(false);
  const sizeStyle = SIZE_STYLES[size] ?? SIZE_STYLES.sm;

  // Close dropdown when clicking outside
  useEffect(() => {
    const handleOutside = (event: MouseEvent) => {
      if (containerRef.current && !containerRef.current.contains(event.target as Node)) {
        setIsOpen(false);
        setSearchTerm('');
      }
    };
    document.addEventListener('mousedown', handleOutside);
    return () => document.removeEventListener('mousedown', handleOutside);
  }, []);

  const toggleOption = useCallback(
    (option: string) => {
      if (singleSelect) {
        const isSelected = value.includes(option);
        onChange(isSelected ? [] : [option]);
        setIsOpen(false);
        setSearchTerm('');
        return;
      }
      const next = value.includes(option)
        ? value.filter((v) => v !== option)
        : [...value, option];
      onChange(next);
    },
    [onChange, singleSelect, value],
  );

  const removeOption = useCallback(
    (option: string) => {
      onChange(value.filter((v) => v !== option));
    },
    [onChange, value],
  );

  const filteredOptions = useMemo(
    () =>
      options
        .filter(Boolean)
        .map((opt) => String(opt).trim())
        .filter((opt, idx, arr) => arr.indexOf(opt) === idx)
        .filter((option) => option.toLowerCase().includes(searchTerm.toLowerCase())),
    [options, searchTerm],
  );

  // Handle Enter for adding custom option if allowed, or just to toggle dropdown
  // Also handle Escape to close dropdown and clear search
  const handleKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === 'Escape') {
      setIsOpen(false);
      setSearchTerm('');
    }
    if (e.key === 'Enter' && allowCustom && searchTerm.trim()) {
      const candidate = searchTerm.trim().toLowerCase();
      const next = singleSelect
        ? [candidate]
        : value.includes(candidate)
          ? value
          : [...value, candidate];
      onChange(next);
      setSearchTerm('');
      if (singleSelect) setIsOpen(false);
    }
  };

  // The main toggle area uses onMouseDown so we act before focus shifts.
  // We also preventDefault to stop <label> from forwarding clicks.
  const handleTriggerMouseDown = (e: React.MouseEvent) => {
    e.preventDefault(); // prevent <label> focus forwarding
    if (disabled) return;
    // If a remove button set the suppress flag, skip toggling
    if (suppressToggleRef.current) {
      suppressToggleRef.current = false;
      return;
    }
    setIsOpen((prev) => {
      if (prev) setSearchTerm('');
      return !prev;
    });
  };

  // Remove buttons use onMouseDown so they fire before the parent's handler.
  // They set the suppress flag so handleTriggerMouseDown won't also toggle.
  const handleRemoveMouseDown = (option: string, e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();
    suppressToggleRef.current = true;
    removeOption(option);
  };

  return (
    <div ref={containerRef} className={`relative w-full ${className}`}>
      {/* Trigger / selected items display */}
      <div
        role="combobox"
        aria-expanded={isOpen}
        aria-controls="combobox-list"
        tabIndex={0}
        onMouseDown={handleTriggerMouseDown}
        onKeyDown={(e) => {
          if (e.key === 'Enter' || e.key === ' ') {
            e.preventDefault();
            if (!disabled) setIsOpen((p) => !p);
          }
        }}
        className={`${sizeStyle} border rounded-md cursor-pointer transition-colors flex flex-wrap gap-2 items-center bg-zinc-900 border-zinc-700 text-zinc-100 select-none`}
      >
        {value.length === 0 ? (
          <span className="text-zinc-500 pointer-events-none">{placeholder}</span>
        ) : (
          value.map((item) => (
            <span
              key={item}
              className="inline-flex items-center gap-1 px-2 bg-orange-900/40 text-orange-100 border border-orange-800 rounded-md text-xs"
            >
              {labelForOption(item)}
              {!disabled && (
                <button
                  type="button"
                  onMouseDown={(e) => handleRemoveMouseDown(item, e)}
                  className="hover:text-white text-orange-200 rounded-full p-0.5 transition-colors"
                  aria-label={`Remove ${item}`}
                >
                  <svg className="w-3 h-3" viewBox="0 0 24 24" fill="none" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                  </svg>
                </button>
              )}
            </span>
          ))
        )}

        {/* Dropdown arrow */}
        <svg
          className={`w-4 h-4 ml-auto transition-transform pointer-events-none ${isOpen ? 'rotate-180' : ''}`}
          fill="none"
          stroke="currentColor"
          viewBox="0 0 24 24"
        >
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
        </svg>
      </div>

      {/* Dropdown menu */}
      {isOpen && !disabled && (
        <div
          className="absolute z-50 w-full mt-2 bg-zinc-900 border border-zinc-800 rounded-md shadow-xl max-h-64 overflow-hidden"
          onMouseDown={(e) => {
            // Prevent clicks inside the dropdown from closing via blur / label forwarding
            e.preventDefault();
          }}
        >
          {/* Search input */}
          <div className="p-2 border-b border-zinc-800">
            <input
              ref={inputRef}
              type="text"
              autoFocus
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              onKeyDown={handleKeyDown}
              placeholder="Search..."
              className="w-full rounded-md bg-zinc-900 border ps-1 border-zinc-700 text-zinc-100 focus:outline-none focus:border-orange-500 focus:ring-1 focus:ring-orange-500"
            />
          </div>

          {/* Options list */}
          <div className="overflow-y-auto max-h-48">
            {filteredOptions.length === 0 ? (
              <div className="px-4 py-3 text-zinc-500 text-center text-sm">
                {allowCustom && searchTerm.trim()
                  ? `Press Enter to add "${searchTerm.trim()}"`
                  : 'No options found'}
              </div>
            ) : (
              filteredOptions.map((option) => {
                const isSelected = value.includes(option);
                return (
                  <button
                    type="button"
                    key={option}
                    onMouseDown={(e) => {
                      e.preventDefault();
                      e.stopPropagation();
                      toggleOption(option);
                    }}
                    className={`w-full text-left ${sizeStyle} cursor-pointer flex items-center gap-2 transition-colors ${
                      isSelected ? 'bg-orange-900/30 text-orange-100' : 'hover:bg-zinc-800 text-zinc-200'
                    }`}
                  >
                    <span
                      className={`inline-flex h-4 w-4 items-center justify-center rounded border ${
                        isSelected ? 'bg-orange-500 border-orange-500' : 'border-zinc-600'
                      }`}
                    >
                      {isSelected && (
                        <svg className="w-3 h-3 text-white" viewBox="0 0 24 24" fill="none" stroke="currentColor">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={3} d="M5 13l4 4L19 7" />
                        </svg>
                      )}
                    </span>
                    <span className={isSelected ? 'font-semibold' : ''}>{labelForOption(option)}</span>
                  </button>
                );
              })
            )}
          </div>
        </div>
      )}
    </div>
  );
};

export default ComboBox;
