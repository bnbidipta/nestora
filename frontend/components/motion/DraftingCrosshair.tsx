'use client';

import React, { useEffect, useState } from 'react';
import { motion, useSpring } from 'framer-motion';

export default function DraftingCrosshair() {
  const [coords, setCoords] = useState({ x: 0, y: 0, mmX: 0, mmY: 0 });
  const [isVisible, setIsVisible] = useState(false);

  const springConfig = { damping: 25, stiffness: 350 };
  const cursorX = useSpring(0, springConfig);
  const cursorY = useSpring(0, springConfig);

  useEffect(() => {
    const handleMouseMove = (e: MouseEvent) => {
      cursorX.set(e.clientX);
      cursorY.set(e.clientY);
      setCoords({
        x: e.clientX,
        y: e.clientY,
        mmX: Math.round(e.clientX * 2.5),
        mmY: Math.round(e.clientY * 2.5)
      });
      if (!isVisible) setIsVisible(true);
    };

    const handleMouseLeave = () => setIsVisible(false);

    window.addEventListener('mousemove', handleMouseMove);
    document.addEventListener('mouseleave', handleMouseLeave);

    return () => {
      window.removeEventListener('mousemove', handleMouseMove);
      document.removeEventListener('mouseleave', handleMouseLeave);
    };
  }, [isVisible, cursorX, cursorY]);

  if (!isVisible) return null;

  return (
    <motion.div
      className="fixed pointer-events-none z-50 transition-opacity duration-300 hidden md:block"
      style={{
        x: cursorX,
        y: cursorY,
        translateX: "-50%",
        translateY: "-50%"
      }}
    >
      {/* Precision Crosshair Lines */}
      <div className="relative w-12 h-12 flex items-center justify-center">
        <div className="absolute w-full h-[0.75px] bg-sage-800/25" />
        <div className="absolute h-full w-[0.75px] bg-sage-800/25" />
        <div className="w-2.5 h-2.5 rounded-full border border-sage-800/40 bg-white/30 backdrop-blur-xs" />
        
        {/* Dynamic Coordinate Tag */}
        <div className="absolute top-4 left-4 bg-white/90 backdrop-blur-md px-2 py-0.5 rounded border border-stone-border/80 shadow-xs flex items-center space-x-1.5 whitespace-nowrap">
          <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-ping" />
          <span className="text-[9px] font-mono text-sage-900 font-semibold tracking-tighter">
            X:{coords.mmX}mm Y:{coords.mmY}mm
          </span>
        </div>
      </div>
    </motion.div>
  );
}
