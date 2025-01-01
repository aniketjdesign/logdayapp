import React, { useState, useRef, useEffect } from 'react';
import { ChevronDown, Folder, Check } from 'lucide-react';

interface DropdownOption {
  value: string;
  label: string;
}

interface DropdownProps {
  value: string;
  onChange: (value: string) => void;
  options: DropdownOption[];
  placeholder?: string;
  className?: string;
  showIcon?: boolean;
}

export const Dropdown: React.FC<DropdownProps> = ({
  value,
  onChange,
  options,
  placeholder = 'Select an option',
  className = '',
  showIcon = false,
}) => {
  const [isOpen, setIsOpen] = useState(false);
  const dropdownRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
        setIsOpen(false);
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const selectedOption = options.find(option => option.value === value);

  return (
    <div className={`relative ${className}`} ref={dropdownRef}>
      <button
        type="button"
        onClick={() => setIsOpen(!isOpen)}
        className="w-full flex items-center justify-between px-3 py-2 bg-white border rounded-lg hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-blue-500"
      >
        <div className="flex items-center">
          {showIcon && (
            <Folder size={18} className="mr-2 text-gray-500" />
          )}
          <span className={`block truncate ${!selectedOption ? 'text-gray-500' : ''}`}>
            {selectedOption ? selectedOption.label : placeholder}
          </span>
        </div>
        <ChevronDown
          size={18}
          className={`ml-2 text-gray-400 transition-transform duration-200 ${
            isOpen ? 'transform rotate-180' : ''
          }`}
        />
      </button>

      {isOpen && (
        <div className="absolute z-50 w-full mt-1 bg-white border rounded-lg shadow-lg max-h-60 overflow-auto">
          {options.map((option) => (
            <button
              key={option.value}
              onClick={() => {
                onChange(option.value);
                setIsOpen(false);
              }}
              className={`w-full flex items-center px-3 py-2 text-left hover:bg-gray-50 ${
                option.value === value ? 'bg-blue-50 text-blue-600' : ''
              }`}
            >
              {showIcon && (
                <Folder size={18} className={`mr-2 ${option.value === value ? 'text-blue-600' : 'text-gray-500'}`} />
              )}
              <span className="flex-1">{option.label}</span>
              {option.value === value && (
                <Check size={18} className="text-blue-600" />
              )}
            </button>
          ))}
        </div>
      )}
    </div>
  );
};
