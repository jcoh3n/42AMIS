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
      <div className="flex justify-center items-center min-h-screen bg-gray-50">
        <div className="animate-spin rounded-full h-10 w-10 border-t-2 border-b-2 border-blue-600"></div>
      </div>
    );
  }
  
  if (!isAuthenticated) {
    return (
      <div className="flex flex-col justify-center items-center min-h-screen bg-gray-50">
        <div className="text-center p-8 bg-white rounded-lg shadow-lg max-w-md">
          <h1 className="text-3xl font-bold mb-6 text-gray-800">42 Seating Map</h1>
          <p className="mb-6 text-gray-600">Sign in with your 42 account to view the campus seating map</p>
          <button
            onClick={login}
            className="px-6 py-3 bg-blue-600 text-white font-medium rounded-md hover:bg-blue-700 transition-colors shadow-md mb-4 w-full"
          >
            Login with 42
          </button>
        </div>
      </div>
    );
  }
  
  return (
    <LocationsProvider>
      <div className="min-h-screen bg-gray-50 py-8">
        <div className="container mx-auto px-4">
          <header className="mb-8 flex justify-between items-center">
            <h1 className="text-3xl font-bold text-gray-800">42 Seating Map</h1>
          </header>
          
          <FloorSelector
            currentFloor={currentFloor}
            onFloorChange={setCurrentFloor}
          />
          
          <SeatingMap currentFloor={currentFloor} />
          
          <div className="mt-8 bg-white rounded-lg shadow-lg p-6">
            <h2 className="text-xl font-semibold mb-4">Legend</h2>
            <div className="flex items-center space-x-6">
              <div className="flex items-center">
                <div className="w-7 h-7 bg-green-600 rounded-md flex items-center justify-center text-white shadow-sm mr-2">
                  <span className="text-xs">A</span>
                </div>
                <span className="text-gray-700">Occupied</span>
              </div>
              <div className="flex items-center">
                <div className="w-7 h-7 bg-gray-200 rounded-md mr-2"></div>
                <span className="text-gray-700">Available</span>
              </div>
            </div>
          </div>
          
          <footer className="mt-10 text-center text-gray-500 text-sm">
            <p>Made with ❤️ for 42 students</p>
          </footer>
        </div>
      </div>
    </LocationsProvider>
  );
}
