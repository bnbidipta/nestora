import React from 'react';

export interface IconProps {
  className?: string;
  style?: React.CSSProperties;
  width?: number | string;
  height?: number | string;
}

// Bespoke 0.75px fine-gauge SVG architectural line icons
// Guaranteed bounded dimensions (explicit width/height + inline style limits)

export function CompassRoseIcon({ className = "w-5 h-5", style, width = 20, height = 20 }: IconProps) {
  return (
    <svg 
      className={className} 
      width={width} 
      height={height} 
      style={{ display: 'inline-block', flexShrink: 0, maxWidth: '24px', maxHeight: '24px', ...style }} 
      viewBox="0 0 24 24" 
      fill="none" 
      stroke="currentColor" 
      strokeWidth="0.85" 
      strokeLinecap="round" 
      strokeLinejoin="round"
    >
      <circle cx="12" cy="12" r="10" />
      <polygon points="12 2 14.5 9.5 22 12 14.5 14.5 12 22 9.5 14.5 2 12 9.5 9.5 12 2" fill="currentColor" fillOpacity="0.08" />
      <line x1="12" y1="2" x2="12" y2="22" strokeDasharray="1 2" />
      <line x1="2" y1="12" x2="22" y2="12" strokeDasharray="1 2" />
      <text x="12" y="6" fontSize="3" textAnchor="middle" fill="currentColor" fontFamily="Helvetica, Arial, sans-serif" fontWeight="bold">N</text>
    </svg>
  );
}

export function PlumbBobIcon({ className = "w-5 h-5", style, width = 20, height = 20 }: IconProps) {
  return (
    <svg 
      className={className} 
      width={width} 
      height={height} 
      style={{ display: 'inline-block', flexShrink: 0, maxWidth: '24px', maxHeight: '24px', ...style }} 
      viewBox="0 0 24 24" 
      fill="none" 
      stroke="currentColor" 
      strokeWidth="0.85" 
      strokeLinecap="round" 
      strokeLinejoin="round"
    >
      <line x1="12" y1="1" x2="12" y2="9" />
      <circle cx="12" cy="10" r="1.5" />
      <polygon points="12 11 16 15 12 23 8 15" fill="currentColor" fillOpacity="0.1" />
      <line x1="9" y1="15" x2="15" y2="15" />
    </svg>
  );
}

export function TSquareIcon({ className = "w-5 h-5", style, width = 20, height = 20 }: IconProps) {
  return (
    <svg 
      className={className} 
      width={width} 
      height={height} 
      style={{ display: 'inline-block', flexShrink: 0, maxWidth: '24px', maxHeight: '24px', ...style }} 
      viewBox="0 0 24 24" 
      fill="none" 
      stroke="currentColor" 
      strokeWidth="0.85" 
      strokeLinecap="round" 
      strokeLinejoin="round"
    >
      <rect x="2" y="2" width="20" height="3" rx="0.5" fill="currentColor" fillOpacity="0.12" />
      <rect x="10.5" y="5" width="3" height="17" rx="0.5" fill="currentColor" fillOpacity="0.08" />
      <line x1="10.5" y1="8" x2="12" y2="8" />
      <line x1="10.5" y1="12" x2="12" y2="12" />
      <line x1="10.5" y1="16" x2="12" y2="16" />
      <line x1="10.5" y1="20" x2="12" y2="20" />
    </svg>
  );
}

export function SunArcIcon({ className = "w-5 h-5", style, width = 20, height = 20 }: IconProps) {
  return (
    <svg 
      className={className} 
      width={width} 
      height={height} 
      style={{ display: 'inline-block', flexShrink: 0, maxWidth: '24px', maxHeight: '24px', ...style }} 
      viewBox="0 0 24 24" 
      fill="none" 
      stroke="currentColor" 
      strokeWidth="0.85" 
      strokeLinecap="round" 
      strokeLinejoin="round"
    >
      <path d="M3 20 A 10 10 0 0 1 21 20" strokeDasharray="1.5 2" />
      <circle cx="12" cy="10" r="2.5" fill="currentColor" fillOpacity="0.15" />
      <line x1="12" y1="4" x2="12" y2="6" />
      <line x1="6.3" y1="6.3" x2="7.7" y2="7.7" />
      <line x1="17.7" y1="6.3" x2="16.3" y2="7.7" />
      <line x1="1" y1="20" x2="23" y2="20" />
    </svg>
  );
}

