'use client';

import React from 'react';
import { motion } from 'framer-motion';
import { cn } from '@/lib/utils';

interface KineticTextProps {
  text: string;
  className?: string;
  highlightWords?: string[];
  highlightClassName?: string;
  delay?: number;
}

export function KineticText({
  text,
  className,
  highlightWords = [],
  highlightClassName = "text-transparent bg-clip-text bg-gradient-to-r from-sage-900 via-sage-800 to-sage-600",
  delay = 0
}: KineticTextProps) {
  const words = text.split(" ");

  const container = {
    hidden: { opacity: 0 },
    visible: (i: number = 1) => ({
      opacity: 1,
      transition: { staggerChildren: 0.08, delayChildren: delay }
    })
  };

  const child = {
    hidden: {
      opacity: 0,
      y: 24,
      filter: "blur(6px)"
    },
    visible: {
      opacity: 1,
      y: 0,
      filter: "blur(0px)",
      transition: {
        type: "spring",
        damping: 18,
        stiffness: 120
      }
    }
  };

  return (
    <motion.span
      className={cn("inline-block", className)}
      variants={container}
      initial="hidden"
      whileInView="visible"
      viewport={{ once: true }}
    >
      {words.map((word, index) => {
        const isHighlight = highlightWords.some(hw => 
          word.toLowerCase().includes(hw.toLowerCase())
        );

        return (
          <motion.span
            key={index}
            variants={child}
            className={cn("inline-block mr-[0.28em] will-change-transform", isHighlight && highlightClassName)}
          >
            {word}
          </motion.span>
        );
      })}
    </motion.span>
  );
}
