import React, { useState, useRef, useEffect, useMemo } from 'react';

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
};

// Lightweight multi-select combobox tuned for the dark UI used in modals.
const ComboBox: React.FC<ComboBoxProps> = ({
  options,
  value,
  onChange,
  placeholder = 'Select options...',
  className = '',
  allowCustom = true,
  disabled = false,
  size = 'sm',
}) => {
  const [isOpen, setIsOpen] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');
  const dropdownRef = useRef<HTMLDivElement | null>(null);
  const sizeStyle = SIZE_STYLES[size] ?? SIZE_STYLES.sm;

  // Close dropdown when clicking outside
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
        setIsOpen(false);
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const toggleOption = (option: string) => {
    const newValue = value.includes(option) ? value.filter((v) => v !== option) : [...value, option];
    onChange(newValue);
  };

  const removeOption = (option: string, e: React.MouseEvent) => {
    e.stopPropagation();
    onChange(value.filter((v) => v !== option));
  };

  const filteredOptions = useMemo(
    () =>
      options
        .filter(Boolean)
        .map((opt) => String(opt).trim())
        .filter((opt, idx, arr) => arr.indexOf(opt) === idx)
        .filter((option) => option.toLowerCase().includes(searchTerm.toLowerCase())),
    [options, searchTerm],
  );

  const handleKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === 'Escape') setIsOpen(false);
    if (e.key === 'Enter' && allowCustom && searchTerm.trim()) {
      const candidate = searchTerm.trim().toLowerCase();
      if (!value.includes(candidate)) onChange([...value, candidate]);
      setSearchTerm('');
    }
  };

  const handleToggle = () => {
    if (disabled) return;
    setIsOpen((prev) => !prev);
  };

  return (
    <div ref={dropdownRef} className={`relative w-full` + ` ${className}`}>
      {/* Selected items display */}
      <div
        role="button"
        tabIndex={0}
        onClick={handleToggle}
        onKeyDown={(e) => e.key === 'Enter' && handleToggle()}
        className={`${sizeStyle} border rounded-md cursor-pointer transition-colors flex flex-wrap gap-2 items-center  bg-zinc-900 border-zinc-700 text-zinc-100`}
      >
        {value.length === 0 ? (
          <span className="text-zinc-500">{placeholder}</span>
        ) : (
          value.map((item) => (
            <span
              key={item}
              className="inline-flex items-center gap-1 px-2
               bg-orange-900/40 text-orange-100 border border-orange-800 rounded-md text-xs"
            >
              {item}
              {!disabled && (
                <button
                  onClick={(e) => removeOption(item, e)}
                  className="hover:text-white text-orange-200 rounded-full p-0.5 transition-colors"
                  aria-label={`Remove ${item}`}
                >
                  {/* Close/Clear  */}
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
          className="w-4 h-4 ml-auto transition-transform"
          fill="none"
          stroke="currentColor"
          viewBox="0 0 24 24"
        >
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
        </svg>
      </div>

      {/* Dropdown menu */}
      {isOpen && !disabled && (
        <div className="absolute z-50 w-full mt-2 bg-zinc-900 border border-zinc-800 rounded-md shadow-xl max-h-64 overflow-hidden">
          {/* Search input */}
          <div className="p-2 border-b border-zinc-800">
            <input
              type="text"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              onKeyDown={handleKeyDown}
              placeholder="Search..."
              className="w-full  rounded-md bg-zinc-900 border ps-1
                border-zinc-700 text-zinc-100 focus:outline-none focus:border-orange-500 focus:ring-1 focus:ring-orange-500"
              autoFocus
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
                    onClick={() => toggleOption(option)}
                    className={`w-full text-left ${sizeStyle} cursor-pointer flex items-center gap-2 transition-colors ${
                      isSelected ? 'bg-orange-900/30 text-orange-100' : 'hover:bg-zinc-800 text-zinc-200'
                    }`}
                  >
                    {/* Checkbox */}
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
                    <span className={isSelected ? 'font-semibold' : ''}>{option}</span>
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
