'use client';

import React from 'react';
import { ArrowFolioLeftIcon, ArrowFolioRightIcon, CompassRoseIcon } from './BespokeIcons';

interface ChapterDockProps {
  currentChapter: number;
  totalChapters: number;
  onSelectChapter: (chapterIndex: number) => void;
  onPrev: () => void;
  onNext: () => void;
}

const CHAPTER_TITLES = [
  { num: 'I', label: 'The Vision' },
  { num: 'II', label: 'Living Adaptations' },
  { num: 'III', label: 'Tactile Materials' },
  { num: 'IV', label: 'The Master Plan' },
];

export default function ChapterDock({
  currentChapter,
  totalChapters,
  onSelectChapter,
  onPrev,
  onNext
}: ChapterDockProps) {
  const progressPercent = ((currentChapter + 1) / totalChapters) * 100;

  return (
    <div className="fixed bottom-6 left-1/2 -translate-x-1/2 z-50 flex items-center space-x-3 bg-white/85 backdrop-blur-xl border border-stone-border/80 px-4 py-2.5 rounded-full shadow-2xl transition-all duration-300">
      {/* Chapter Indicator Stamp */}
      <div className="flex items-center space-x-1.5 pr-3 border-r border-stone-border">
        <CompassRoseIcon className="w-4 h-4 text-sage-700" />
        <span className="text-xs font-bold text-sage-900 tracking-wider">
          FOLIO {currentChapter + 1}
        </span>
        <span className="text-[10px] text-stone-muted">/ 0{totalChapters}</span>
      </div>

      {/* Direct Chapter Buttons */}
      <div className="hidden sm:flex items-center space-x-1">
        {CHAPTER_TITLES.map((ch, idx) => (
          <button
            key={idx}
            onClick={() => onSelectChapter(idx)}
            className={`px-3 py-1 rounded-full text-xs font-medium transition-all ${
              currentChapter === idx
                ? 'bg-sage-800 text-ivory-50 shadow-sm'
                : 'text-stone-muted hover:text-sage-900 hover:bg-ivory-200/50'
            }`}
          >
            <span className="font-bold mr-1">{ch.num}.</span>
            {ch.label}
          </button>
        ))}
      </div>

      {/* Progress Line */}
      <div className="w-16 h-1 bg-ivory-200 rounded-full overflow-hidden mx-1">
        <div 
          className="h-full bg-sage-700 transition-all duration-300 rounded-full"
          style={{ width: `${progressPercent}%` }}
        />
      </div>

      {/* Folio Arrows */}
      <div className="flex items-center space-x-1 pl-2 border-l border-stone-border">
        <button
          onClick={onPrev}
          disabled={currentChapter === 0}
          aria-label="Previous Chapter"
          className="p-1.5 rounded-full text-sage-800 hover:bg-ivory-200 transition-all disabled:opacity-30 disabled:hover:bg-transparent"
        >
          <ArrowFolioLeftIcon className="w-4 h-4" />
        </button>
        <button
          onClick={onNext}
          disabled={currentChapter === totalChapters - 1}
          aria-label="Next Chapter"
          className="p-1.5 rounded-full text-sage-800 hover:bg-ivory-200 transition-all disabled:opacity-30 disabled:hover:bg-transparent"
        >
          <ArrowFolioRightIcon className="w-4 h-4" />
        </button>
      </div>
    </div>
  );
}
