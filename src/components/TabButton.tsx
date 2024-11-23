import React, { useState, useRef } from 'react';
import { Edit2 } from 'lucide-react';
import { useSamplerStore } from '../store/useSamplerStore';

interface TabButtonProps {
  id: string;
  name: string;
  isActive: boolean;
}

export const TabButton: React.FC<TabButtonProps> = ({ id, name, isActive }) => {
  const { setActiveTab, updateTabName } = useSamplerStore();
  const [isEditing, setIsEditing] = useState(false);
  const [longPressTimer, setLongPressTimer] = useState<NodeJS.Timeout | null>(null);
  const inputRef = useRef<HTMLInputElement>(null);

  const handleTouchStart = () => {
    const timer = setTimeout(() => {
      setIsEditing(true);
      setTimeout(() => inputRef.current?.focus(), 100);
    }, 800);
    setLongPressTimer(timer);
  };

  const handleTouchEnd = () => {
    if (longPressTimer) {
      clearTimeout(longPressTimer);
      setLongPressTimer(null);
    }
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const newName = inputRef.current?.value.trim();
    if (newName) {
      updateTabName(id, newName);
    }
    setIsEditing(false);
  };

  if (isEditing) {
    return (
      <form onSubmit={handleSubmit} className="min-w-[120px]">
        <input
          ref={inputRef}
          type="text"
          defaultValue={name}
          className="w-full px-4 py-2 rounded-lg bg-gray-700 text-white border border-gray-600 focus:outline-none focus:border-indigo-500"
          onBlur={handleSubmit}
          autoFocus
        />
      </form>
    );
  }

  return (
    <button
      onClick={() => setActiveTab(id)}
      onTouchStart={handleTouchStart}
      onTouchEnd={handleTouchEnd}
      onMouseDown={handleTouchStart}
      onMouseUp={handleTouchEnd}
      onMouseLeave={handleTouchEnd}
      className={`group relative px-4 py-2 rounded-lg font-medium transition-colors ${
        isActive
          ? 'bg-indigo-600 text-white'
          : 'bg-gray-800 text-gray-300 hover:bg-gray-700'
      }`}
    >
      <span>{name}</span>
      <Edit2 className="absolute right-1 top-1 w-3 h-3 opacity-0 group-hover:opacity-50 transition-opacity" />
    </button>
  );
};