import { useState, useEffect } from 'react';
import { LocationItem } from '../types';
import { apiClient } from '../api/client';

export const useLocationState = () => {
  const [locations, setLocations] = useState<LocationItem[]>([
    { id: '1', city: 'Bangalore', area: 'Indiranagar', latitude: 12.9716, longitude: 77.5946, pincode: '560001', is_default: true, created_at: '' },
    { id: '2', city: 'Mumbai', area: 'Bandra West', latitude: 19.0596, longitude: 72.8295, pincode: '400050', is_default: false, created_at: '' },
    { id: '3', city: 'Delhi NCR', area: 'Connaught Place', latitude: 28.6315, longitude: 77.2167, pincode: '110001', is_default: false, created_at: '' },
    { id: '4', city: 'Hyderabad', area: 'Hitec City', latitude: 17.4474, longitude: 78.3762, pincode: '500081', is_default: false, created_at: '' },
    { id: '5', city: 'Pune', area: 'Koregaon Park', latitude: 18.5362, longitude: 73.8939, pincode: '411001', is_default: false, created_at: '' },
    { id: '6', city: 'Chennai', area: 'T. Nagar', latitude: 13.0418, longitude: 80.2341, pincode: '600017', is_default: false, created_at: '' }
  ]);

  const [selectedLocation, setSelectedLocation] = useState<LocationItem>(() => {
    const saved = localStorage.getItem('quicksync_selected_location');
    if (saved) {
      try { return JSON.parse(saved); } catch {}
    }
    return locations[0];
  });

  useEffect(() => {
    // Fetch stored locations from backend if available
    apiClient.get('/locations').then((res) => {
      if (Array.isArray(res.data) && res.data.length > 0) {
        setLocations(res.data);
        // If no selected location, pick default
        const def = res.data.find((l: LocationItem) => l.is_default) || res.data[0];
        if (!localStorage.getItem('quicksync_selected_location')) {
          setSelectedLocation(def);
        }
      }
    }).catch(() => {});
  }, []);

  const changeLocation = (loc: LocationItem) => {
    setSelectedLocation(loc);
    localStorage.setItem('quicksync_selected_location', JSON.stringify(loc));
  };

  return { locations, selectedLocation, changeLocation, setLocations };
};
