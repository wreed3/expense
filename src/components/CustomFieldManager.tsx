import React, { useEffect, useState } from 'react';
import { useCustomFieldStore } from '../stores/customFieldStore';
import toast from 'react-hot-toast';

const FIELD_TYPES = [
  { value: 'text', label: 'Text', icon: '📝' },
  { value: 'number', label: 'Number', icon: '🔢' },
  { value: 'date', label: 'Date', icon: '📅' },
  { value: 'boolean', label: 'Yes/No', icon: '✓✗' },
  { value: 'select', label: 'Dropdown', icon: '📋' },
];

export default function CustomFieldManager() {
  const { customFields, fetchCustomFields, addCustomField, updateCustomField, deleteCustomField, isLoading } = useCustomFieldStore();
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingField, setEditingField] = useState<any>(null);
  const [formData, setFormData] = useState({
    name: '',
    field_type: 'text' as 'text' | 'number' | 'date' | 'boolean' | 'select',
    options: [] as string[],
    is_required: false,
  });
  const [optionInput, setOptionInput] = useState('');

  useEffect(() => {
    fetchCustomFields();
  }, []);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (formData.field_type === 'select' && formData.options.length === 0) {
      toast.error('Please add at least one option for dropdown field');
      return;
    }

    try {
      const data = {
        ...formData,
        options: formData.field_type === 'select' ? JSON.stringify(formData.options) : undefined,
      };

      if (editingField) {
        await updateCustomField(editingField.id, data);
        toast.success('Custom field updated successfully');
      } else {
        await addCustomField(data);
        toast.success('Custom field created successfully');
      }
      handleClose();
    } catch (error: any) {
      toast.error(error.message);
    }
  };

  const handleEdit = (field: any) => {
    setEditingField(field);
    setFormData({
      name: field.name,
      field_type: field.field_type,
      options: field.options || [],
      is_required: field.is_required,
    });
    setIsModalOpen(true);
  };

  const handleDelete = async (id: number) => {
    if (window.confirm('Are you sure you want to delete this custom field? All associated data will be lost.')) {
      try {
        await deleteCustomField(id);
        toast.success('Custom field deleted successfully');
      } catch (error: any) {
        toast.error(error.message);
      }
    }
  };

  const handleClose = () => {
    setIsModalOpen(false);
    setEditingField(null);
    setFormData({
      name: '',
      field_type: 'text',
      options: [],
      is_required: false,
    });
    setOptionInput('');
  };

  const addOption = () => {
    if (optionInput.trim()) {
      setFormData({
        ...formData,
        options: [...formData.options, optionInput.trim()]
      });
      setOptionInput('');
    }
  };

  const removeOption = (index: number) => {
    setFormData({
      ...formData,
      options: formData.options.filter((_, i) => i !== index)
    });
  };

  return (
    <div className="bg-white rounded-lg shadow p-6">
      <div className="flex justify-between items-center mb-6">
        <div>
          <h2 className="text-2xl font-bold text-gray-900">Custom Fields</h2>
          <p className="text-gray-600 mt-1">Add custom fields to track additional expense information</p>
        </div>
        <button
          onClick={() => setIsModalOpen(true)}
          className="px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700"
        >
          Create Field
        </button>
      </div>

      {isLoading ? (
        <div className="text-center py-8">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto"></div>
        </div>
      ) : customFields.length === 0 ? (
        <div className="text-center py-12 text-gray-500">
          <div className="text-4xl mb-3">📝</div>
          <p>No custom fields yet. Create fields to capture additional expense details.</p>
        </div>
      ) : (
        <div className="space-y-4">
          {customFields.map(field => (
            <div
              key={field.id}
              className="border border-gray-200 rounded-lg p-4 hover:shadow-md transition-shadow"
            >
              <div className="flex items-center justify-between">
                <div className="flex-1">
                  <div className="flex items-center gap-2 mb-1">
                    <span className="text-2xl">
                      {FIELD_TYPES.find(t => t.value === field.field_type)?.icon}
                    </span>
                    <span className="font-medium text-gray-900">{field.name}</span>
                    {field.is_required && (
                      <span className="px-2 py-1 text-xs bg-red-100 text-red-800 rounded">
                        Required
                      </span>
                    )}
                  </div>
                  <div className="text-sm text-gray-500">
                    Type: {FIELD_TYPES.find(t => t.value === field.field_type)?.label}
                    {field.field_type === 'select' && field.options && (
                      <span className="ml-2">
                        ({field.options.length} options)
                      </span>
                    )}
                  </div>
                  {field.field_type === 'select' && field.options && (
                    <div className="mt-2 flex flex-wrap gap-1">
                      {field.options.map((option, i) => (
                        <span
                          key={i}
                          className="px-2 py-1 text-xs bg-gray-100 text-gray-700 rounded"
                        >
                          {option}
                        </span>
                      ))}
                    </div>
                  )}
                </div>
                <div className="flex gap-2">
                  <button
                    onClick={() => handleEdit(field)}
                    className="text-blue-600 hover:text-blue-800 text-sm"
                  >
                    Edit
                  </button>
                  <button
                    onClick={() => handleDelete(field.id)}
                    className="text-red-600 hover:text-red-800 text-sm"
                  >
                    Delete
                  </button>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}

      {isModalOpen && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-lg p-6 w-full max-w-md max-h-[90vh] overflow-y-auto">
            <h3 className="text-lg font-bold mb-4">
              {editingField ? 'Edit Custom Field' : 'Create Custom Field'}
            </h3>
            <form onSubmit={handleSubmit}>
              <div className="mb-4">
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Field Name
                </label>
                <input
                  type="text"
                  value={formData.name}
                  onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                  required
                  maxLength={100}
                />
              </div>

              <div className="mb-4">
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Field Type
                </label>
                <select
                  value={formData.field_type}
                  onChange={(e) => setFormData({ 
                    ...formData, 
                    field_type: e.target.value as any,
                    options: e.target.value === 'select' ? formData.options : []
                  })}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                >
                  {FIELD_TYPES.map(type => (
                    <option key={type.value} value={type.value}>
                      {type.icon} {type.label}
                    </option>
                  ))}
                </select>
              </div>

              {formData.field_type === 'select' && (
                <div className="mb-4">
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Dropdown Options
                  </label>
                  <div className="flex gap-2 mb-2">
                    <input
                      type="text"
                      value={optionInput}
                      onChange={(e) => setOptionInput(e.target.value)}
                      onKeyPress={(e) => e.key === 'Enter' && (e.preventDefault(), addOption())}
                      placeholder="Add option"
                      className="flex-1 px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                    />
                    <button
                      type="button"
                      onClick={addOption}
                      className="px-4 py-2 bg-gray-600 text-white rounded-md hover:bg-gray-700"
                    >
                      Add
                    </button>
                  </div>
                  <div className="space-y-1">
                    {formData.options.map((option, index) => (
                      <div key={index} className="flex items-center justify-between bg-gray-50 px-3 py-2 rounded">
                        <span className="text-sm">{option}</span>
                        <button
                          type="button"
                          onClick={() => removeOption(index)}
                          className="text-red-600 hover:text-red-800"
                        >
                          ×
                        </button>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              <div className="mb-6">
                <label className="flex items-center gap-2">
                  <input
                    type="checkbox"
                    checked={formData.is_required}
                    onChange={(e) => setFormData({ ...formData, is_required: e.target.checked })}
                    className="rounded"
                  />
                  <span className="text-sm font-medium text-gray-700">
                    Required field
                  </span>
                </label>
              </div>

              <div className="flex justify-end gap-2">
                <button
                  type="button"
                  onClick={handleClose}
                  className="px-4 py-2 text-gray-700 hover:bg-gray-100 rounded-md"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700"
                >
                  {editingField ? 'Update' : 'Create'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}