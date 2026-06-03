import { useState } from 'react';

const COUNTRY_FLAGS = {
  'England': '🏴󠁧󠁢󠁥󠁮󠁧󠁿', 'Germany': '🇩🇪', 'France': '🇫🇷', 'Gibraltar': '🇬🇮',
  'Ireland': '🇮🇪', 'Austria': '🇦🇹', 'Italy': '🇮🇹', 'Spain': '🇪🇸',
  'Slovenia': '🇸🇮', 'Czechia': '🇨🇿', 'Poland': '🇵🇱', 'Sweden': '🇸🇪',
};

const BADGE_COLORS = { FIFA: '#f59e0b', National: '#3b82f6', Regional: '#8b5cf6', Youth: '#34d399' };

export default function RefereePanel({ referees, matches, assignments }) {
  const [selected, setSelected] = useState(null);

  const refStats = referees.map(r => {
    const asMain = Object.values(assignments).filter(a => a?.referee === r.id).length;
    const asAR = Object.values(assignments).filter(a => a?.ar1 === r.id || a?.ar2 === r.id).length;
    const total = asMain + asAR;
    const approvedCount = Object.entries(assignments)
      .filter(([, a]) => a?.status === 'approved' && (a?.referee === r.id || a?.ar1 === r.id || a?.ar2 === r.id)).length;
    return { ...r, asMain, asAR, total, approvedCount };
  }).sort((a, b) => b.total - a.total);

  const selectedRef = selected ? refStats.find(r => r.id === selected) : null;
  const selectedMatches = selected ? matches.filter(m =>
    assignments[m.id]?.referee === selected ||
    assignments[m.id]?.ar1 === selected ||
    assignments[m.id]?.ar2 === selected
  ) : [];

  return (
    <div style={{ display: 'grid', gridTemplateColumns: selected ? '1fr 380px' : '1fr', gap: 20 }}>
      <div>
        <div style={{ marginBottom: 20 }}>
          <h2 style={{ fontSize: 18, fontWeight: 700, color: '#f1f5f9', margin: 0 }}>Referee Pool</h2>
          <p style={{ color: '#64748b', fontSize: 12, margin: '2px 0 0' }}>43 referees from 12 countries</p>
        </div>

        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(240px, 1fr))', gap: 12 }}>
          {refStats.map(r => (
            <div
              key={r.id}
              onClick={() => setSelected(selected === r.id ? null : r.id)}
              style={{
                background: selected === r.id ? 'rgba(59,130,246,0.12)' : '#13151f',
                border: `1px solid ${selected === r.id ? '#3b82f6' : '#1e2235'}`,
                borderRadius: 12, padding: '14px 16px', cursor: 'pointer',
                transition: 'all 0.15s'
              }}
            >
              <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 10 }}>
                <div style={{
                  width: 36, height: 36, borderRadius: 10,
                  background: `${BADGE_COLORS[r.badge] || '#64748b'}22`,
                  display: 'flex', alignItems: 'center', justifyContent: 'center',
                  fontSize: 18
                }}>
                  {COUNTRY_FLAGS[r.country] || '🏳️'}
                </div>
                <div style={{ flex: 1, overflow: 'hidden' }}>
                  <div style={{ fontSize: 13, fontWeight: 600, color: '#f1f5f9', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{r.name}</div>
                  <div style={{ fontSize: 11, color: '#64748b' }}>{r.country} · Age {r.age}</div>
                </div>
                <span style={{
                  background: `${BADGE_COLORS[r.badge]}22`, color: BADGE_COLORS[r.badge],
                  fontSize: 10, fontWeight: 700, padding: '2px 8px', borderRadius: 6
                }}>{r.badge}</span>
              </div>

              <div style={{ display: 'flex', gap: 12 }}>
                <div style={{ flex: 1, textAlign: 'center', background: '#0f1117', borderRadius: 8, padding: '6px 8px' }}>
                  <div style={{ fontSize: 18, fontWeight: 700, color: '#3b82f6' }}>{r.total}</div>
                  <div style={{ fontSize: 10, color: '#475569' }}>Total</div>
                </div>
                <div style={{ flex: 1, textAlign: 'center', background: '#0f1117', borderRadius: 8, padding: '6px 8px' }}>
                  <div style={{ fontSize: 18, fontWeight: 700, color: '#8b5cf6' }}>{r.asMain}</div>
                  <div style={{ fontSize: 10, color: '#475569' }}>Main</div>
                </div>
                <div style={{ flex: 1, textAlign: 'center', background: '#0f1117', borderRadius: 8, padding: '6px 8px' }}>
                  <div style={{ fontSize: 18, fontWeight: 700, color: '#34d399' }}>{r.approvedCount}</div>
                  <div style={{ fontSize: 10, color: '#475569' }}>✓</div>
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Detail panel */}
      {selectedRef && (
        <div style={{ background: '#13151f', border: '1px solid #1e2235', borderRadius: 12, padding: 20, alignSelf: 'start', position: 'sticky', top: 0 }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 12, marginBottom: 20 }}>
            <div style={{ fontSize: 32 }}>{COUNTRY_FLAGS[selectedRef.country] || '🏳️'}</div>
            <div>
              <div style={{ fontSize: 15, fontWeight: 700, color: '#f1f5f9' }}>{selectedRef.name}</div>
              <div style={{ fontSize: 12, color: '#64748b' }}>{selectedRef.country}</div>
            </div>
          </div>

          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 8, marginBottom: 16 }}>
            {[
              ['Badge', selectedRef.badge, BADGE_COLORS[selectedRef.badge]],
              ['Age', selectedRef.age, '#94a3b8'],
              ['Kit Size', selectedRef.size, '#94a3b8'],
              ['Assigned', selectedRef.total, '#3b82f6'],
            ].map(([label, val, color]) => (
              <div key={label} style={{ background: '#0f1117', borderRadius: 8, padding: '10px 12px' }}>
                <div style={{ fontSize: 10, color: '#475569', marginBottom: 2 }}>{label}</div>
                <div style={{ fontSize: 14, fontWeight: 700, color: color || '#f1f5f9' }}>{val}</div>
              </div>
            ))}
          </div>

          <div style={{ fontSize: 12, fontWeight: 600, color: '#94a3b8', marginBottom: 10 }}>
            ASSIGNED MATCHES ({selectedMatches.length})
          </div>
          <div style={{ maxHeight: 400, overflowY: 'auto' }}>
            {selectedMatches.length === 0 ? (
              <div style={{ color: '#475569', fontSize: 12, textAlign: 'center', padding: '20px 0' }}>No matches assigned yet</div>
            ) : selectedMatches.map(m => {
              const role = assignments[m.id]?.referee === selected ? 'Referee' :
                assignments[m.id]?.ar1 === selected ? 'AR1' : 'AR2';
              return (
                <div key={m.id} style={{
                  background: '#0f1117', borderRadius: 8, padding: '10px 12px', marginBottom: 8,
                  display: 'flex', gap: 10, alignItems: 'flex-start'
                }}>
                  <span style={{
                    background: role === 'Referee' ? 'rgba(59,130,246,0.2)' : 'rgba(139,92,246,0.2)',
                    color: role === 'Referee' ? '#60a5fa' : '#a78bfa',
                    fontSize: 10, fontWeight: 700, padding: '2px 6px', borderRadius: 5, whiteSpace: 'nowrap'
                  }}>{role}</span>
                  <div>
                    <div style={{ fontSize: 12, color: '#e2e8f0', fontWeight: 500 }}>{m.home} vs {m.away}</div>
                    <div style={{ fontSize: 11, color: '#475569' }}>{m.date} {m.time} · {m.teamType}</div>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      )}
    </div>
  );
}
