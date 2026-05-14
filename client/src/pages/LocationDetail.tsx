import { useRoute } from "wouter";
import { locations } from "@/data/locations";
import { Button } from "@/components/ui/button";
import { MapPin, Phone, Clock, ArrowLeft, Wifi, Coffee, Car, Users, Maximize2, Star, ShoppingBag, Eye } from "lucide-react";
import { Link } from "wouter";
import { MapView } from "@/components/Map";
import { openIntakeChatbot } from "@/lib/chatbot";
import { ScheduleWidget } from "@/components/ScheduleWidget";
import { NextClassTimer } from "@/components/NextClassTimer";
import { LocationClock } from "@/components/LocationClock";
import { LocationWeather } from "@/components/LocationWeather";
import { OpenStatusBadge, StatusState } from "@/components/OpenStatusBadge";
import { useState, useEffect } from "react";
import { cn } from "@/lib/utils";
import { useNextClass } from "@/hooks/useNextClass";

// Tomball HQ facility photos (CDN)
const TOMBALL_PHOTOS = [
  {
    url: "https://d2xsxph8kpxj0f.cloudfront.net/310419663031545745/Lu5Er8YqGDyrsXYnbeua3C/tomball-entrance_c307e391.jpg",
    caption: "Grand Entrance — Iconic Torii Gate & MyDojo HQ Seal",
    description: "Step through our signature red torii gate and into a world-class martial arts experience."
  },
  {
    url: "https://d2xsxph8kpxj0f.cloudfront.net/310419663031545745/Lu5Er8YqGDyrsXYnbeua3C/tomball-main-floor_004b5a76.jpg",
    caption: "Main Training Floor — Dojo 1",
    description: "Pristine premium mats, full-wall mirrors, and motivational Student Creed banners fill our primary training space."
  },
  {
    url: "https://d2xsxph8kpxj0f.cloudfront.net/310419663031545745/Lu5Er8YqGDyrsXYnbeua3C/tomball-training-floor_9a2c684b.jpg",
    caption: "Competition-Ready Training Floor — Dojo 1 (Alternate View)",
    description: "Spacious enough to run simultaneous programs, our main floor accommodates large class sizes without crowding."
  },
  {
    url: "https://d2xsxph8kpxj0f.cloudfront.net/310419663031545745/Lu5Er8YqGDyrsXYnbeua3C/tomball-kickboxing-room_76ba1f00.jpg",
    caption: "Dojo 2 — Dedicated Kickboxing Studio",
    description: "Signature hexagonal LED lighting, floor-to-ceiling heavy bags, and dual flat-screen TVs create an electrifying training atmosphere."
  }
];

const TOMBALL_AMENITIES = [
  { icon: Maximize2, title: "3,500+ Sq Ft Facility", description: "Two full training dojos with room to grow — never feel cramped during class." },
  { icon: Users, title: "500+ Member Capacity", description: "Built to serve a thriving community. Plenty of space for every family." },
  { icon: Car, title: "Reserved Parking", description: "Dedicated, well-lit reserved parking spaces right at our front door." },
  { icon: Eye, title: "Parent Viewing Area", description: "Comfortable waiting rooms with clear sightlines so you never miss a moment." },
  { icon: Coffee, title: "Hospitality Coffee Bar", description: "Complimentary coffee and a welcoming lounge while you wait for class to finish." },
  { icon: ShoppingBag, title: "Vending While You Wait", description: "Convenient vending machines stocked with snacks and drinks for students and parents." },
  { icon: Wifi, title: "Free Wi-Fi", description: "Stay connected with complimentary high-speed Wi-Fi throughout the facility." },
  { icon: Star, title: "Spotless & Maintained Daily", description: "Our mats and floors are sanitized before and after every class — cleanliness is a core standard." },
];

