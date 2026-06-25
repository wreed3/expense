import React, { useEffect } from 'react';
import { useCustomFieldStore, CustomFieldValue } from '../stores/customFieldStore';

interface CustomFieldsInputProps {
  values: CustomFieldValue[];
  onChange: (values: CustomFieldValue[]) => void;
  className?: string;
}

export function CustomFieldsInput({ values, onChange, className = '' }: CustomFieldsInputProps) {
  const { customFields, fetchCustomFields, isLoading } = useCustomFieldStore();

  useEffect(() => {
    if (customFields.length === 0) {
      fetchCustomFields();
    }
  }, [customFields.length, fetchCustomFields]);

  const handleFieldChange = (fieldId: number, value: string) => {
    const existing = values.find(v => v.field_id === fieldId);
    
    if (existing) {
      onChange(values.map(v => 
        v.field_id === fieldId ? { ...v, value } : v
      ));
    } else {
      onChange([...values, { field_id: fieldId, value }]);
    }
  };

  const getFieldValue = (fieldId: number): string => {
    return values.find(v => v.field_id === fieldId)?.value || '';
  };

  if (isLoading) {
    return <div className={className}>Loading custom fields...</div>;
  }

  if (customFields.length === 0) {
    return null;
  }

  return (
    <div className={`space-y-4 ${className}`}>
      <h3 className="font-medium">Custom Fields</h3>
      
      {customFields.map(field => (
        <div key={field.id}>
          <label className="label">
            {field.name}
            {field.is_required && <span className="text-red-500 ml-1">*</span>}
          </label>
          
          {field.field_type === 'text' && (
            <input
              type="text"
              value={getFieldValue(field.id)}
              onChange={(e) => handleFieldChange(field.id, e.target.value)}
              required={field.is_required}
              className="input"
            />
          )}
          
          {field.field_type === 'number' && (
            <input
              type="number"
              value={getFieldValue(field.id)}
              onChange={(e) => handleFieldChange(field.id, e.target.value)}
              required={field.is_required}
              className="input"
            />
          )}
          
          {field.field_type === 'date' && (
            <input
              type="date"
              value={getFieldValue(field.id)}
              onChange={(e) => handleFieldChange(field.id, e.target.value)}
              required={field.is_required}
              className="input"
            />
          )}
          
          {field.field_type === 'boolean' && (
            <label className="flex items-center gap-2">
              <input
                type="checkbox"
                checked={getFieldValue(field.id) === 'true'}
                onChange={(e) => handleFieldChange(field.id, e.target.checked ? 'true' : 'false')}
                className="w-4 h-4"
              />
              <span className="text-sm text-gray-600">Yes</span>
            </label>
          )}
          
          {field.field_type === 'select' && field.options && (
            <select
              value={getFieldValue(field.id)}
              onChange={(e) => handleFieldChange(field.id, e.target.value)}
              required={field.is_required}
              className="input"
            >
              <option value="">Select an option</option>
              {field.options.map(option => (
                <option key={option} value={option}>
                  {option}
                </option>
              ))}
            </select>
          )}
        </div>
      ))}
    </div>
  );
}