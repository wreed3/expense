import React, { useEffect, useState } from 'react';
import { useTagStore } from '../stores/tagStore';
import { Tag } from '../types';

interface TagSelectorProps {
  selectedTags: number[];
  onChange: (tagIds: number[]) => void;
  label?: string;
  className?: string;
}

export default function TagSelector({ 
  selectedTags, 
  onChange, 
  label = 'Tags',
  className = ''
}: TagSelectorProps) {
  const { tags, fetchTags } = useTagStore();
  const [isOpen, setIsOpen] = useState(false);

  useEffect(() => {
    if (tags.length === 0) {
      fetchTags();
    }
  }, []);

  const toggleTag = (tagId: number) => {
    if (selectedTags.includes(tagId)) {
      onChange(selectedTags.filter(id => id !== tagId));
    } else {
      onChange([...selectedTags, tagId]);
    }
  };

  const selectedTagObjects = tags.filter(tag => selectedTags.includes(tag.id));

  return (
    <div className={className}>
      <label className="block text-sm font-medium text-gray-700 mb-1">
        {label}
      </label>
      <div className="relative">
        <div
          onClick={() => setIsOpen(!isOpen)}
          className="w-full px-3 py-2 border border-gray-300 rounded-md cursor-pointer min-h-[42px] flex flex-wrap gap-1 items-center"
        >
          {selectedTagObjects.length === 0 ? (
            <span className="text-gray-400">Select tags...</span>
          ) : (
            selectedTagObjects.map(tag => (
              <span
                key={tag.id}
                className="inline-flex items-center gap-1 px-2 py-1 rounded-full text-sm"
                style={{ 
                  backgroundColor: tag.color ? `${tag.color}20` : '#3B82F620',
                  color: tag.color || '#3B82F6'
                }}
              >
                <div
                  className="w-2 h-2 rounded-full"
                  style={{ backgroundColor: tag.color || '#3B82F6' }}
                />
                {tag.name}
                <button
                  type="button"
                  onClick={(e) => {
                    e.stopPropagation();
                    toggleTag(tag.id);
                  }}
                  className="ml-1 hover:opacity-70"
                >
                  ×
                </button>
              </span>
            ))
          )}
        </div>

        {isOpen && (
          <div className="absolute z-10 w-full mt-1 bg-white border border-gray-300 rounded-md shadow-lg max-h-60 overflow-auto">
            {tags.length === 0 ? (
              <div className="px-3 py-2 text-gray-500 text-sm">
                No tags available
              </div>
            ) : (
              tags.map(tag => (
                <div
                  key={tag.id}
                  onClick={() => toggleTag(tag.id)}
                  className="px-3 py-2 hover:bg-gray-100 cursor-pointer flex items-center gap-2"
                >
                  <input
                    type="checkbox"
                    checked={selectedTags.includes(tag.id)}
                    onChange={() => {}}
                    className="rounded"
                  />
                  <div
                    className="w-3 h-3 rounded-full"
                    style={{ backgroundColor: tag.color || '#3B82F6' }}
                  />
                  <span>{tag.name}</span>
                </div>
              ))
            )}
          </div>
        )}
      </div>
    </div>
  );
}