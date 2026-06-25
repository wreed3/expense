import React, { useEffect, useState } from 'react';
import { useTagStore } from '../stores/tagStore';
import { X, Plus } from 'lucide-react';
import toast from 'react-hot-toast';

interface TagSelectorProps {
  selectedTagIds: number[];
  onChange: (tagIds: number[]) => void;
  className?: string;
}

export function TagSelector({ selectedTagIds, onChange, className = '' }: TagSelectorProps) {
  const { tags, fetchTags, createTag, isLoading } = useTagStore();
  const [isCreating, setIsCreating] = useState(false);
  const [newTagName, setNewTagName] = useState('');
  const [newTagColor, setNewTagColor] = useState('#3B82F6');

  useEffect(() => {
    if (tags.length === 0) {
      fetchTags();
    }
  }, [tags.length, fetchTags]);

  const handleToggleTag = (tagId: number) => {
    if (selectedTagIds.includes(tagId)) {
      onChange(selectedTagIds.filter(id => id !== tagId));
    } else {
      onChange([...selectedTagIds, tagId]);
    }
  };

  const handleCreateTag = async () => {
    if (!newTagName.trim()) {
      toast.error('Tag name is required');
      return;
    }

    try {
      const tag = await createTag({ name: newTagName, color: newTagColor });
      onChange([...selectedTagIds, tag.id]);
      setNewTagName('');
      setNewTagColor('#3B82F6');
      setIsCreating(false);
      toast.success('Tag created successfully');
    } catch (error) {
      toast.error('Failed to create tag');
    }
  };

  const selectedTags = tags.filter(tag => selectedTagIds.includes(tag.id));

  return (
    <div className={className}>
      <label className="label">Tags</label>
      
      {/* Selected tags */}
      <div className="flex flex-wrap gap-2 mb-2">
        {selectedTags.map(tag => (
          <span
            key={tag.id}
            className="inline-flex items-center gap-1 px-2 py-1 rounded text-sm"
            style={{ backgroundColor: tag.color + '20', color: tag.color }}
          >
            {tag.name}
            <button
              type="button"
              onClick={() => handleToggleTag(tag.id)}
              className="hover:bg-black/10 rounded p-0.5"
            >
              <X className="w-3 h-3" />
            </button>
          </span>
        ))}
      </div>

      {/* Tag selection dropdown */}
      {!isCreating && (
        <div className="space-y-2">
          <div className="flex flex-wrap gap-2">
            {tags
              .filter(tag => !selectedTagIds.includes(tag.id))
              .map(tag => (
                <button
                  key={tag.id}
                  type="button"
                  onClick={() => handleToggleTag(tag.id)}
                  className="px-2 py-1 rounded text-sm border hover:bg-gray-50"
                  style={{ borderColor: tag.color, color: tag.color }}
                >
                  {tag.name}
                </button>
              ))}
          </div>
          
          <button
            type="button"
            onClick={() => setIsCreating(true)}
            className="btn-secondary text-sm"
          >
            <Plus className="w-4 h-4" />
            Create New Tag
          </button>
        </div>
      )}

      {/* Create new tag form */}
      {isCreating && (
        <div className="space-y-2 p-3 border rounded bg-gray-50">
          <input
            type="text"
            value={newTagName}
            onChange={(e) => setNewTagName(e.target.value)}
            placeholder="Tag name"
            className="input"
          />
          <div className="flex items-center gap-2">
            <input
              type="color"
              value={newTagColor}
              onChange={(e) => setNewTagColor(e.target.value)}
              className="w-10 h-10 rounded cursor-pointer"
            />
            <button
              type="button"
              onClick={handleCreateTag}
              className="btn-primary flex-1"
            >
              Create
            </button>
            <button
              type="button"
              onClick={() => {
                setIsCreating(false);
                setNewTagName('');
                setNewTagColor('#3B82F6');
              }}
              className="btn-secondary"
            >
              Cancel
            </button>
          </div>
        </div>
      )}
    </div>
  );
}