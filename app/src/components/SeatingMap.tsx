'use client';

import { useState, useEffect } from 'react';
import { campusLayout } from '@/data/campusLayout';
import { SeatType } from '@/types/types';
import Seat from './Seat';
import { useLocations } from '@/contexts/LocationsContext';

interface SeatingMapProps {
  currentFloor: string;
}

export default function SeatingMap({ currentFloor }: SeatingMapProps) {
  const { locations, loading, error, refreshLocations } = useLocations();
  const [seats, setSeats] = useState<SeatType[]>([]);
  const [stats, setStats] = useState({ total: 0, occupied: 0 });
  const [refreshing, setRefreshing] = useState(false);
  
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
    setStats({ total: newSeats.length, occupied: 0 });
  }, [currentFloor]);
  
  // Update seats with location data
  useEffect(() => {
    if (!locations.length) return;
    
    console.log('Updating seats with locations', locations.length);
    let occupiedCount = 0;
    
    setSeats(prevSeats => {
      const updatedSeats = [...prevSeats];
      
      // Reset all seats to unoccupied
      updatedSeats.forEach(seat => {
        seat.isOccupied = false;
        seat.user = undefined;
      });
      
      // Update seats based on location data
      locations.forEach(location => {
        if (!location.host) {
          console.log('Location missing host data:', location);
          return;
        }

        const host = location.host.toLowerCase();
        console.log('Processing location host:', host);
        
        // Extraction améliorée de l'information d'hôte
        // Format attendu: f1r9s7, f2r3s12, f1br7s3, etc.
        // Extraire le préfixe d'étage (f1, f2, etc.)
        const floorMatch = host.match(/^(f\d+)/);
        if (!floorMatch) {
          console.log('Could not parse floor from host:', host);
          return;
        }
        
        const floorPrefix = floorMatch[1];
        if (floorPrefix !== currentFloor) {
          // Ignorer les postes d'autres étages
          return;
        }
        
        // Extraire les informations de rangée et de siège
        // Formats possibles: f1r9s7, f1br7s3
        const seatInfoMatch = host.match(/^f\d+(br?|r)(\d+)s(\d+)$/);
        if (!seatInfoMatch) {
          console.log('Could not parse row and seat from host:', host);
          return;
        }
        
        const rowType = seatInfoMatch[1]; // 'r' ou 'br'
        const rowNum = seatInfoMatch[2];  // numéro de rangée
        const seatNum = seatInfoMatch[3]; // numéro de siège
        
        // Construire l'ID du siège tel qu'il est dans notre modèle
        const rowId = rowType + rowNum;
        const seatId = 's' + seatNum;
        const fullSeatId = rowId + seatId;
        
        console.log('Mapped to seat ID:', fullSeatId);
        
        const seatIndex = updatedSeats.findIndex(seat => seat.id === fullSeatId);
        if (seatIndex >= 0) {
          updatedSeats[seatIndex].isOccupied = true;
          updatedSeats[seatIndex].user = location.user;
          occupiedCount++;
        } else {
          console.log('Seat not found in layout:', fullSeatId);
        }
      });
      
      setStats({
        total: updatedSeats.length,
        occupied: occupiedCount
      });
      
      return updatedSeats;
    });
    
    // Arrêter l'animation de rafraîchissement
    setRefreshing(false);
  }, [locations, currentFloor]);
  
  // Ajouter un log pour voir les données des emplacements
  useEffect(() => {
    console.log('SeatingMap locations:', locations);
  }, [locations]);
  
  const handleRefresh = async () => {
    setRefreshing(true);
    await refreshLocations();
  };
  
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
  
  // Sort rows to display them in descending order (R13, R12, R11, etc.)
  const sortedRows = Object.keys(seatsByRow).sort((a, b) => {
    const aNum = parseInt(a.replace(/[^\d]/g, ''));
    const bNum = parseInt(b.replace(/[^\d]/g, ''));
    return bNum - aNum;
  });
  
  return (
    <div className="relative">
      {/* Add debug info */}
      <div className="absolute top-2 right-2 bg-black/60 text-white p-2 rounded text-xs z-10">
        Status: {loading ? 'Loading...' : error ? `Error: ${error}` : `${stats.occupied} seats occupied`}
      </div>
      
      <div className="bg-white rounded-lg shadow-lg p-6">
        <div className="flex justify-between items-center mb-6">
          <h2 className="text-xl font-semibold">{floorLayout.name}</h2>
          <div className="flex items-center space-x-4">
            <button 
              onClick={handleRefresh}
              disabled={loading || refreshing}
              className="text-blue-600 hover:text-blue-800 disabled:text-gray-400 flex items-center"
            >
              <svg 
                className={`w-5 h-5 mr-1 ${refreshing ? 'animate-spin' : ''}`} 
                fill="none" 
                stroke="currentColor" 
                viewBox="0 0 24 24" 
                xmlns="http://www.w3.org/2000/svg"
              >
                <path 
                  strokeLinecap="round" 
                  strokeLinejoin="round" 
                  strokeWidth={2} 
                  d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" 
                />
              </svg>
              {refreshing ? 'Rafraîchissement...' : 'Actualiser'}
            </button>
            <div className="text-sm bg-gray-100 px-3 py-1 rounded-full">
              <span className="text-green-600 font-medium">{stats.occupied}</span>
              <span className="mx-1">/</span>
              <span>{stats.total}</span>
              <span className="ml-1 text-gray-500">seats occupied</span>
            </div>
          </div>
        </div>
        
        <div className="overflow-auto bg-gray-50 p-4 rounded-lg max-h-[calc(100vh-240px)]">
          {loading ? (
            <div className="flex justify-center items-center py-8">
              <div className="animate-spin rounded-full h-8 w-8 border-t-2 border-b-2 border-blue-600"></div>
            </div>
          ) : (
            sortedRows.map(rowId => (
              <div key={rowId} className="flex items-center mb-4">
                <div className="w-12 font-medium text-right mr-3 text-gray-600">{rowId.toUpperCase()}</div>
                <div className="flex flex-wrap">
                  {seatsByRow[rowId].map(seat => (
                    <Seat key={seat.id} seat={seat} />
                  ))}
                </div>
              </div>
            ))
          )}
        </div>
      </div>
    </div>
  );
} 