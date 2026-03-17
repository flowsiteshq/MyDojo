import React, { useState, useRef, forwardRef } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Button, buttonVariants } from "@/components/ui/button";
import { VariantProps } from "class-variance-authority";
import { cn } from "@/lib/utils";

interface Particle {
  id: string;
  x: number;
  y: number;
  angle: number;
  velocity: number;
  size: number;
  color: string;
  life: number;
}

interface Shockwave {
  id: string;
  x: number;
  y: number;
  color: string;
}

interface ParticleButtonProps
  extends React.ComponentProps<"button">,
    VariantProps<typeof buttonVariants> {
  asChild?: boolean;
  particleColor?: string;
  particleCount?: number;
}

export const ParticleButton = forwardRef<HTMLButtonElement, ParticleButtonProps>(
  ({ children, className, particleColor = "#ef4444", particleCount = 30, onClick, onMouseEnter, ...props }, ref) => {
    const [particles, setParticles] = useState<Particle[]>([]);
    const [shockwaves, setShockwaves] = useState<Shockwave[]>([]);
    const localRef = useRef<HTMLButtonElement>(null);
    
    // Combine refs
    const setRefs = (element: HTMLButtonElement | null) => {
      localRef.current = element;
      if (typeof ref === "function") {
        ref(element);
      } else if (ref) {
        (ref as React.MutableRefObject<HTMLButtonElement | null>).current = element;
      }
    };

    const spawnParticles = (x: number, y: number, count: number, speedMultiplier: number = 1, sizeMultiplier: number = 1) => {
      const newParticles: Particle[] = [];
      for (let i = 0; i < count; i++) {
        const angle = (Math.PI * 2 * i) / count;
        // Mix in some white/gold sparks for contrast
        const isSpark = Math.random() > 0.7;
        const color = isSpark ? (Math.random() > 0.5 ? "#ffffff" : "#fbbf24") : particleColor;
        
        newParticles.push({
          id: `p-${Date.now()}-${i}-${Math.random().toString(36).substr(2, 9)}`,
          x,
          y,
          angle: angle + (Math.random() * 0.5 - 0.25),
          velocity: (3 + Math.random() * 5) * speedMultiplier, // Faster velocity
          size: (isSpark ? 2 : 4 + Math.random() * 6) * sizeMultiplier, // Larger size variation
          color: color,
          life: 1.0
        });
      }
      setParticles((prev) => [...prev, ...newParticles]);
      
      // Cleanup
      setTimeout(() => {
        setParticles((prev) => prev.filter((p) => !newParticles.includes(p)));
      }, 1500);
    };

    const spawnShockwave = (x: number, y: number) => {
      const newShockwave = {
        id: `s-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
        x,
        y,
        color: particleColor
      };
      setShockwaves(prev => [...prev, newShockwave]);
      setTimeout(() => {
        setShockwaves(prev => prev.filter(s => s !== newShockwave));
      }, 1000);
    };

    const handleClick = (e: React.MouseEvent<HTMLButtonElement>) => {
      const rect = localRef.current?.getBoundingClientRect();
      if (rect) {
        const clickX = e.clientX - rect.left;
        const clickY = e.clientY - rect.top;
        spawnParticles(clickX, clickY, particleCount * 2.5, 3, 1.8); // More particles, faster, bigger
        spawnShockwave(clickX, clickY);
      }
      if (onClick) onClick(e);
    };

    const handleMouseEnter = (e: React.MouseEvent<HTMLButtonElement>) => {
      const rect = localRef.current?.getBoundingClientRect();
      if (rect) {
        // Spawn a few particles from the center on hover
        spawnParticles(rect.width / 2, rect.height / 2, 8, 0.5, 0.8);
      }
      if (onMouseEnter) onMouseEnter(e);
    };

    return (
      <div className="relative inline-block">
        <Button
          ref={setRefs}
          className={cn("relative overflow-visible active:scale-95 transition-transform z-10", className)}
          onClick={handleClick}
          onMouseEnter={handleMouseEnter}
          {...props}
        >
          {children}
        </Button>
        
        <AnimatePresence>
          {shockwaves.map((wave) => (
            <motion.div
              key={wave.id}
              initial={{ 
                x: wave.x, 
                y: wave.y, 
                width: 0,
                height: 0,
                opacity: 0.8,
                borderWidth: 20
              }}
              animate={{ 
                x: wave.x, 
                y: wave.y, 
                width: 500,
                height: 500,
                opacity: 0,
                borderWidth: 0
              }}
              exit={{ opacity: 0 }}
              transition={{ duration: 0.8, ease: "easeOut" }}
              style={{
                position: "absolute",
                top: 0,
                left: 0,
                transform: "translate(-50%, -50%)",
                borderRadius: "50%",
                borderColor: wave.color,
                borderStyle: "solid",
                pointerEvents: "none",
                zIndex: 15,
              }}
            />
          ))}
          {particles.map((particle) => (
            <motion.div
              key={particle.id}
              initial={{ 
                x: particle.x, 
                y: particle.y, 
                opacity: 1, 
                scale: 0 
              }}
              animate={{ 
                x: particle.x + Math.cos(particle.angle) * 150 * particle.velocity * 0.5, 
                y: particle.y + Math.sin(particle.angle) * 150 * particle.velocity * 0.5, 
                opacity: 0, 
                scale: 0.5 
              }}
              exit={{ opacity: 0 }}
              transition={{ duration: 1.2, ease: "easeOut" }}
              style={{
                position: "absolute",
                top: 0,
                left: 0,
                width: particle.size,
                height: particle.size,
                borderRadius: "50%",
                backgroundColor: particle.color,
                pointerEvents: "none",
                zIndex: 20,
                boxShadow: `0 0 ${particle.size * 4}px ${particle.color}`, // Stronger glow
              }}
            />
          ))}
        </AnimatePresence>
      </div>
    );
  }
);

ParticleButton.displayName = "ParticleButton";
