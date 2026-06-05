import React from 'react';

// Referee Abroad logo as inline SVG component
// size: 'sm' | 'md' | 'lg' (also accepts legacy 'small' | 'normal' | 'large')
export default function USOfficialsLogo({ size = 'md' }) {
  const normalized = size === 'small' ? 'sm' : size === 'large' ? 'lg' : size === 'normal' ? 'md' : size;
  const scale = normalized === 'sm' ? 0.6 : normalized === 'lg' ? 1.4 : 1;
  const w = Math.round(220 * scale);
  const h = Math.round(80 * scale);
  return (
    <svg width={w} height={h} viewBox="0 0 220 80" fill="none" xmlns="http://www.w3.org/2000/svg">
      {/* Green outer blob */}
      <ellipse cx="40" cy="40" rx="36" ry="36" fill="#6abf3e"/>
      {/* Satellite ovals */}
      <ellipse cx="40" cy="6" rx="6" ry="4" fill="#2a2a2a"/>
      <ellipse cx="40" cy="74" rx="6" ry="4" fill="#2a2a2a"/>
      <ellipse cx="6" cy="40" rx="4" ry="6" fill="#2a2a2a" transform="rotate(-20 6 40)"/>
      <ellipse cx="74" cy="40" rx="4" ry="6" fill="#2a2a2a" transform="rotate(20 74 40)"/>
      {/* Inner white ring hint */}
      <ellipse cx="40" cy="40" rx="24" ry="24" fill="white"/>
      {/* Dark dumbbell/figure-8 center shape */}
      <ellipse cx="33" cy="40" rx="10" ry="13" fill="#2a2a2a"/>
      <ellipse cx="47" cy="40" rx="10" ry="13" fill="#2a2a2a"/>
      <rect x="33" y="34" width="14" height="12" fill="#2a2a2a"/>
      {/* White gap to create figure-8 waist */}
      <ellipse cx="40" cy="40" rx="4" ry="6" fill="white"/>
      {/* Text: referee */}
      <text x="90" y="38" fontFamily="Arial Black, sans-serif" fontWeight="900" fontSize="28" fill="#1a1a1a">referee</text>
      {/* Text: abroad */}
      <text x="90" y="68" fontFamily="Arial Black, sans-serif" fontWeight="900" fontSize="28" fill="#6abf3e">abroad</text>
    </svg>
  );
}
