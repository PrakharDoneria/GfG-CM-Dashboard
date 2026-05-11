'use client';
import { useState, useRef, useEffect } from 'react';
import './CustomSelect.css';

export default function CustomSelect({ value, onChange, options, placeholder = 'Select an option', required = false }) {
  const [isOpen, setIsOpen] = useState(false);
  const containerRef = useRef(null);

  const selectedOption = options.find(opt => opt.value === value);

  useEffect(() => {
    const handleClickOutside = (event) => {
      if (containerRef.current && !containerRef.current.contains(event.target)) {
        setIsOpen(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const handleSelect = (e, option) => {
    e.stopPropagation();
    onChange({ target: { value: option.value } });
    setIsOpen(false);
  };

  return (
    <div className={`custom-select-container ${isOpen ? 'open' : ''}`} ref={containerRef} style={{ zIndex: isOpen ? 1000 : 1 }}>
      <div 
        className="custom-select-trigger" 
        onClick={() => setIsOpen(!isOpen)}
        tabIndex={0}
      >
        <span className={!selectedOption ? 'placeholder' : ''}>
          {selectedOption ? selectedOption.label : placeholder}
        </span>
        <svg 
          className={`chevron ${isOpen ? 'rotate' : ''}`} 
          width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"
        >
          <polyline points="6 9 12 15 18 9"></polyline>
        </svg>
      </div>
      
      {isOpen && (
        <ul className="custom-select-options animate-fade-in">
          {options.map((option) => (
            <li 
              key={option.value} 
              className={`custom-select-option ${value === option.value ? 'selected' : ''}`}
              onClick={(e) => handleSelect(e, option)}
            >
              {option.label}
              {value === option.value && (
                <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round">
                  <polyline points="20 6 9 17 4 12"></polyline>
                </svg>
              )}
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}
