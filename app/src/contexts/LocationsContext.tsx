'use client';

import { createContext, useContext, useEffect, useState, ReactNode, useCallback } from 'react';
import { LocationType } from '@/types/types';
import { useAuth } from './AuthContext';

interface LocationsContextType {
  locations: LocationType[];
  loading: boolean;
  error: string | null;
  campusId: number;
  setCampusId: (id: number) => void;
  refreshLocations: () => void;
}

const LocationsContext = createContext<LocationsContextType>({
  locations: [],
  loading: false,
  error: null,
  campusId: 1,
  setCampusId: () => {},
  refreshLocations: () => {}
});

export function LocationsProvider({ children }: { children: ReactNode }) {
  const [locations, setLocations] = useState<LocationType[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [campusId, setCampusId] = useState(1);
  const { isAuthenticated } = useAuth();

  // Fonction pour actualiser les données avec useCallback
  const refreshLocations = useCallback(async () => {
    if (!isAuthenticated) {
      console.log('Not authenticated, skipping location refresh');
      return;
    }
    
    setLoading(true);
    setError(null);
    
    try {
      console.log('Refreshing locations for campus', campusId);
      const data = await fetch(`/api/locations?campusId=${campusId}`);
      
      if (!data.ok) {
        const errorText = await data.text();
        console.error(`Error fetching locations: ${data.status} - ${errorText}`);
        throw new Error(`Erreur lors de la récupération des données: ${data.status} - ${errorText}`);
      }
      
      const locationsData = await data.json();
      
      if (!locationsData || (Array.isArray(locationsData) && locationsData.length === 0)) {
        console.warn('No locations data returned from API');
      } else {
        console.log(`Received ${Array.isArray(locationsData) ? locationsData.length : 'non-array'} locations`);
      }
      
      if (locationsData.error) {
        throw new Error(`API error: ${locationsData.error} - ${locationsData.details || ''}`);
      }
      
      setLocations(Array.isArray(locationsData) ? locationsData : []);
    } catch (err) {
      console.error('Erreur lors du chargement des emplacements:', err);
      setError(`Impossible de charger les emplacements. ${err instanceof Error ? err.message : 'Veuillez réessayer.'}`);
      // En cas d'erreur, on garde les anciennes données
    } finally {
      setLoading(false);
    }
  }, [isAuthenticated, campusId]);

  // Charger les données lors du montage du composant et lors du changement de campus
  useEffect(() => {
    if (isAuthenticated) {
      console.log('Loading locations due to auth state change or campus change');
      refreshLocations();
    }
    
    // Rafraîchir les données toutes les 30 secondes
    const interval = setInterval(() => {
      if (isAuthenticated) {
        console.log('Auto-refreshing locations');
        refreshLocations();
      }
    }, 30000);
    
    return () => clearInterval(interval);
  }, [isAuthenticated, campusId, refreshLocations]);

  return (
    <LocationsContext.Provider
      value={{
        locations,
        loading,
        error,
        campusId,
        setCampusId,
        refreshLocations
      }}
    >
      {children}
    </LocationsContext.Provider>
  );
}

export function useLocations() {
  const context = useContext(LocationsContext);
  if (!context) {
    throw new Error('useLocations must be used within a LocationsProvider');
  }
  return context;
} 