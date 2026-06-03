// Star rating component — like classic FIFA career mode
// value: 0–100, displayed as 0–5 stars with halves
export default function StarRating({ value, max = 100, size = 16, color = '#f5c518', dimColor = '#2a2d3e', showNumber = false, label }) {
  const stars = (value / max) * 5;
  const fullStars = Math.floor(stars);
  const half = stars - fullStars >= 0.4;
  const emptyStars = 5 - fullStars - (half ? 1 : 0);

  return (
    <div style={{ display: 'inline-flex', alignItems: 'center', gap: 4 }}>
      {label && <span style={{ fontSize: size * 0.7, color: '#64748b', marginRight: 2 }}>{label}</span>}
      <div style={{ display: 'flex', gap: 1 }}>
        {Array(fullStars).fill(0).map((_, i) => (
          <StarFull key={`f${i}`} size={size} color={color} />
        ))}
        {half && <StarHalf size={size} color={color} dimColor={dimColor} />}
        {Array(emptyStars).fill(0).map((_, i) => (
          <StarEmpty key={`e${i}`} size={size} color={dimColor} />
        ))}
      </div>
      {showNumber && (
        <span style={{ fontSize: size * 0.75, color, fontWeight: 700, marginLeft: 4 }}>
          {value}
        </span>
      )}
    </div>
  );
}

function StarFull({ size, color }) {
  return (
    <svg width={size} height={size} viewBox="0 0 20 20" fill={color}>
      <path d="M10 1.5l2.47 5.01 5.53.81-4 3.9.94 5.49L10 14.27 5.06 16.71l.94-5.49-4-3.9 5.53-.81z"/>
    </svg>
  );
}

function StarHalf({ size, color, dimColor }) {
  const id = `half-${Math.random().toString(36).slice(2)}`;
  return (
    <svg width={size} height={size} viewBox="0 0 20 20">
      <defs>
        <linearGradient id={id}>
          <stop offset="50%" stopColor={color} />
          <stop offset="50%" stopColor={dimColor} />
        </linearGradient>
      </defs>
      <path d="M10 1.5l2.47 5.01 5.53.81-4 3.9.94 5.49L10 14.27 5.06 16.71l.94-5.49-4-3.9 5.53-.81z" fill={`url(#${id})`}/>
    </svg>
  );
}

function StarEmpty({ size, color }) {
  return (
    <svg width={size} height={size} viewBox="0 0 20 20" fill={color} opacity="0.5">
      <path d="M10 1.5l2.47 5.01 5.53.81-4 3.9.94 5.49L10 14.27 5.06 16.71l.94-5.49-4-3.9 5.53-.81z"/>
    </svg>
  );
}

// Dual bar showing current vs potential (like FIFA growth bar)
export function SkillBar({ current, potential, label }) {
  return (
    <div style={{ marginBottom: 8 }}>
      {label && <div style={{ fontSize: 10, color: '#64748b', marginBottom: 3 }}>{label}</div>}
      <div style={{ position: 'relative', height: 8, background: '#1a1d2e', borderRadius: 4, overflow: 'hidden' }}>
        {/* Potential (background) */}
        <div style={{
          position: 'absolute', left: 0, top: 0, height: '100%',
          width: `${potential}%`,
          background: 'rgba(139,92,246,0.25)',
          borderRadius: 4,
        }} />
        {/* Current (foreground) */}
        <div style={{
          position: 'absolute', left: 0, top: 0, height: '100%',
          width: `${current}%`,
          background: 'linear-gradient(90deg, #f5c518, #ff9800)',
          borderRadius: 4,
          transition: 'width 0.6s ease',
        }} />
      </div>
      <div style={{ display: 'flex', justifyContent: 'space-between', marginTop: 2 }}>
        <span style={{ fontSize: 10, color: '#f5c518', fontWeight: 700 }}>{current}</span>
        <span style={{ fontSize: 10, color: '#7c3aed', fontWeight: 600 }}>↑ {potential}</span>
      </div>
    </div>
  );
}
