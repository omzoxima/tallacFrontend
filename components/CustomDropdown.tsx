'use client';

import React, { useState, useRef, useEffect } from 'react';

interface DropdownOption {
  value: string;
  label: string;
  color?: string;
  icon?: string;
  subLabel?: string;
  colorClass?: string;
}

interface CustomDropdownProps {
  value: string;
  options: DropdownOption[];
  onChange: (value: string) => void;
  buttonClass?: string;
  showColorDot?: boolean;
  showCheckmark?: boolean;
  searchable?: boolean;
  autoCloseOthers?: boolean;
}

export default function CustomDropdown({
  value,
  options,
  onChange,
  buttonClass = 'bg-blue-600 border-blue-600 text-white',
  showColorDot = true,
  showCheckmark = true,
  searchable = false,
  autoCloseOthers = false,
}: CustomDropdownProps) {
  const [isOpen, setIsOpen] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const dropdownRef = useRef<HTMLDivElement>(null);
  const searchInputRef = useRef<HTMLInputElement>(null);

  const selectedOption = options.find(opt => opt.value === value);

  const filteredOptions = searchable && searchQuery
    ? options.filter(option =>
        option.label.toLowerCase().includes(searchQuery.toLowerCase()) ||
        String(option.value).toLowerCase().includes(searchQuery.toLowerCase())
      )
    : options;

  const toggleDropdown = () => {
    if (!isOpen) {
      setIsOpen(true);
      if (searchable) {
        setTimeout(() => {
          searchInputRef.current?.focus();
        }, 100);
      }
    } else {
      setIsOpen(false);
      setSearchQuery('');
    }
  };

  const selectOption = (option: DropdownOption) => {
    onChange(option.value);
    setIsOpen(false);
    setSearchQuery('');
  };

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
        setIsOpen(false);
        setSearchQuery('');
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  return (
    <div className="custom-dropdown relative z-10" ref={dropdownRef}>
      <button
        type="button"
        onClick={toggleDropdown}
        className={`w-full flex items-center justify-between px-3 py-2.5 rounded-lg border font-semibold text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 transition-all h-10 ${buttonClass}`}
      >
        <span className="flex items-center gap-2 min-w-0">
          {selectedOption?.icon && (
            <span className="text-lg flex-shrink-0">{selectedOption.icon}</span>
          )}
          <span className="truncate">{selectedOption?.label || 'Select'}</span>
        </span>
        <svg
          className={`w-4 h-4 transition-transform ${isOpen ? 'rotate-180' : ''}`}
          fill="none"
          stroke="currentColor"
          viewBox="0 0 24 24"
        >
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M19 9l-7 7-7-7"></path>
        </svg>
      </button>

      {isOpen && (
        <div 
          className="absolute z-[9999] w-full mt-2 bg-gray-800 border border-gray-700 rounded-lg shadow-2xl overflow-hidden"
        >
          {searchable && (
            <div className="p-2 sticky top-0 bg-gray-800 border-b border-gray-700 z-10">
              <input
                ref={searchInputRef}
                type="text"
                placeholder="Search..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                onClick={(e) => e.stopPropagation()}
                className="w-full bg-gray-700 border border-gray-600 text-white text-sm rounded px-3 py-2 focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none"
              />
            </div>
          )}

          {filteredOptions.length === 0 ? (
            <div className="px-4 py-3 text-gray-400 text-sm text-center">No results found</div>
          ) : (
            <div 
              className="overflow-y-auto custom-dropdown-scroll" 
              style={{ 
                maxHeight: searchable ? '250px' : '300px',
                overflowX: 'hidden',
                WebkitOverflowScrolling: 'touch'
              }}
            >
              {filteredOptions.map((option) => (
              <button
                key={option.value}
                type="button"
                onClick={() => selectOption(option)}
                className={`w-full flex items-center gap-3 px-4 py-3 text-left font-semibold text-base transition-all hover:bg-gray-700 active:bg-gray-600 ${
                  value === option.value ? 'bg-gray-700' : ''
                } ${option.colorClass || 'text-white'}`}
              >
                {showColorDot && option.color && (
                  <span
                    className="w-3 h-3 rounded-full flex-shrink-0"
                    style={{ backgroundColor: option.color }}
                  ></span>
                )}
                {option.icon && <span className="text-lg flex-shrink-0">{option.icon}</span>}
                <div className="flex-1 text-left">
                  <div className="text-white">
                    {option.label}
                    {option.subLabel && (
                      <span className="text-gray-400 font-normal"> ({option.subLabel})</span>
                    )}
                  </div>
                </div>
                {showCheckmark && value === option.value && (
                  <svg
                    className="w-5 h-5 text-blue-500 flex-shrink-0"
                    fill="currentColor"
                    viewBox="0 0 20 20"
                  >
                    <path
                      fillRule="evenodd"
                      d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z"
                      clipRule="evenodd"
                    ></path>
                  </svg>
                )}
              </button>
              ))}
            </div>
          )}
        </div>
      )}

      <style jsx>{`
        .custom-dropdown ::-webkit-scrollbar,
        .custom-dropdown-scroll ::-webkit-scrollbar {
          width: 8px;
        }

        .custom-dropdown ::-webkit-scrollbar-track,
        .custom-dropdown-scroll ::-webkit-scrollbar-track {
          background: #1f2937;
          border-radius: 4px;
        }

        .custom-dropdown ::-webkit-scrollbar-thumb,
        .custom-dropdown-scroll ::-webkit-scrollbar-thumb {
          background: #4b5563;
          border-radius: 4px;
        }

        .custom-dropdown ::-webkit-scrollbar-thumb:hover,
        .custom-dropdown-scroll ::-webkit-scrollbar-thumb:hover {
          background: #6b7280;
        }
        
        /* Ensure dropdown is scrollable */
        .custom-dropdown > div[style*="maxHeight"],
        .custom-dropdown-scroll {
          overscroll-behavior: contain;
          -webkit-overflow-scrolling: touch;
        }
      `}</style>
    </div>
  );
}

