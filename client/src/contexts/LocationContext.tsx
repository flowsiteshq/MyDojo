import React, { createContext, useContext, useState, useEffect, ReactNode } from 'react';
import { locations, Location } from '@/data/locations';

interface ClosestLocation {
  id: string;
  name: string;
  city: string;
  distance: number;
}

interface LocationContextType {
  userCity: string | null;
  closestLocation: ClosestLocation | null;
  isLocating: boolean;
  permissionStatus: PermissionState | 'unknown' | 'prompt';
  requestPreciseLocation: () => Promise<void>;
  dismissPrompt: () => void;
  showPrompt: boolean;
}

const LocationContext = createContext<LocationContextType | undefined>(undefined);

export function LocationProvider({ children }: { children: ReactNode }) {
  const [userCity, setUserCity] = useState<string | null>(null);
  const [closestLocation, setClosestLocation] = useState<ClosestLocation | null>(null);
  const [isLocating, setIsLocating] = useState(false);
  const [permissionStatus, setPermissionStatus] = useState<PermissionState | 'unknown' | 'prompt'>('unknown');
  const [showPrompt, setShowPrompt] = useState(false);

  // Helper to calculate closest location
  const findClosest = (lat: number, lng: number) => {
    const locationsWithDistance = locations.map(loc => {
      const R = 3958.8; // Radius of Earth in miles
      const dLat = (loc.coordinates.lat - lat) * Math.PI / 180;
      const dLon = (loc.coordinates.lng - lng) * Math.PI / 180;
      const a = 
        Math.sin(dLat/2) * Math.sin(dLat/2) +
        Math.cos(lat * Math.PI / 180) * Math.cos(loc.coordinates.lat * Math.PI / 180) * 
        Math.sin(dLon/2) * Math.sin(dLon/2);
      const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1-a));
      const distance = R * c;
      return { ...loc, distance };
    });
    
    locationsWithDistance.sort((a, b) => a.distance - b.distance);
    
    if (locationsWithDistance.length > 0) {
      setClosestLocation({
        id: locationsWithDistance[0].id,
        name: locationsWithDistance[0].name,
        city: locationsWithDistance[0].city,
        distance: locationsWithDistance[0].distance
      });
    }
  };

  // Initial IP-based lookup
  useEffect(() => {
    // Check if user has already dismissed the prompt in this session
    const promptDismissed = sessionStorage.getItem('locationPromptDismissed');
    
    // Check permission status if available
    if (navigator.permissions && navigator.permissions.query) {
      navigator.permissions.query({ name: 'geolocation' }).then(result => {
        setPermissionStatus(result.state);
        // If prompt not dismissed and permission is prompt/unknown, we can show our custom prompt
        if (!promptDismissed && result.state === 'prompt') {
          setShowPrompt(true);
        }
      });
    } else {
      if (!promptDismissed) setShowPrompt(true);
    }

    // Use ip-api.com (free, no CORS issues, no API key needed for basic use)
    fetch('https://ip-api.com/json/?fields=status,city,lat,lon')
      .then(res => {
        if (!res.ok) throw new Error(`HTTP ${res.status}`);
        return res.json();
      })
      .then(data => {
        if (data.status === 'success') {
          if (data.city) setUserCity(data.city);
          if (data.lat && data.lon) findClosest(data.lat, data.lon);
        }
      })
      .catch(() => {
        // Silently ignore — IP geolocation is a best-effort enhancement, not critical
      });
  }, []);

  const requestPreciseLocation = async () => {
    setIsLocating(true);
    if (!navigator.geolocation) {
      console.error("Geolocation is not supported by your browser");
      setIsLocating(false);
      return;
    }

    return new Promise<void>((resolve, reject) => {
      navigator.geolocation.getCurrentPosition(
        (position) => {
          findClosest(position.coords.latitude, position.coords.longitude);
          setPermissionStatus('granted');
          setShowPrompt(false);
          setIsLocating(false);
          resolve();
        },
        (error) => {
          console.error("Error getting location", error);
          setPermissionStatus('denied');
          setIsLocating(false);
          reject(error);
        }
      );
    });
  };

  const dismissPrompt = () => {
    setShowPrompt(false);
    sessionStorage.setItem('locationPromptDismissed', 'true');
  };

  return (
    <LocationContext.Provider value={{ 
      userCity, 
      closestLocation, 
      isLocating, 
      permissionStatus, 
      requestPreciseLocation,
      dismissPrompt,
      showPrompt
    }}>
      {children}
    </LocationContext.Provider>
  );
}

export function useLocationContext() {
  const context = useContext(LocationContext);
  if (context === undefined) {
    throw new Error('useLocationContext must be used within a LocationProvider');
  }
  return context;
}
