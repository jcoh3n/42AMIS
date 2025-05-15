import { useState, useEffect, useCallback } from 'react';
import { io } from 'socket.io-client';

function useSocket() {
  const [socket, setSocket] = useState(null);
  const [isConnected, setIsConnected] = useState(false);
  const [lastUpdate, setLastUpdate] = useState(null);

  // Initialize socket connection
  useEffect(() => {
    // Check if we're in production on Vercel where WebSockets are disabled
    const isVercel = process.env.VERCEL === '1';
    
    if (isVercel) {
      console.log('Running on Vercel - WebSockets disabled');
      return () => {};
    }
    
    // Create socket connection
    const socketInstance = io({
      path: '/socket.io',
      reconnectionAttempts: 5,
      reconnectionDelay: 5000,
    });

    setSocket(socketInstance);

    // Socket events
    socketInstance.on('connect', () => {
      console.log('Socket connected');
      setIsConnected(true);
    });

    socketInstance.on('disconnect', () => {
      console.log('Socket disconnected');
      setIsConnected(false);
    });

    socketInstance.on('location_update', (data) => {
      setLastUpdate(new Date());
      console.log('Received location update via socket');
    });

    // Cleanup on unmount
    return () => {
      socketInstance.disconnect();
    };
  }, []);

  return {
    socket,
    isConnected,
    lastUpdate
  };
}

export default useSocket; 