export default function LocationDetail() {
  const [, params] = useRoute("/locations/:id");
  const [locationStatus, setLocationStatus] = useState<StatusState | null>(null);
  const [activePhoto, setActivePhoto] = useState(0);
  const locationId = params?.id;
  const location = locations.find((loc) => loc.id === locationId);
  
  const nextClass = useNextClass(location?.schedule, location?.timezone);
  const [heroImage, setHeroImage] = useState<string>('https://files.manuscdn.com/user_upload_by_module/session_file/310419663031545745/NNwrjeVElfgByBcR.jpg');

  useEffect(() => {
    if (!nextClass) {
      setHeroImage('https://files.manuscdn.com/user_upload_by_module/session_file/310419663031545745/NNwrjeVElfgByBcR.jpg');
      return;
    }
    const className = nextClass.class.name.toLowerCase();
    if (className.includes('little ninjas')) {
      setHeroImage('https://files.manuscdn.com/user_upload_by_module/session_file/310419663031545745/LTZLjvnxAjEMFOTe.jpg');
    } else if (className.includes('dragon kids') || className.includes('kids')) {
      setHeroImage('https://files.manuscdn.com/user_upload_by_module/session_file/310419663031545745/TWDwBCQHREJezPRu.jpg');
    } else if (className.includes('teen') || className.includes('adult')) {
      setHeroImage('https://files.manuscdn.com/user_upload_by_module/session_file/310419663031545745/vkpYJXbOqHygXrIJ.jpg');
    } else if (className.includes('kickboxing') || className.includes('fitness')) {
      setHeroImage('https://files.manuscdn.com/user_upload_by_module/session_file/310419663031545745/KIazhBWQpCfhvKFK.jpg');
    } else {
      setHeroImage('https://files.manuscdn.com/user_upload_by_module/session_file/310419663031545745/NNwrjeVElfgByBcR.jpg');
    }
  }, [nextClass]);

  if (!location) {
    return (
      <div className="min-h-screen flex flex-col items-center justify-center bg-gray-50">
        <h1 className="text-2xl font-bold mb-4">Location Not Found</h1>
        <Link href="/locations">
          <Button>Back to Locations</Button>
        </Link>
      </div>
    );
  }

  const isHQ = location.id === "hq";

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Hero Section */}
      <section className="bg-black text-white py-20 relative overflow-hidden transition-all duration-1000 ease-in-out">
        <div 
          className="absolute inset-0 bg-cover bg-center opacity-40 transition-all duration-1000 ease-in-out"
          style={{ backgroundImage: `url(${heroImage})` }}
        ></div>
        <div className="container mx-auto px-4 relative z-10">
          <Link href="/locations">
            <Button variant="ghost" className="text-white hover:text-gray-200 hover:bg-white/10 mb-6 pl-0">
              <ArrowLeft className="w-4 h-4 mr-2" />
              Back to Locations
            </Button>
          </Link>
          <div className="flex flex-col md:flex-row md:items-end gap-4 mb-4">
            <h1 className="text-4xl md:text-6xl font-heading font-bold">{location.name}</h1>
            <div className="mb-2 md:mb-3 flex flex-wrap items-center gap-3">
              <LocationClock timezone={location.timezone || "America/Chicago"} label={`Time in ${location.city}`} />
              <LocationWeather lat={location.coordinates.lat} lng={location.coordinates.lng} />
            </div>
          </div>
          
          {location.schedule && (
            <div className="mb-8">
              <NextClassTimer schedule={location.schedule} timezone={location.timezone} />
            </div>
          )}

          <div className="flex flex-col md:flex-row gap-6 text-lg text-gray-200">
            <div className="flex items-center">
              <MapPin className="w-5 h-5 mr-2 text-primary" />
              {location.address}, {location.city}, {location.state} {location.zip}
            </div>
            <div className={cn(
              "flex items-center transition-all duration-300",
              locationStatus === "closing-soon" && "text-white font-bold animate-pulse"
            )}>
              <Phone className={cn(
                "w-5 h-5 mr-2 text-primary",
                locationStatus === "closing-soon" && "text-white"
              )} />
              {location.phone}
              {locationStatus === "closing-soon" && (
                <span className="ml-2 text-xs bg-white text-primary px-2 py-0.5 rounded-full font-bold uppercase">
                  Call Now
                </span>
              )}
            </div>
          </div>
        </div>
      </section>

      {/* Separator strip between hero and facility section */}
      {isHQ && (
        <div className="relative h-2 bg-primary" />
      )}

      {/* Affiliate Dojo — About Section */}
      {!isHQ && location.isAffiliate && (
        <section className="bg-white border-b border-gray-100">
          <div className="relative h-2 bg-primary" />
          {/* Story Header */}
          <div className="bg-black text-white py-16 relative overflow-hidden">
            <div className="absolute inset-0 opacity-10"
              style={{ backgroundImage: "url('https://files.manuscdn.com/user_upload_by_module/session_file/310419663031545745/NNwrjeVElfgByBcR.jpg')", backgroundSize: "cover", backgroundPosition: "center" }}
            />
            <div className="container mx-auto px-4 relative z-10 max-w-4xl">
              <div className="inline-block bg-primary text-white text-xs font-bold uppercase tracking-widest px-3 py-1 mb-4 rounded-sm">
                MyDojo Affiliate Partner
              </div>
              <h2 className="text-4xl md:text-5xl font-heading font-bold mb-6">
                PART OF THE <span className="text-primary">MYDOJO NETWORK</span>
              </h2>
              <p className="text-gray-300 text-lg leading-relaxed mb-4">
                {location.description}
              </p>
              <p className="text-gray-300 text-lg leading-relaxed">
                As a MyDojo affiliate, this dojo shares our commitment to excellence in martial arts instruction, character development, and building confident, disciplined students of all ages. Students and families from the MyDojo network are always welcome.
              </p>
            </div>
          </div>

          {/* Programs & Amenities Grid */}
          <div className="bg-gray-50 py-16">
            <div className="container mx-auto px-4 max-w-6xl">
              <div className="text-center mb-12">
                <h3 className="text-3xl md:text-4xl font-heading font-bold text-black mb-3">PROGRAMS &amp; <span className="text-primary">WHAT TO EXPECT</span></h3>
                <p className="text-gray-500 text-lg max-w-2xl mx-auto">Quality martial arts training in a welcoming, family-friendly environment.</p>
              </div>
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
                {[
                  { icon: Users, title: "Kids Programs", description: "Age-appropriate classes for children starting as young as 3, building confidence and discipline." },
                  { icon: Star, title: "Teen & Adult", description: "Traditional martial arts, kickboxing, and self-defense for teens and adults of all skill levels." },
                  { icon: Maximize2, title: "Professional Facility", description: "Dedicated training space with professional mats and equipment for safe, effective training." },
                  { icon: Eye, title: "Parent Viewing", description: "Comfortable viewing areas so parents can watch their children grow and progress." },
                ].map((item, idx) => (
                  <div key={idx} className="bg-white rounded-xl p-6 shadow-sm border border-gray-100 hover:shadow-md hover:border-primary/20 transition-all duration-200 group">
                    <div className="w-12 h-12 bg-black rounded-xl flex items-center justify-center mb-4 group-hover:bg-primary transition-colors duration-200">
                      <item.icon className="w-6 h-6 text-white" />
                    </div>
                    <h4 className="font-bold text-black mb-2 text-sm uppercase tracking-wide">{item.title}</h4>
                    <p className="text-gray-500 text-sm leading-relaxed">{item.description}</p>
                  </div>
                ))}
              </div>
            </div>
          </div>

          {/* Affiliate Promise */}
          <div className="container mx-auto px-4 py-16 max-w-4xl text-center">
            <h3 className="text-3xl font-heading font-bold text-black mb-6">THE <span className="text-primary">MYDOJO</span> AFFILIATE PROMISE</h3>
            <p className="text-gray-600 text-lg leading-relaxed mb-4">
              Every dojo in the MyDojo affiliate network is hand-selected for their shared values: exceptional instruction, a welcoming community, and a genuine commitment to student growth. When you train at a MyDojo affiliate, you train with the same standards we hold at our Tomball headquarters.
            </p>
            <p className="text-gray-600 text-lg leading-relaxed mb-8">
              Whether you're visiting from out of town or looking for a location closer to home, our affiliate network ensures you always have access to world-class martial arts training.
            </p>
            <div className="flex flex-col sm:flex-row gap-4 justify-center">
              <Button
                onClick={openIntakeChatbot}
                className="bg-primary hover:bg-primary/90 text-white text-lg px-10 py-6 h-auto font-heading uppercase tracking-wider"
              >
                Book Your Free Trial Class
              </Button>
              <Button
                variant="outline"
                className="text-lg px-10 py-6 h-auto font-heading uppercase tracking-wider"
                onClick={() => window.open(`tel:${location.phone}`, '_self')}
              >
                Call {location.phone}
              </Button>
            </div>
          </div>
        </section>
      )}

      {/* Tomball HQ — About Our Location Story Section */}
      {isHQ && (
        <section className="bg-white border-b border-gray-100">
          {/* Story Header */}
          <div className="bg-black text-white py-16 relative overflow-hidden">
            <div className="absolute inset-0 opacity-10"
              style={{ backgroundImage: "url('https://d2xsxph8kpxj0f.cloudfront.net/310419663031545745/Lu5Er8YqGDyrsXYnbeua3C/tomball-kickboxing-room_76ba1f00.jpg')", backgroundSize: "cover", backgroundPosition: "center" }}
            />
            <div className="container mx-auto px-4 relative z-10 max-w-4xl">
              <div className="inline-block bg-primary text-white text-xs font-bold uppercase tracking-widest px-3 py-1 mb-4 rounded-sm">
                Tomball Headquarters
              </div>
              <h2 className="text-4xl md:text-5xl font-heading font-bold mb-6">
                A FACILITY BUILT FOR <span className="text-primary">CHAMPIONS</span>
              </h2>
              <p className="text-gray-300 text-lg leading-relaxed mb-4">
                From the moment you step through our iconic red torii gate, you know this is no ordinary martial arts school. MyDojo Tomball HQ was designed from the ground up to deliver a world-class training experience — one that honors the discipline and beauty of martial arts while providing every modern comfort for students and families alike.
              </p>
              <p className="text-gray-300 text-lg leading-relaxed">
                Spanning over <strong className="text-white">3,500 square feet</strong> across two dedicated training dojos, our Tomball headquarters is equipped to serve a community of <strong className="text-white">500+ members</strong> without ever feeling crowded. Every inch of this facility was thoughtfully designed — from the spotless premium mats to the motivational Student Creed banners that line the walls, reminding every student why they train.
              </p>
            </div>
          </div>

          {/* Photo Gallery */}
          <div className="container mx-auto px-4 py-12 max-w-6xl">
            <h3 className="text-2xl font-heading font-bold text-center mb-2 text-black">TOUR OUR FACILITY</h3>
            <p className="text-gray-500 text-center mb-8">See why families drive from across the Houston area to train at MyDojo Tomball.</p>

            {/* Main Photo */}
            <div className="relative rounded-2xl overflow-hidden shadow-2xl mb-4 aspect-video bg-black">
              <img
                src={TOMBALL_PHOTOS[activePhoto].url}
                alt={TOMBALL_PHOTOS[activePhoto].caption}
                className="w-full h-full object-cover transition-all duration-500" loading="lazy" />
              <div className="absolute bottom-0 left-0 right-0 bg-gradient-to-t from-black/80 to-transparent p-6">
                <p className="text-white font-bold text-lg">{TOMBALL_PHOTOS[activePhoto].caption}</p>
                <p className="text-gray-300 text-sm mt-1">{TOMBALL_PHOTOS[activePhoto].description}</p>
              </div>
            </div>

            {/* Thumbnail Strip */}
            <div className="grid grid-cols-4 gap-3">
              {TOMBALL_PHOTOS.map((photo, idx) => (
                <button
                  key={idx}
                  onClick={() => setActivePhoto(idx)}
                  className={cn(
                    "relative rounded-lg overflow-hidden aspect-video border-2 transition-all duration-200",
                    activePhoto === idx ? "border-primary shadow-lg scale-105" : "border-transparent opacity-70 hover:opacity-100"
                  )}
                >
                  <img src={photo.url} alt={photo.caption} className="w-full h-full object-cover" loading="lazy" />
                </button>
              ))}
            </div>

            {/* View on Google Maps Link */}
            <div className="text-center mt-6">
              <a
                href="https://www.google.com/maps/place/MyDojo+Martial+Arts+%26+Fitness/@30.0112706,-95.6025971,17z"
                target="_blank"
                rel="noopener noreferrer"
                className="inline-flex items-center gap-2 text-primary font-bold hover:underline text-lg"
              >
                <MapPin className="w-5 h-5" />
                View Tomball MyDojo on Google Maps
              </a>
            </div>
          </div>

          {/* Amenities Grid */}
          <div className="bg-gray-50 py-16">
            <div className="container mx-auto px-4 max-w-6xl">
              <div className="text-center mb-12">
                <h3 className="text-3xl md:text-4xl font-heading font-bold text-black mb-3">EVERYTHING YOU NEED, <span className="text-primary">NOTHING YOU DON'T</span></h3>
                <p className="text-gray-500 text-lg max-w-2xl mx-auto">We built MyDojo Tomball to be the dojo we always wished existed — premium training space paired with genuine hospitality for the whole family.</p>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
                {TOMBALL_AMENITIES.map((amenity, idx) => (
                  <div key={idx} className="bg-white rounded-xl p-6 shadow-sm border border-gray-100 hover:shadow-md hover:border-primary/20 transition-all duration-200 group">
                    <div className="w-12 h-12 bg-black rounded-xl flex items-center justify-center mb-4 group-hover:bg-primary transition-colors duration-200">
                      <amenity.icon className="w-6 h-6 text-white" />
                    </div>
                    <h4 className="font-bold text-black mb-2 text-sm uppercase tracking-wide">{amenity.title}</h4>
                    <p className="text-gray-500 text-sm leading-relaxed">{amenity.description}</p>
                  </div>
                ))}
              </div>
            </div>
          </div>

          {/* Story Close — The MyDojo Promise */}
          <div className="container mx-auto px-4 py-16 max-w-4xl text-center">
            <h3 className="text-3xl font-heading font-bold text-black mb-6">THE <span className="text-primary">MYDOJO</span> PROMISE</h3>
            <p className="text-gray-600 text-lg leading-relaxed mb-4">
              When you walk through our doors, you are not just joining a gym — you are joining a community. Our Tomball headquarters was built with one goal in mind: to create the most welcoming, inspiring, and effective martial arts environment in the Houston area.
            </p>
            <p className="text-gray-600 text-lg leading-relaxed mb-8">
              Whether you are a parent watching your child earn their first stripe, an adult pushing through a kickboxing class, or a competitor preparing for your next tournament — this facility was built for you. Reserved parking, a comfortable waiting lounge, a hospitality coffee bar, vending, and free Wi-Fi mean that coming to class is never an inconvenience. It is the highlight of your week.
            </p>
            <Button
              onClick={openIntakeChatbot}
              className="bg-primary hover:bg-primary/90 text-white text-lg px-10 py-6 h-auto font-heading uppercase tracking-wider"
            >
              Book Your Free Trial Class
            </Button>
          </div>
        </section>
      )}

      {/* Divider between facility section and schedule/info grid */}
      <div className="relative">
        <div className="absolute inset-0 flex items-center" aria-hidden="true">
          <div className="w-full border-t-4 border-gray-200" />
        </div>
        <div className="relative flex justify-center">
          <span className="bg-gray-50 px-6 py-2 text-xs font-bold uppercase tracking-widest text-gray-400">
            Class Schedule &amp; Location Info
          </span>
        </div>
      </div>

      <div className="container mx-auto px-4 py-12">
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          {/* Main Content */}
          <div className="lg:col-span-2 space-y-8">
            {!isHQ && (
              <div className="bg-white p-8 rounded-xl shadow-sm border border-gray-200">
                <h2 className="text-2xl font-bold mb-4">About This Location</h2>
                <p className="text-gray-600 leading-relaxed mb-6">
                  {location.description || "Join us at our premier martial arts facility. We offer classes for all ages and skill levels, from Little Ninjas to Adult Kickboxing."}
                </p>
                
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div className="bg-gray-50 p-4 rounded-lg">
                    <h3 className="font-bold mb-2">Programs Offered</h3>
                    <ul className="list-disc list-inside text-gray-600 space-y-1">
                      <li>Little Ninjas (Ages 3-5)</li>
                      <li>Dragon Kids (Ages 5-12)</li>
                      <li>Teens & Adults</li>
                      <li>Kickboxing</li>
                    </ul>
                  </div>
                  <div className="bg-gray-50 p-4 rounded-lg">
                    <h3 className="font-bold mb-2">Amenities</h3>
                    <ul className="list-disc list-inside text-gray-600 space-y-1">
                      <li>Professional Mats</li>
                      <li>Parent Viewing Area</li>
                      <li>Pro Shop</li>
                      <li>Changing Rooms</li>
                    </ul>
                  </div>
                </div>
              </div>
            )}

            {/* Schedule Widget */}
            <div className="bg-white p-8 rounded-xl shadow-sm border border-gray-200">
              <h2 className="text-2xl font-bold mb-4">Class Schedule</h2>
              <p className="text-gray-600 mb-6">View our current class schedule below. First time? Book a free trial class!</p>
              {location.schedule ? (
                <ScheduleWidget schedule={location.schedule} />
              ) : (
                <div className="bg-gray-100 h-64 rounded-lg flex items-center justify-center text-gray-400">
                  Schedule coming soon for this location.
                </div>
              )}
            </div>
          </div>

          {/* Sidebar */}
          <div className="space-y-6">
            {/* CTA Card */}
            <div className="bg-primary text-white p-6 rounded-xl shadow-lg">
              <h3 className="text-xl font-bold mb-2">Ready to Start?</h3>
              <p className="mb-6 text-white/90">Book your free trial class today and experience the MyDojo difference.</p>
              <Button 
                onClick={openIntakeChatbot}
                className="w-full bg-white text-primary hover:bg-gray-100 font-bold"
              >
                Book Free Trial
              </Button>
            </div>

            {/* Hours & Map */}
            <div className="bg-white p-6 rounded-xl shadow-sm border border-gray-200">
              <div className="flex items-center justify-between mb-4">
                <h3 className="text-xl font-bold flex items-center">
                  <Clock className="w-5 h-5 mr-2 text-primary" />
                  Hours
                </h3>
                <OpenStatusBadge 
                  hours={location.hours} 
                  timezone={location.timezone} 
                  onStatusChange={setLocationStatus}
                />
              </div>
              <ul className="space-y-2 mb-6">
                {location.hours.map((hour, index) => (
                  <li key={index} className="text-gray-600 border-b border-gray-100 last:border-0 pb-2 last:pb-0">
                    {hour}
                  </li>
                ))}
              </ul>

              <div className="h-48 rounded-lg overflow-hidden relative mb-4">
                <MapView 
                  className="w-full h-full"
                  onMapReady={(map) => {
                    const position = { lat: location.coordinates.lat, lng: location.coordinates.lng };
                    new google.maps.Marker({
                      position,
                      map,
                      title: location.name
                    });
                    map.setCenter(position);
                    map.setZoom(15);
                  }}
                />
              </div>
              
              <Button 
                variant="outline" 
                className="w-full"
                onClick={() => {
                  window.open(`https://www.google.com/maps/dir/?api=1&destination=${encodeURIComponent(`${location.address}, ${location.city}, ${location.state} ${location.zip}`)}`, '_blank');
                }}
              >
                Get Directions
              </Button>
            </div>

            {/* View on Google Maps — HQ only */}
            {isHQ && (
              <div className="bg-black text-white p-6 rounded-xl shadow-lg text-center">
                <MapPin className="w-8 h-8 text-primary mx-auto mb-3" />
                <h3 className="font-bold text-lg mb-2">See It For Yourself</h3>
                <p className="text-gray-400 text-sm mb-4">Take a virtual look at our Tomball headquarters on Google Maps.</p>
                <a
                  href="https://www.google.com/maps/place/MyDojo+Martial+Arts+%26+Fitness/@30.0112706,-95.6025971,17z"
                  target="_blank"
                  rel="noopener noreferrer"
                >
                  <Button className="w-full bg-primary hover:bg-primary/90 text-white font-bold">
                    View Tomball MyDojo
                  </Button>
                </a>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
