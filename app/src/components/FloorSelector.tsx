'use client';

import { campusLayout } from '@/data/campusLayout';

interface FloorSelectorProps {
  currentFloor: string;
  onFloorChange: (floorKey: string) => void;
}

export default function FloorSelector({ currentFloor, onFloorChange }: FloorSelectorProps) {
  return (
    <div className="flex justify-center mb-4 space-x-2 overflow-x-auto">
      {Object.entries(campusLayout).map(([floorKey, floor]) => (
        <button
          key={floorKey}
          className={`px-3 py-1 rounded ${
            currentFloor === floorKey
              ? 'bg-blue-600 text-white'
              : 'bg-gray-200 hover:bg-gray-300'
          }`}
          onClick={() => onFloorChange(floorKey)}
        >
          {floor.name}
        </button>
      ))}
    </div>
  );
} 