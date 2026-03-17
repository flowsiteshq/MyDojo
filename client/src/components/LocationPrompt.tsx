import { useState, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { MapPin, X, Navigation } from "lucide-react";
import { Button } from "@/components/ui/button";
import { useLocationContext } from "@/contexts/LocationContext";

export function LocationPrompt() {
  const { showPrompt, requestPreciseLocation, dismissPrompt, isLocating } = useLocationContext();
  
  if (!showPrompt) return null;

  return (
    <AnimatePresence>
      <motion.div
        initial={{ opacity: 0, y: 50 }}
        animate={{ opacity: 1, y: 0 }}
        exit={{ opacity: 0, y: 50 }}
        className="fixed bottom-4 left-4 right-4 md:left-auto md:right-4 md:w-96 z-50"
      >
        <div className="bg-white rounded-lg shadow-xl border border-gray-200 p-4 flex flex-col gap-3">
          <div className="flex justify-between items-start">
            <div className="flex items-center gap-2 text-primary font-bold">
              <MapPin className="h-5 w-5" />
              <span>Find Your Nearest Dojo</span>
            </div>
            <button 
              onClick={dismissPrompt}
              className="text-gray-400 hover:text-gray-600 transition-colors"
            >
              <X className="h-4 w-4" />
            </button>
          </div>
          
          <p className="text-sm text-gray-600">
            Enable location services to instantly find the closest classes and schedules near you.
          </p>
          
          <div className="flex gap-2">
            <Button 
              size="sm" 
              className="flex-1 bg-primary hover:bg-primary/90 text-white gap-2"
              onClick={requestPreciseLocation}
              disabled={isLocating}
            >
              {isLocating ? (
                <span className="animate-spin rounded-full h-4 w-4 border-2 border-white border-t-transparent" />
              ) : (
                <Navigation className="h-4 w-4" />
              )}
              {isLocating ? "Locating..." : "Use My Location"}
            </Button>
            <Button 
              size="sm" 
              variant="outline" 
              className="flex-1"
              onClick={dismissPrompt}
            >
              Not Now
            </Button>
          </div>
        </div>
      </motion.div>
    </AnimatePresence>
  );
}
