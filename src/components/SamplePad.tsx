import React, { useState } from 'react';
import { Music, Upload } from 'lucide-react';
import { useSamplerStore } from '../store/useSamplerStore';

interface SamplePadProps {
  id: string;
  name: string;
  url: string;
  data?: string;
  tabId: string;
}

export const SamplePad: React.FC<SamplePadProps> = ({ id, name, url, data, tabId }) => {
  const { playAudio, updateSample } = useSamplerStore();
  const [longPressTimer, setLongPressTimer] = useState<NodeJS.Timeout | null>(null);

  const handleTouchStart = () => {
    const timer = setTimeout(() => {
      handleFileSelect();
    }, 800);
    setLongPressTimer(timer);
  };

  const handleTouchEnd = () => {
    if (longPressTimer) {
      clearTimeout(longPressTimer);
      setLongPressTimer(null);
    }
  };

  const handleFileSelect = () => {
    const input = document.createElement('input');
    input.type = 'file';
    input.accept = 'audio/mpeg';
    input.onchange = (e) => {
      const file = (e.target as HTMLInputElement).files?.[0];
      if (file) {
        updateSample(tabId, id, file);
      }
    };
    input.click();
  };

  return (
    <button
      className={`relative w-full aspect-square rounded-xl ${
        url ? 'bg-indigo-600 hover:bg-indigo-700' : 'bg-gray-600 hover:bg-gray-700'
      } text-white font-semibold shadow-lg transition-all duration-150 active:scale-95`}
      onClick={() => url && playAudio({ id, name, url, data })}
      onTouchStart={handleTouchStart}
      onTouchEnd={handleTouchEnd}
      onMouseDown={handleTouchStart}
      onMouseUp={handleTouchEnd}
      onMouseLeave={handleTouchEnd}
    >
      <div className="absolute inset-0 flex flex-col items-center justify-center p-2">
        {url ? (
          <>
            <Music className="w-8 h-8 mb-2" />
            <span className="text-sm truncate max-w-full px-2">{name}</span>
          </>
        ) : (
          <>
            <Upload className="w-8 h-8 mb-2" />
            <span className="text-sm">Load Sample</span>
          </>
        )}
      </div>
    </button>
  );
};