export function CantileverBeamIcon({ className = "w-5 h-5", style, width = 20, height = 20 }: IconProps) {
  return (
    <svg 
      className={className} 
      width={width} 
      height={height} 
      style={{ display: 'inline-block', flexShrink: 0, maxWidth: '24px', maxHeight: '24px', ...style }} 
      viewBox="0 0 24 24" 
      fill="none" 
      stroke="currentColor" 
      strokeWidth="0.85" 
      strokeLinecap="round" 
      strokeLinejoin="round"
    >
      <rect x="3" y="4" width="4" height="18" fill="currentColor" fillOpacity="0.12" />
      <rect x="3" y="4" width="18" height="4" fill="currentColor" fillOpacity="0.15" />
      <line x1="3" y1="22" x2="7" y2="22" />
      <line x1="19" y1="8" x2="19" y2="14" strokeDasharray="1 1.5" />
      <path d="M17 12 L19 14 L21 12" />
    </svg>
  );
}

export function AcousticWaveIcon({ className = "w-5 h-5", style, width = 20, height = 20 }: IconProps) {
  return (
    <svg 
      className={className} 
      width={width} 
      height={height} 
      style={{ display: 'inline-block', flexShrink: 0, maxWidth: '24px', maxHeight: '24px', ...style }} 
      viewBox="0 0 24 24" 
      fill="none" 
      stroke="currentColor" 
      strokeWidth="0.85" 
      strokeLinecap="round" 
      strokeLinejoin="round"
    >
      <path d="M2 12 C 4 8, 6 16, 8 12 C 10 7, 12 17, 14 12 C 16 9, 18 15, 20 12 C 21 10.5, 22 13.5, 23 12" />
      <line x1="11" y1="3" x2="11" y2="21" strokeDasharray="1.5 2" />
    </svg>
  );
}

export function ArchitecturalRulerIcon({ className = "w-5 h-5", style, width = 20, height = 20 }: IconProps) {
  return (
    <svg 
      className={className} 
      width={width} 
      height={height} 
      style={{ display: 'inline-block', flexShrink: 0, maxWidth: '24px', maxHeight: '24px', ...style }} 
      viewBox="0 0 24 24" 
      fill="none" 
      stroke="currentColor" 
      strokeWidth="0.85" 
      strokeLinecap="round" 
      strokeLinejoin="round"
    >
      <rect x="1" y="7" width="22" height="10" rx="1" fill="currentColor" fillOpacity="0.08" />
      <line x1="4" y1="7" x2="4" y2="11" />
      <line x1="7" y1="7" x2="7" y2="14" />
      <line x1="10" y1="7" x2="10" y2="11" />
      <line x1="13" y1="7" x2="13" y2="14" />
      <line x1="16" y1="7" x2="16" y2="11" />
      <line x1="19" y1="7" x2="19" y2="14" />
    </svg>
  );
}

export function ShieldVerifiedIcon({ className = "w-5 h-5", style, width = 20, height = 20 }: IconProps) {
  return (
    <svg 
      className={className} 
      width={width} 
      height={height} 
      style={{ display: 'inline-block', flexShrink: 0, maxWidth: '24px', maxHeight: '24px', ...style }} 
      viewBox="0 0 24 24" 
      fill="none" 
      stroke="currentColor" 
      strokeWidth="0.85" 
      strokeLinecap="round" 
      strokeLinejoin="round"
    >
      <path d="M12 2 L20 6 V12 C20 17 16.5 21 12 22 C7.5 21 4 17 4 12 V6 L12 2 Z" fill="currentColor" fillOpacity="0.08" />
      <polyline points="9 12 11 14 15 10" />
    </svg>
  );
}

export function ArrowFolioRightIcon({ className = "w-4 h-4", style, width = 16, height = 16 }: IconProps) {
  return (
    <svg 
      className={className} 
      width={width} 
      height={height} 
      style={{ display: 'inline-block', flexShrink: 0, maxWidth: '20px', maxHeight: '20px', ...style }} 
      viewBox="0 0 24 24" 
      fill="none" 
      stroke="currentColor" 
      strokeWidth="1.2" 
      strokeLinecap="round" 
      strokeLinejoin="round"
    >
      <line x1="4" y1="12" x2="20" y2="12" />
      <polyline points="14 6 20 12 14 18" />
    </svg>
  );
}

export function ArrowFolioLeftIcon({ className = "w-4 h-4", style, width = 16, height = 16 }: IconProps) {
  return (
    <svg 
      className={className} 
      width={width} 
      height={height} 
      style={{ display: 'inline-block', flexShrink: 0, maxWidth: '20px', maxHeight: '20px', ...style }} 
      viewBox="0 0 24 24" 
      fill="none" 
      stroke="currentColor" 
      strokeWidth="1.2" 
      strokeLinecap="round" 
      strokeLinejoin="round"
    >
      <line x1="20" y1="12" x2="4" y2="12" />
      <polyline points="10 6 4 12 10 18" />
    </svg>
  );
}
