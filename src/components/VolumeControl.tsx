import React from 'react';
import { Volume1, Volume2, VolumeX } from 'lucide-react';
import { useSamplerStore } from '../store/useSamplerStore';

export const VolumeControl: React.FC = () => {
  const { volume, setVolume } = useSamplerStore();

  const VolumeIcon = volume === 0 ? VolumeX : volume < 0.5 ? Volume1 : Volume2;

  return (
    <div className="flex items-center gap-2 bg-gray-800 rounded-lg p-2">
      <VolumeIcon className="w-6 h-6 text-white" />
      <input
        type="range"
        min="0"
        max="1"
        step="0.01"
        value={volume}
        onChange={(e) => setVolume(parseFloat(e.target.value))}
        className="w-24 h-2 bg-gray-600 rounded-lg appearance-none cursor-pointer"
      />
    </div>
  );
};