import { useState } from 'react';
import { Plus, X } from 'lucide-react';
import { Button } from './ui/button';
import { Input } from './ui/input';
import { Label } from './ui/label';

interface CustomField {
  key: string;
  value: string;
}

interface CustomFieldsInputProps {
  value: Record<string, string>;
  onChange: (fields: Record<string, string>) => void;
}

export function CustomFieldsInput({ value, onChange }: CustomFieldsInputProps) {
  const [fields, setFields] = useState<CustomField[]>(
    Object.entries(value).map(([key, val]) => ({ key, value: val }))
  );

  const addField = () => {
    setFields([...fields, { key: '', value: '' }]);
  };

  const removeField = (index: number) => {
    const newFields = fields.filter((_, i) => i !== index);
    setFields(newFields);
    updateParent(newFields);
  };

  const updateField = (index: number, field: 'key' | 'value', val: string) => {
    const newFields = [...fields];
    newFields[index][field] = val;
    setFields(newFields);
    updateParent(newFields);
  };

  const updateParent = (newFields: CustomField[]) => {
    const obj: Record<string, string> = {};
    newFields.forEach((field) => {
      if (field.key) {
        obj[field.key] = field.value;
      }
    });
    onChange(obj);
  };

  return (
    <div className="space-y-3">
      <Label>Custom Fields</Label>
      {fields.map((field, index) => (
        <div key={index} className="flex gap-2">
          <Input
            placeholder="Field name"
            value={field.key}
            onChange={(e) => updateField(index, 'key', e.target.value)}
          />
          <Input
            placeholder="Value"
            value={field.value}
            onChange={(e) => updateField(index, 'value', e.target.value)}
          />
          <Button
            type="button"
            variant="ghost"
            size="sm"
            onClick={() => removeField(index)}
          >
            <X className="h-4 w-4" />
          </Button>
        </div>
      ))}
      <Button type="button" variant="outline" size="sm" onClick={addField}>
        <Plus className="h-4 w-4 mr-1" />
        Add Field
      </Button>
    </div>
  );
}