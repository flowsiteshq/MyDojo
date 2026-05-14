import { useState, useEffect } from "react";
import { useLocation, Link } from "wouter";
import { motion } from "framer-motion";
import { MapPin, Navigation, Phone, Clock, ArrowRight, Search } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { MapView } from "@/components/Map";
import SEO from "@/components/SEO";

// Define the Location type
interface Location {
  id: string;
  name: string;
  address: string;
  city: string;
  state: string;
  zip: string;
  phone: string;
  coordinates: {
    lat: number;
    lng: number;
  };
  hours: string[];
  distance?: number; // Distance in miles
  isAffiliate?: boolean;
}

// Initial locations data
const initialLocations: Location[] = [
  {
    id: "yaegers-sda",
    name: "Yaeger's Self Defense of America",
    address: "306 East Pasadena Blvd",
    city: "Deer Park",
    state: "TX",
    zip: "77536",
    phone: "(281) 479-3880",
    coordinates: {
      lat: 29.7052,
      lng: -95.1241
    },
    hours: ["Mon–Fri: 5:30 PM – 9:15 PM", "Sat–Sun: Tournaments & Events"],
    isAffiliate: true
  },
  {
    id: "nokc-belle-chasse",
    name: "New Orleans Karate Club - Belle Chasse",
    address: "1510 LA-406, 2nd Floor",
    city: "Belle Chasse",
    state: "LA",
    zip: "70037",
    phone: "(504) 391-7200",
    coordinates: {
      lat: 29.8574,
      lng: -90.0004
    },
    hours: ["Mon–Fri: 12:00 PM – 9:00 PM", "Sat–Sun: Closed"],
    isAffiliate: true
  },
  {
    id: "hq",
    name: "MyDojo Headquarters - Tomball",
    address: "11721 Spring Cypress Rd",
    city: "Tomball",
    state: "TX",
    zip: "77377",
    phone: "(877) 4-MYDOJO",
    coordinates: {
      lat: 30.0112706,
      lng: -95.6025971
    },
    hours: [
      "Mon-Thu: 12:00 PM - 9:00 PM",
      "Fri: 12:00 PM - 8:00 PM",
      "Sat: 9:00 AM - 2:00 PM",
      "Sun: Closed"
    ]
  }
];

