import React from 'react';
import { campusLayout } from '../config/campusLayout';

function FloorSelector({ floors, selectedFloor, onSelectFloor }) {
  return (
    <div className="mb-4">
      <h2 className="text-lg font-medium text-gray-900 mb-3">Select Floor</h2>
      <div className="flex flex-wrap gap-2">
        {floors.map((floor) => (
          <button
            key={floor}
            onClick={() => onSelectFloor(floor)}
            className={`floor-btn ${
              selectedFloor === floor ? 'floor-btn-active' : 'floor-btn-inactive'
            }`}
          >
            Floor {floor}
          </button>
        ))}
      </div>
    </div>
  );
}

export default FloorSelector;
