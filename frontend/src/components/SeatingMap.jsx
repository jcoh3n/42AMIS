import React, { useMemo } from 'react';
import Seat from './Seat';
import { campusLayout } from '../config/campusLayout';

function SeatingMap({ locations, floor }) {
  // Filter locations for the current floor
  const floorLocations = useMemo(() => {
    if (!locations) return [];
    return locations.filter(loc => loc.floor === floor);
  }, [locations, floor]);
  
  // Get the layout for the current floor
  const currentLayout = useMemo(() => {
    return campusLayout[floor] || { rows: [], columns: [] };
  }, [floor]);
  
  // Calculate grid dimensions
  const gridStyle = {
    display: 'grid',
    gridTemplateColumns: `repeat(${currentLayout.columns}, minmax(2rem, 1fr))`,
    gap: '0.5rem',
  };

  return (
    <div className="seating-map pb-4">
      <h2 className="text-lg font-medium text-gray-900 mb-4">Floor {floor} Seating Map</h2>
      
      {floorLocations.length === 0 ? (
        <div className="text-center text-gray-500 p-8">
          No seats available for this floor
        </div>
      ) : (
        <div className="seating-grid" style={gridStyle}>
          {floorLocations.map((seat) => (
            <Seat
              key={seat.id}
              seat={seat}
              position={{ row: seat.row, col: seat.col }}
            />
          ))}
        </div>
      )}
    </div>
  );
}

export default SeatingMap;
