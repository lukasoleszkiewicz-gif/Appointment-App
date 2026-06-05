// Referee Abroad logo as inline SVG component
export default function USOfficialsLogo({ size = 'normal' }) {
  const w = size === 'small' ? 110 : size === 'large' ? 180 : 140;
  const h = Math.round(w * 0.38);

  return (
    <svg width={w} height={h} viewBox="0 0 140 53" fill="none" xmlns="http://www.w3.org/2000/svg">
      {/* Circular green icon on the left */}
      <circle cx="24" cy="26" r="21" fill="#0f1a0f" stroke="#22c55e" strokeWidth="1.5"/>
      {/* Globe lines - horizontal */}
      <ellipse cx="24" cy="26" rx="14" ry="6" stroke="#22c55e" strokeWidth="1" fill="none" opacity="0.6"/>
      <ellipse cx="24" cy="26" rx="14" ry="11" stroke="#22c55e" strokeWidth="1" fill="none" opacity="0.5"/>
      {/* Globe lines - vertical */}
      <ellipse cx="24" cy="26" rx="6" ry="14" stroke="#22c55e" strokeWidth="1" fill="none" opacity="0.6"/>
      {/* Outer circle of globe */}
      <circle cx="24" cy="26" r="14" stroke="#22c55e" strokeWidth="1.5" fill="none"/>
      {/* Network dots */}
      <circle cx="24" cy="12" r="2" fill="#22c55e"/>
      <circle cx="24" cy="40" r="2" fill="#22c55e"/>
      <circle cx="10" cy="26" r="2" fill="#22c55e"/>
      <circle cx="38" cy="26" r="2" fill="#22c55e"/>
      <circle cx="15" cy="17" r="1.5" fill="#22c55e" opacity="0.7"/>
      <circle cx="33" cy="17" r="1.5" fill="#22c55e" opacity="0.7"/>
      <circle cx="15" cy="35" r="1.5" fill="#22c55e" opacity="0.7"/>
      <circle cx="33" cy="35" r="1.5" fill="#22c55e" opacity="0.7"/>
      {/* Text: "referee" bold white, "abroad" bold green */}
      <text x="52" y="23" fill="#f1f5f9" fontFamily="Arial Black, Arial, sans-serif" fontWeight="900" fontSize="13" letterSpacing="0.5">referee</text>
      <text x="52" y="39" fill="#22c55e" fontFamily="Arial Black, Arial, sans-serif" fontWeight="900" fontSize="13" letterSpacing="0.5">abroad</text>
    </svg>
  );
}
