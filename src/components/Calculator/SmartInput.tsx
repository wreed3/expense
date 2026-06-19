import { useState, useEffect, useRef } from 'react';
import { ExpressionEvaluator } from '../../utils/expressionEvaluator';
import { useCalculatorStore } from '../../store/calculatorStore';

interface SmartInputProps {
  id: string;
  value: string;
  onChange: (value: string) => void;
  onFocus?: () => void;
  onBlur?: () => void;
  placeholder?: string;
  required?: boolean;
  className?: string;
}

export function SmartInput({
  id,
  value,
  onChange,
  onFocus,
  onBlur,
  placeholder = '0.00 or 45+12.30',
  required,
  className = '',
}: SmartInputProps) {
  const [expression, setExpression] = useState(value);
  const [preview, setPreview] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const inputRef = useRef<HTMLInputElement>(null);
  const { setActiveInput, toggleOpen } = useCalculatorStore();

  useEffect(() => {
    setExpression(value);
  }, [value]);

  useEffect(() => {
    // Check if expression contains operators
    if (/[+\-*/]/.test(expression) && expression !== value) {
      try {
        const result = ExpressionEvaluator.evaluate(expression);
        setPreview(ExpressionEvaluator.formatResult(result));
        setError(null);
      } catch (err) {
        setPreview(null);
        setError(err instanceof Error ? err.message : 'Invalid expression');
      }
    } else {
      setPreview(null);
      setError(null);
    }
  }, [expression, value]);

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const newValue = e.target.value;
    setExpression(newValue);
    onChange(newValue);
  };

  const handleBlur = () => {
    // Auto-evaluate expression on blur if valid
    if (preview && !error) {
      onChange(preview);
      setExpression(preview);
      setPreview(null);
    }
    setActiveInput(null);
    onBlur?.();
  };

  const handleFocus = () => {
    setActiveInput(id);
    onFocus?.();
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    // Evaluate on Enter
    if (e.key === 'Enter' && preview && !error) {
      e.preventDefault();
      onChange(preview);
      setExpression(preview);
      setPreview(null);
      inputRef.current?.blur();
    }

    // Open calculator on Ctrl+K
    if ((e.ctrlKey || e.metaKey) && e.key === 'k') {
      e.preventDefault();
      toggleOpen();
    }
  };

  const handleCalculatorClick = () => {
    setActiveInput(id);
    toggleOpen();
  };

  return (
    <div className="smart-input-wrapper">
      <div className="smart-input-container">
        <input
          ref={inputRef}
          type="text"
          id={id}
          value={expression}
          onChange={handleChange}
          onFocus={handleFocus}
          onBlur={handleBlur}
          onKeyDown={handleKeyDown}
          placeholder={placeholder}
          required={required}
          className={`smart-input ${className} ${error ? 'error' : ''} ${preview ? 'has-preview' : ''}`}
          inputMode="decimal"
        />
        <button
          type="button"
          className="calculator-trigger-btn"
          onClick={handleCalculatorClick}
          title="Open calculator (Ctrl+K)"
          tabIndex={-1}
        >
          🧮
        </button>
      </div>
      {preview && !error && (
        <div className="smart-input-preview">
          = {preview}
          <span className="preview-hint">Press Enter or blur to apply</span>
        </div>
      )}
      {error && <div className="smart-input-error">{error}</div>}
    </div>
  );
}