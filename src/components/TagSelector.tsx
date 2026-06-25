import React, { useState } from 'react';
import { Tag, X, Plus } from 'lucide-react';
import { useTagStore } from '../stores/tagStore';

interface TagSelectorProps {
  selectedTags: string[];
  onChange: (tags: string[]) => void;
  className?: string;
}

export function TagSelector({ selectedTags, onChange, className = '' }: TagSelectorProps) {
  const { tags, addTag } = useTagStore();
  const [newTag, setNewTag] = useState('');
  const [isAdding, setIsAdding] = useState(false);

  const handleAddTag = async () => {
    if (newTag.trim()) {
      await addTag(newTag.trim());
      onChange([...selectedTags, newTag.trim()]);
      setNewTag('');
      setIsAdding(false);
    }
  };

  const toggleTag = (tagName: string) => {
    if (selectedTags.includes(tagName)) {
      onChange(selectedTags.filter(t => t !== tagName));
    } else {
      onChange([...selectedTags, tagName]);
    }
  };

  const removeTag = (tagName: string) => {
    onChange(selectedTags.filter(t => t !== tagName));
  };

  return (
    <div className={className}>
      <label className="block text-sm font-medium text-gray-700 mb-2">
        <Tag className="w-4 h-4 inline mr-1" />
        Tags
      </label>

      {/* Selected Tags */}
      {selectedTags.length > 0 && (
        <div className="flex flex-wrap gap-2 mb-3">
          {selectedTags.map((tag) => (
            <span
              key={tag}
              className="inline-flex items-center gap-1 px-3 py-1 bg-indigo-100 text-indigo-700 rounded-full text-sm font-medium"
            >
              {tag}
              <button
                type="button"
                onClick={() => removeTag(tag)}
                className="hover:text-indigo-900"
              >
                <X className="w-3 h-3" />
              </button>
            </span>
          ))}
        </div>
      )}

      {/* Available Tags */}
      <div className="flex flex-wrap gap-2 mb-3">
        {tags
          .filter(tag => !selectedTags.includes(tag.name))
          .map((tag) => (
            <button
              key={tag.id}
              type="button"
              onClick={() => toggleTag(tag.name)}
              className="px-3 py-1 bg-gray-100 text-gray-700 rounded-full text-sm font-medium hover:bg-gray-200 transition-colors"
            >
              {tag.name}
            </button>
          ))}
      </div>

      {/* Add New Tag */}
      {isAdding ? (
        <div className="flex gap-2">
          <input
            type="text"
            value={newTag}
            onChange={(e) => setNewTag(e.target.value)}
            onKeyPress={(e) => e.key === 'Enter' && (e.preventDefault(), handleAddTag())}
            placeholder="Enter tag name..."
            className="flex-1 px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-transparent text-sm"
            autoFocus
          />
          <button
            type="button"
            onClick={handleAddTag}
            className="px-4 py-2 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 transition-colors text-sm font-medium"
          >
            Add
          </button>
          <button
            type="button"
            onClick={() => {
              setIsAdding(false);
              setNewTag('');
            }}
            className="px-4 py-2 border border-gray-300 rounded-lg text-gray-700 hover:bg-gray-50 transition-colors text-sm font-medium"
          >
            Cancel
          </button>
        </div>
      ) : (
        <button
          type="button"
          onClick={() => setIsAdding(true)}
          className="flex items-center gap-1 px-3 py-2 text-sm font-medium text-indigo-600 hover:text-indigo-700 hover:bg-indigo-50 rounded-lg transition-colors"
        >
          <Plus className="w-4 h-4" />
          Add New Tag
        </button>
      )}
    </div>
  );
}