export default function Locations() {
  const [locations, setLocations] = useState<Location[]>(initialLocations);
  const [userLocation, setUserLocation] = useState<{ lat: number; lng: number } | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [selectedLocation, setSelectedLocation] = useState<Location | null>(null);
  const [searchQuery, setSearchQuery] = useState("");
  const [geocoder, setGeocoder] = useState<google.maps.Geocoder | null>(null);
  const [location] = useLocation();

  // Parse query params
  const getQueryParams = () => {
    const search = window.location.search;
    const params = new URLSearchParams(search);
    return params.get("city");
  };

  // Auto-trigger search if city param is in URL (no auto-geolocation on mount)
  useEffect(() => {
    const cityParam = getQueryParams();
    if (cityParam) {
      setSearchQuery(cityParam);
      // Actual search triggered once geocoder is ready (see effect below)
    }
    // Do NOT auto-request geolocation — wait for user to click the button
  }, []);

  // Trigger search when geocoder is ready and we have a query from URL
  useEffect(() => {
    const cityParam = getQueryParams();
    if (cityParam && geocoder && !userLocation) {
      handleSearch(cityParam);
    }
  }, [geocoder]);

  // Haversine formula to calculate distance between two points in miles
  const calculateDistance = (lat1: number, lon1: number, lat2: number, lon2: number) => {
    const R = 3958.8; // Radius of the Earth in miles
    const dLat = (lat2 - lat1) * (Math.PI / 180);
    const dLon = (lon2 - lon1) * (Math.PI / 180);
    const a =
      Math.sin(dLat / 2) * Math.sin(dLat / 2) +
      Math.cos(lat1 * (Math.PI / 180)) * Math.cos(lat2 * (Math.PI / 180)) *
      Math.sin(dLon / 2) * Math.sin(dLon / 2);
    const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
    return R * c;
  };

  const updateLocationsWithDistance = (lat: number, lng: number) => {
    const locationsWithDistance = initialLocations.map(loc => ({
      ...loc,
      distance: calculateDistance(lat, lng, loc.coordinates.lat, loc.coordinates.lng)
    })).sort((a, b) => (a.distance || 0) - (b.distance || 0));

    setLocations(locationsWithDistance);
    
    // Auto-select the nearest one
    if (locationsWithDistance.length > 0) {
      setSelectedLocation(locationsWithDistance[0]);
    }
  };

  const handleFindNearest = () => {
    setLoading(true);
    setError(null);

    if (!navigator.geolocation) {
      setError("Geolocation is not supported by your browser.");
      setLoading(false);
      return;
    }

    navigator.geolocation.getCurrentPosition(
      (position) => {
        const { latitude, longitude } = position.coords;
        setUserLocation({ lat: latitude, lng: longitude });
        updateLocationsWithDistance(latitude, longitude);
        setLoading(false);
      },
      (err) => {
        console.error(err);
        let msg = "Unable to retrieve your location.";
        if (err.code === 1) {
          msg = "Location access was denied. Please use the search box above to find the nearest dojo.";
        } else if (err.code === 2) {
          msg = "Your location could not be determined. Please try searching by city or zip code.";
        } else if (err.code === 3) {
          msg = "Location request timed out. Please try searching by city or zip code.";
        }
        setError(msg);
        setLoading(false);
      }
    );
  };

  const handleSearch = (queryOverride?: string) => {
    const query = queryOverride || searchQuery;
    if (!query.trim() || !geocoder) return;
    
    setLoading(true);
    setError(null);

    geocoder.geocode({ address: query }, (results, status) => {
      if (status === "OK" && results && results[0]) {
        const { lat, lng } = results[0].geometry.location;
        const latVal = lat();
        const lngVal = lng();
        
        setUserLocation({ lat: latVal, lng: lngVal });
        updateLocationsWithDistance(latVal, lngVal);
      } else {
        setError("Could not find location. Please try a different address.");
      }
      setLoading(false);
    });
  };

  return (
    <div className="flex flex-col min-h-screen bg-gray-50">
      <SEO 
        title="Our Locations"
        description="Find a MyDojo martial arts location near you in Tomball, Texas. View addresses, hours, directions, and class schedules for all our training facilities."
        keywords="MyDojo locations, martial arts Tomball locations, karate school near me, dojo locations, martial arts facility Tomball, find martial arts class, dojo directions"
      />
      {/* Hero Section */}
      <section className="bg-black text-white py-20 relative overflow-hidden">
        <div className="absolute inset-0 bg-[url('https://files.manuscdn.com/user_upload_by_module/session_file/310419663031545745/QCDmgxbjdlfUOCPT.jpg')] bg-cover bg-center opacity-30"></div>
        <div className="container mx-auto px-4 relative z-10 text-center">
          <h1 className="text-4xl md:text-6xl font-heading font-bold mb-4">FIND A LOCATION</h1>
          <p className="text-xl text-gray-300 max-w-2xl mx-auto">
            Discover a MyDojo near you and start your martial arts journey today.
          </p>
        </div>
      </section>

      <div className="container mx-auto px-4 py-12 flex-grow">
        <div className="flex flex-col lg:flex-row gap-8 h-full">
          
          {/* Sidebar / List */}
          <div className="lg:w-1/3 flex flex-col gap-6">
            <div className="bg-white p-6 rounded-xl shadow-sm border border-gray-200">
              <h2 className="text-xl font-bold mb-4 flex items-center">
                <Navigation className="w-5 h-5 mr-2 text-primary" />
                Find Nearest Dojo
              </h2>
              
              <div className="space-y-4">
                <div>
                  <label className="text-sm font-bold text-gray-700 mb-2 block">Search by Location</label>
                  <div className="flex gap-2">
                    <Input 
                      placeholder="Enter city, zip, or address" 
                      value={searchQuery}
                      onChange={(e) => setSearchQuery(e.target.value)}
                      onKeyDown={(e) => e.key === 'Enter' && handleSearch()}
                      className="bg-gray-50"
                    />
                    <Button onClick={() => handleSearch()} disabled={loading || !geocoder} className="bg-black text-white hover:bg-gray-800">
                      <Search className="w-4 h-4" />
                    </Button>
                  </div>
                </div>

                <div className="relative">
                  <div className="absolute inset-0 flex items-center">
                    <span className="w-full border-t border-gray-200" />
                  </div>
                  <div className="relative flex justify-center text-xs uppercase">
                    <span className="bg-white px-2 text-gray-500">Or</span>
                  </div>
                </div>

                <Button 
                  onClick={handleFindNearest} 
                  disabled={loading}
                  variant="outline"
                  className="w-full border-primary text-primary hover:bg-primary/5"
                >
                  {loading ? "Locating..." : "Use My Current Location"}
                </Button>
              </div>
              
              {error && <p className="text-red-500 text-sm mt-4 bg-red-50 p-3 rounded-md border border-red-100">{error}</p>}
            </div>

            <div className="space-y-4">
              {locations.map((location) => (
                <motion.div
                  key={location.id}
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  className={`bg-white p-6 rounded-xl shadow-sm border cursor-pointer transition-all hover:shadow-md ${
                    selectedLocation?.id === location.id ? "border-primary ring-1 ring-primary" : "border-gray-200"
                  }`}
                  onClick={() => setSelectedLocation(location)}
                >
                  <div className="flex justify-between items-start mb-2">
                    <div>
                      <h3 className="font-bold text-lg text-gray-900">{location.name}</h3>
                      {location.isAffiliate && (
                        <span className="inline-block bg-blue-100 text-blue-700 text-xs font-bold px-2 py-0.5 rounded-full mt-1">Affiliate Dojo</span>
                      )}
                    </div>
                    {location.distance !== undefined && (
                      <span className="bg-gray-100 text-gray-600 text-xs font-bold px-2 py-1 rounded-full">
                        {location.distance.toFixed(1)} mi
                      </span>
                    )}
                  </div>
                  
                  <div className="space-y-2 text-sm text-gray-600 mb-4">
                    <div className="flex items-start">
                      <MapPin className="w-4 h-4 mr-2 mt-0.5 shrink-0" />
                      <span>{location.address}<br/>{location.city}, {location.state} {location.zip}</span>
                    </div>
                    {location.phone && (
                      <div className="flex items-center">
                        <Phone className="w-4 h-4 mr-2 shrink-0" />
                        <span>{location.phone}</span>
                      </div>
                    )}
                  </div>

                  <div className="flex gap-2 flex-wrap">
                    <Button variant="outline" size="sm" className="flex-1" onClick={(e) => {
                      e.stopPropagation();
                      window.open(`https://www.google.com/maps/dir/?api=1&destination=${encodeURIComponent(`${location.address}, ${location.city}, ${location.state} ${location.zip}`)}`, '_blank');
                    }}>
                      Directions
                    </Button>
                    <Link href={`/locations/${location.id}`}>
                      <Button size="sm" className="flex-1 bg-primary text-white hover:bg-primary/90">
                        Details
                      </Button>
                    </Link>
                  </div>
                  {location.id === 'hq' && (
                    <div className="mt-2">
                      <a
                        href="https://www.google.com/maps/place/MyDojo+Martial+Arts+%26+Fitness/@30.0112706,-95.6025971,17z"
                        target="_blank"
                        rel="noopener noreferrer"
                        onClick={(e) => e.stopPropagation()}
                        className="flex items-center gap-1 text-xs text-primary font-bold hover:underline"
                      >
                        <MapPin className="w-3 h-3" />
                        View Tomball MyDojo on Google Maps
                      </a>
                    </div>
                  )}
                </motion.div>
              ))}
            </div>
          </div>

          {/* Map Area */}
          <div className="lg:w-2/3 bg-white rounded-xl shadow-lg overflow-hidden border border-gray-200 min-h-[500px] relative">
            <MapView 
              className="w-full h-full absolute inset-0"
              onMapReady={(map) => {
                // Initialize geocoder
                if (!geocoder) {
                  setGeocoder(new google.maps.Geocoder());
                }

                // Bounds to fit all markers
                const bounds = new google.maps.LatLngBounds();

                locations.forEach(loc => {
                  const position = { lat: loc.coordinates.lat, lng: loc.coordinates.lng };
                  
                  const marker = new google.maps.Marker({
                    position,
                    map,
                    title: loc.name,
                    animation: google.maps.Animation.DROP
                  });

                  // Info window
                  const infoWindow = new google.maps.InfoWindow({
                    content: `
                      <div style="padding: 8px;">
                        <h3 style="font-weight: bold; margin-bottom: 4px;">${loc.name}</h3>
                        <p style="margin-bottom: 4px;">${loc.address}</p>
                        <p>${loc.city}, ${loc.state}</p>
                      </div>
                    `
                  });

                  marker.addListener("click", () => {
                    infoWindow.open(map, marker);
                    setSelectedLocation(loc);
                  });

                  bounds.extend(position);
                });

                // If user location exists, add a blue dot marker
                if (userLocation) {
                  new google.maps.Marker({
                    position: userLocation,
                    map,
                    title: "You are here",
                    icon: {
                      path: google.maps.SymbolPath.CIRCLE,
                      scale: 8,
                      fillColor: "#4285F4",
                      fillOpacity: 1,
                      strokeColor: "white",
                      strokeWeight: 2,
                    }
                  });
                  bounds.extend(userLocation);
                }

                // Fit bounds if there are locations, otherwise center on default
                if (locations.length > 0 || userLocation) {
                  map.fitBounds(bounds);
                  // Avoid zooming in too close if only one point
                  const listener = google.maps.event.addListener(map, "idle", () => { 
                    const zoom = map.getZoom();
                    if (zoom && zoom > 15) map.setZoom(15); 
                    google.maps.event.removeListener(listener); 
                  });
                } else {
                   map.setCenter({ lat: 30.0112706, lng: -95.6025971 });
                   map.setZoom(10);
                }
              }}
            />
          </div>
        </div>
      </div>
    </div>
  );
}
