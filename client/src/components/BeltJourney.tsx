import { useState } from "react";
import { beltLevels, BeltLevel } from "@/data/belt-journey";
import { motion, AnimatePresence } from "framer-motion";
import { cn } from "@/lib/utils";
import { ChevronRight, Star, Shield, Zap } from "lucide-react";

export function BeltJourney() {
  const [selectedBelt, setSelectedBelt] = useState<BeltLevel>(beltLevels[0]);

  return (
    <section className="py-20 bg-gray-50 overflow-hidden">
      <div className="container mx-auto px-4">
        <div className="text-center mb-16">
          <h2 className="text-4xl md:text-5xl font-heading font-bold mb-4">
            Your Path to <span className="text-primary">Black Belt</span>
          </h2>
          <p className="text-xl text-gray-600 max-w-2xl mx-auto">
            Every master was once a beginner. Explore the journey of growth, discipline, and excellence that awaits every student at MyDojo.
          </p>
        </div>

        <div className="flex flex-col lg:flex-row gap-12 items-center">
          {/* Interactive Timeline (Left Side) */}
          <div className="w-full lg:w-1/3 flex flex-col gap-4 relative">
            {/* Connecting Line */}
            <div className="absolute left-8 top-8 bottom-8 w-1 bg-gray-200 rounded-full hidden md:block" />

            {beltLevels.map((belt, index) => (
              <button
                key={belt.id}
                onClick={() => setSelectedBelt(belt)}
                className={cn(
                  "group relative flex items-center gap-6 p-4 rounded-xl transition-all duration-300 w-full text-left",
                  selectedBelt.id === belt.id 
                    ? "bg-white shadow-lg scale-105 z-10" 
                    : "hover:bg-white/50 hover:scale-102"
                )}
              >
                {/* Belt Indicator */}
                <div 
                  className={cn(
                    "w-16 h-16 rounded-full flex items-center justify-center shadow-md border-4 transition-transform duration-300 relative z-10 shrink-0",
                    selectedBelt.id === belt.id ? "scale-110" : "group-hover:scale-110"
                  )}
                  style={{ 
                    backgroundColor: belt.color,
                    borderColor: belt.borderColor
                  }}
                >
                  <div className="w-8 h-8 rounded-full bg-white/20 backdrop-blur-sm" />
                </div>

                {/* Text Info */}
                <div className="flex-1">
                  <h3 className={cn(
                    "text-lg font-bold transition-colors",
                    selectedBelt.id === belt.id ? "text-primary" : "text-gray-700"
                  )}>
                    {belt.name}
                  </h3>
                  <p className="text-sm text-gray-500 font-medium">
                    {belt.title}
                  </p>
                </div>

                {/* Active Arrow */}
                {selectedBelt.id === belt.id && (
                  <ChevronRight className="w-6 h-6 text-primary animate-pulse" />
                )}
              </button>
            ))}
          </div>

          {/* Detail Card (Right Side) */}
          <div className="w-full lg:w-2/3 relative min-h-[500px]">
            <AnimatePresence mode="wait">
              <motion.div
                key={selectedBelt.id}
                initial={{ opacity: 0, x: 20 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: -20 }}
                transition={{ duration: 0.3 }}
                className="bg-white rounded-3xl shadow-xl overflow-hidden border border-gray-100 h-full"
              >
                {/* Header Banner */}
                <div 
                  className="h-32 relative flex items-center justify-center overflow-hidden"
                  style={{ backgroundColor: selectedBelt.color }}
                >
                  <div className="absolute inset-0 bg-black/10" />
                  <div className="absolute inset-0 bg-gradient-to-b from-transparent to-black/20" />
                  <h2 
                    className="text-4xl md:text-6xl font-heading font-bold relative z-10 uppercase tracking-widest opacity-90"
                    style={{ color: selectedBelt.textColor }}
                  >
                    {selectedBelt.name}
                  </h2>
                </div>

                <div className="p-8 md:p-12">
                  <div className="mb-8">
                    <h3 className="text-2xl font-bold mb-4 flex items-center gap-3">
                      <span className="p-2 bg-primary/10 rounded-lg text-primary">
                        <Star className="w-6 h-6" />
                      </span>
                      {selectedBelt.title}
                    </h3>
                    <p className="text-lg text-gray-600 leading-relaxed">
                      {selectedBelt.description}
                    </p>
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                    {/* Core Values */}
                    <div className="bg-gray-50 p-6 rounded-2xl">
                      <h4 className="font-bold text-gray-900 mb-4 flex items-center gap-2">
                        <Shield className="w-5 h-5 text-primary" />
                        Core Values
                      </h4>
                      <ul className="space-y-3">
                        {selectedBelt.values.map((value, i) => (
                          <li key={i} className="flex items-center gap-3 text-gray-700">
                            <div className="w-2 h-2 rounded-full bg-primary" />
                            {value}
                          </li>
                        ))}
                      </ul>
                    </div>

                    {/* Key Skills */}
                    <div className="bg-gray-50 p-6 rounded-2xl">
                      <h4 className="font-bold text-gray-900 mb-4 flex items-center gap-2">
                        <Zap className="w-5 h-5 text-primary" />
                        Key Skills
                      </h4>
                      <ul className="space-y-3">
                        {selectedBelt.skills.map((skill, i) => (
                          <li key={i} className="flex items-center gap-3 text-gray-700">
                            <div className="w-2 h-2 rounded-full bg-secondary" />
                            {skill}
                          </li>
                        ))}
                      </ul>
                    </div>
                  </div>
                </div>
              </motion.div>
            </AnimatePresence>
          </div>
        </div>
      </div>
    </section>
  );
}
