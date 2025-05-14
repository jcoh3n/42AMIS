'use client';

import { useState } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import FloorSelector from '@/components/FloorSelector';
import SeatingMap from '@/components/SeatingMap';
import { LocationsProvider } from '@/contexts/LocationsContext';

export default function Home() {
  const [currentFloor, setCurrentFloor] = useState('f1');
  const { isAuthenticated, loading, login } = useAuth();
  
  if (loading) {
    return (
      <div className="flex justify-center items-center min-h-screen">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
      </div>
    );
  }
  
  if (!isAuthenticated) {
    return (
      <div className="flex flex-col justify-center items-center min-h-screen">
        <h1 className="text-3xl font-bold mb-8">42 Seating Map</h1>
        <button
          onClick={login}
          className="px-4 py-2 bg-blue-600 text-white rounded hover:bg-blue-700 transition-colors"
        >
          Login with 42
        </button>
      </div>
    );
  }
  
  return (
    <LocationsProvider>
      <div className="container mx-auto px-4 py-8">
        <h1 className="text-3xl font-bold text-center mb-8">42 Seating Map</h1>
        
        <FloorSelector
          currentFloor={currentFloor}
          onFloorChange={setCurrentFloor}
        />
        
        <SeatingMap currentFloor={currentFloor} />
        
        <div className="mt-8 bg-white rounded-lg shadow-lg p-6">
          <h2 className="text-xl font-semibold mb-4">Legend</h2>
          <div className="flex items-center space-x-4">
            <div className="w-6 h-6 bg-green-500 rounded flex items-center justify-center text-white">
              A
            </div>
            <span>Occupied</span>
            <div className="w-6 h-6 bg-gray-200 rounded"></div>
            <span>Available</span>
          </div>
        </div>
      </div>
    </LocationsProvider>
  );
}
