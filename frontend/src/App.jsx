import { useState, useEffect } from 'react'
import FloorSelector from './components/FloorSelector'
import SeatingMap from './components/SeatingMap'
import Legend from './components/Legend'
import useSocket from './hooks/useSocket'
import useLocations from './hooks/useLocations'

function App() {
  const [selectedFloor, setSelectedFloor] = useState('1');
  const { isConnected, lastUpdate } = useSocket();
  const { locations, loading, error, fetchLocations } = useLocations();

  const availableFloors = ['1', '2', '3', '4', '5']; // Example floors

  // Refetch data every 30 seconds if socket is not connected
  useEffect(() => {
    if (!isConnected) {
      const interval = setInterval(() => {
        fetchLocations();
      }, 30000);
      
      return () => clearInterval(interval);
    }
  }, [isConnected, fetchLocations]);

  // Format last update time
  const formattedTime = lastUpdate ? new Date(lastUpdate).toLocaleTimeString() : 'N/A';

  return (
    <div className="container mx-auto px-4 py-8 max-w-6xl">
      <header className="mb-8">
        <h1 className="text-3xl font-bold text-gray-900 mb-2">42AMIS Seating Map</h1>
        <div className="flex flex-wrap items-center gap-4 text-sm text-gray-600">
          <div className={`flex items-center ${isConnected ? 'text-green-600' : 'text-gray-500'}`}>
            <div className={`w-2 h-2 rounded-full mr-2 ${isConnected ? 'bg-green-600' : 'bg-gray-500'}`}></div>
            {isConnected ? 'Live Updates' : 'Polling Updates'}
          </div>
          <div>Last update: {formattedTime}</div>
        </div>
      </header>

      <div className="bg-white rounded-xl shadow-md p-6 mb-8">
        <FloorSelector
          floors={availableFloors}
          selectedFloor={selectedFloor}
          onSelectFloor={setSelectedFloor}
        />

        <div className="mt-8">
          {loading ? (
            <div className="flex justify-center items-center h-64">
              <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-gray-900"></div>
            </div>
          ) : error ? (
            <div className="text-center text-red-500 p-4 border border-red-200 rounded-lg">
              Error loading data: {error}
            </div>
          ) : (
            <>
              <Legend />
              <div className="mt-4 overflow-x-auto">
                <SeatingMap locations={locations} floor={selectedFloor} />
              </div>
            </>
          )}
        </div>
      </div>

      <footer className="text-center text-gray-500 text-sm">
        &copy; {new Date().getFullYear()} 42AMIS - Data from 42 API
      </footer>
    </div>
  )
}

export default App 