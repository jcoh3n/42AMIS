'use client';

import { useState, useEffect } from 'react';
import { campusLayout } from '@/data/campusLayout';
import { LocationType, SeatType } from '@/types/types';
import Seat from './Seat';
import { useLocations } from '@/contexts/LocationsContext';

interface SeatingMapProps {
  currentFloor: string;
}

export default function SeatingMap({ currentFloor }: SeatingMapProps) {
  const { locations } = useLocations();
  const [seats, setSeats] = useState<SeatType[]>([]);
  
  // Set up the seats for the current floor
  useEffect(() => {
    if (!campusLayout[currentFloor]) return;
    
    const floorLayout = campusLayout[currentFloor];
    const newSeats: SeatType[] = [];
    
    floorLayout.detailedLayout.forEach(row => {
      row.seats.forEach(seatId => {
        newSeats.push({
          id: seatId,
          row: row.rowLabel.toLowerCase(),
          seat: seatId,
          floor: currentFloor,
          isOccupied: false
        });
      });
    });
    
    setSeats(newSeats);
  }, [currentFloor]);
  
  // Update seats with location data
  useEffect(() => {
    if (!locations.length) return;
    
    setSeats(prevSeats => {
      const updatedSeats = [...prevSeats];
      
      // Reset all seats to unoccupied
      updatedSeats.forEach(seat => {
        seat.isOccupied = false;
        seat.user = undefined;
      });
      
      // Update seats based on location data
      locations.forEach(location => {
        if (!location.user) return;
        
        const hostParts = location.host.split(/([a-z]+)(\d+)([a-z]+)(\d+)/i);
        if (hostParts.length < 5) return;
        
        const floorPrefix = hostParts[0];
        if (floorPrefix !== currentFloor) return;
        
        const rowId = hostParts[1] + hostParts[2];
        const seatId = hostParts[3] + hostParts[4];
        const fullSeatId = rowId + seatId;
        
        const seatIndex = updatedSeats.findIndex(seat => seat.id === fullSeatId);
        if (seatIndex >= 0) {
          updatedSeats[seatIndex].isOccupied = true;
          updatedSeats[seatIndex].user = location.user;
        }
      });
      
      return updatedSeats;
    });
  }, [locations, currentFloor]);
  
  if (!campusLayout[currentFloor]) {
    return <div className="text-center py-8">Floor not found</div>;
  }
  
  const floorLayout = campusLayout[currentFloor];
  
  // Group seats by row
  const seatsByRow: Record<string, SeatType[]> = {};
  seats.forEach(seat => {
    if (!seatsByRow[seat.row]) {
      seatsByRow[seat.row] = [];
    }
    seatsByRow[seat.row].push(seat);
  });
  
  return (
    <div className="bg-white rounded-lg shadow-lg p-6">
      <h2 className="text-xl font-semibold mb-4">{floorLayout.name}</h2>
      
      <div className="overflow-auto">
        {Object.entries(seatsByRow).map(([rowId, rowSeats]) => (
          <div key={rowId} className="flex items-center mb-4">
            <div className="w-12 font-medium text-right mr-2">{rowId.toUpperCase()}</div>
            <div className="flex flex-wrap">
              {rowSeats.map(seat => (
                <Seat key={seat.id} seat={seat} />
              ))}
            </div>
          </div>
        ))}
      </div>
    </div>
  );
} 