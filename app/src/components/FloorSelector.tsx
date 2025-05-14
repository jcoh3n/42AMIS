'use client';

import { campusLayout } from '@/data/campusLayout';

interface FloorSelectorProps {
  currentFloor: string;
  onFloorChange: (floorKey: string) => void;
}

export default function FloorSelector({ currentFloor, onFloorChange }: FloorSelectorProps) {
  return (
    <div className="flex justify-center mb-6 space-x-2 overflow-x-auto pb-1">
      {Object.entries(campusLayout).map(([floorKey, floor]) => (
        <button
          key={floorKey}
          className={`
            px-4 py-2 rounded-md font-medium transition-all duration-200
            ${currentFloor === floorKey
              ? 'bg-blue-600 text-white shadow-md transform scale-105'
              : 'bg-gray-200 text-gray-700 hover:bg-gray-300 hover:shadow'
            }
          `}
          onClick={() => onFloorChange(floorKey)}
        >
          {floor.name}
        </button>
      ))}
    </div>
  );
} 