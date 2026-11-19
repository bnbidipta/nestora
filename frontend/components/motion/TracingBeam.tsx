'use client';

import React from 'react';
import { motion, MotionValue } from 'framer-motion';

export function TracingBeam({ scrollYProgress }: { scrollYProgress: MotionValue<number> }) {
  return (
    <div className="fixed top-0 left-0 right-0 h-1 z-50 pointer-events-none">
      {/* Background track */}
      <div className="w-full h-full bg-ivory-300/40" />

      {/* Progress fill */}
      <motion.div
        className="absolute top-0 left-0 h-full bg-gradient-to-r from-champagne via-sage-700 to-sage-900 shadow-sm"
        style={{ scaleX: scrollYProgress, transformOrigin: "0%" }}
      />

      {/* Glowing cursor bead */}
      <motion.div
        className="absolute top-1/2 -translate-y-1/2 w-3 h-3 rounded-full bg-sage-900 border-2 border-white shadow-md"
        style={{
          left: scrollYProgress,
          translateX: "-50%"
        }}
      />
    </div>
  );
}
