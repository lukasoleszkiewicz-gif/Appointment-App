// USofficials logo as inline SVG component
export default function USOfficialsLogo({ size = 'normal' }) {
  const w = size === 'small' ? 110 : size === 'large' ? 180 : 140;
  const h = Math.round(w * 0.38);

  return (
    <svg width={w} height={h} viewBox="0 0 140 53" fill="none" xmlns="http://www.w3.org/2000/svg">
      {/* Outer border */}
      <rect x="1" y="1" width="138" height="51" rx="7" fill="#1a1a6e" stroke="#1a1a6e" strokeWidth="2"/>
      {/* Red stripe top */}
      <rect x="1" y="1" width="138" height="14" rx="7" fill="#cc1111"/>
      <rect x="1" y="8" width="138" height="7" fill="#cc1111"/>
      {/* Red stripe bottom */}
      <rect x="1" y="38" width="138" height="14" rx="7" fill="#cc1111"/>
      <rect x="1" y="38" width="138" height="7" fill="#cc1111"/>
      {/* Main body - blue */}
      <rect x="1" y="14" width="138" height="25" fill="#1a1a6e"/>
      {/* Slash marks */}
      <line x1="16" y1="44" x2="26" y2="9" stroke="white" strokeWidth="4.5" strokeLinecap="round"/>
      <line x1="24" y1="44" x2="34" y2="9" stroke="white" strokeWidth="4.5" strokeLinecap="round"/>
      {/* Vertical divider */}
      <line x1="38" y1="9" x2="38" y2="44" stroke="white" strokeWidth="1.5" opacity="0.5"/>
      {/* Text */}
      <text x="46" y="32" fill="white" fontFamily="Arial Black, Arial, sans-serif" fontWeight="900" fontSize="15" letterSpacing="0.5">USOFFICIALS</text>
      {/* Stars top right */}
      <text x="112" y="12" fill="white" fontSize="8" fontFamily="Arial">★★★</text>
    </svg>
  );
}
