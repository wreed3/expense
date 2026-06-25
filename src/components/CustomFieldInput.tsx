import React from 'react';

interface CustomField {
  id: number;
  name: string;
  field_type: 'text' | 'number' | 'date' | 'boolean' | 'select';
  options?: string[];
  is_required: boolean;
}

interface CustomFieldInputProps {
  field: CustomField;
  value: any;
  onChange: (value: any) => void;
  className?: string;
}

export default function CustomFieldInput({ field, value, onChange, className = '' }: CustomFieldInputProps) {
  const renderInput = () => {
    switch (field.field_type) {
      case 'text':
        return (
          <input
            type="text"
            value={value || ''}
            onChange={(e) => onChange(e.target.value)}
            className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
            required={field.is_required}
          />
        );

      case 'number':
        return (
          <input
            type="number"
            value={value || ''}
            onChange={(e) => onChange(parseFloat(e.target.value))}
            className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
            required={field.is_required}
            step="any"
          />
        );

      case 'date':
        return (
          <input
            type="date"
            value={value || ''}
            onChange={(e) => onChange(e.target.value)}
            className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
            required={field.is_required}
          />
        );

      case 'boolean':
        return (
          <div className="flex items-center gap-4">
            <label className="flex items-center gap-2">
              <input
                type="radio"
                checked={value === true || value === 'true'}
                onChange={() => onChange(true)}
                className="rounded"
              />
              <span>Yes</span>
            </label>
            <label className="flex items-center gap-2">
              <input
                type="radio"
                checked={value === false || value === 'false'}
                onChange={() => onChange(false)}
                className="rounded"
              />
              <span>No</span>
            </label>
          </div>
        );

      case 'select':
        return (
          <select
            value={value || ''}
            onChange={(e) => onChange(e.target.value)}
            className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
            required={field.is_required}
          >
            <option value="">Select an option</option>
            {field.options?.map((option) => (
              <option key={option} value={option}>
                {option}
              </option>
            ))}
          </select>
        );

      default:
        return null;
    }
  };

  return (
    <div className={className}>
      <label className="block text-sm font-medium text-gray-700 mb-1">
        {field.name}
        {field.is_required && <span className="text-red-500 ml-1">*</span>}
      </label>
      {renderInput()}
    </div>
  );
}