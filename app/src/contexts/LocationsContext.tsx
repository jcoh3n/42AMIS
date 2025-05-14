'use client';

import { createContext, useContext, useEffect, useState, ReactNode } from 'react';
import { supabase } from '@/lib/supabase';
import { LocationType } from '@/types/types';
import { useAuth } from './AuthContext';
import { fetchLocations } from '@/lib/api42';

interface LocationsContextType {
  locations: LocationType[];
  loading: boolean;
  error: string | null;
  campusId: number;
  setCampusId: (id: number) => void;
}

const LocationsContext = createContext<LocationsContextType | undefined>(undefined);

export function LocationsProvider({ children }: { children: ReactNode }) {
  const [locations, setLocations] = useState<LocationType[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [campusId, setCampusId] = useState(1);
  const { accessToken } = useAuth();

  // Load initial data and subscribe to Supabase Realtime
  useEffect(() => {
    if (!accessToken) return;

    const loadInitialData = async () => {
      setLoading(true);
      setError(null);
      
      try {
        const data = await fetchLocations(accessToken, campusId);
        setLocations(data);
      } catch (err) {
        console.error('Error fetching locations:', err);
        setError('Failed to load locations. Please try again.');
      } finally {
        setLoading(false);
      }
    };

    loadInitialData();

    // Subscribe to real-time updates from Supabase
    const subscription = supabase
      .channel('locations')
      .on('postgres_changes', { 
        event: '*', 
        schema: 'public', 
        table: 'locations',
        filter: `campus_id=eq.${campusId}` 
      }, (payload) => {
        // Handle real-time updates
        if (payload.eventType === 'INSERT' || payload.eventType === 'UPDATE') {
          const newLocation = payload.new as LocationType;
          
          setLocations(current => {
            // Update or add the location
            const index = current.findIndex(loc => 
              loc.host === newLocation.host && 
              loc.user?.login === newLocation.user?.login
            );
            
            if (index >= 0) {
              const updated = [...current];
              updated[index] = newLocation;
              return updated;
            } else {
              return [...current, newLocation];
            }
          });
        } else if (payload.eventType === 'DELETE') {
          const deletedLocation = payload.old as LocationType;
          
          setLocations(current => 
            current.filter(loc => 
              loc.host !== deletedLocation.host || 
              loc.user?.login !== deletedLocation.user?.login
            )
          );
        }
      })
      .subscribe();

    // Cleanup on unmount
    return () => {
      subscription.unsubscribe();
    };
  }, [accessToken, campusId]);

  return (
    <LocationsContext.Provider
      value={{
        locations,
        loading,
        error,
        campusId,
        setCampusId
      }}
    >
      {children}
    </LocationsContext.Provider>
  );
}

export function useLocations() {
  const context = useContext(LocationsContext);
  if (context === undefined) {
    throw new Error('useLocations must be used within a LocationsProvider');
  }
  return context;
} 