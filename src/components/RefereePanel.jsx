import { useState } from 'react';
import StarRating from './StarRating';
import RefereeProfileModal from './RefereeProfileModal';
import { refereeProfiles } from '../data/refereeProfiles';

const COUNTRY_FLAGS = {
  'England': '🏴󠁧󠁢󠁥󠁮󠁧󠁿', 'Germany': '🇩🇪', 'France': '🇫🇷', 'Gibraltar': '🇬🇮',
  'Ireland': '🇮🇪', 'Austria': '🇦🇹', 'Italy': '🇮🇹', 'Spain': '🇪🇸',
  'Slovenia': '🇸🇮', 'Czechia': '🇨🇿', 'Poland': '🇵🇱', 'Sweden': '🇸🇪',
};

const BADGE_COLORS = { FIFA: '#f59e0b', National: '#3b82f6', Regional: '#8b5cf6', Youth: '#34d399' };

function RefereeCard({ referee, assignments, onClick }) {
  const profile = refereeProfiles[referee.id];
  const asMain = Object.values(assignments).filter(a => a?.referee === referee.id).length;
  const asAR = Object.values(assignments).filter(a => a?.ar1 === referee.id || a?.ar2 === referee.id).length;
  const total = asMain + asAR;
  const approved = Object.values(assignments).filter(a =>
    a?.status === 'approved' && (a?.referee === referee.id || a?.ar1 === referee.id || a?.ar2 === referee.id)
  ).length;

  const ovr = profile?.currentSkill || 50;
  const pot = profile?.potential || 60;

  return (
    <div
      onClick={onClick}
      style={{
        background: '#13151f', border: '1px solid #1e2235', borderRadius: 14,
        padding: '16px', cursor: 'pointer', transition: 'all 0.15s',
        position: 'relative', overflow: 'hidden',
      }}
      onMouseEnter={e => { e.currentTarget.style.borderColor = '#3b82f6'; e.currentTarget.style.background = '#15182a'; }}
      onMouseLeave={e => { e.currentTarget.style.borderColor = '#1e2235'; e.currentTarget.style.background = '#13151f'; }}
    >
      {/* FIFA-style OVR badge top-right */}
      <div style={{
        position: 'absolute', top: 12, right: 12, textAlign: 'center',
      }}>
        <div style={{
          fontSize: 22, fontWeight: 900, lineHeight: 1,
          color: ovr >= 80 ? '#f5c518' : ovr >= 65 ? '#60a5fa' : '#94a3b8',
        }}>{ovr}</div>
        <div style={{ fontSize: 8, color: '#475569', fontWeight: 700, letterSpacing: 0.5 }}>OVR</div>
      </div>

      {/* Top row */}
      <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 10, paddingRight: 44 }}>
        <div style={{
          width: 38, height: 38, borderRadius: 10,
          background: `${BADGE_COLORS[referee.badge] || '#64748b'}22`,
          display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 20, flexShrink: 0
        }}>
          {COUNTRY_FLAGS[referee.country] || '🏳️'}
        </div>
        <div style={{ overflow: 'hidden' }}>
          <div style={{
            fontSize: 12, fontWeight: 700, color: '#f1f5f9',
            overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap',
          }}>{referee.name}</div>
          <div style={{ fontSize: 10, color: '#64748b' }}>{referee.country} · Age {referee.age}</div>
        </div>
      </div>

      {/* Badge pill */}
      <div style={{ marginBottom: 10 }}>
        <span style={{
          background: `${BADGE_COLORS[referee.badge]}22`, color: BADGE_COLORS[referee.badge],
          fontSize: 9, fontWeight: 700, padding: '2px 8px', borderRadius: 5, letterSpacing: 0.5,
        }}>{referee.badge}</span>
      </div>

      {/* Stars - Current */}
      <div style={{ marginBottom: 6 }}>
        <div style={{ fontSize: 9, color: '#64748b', marginBottom: 3, fontWeight: 600 }}>CURRENT</div>
        <StarRating value={ovr} size={13} color="#f5c518" />
      </div>

      {/* Stars - Potential */}
      <div style={{ marginBottom: 12 }}>
        <div style={{ fontSize: 9, color: '#7c3aed', marginBottom: 3, fontWeight: 600 }}>POTENTIAL</div>
        <StarRating value={pot} size={13} color="#a78bfa" dimColor="#2a1f4e" />
      </div>

      {/* Growth arrow */}
      {pot > ovr + 5 && (
        <div style={{ marginBottom: 10 }}>
          <div style={{
            display: 'inline-flex', alignItems: 'center', gap: 4,
            background: 'rgba(124,58,237,0.15)', borderRadius: 6, padding: '3px 8px',
          }}>
            <span style={{ fontSize: 10 }}>↑</span>
            <span style={{ fontSize: 10, color: '#a78bfa', fontWeight: 700 }}>+{pot - ovr} growth potential</span>
          </div>
        </div>
      )}

      {/* Assignment counts */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3,1fr)', gap: 6, borderTop: '1px solid #1a1d2e', paddingTop: 10 }}>
        {[['Total', total, '#3b82f6'], ['Main', asMain, '#8b5cf6'], ['✓', approved, '#34d399']].map(([lbl, val, clr]) => (
          <div key={lbl} style={{ textAlign: 'center', background: '#0f1117', borderRadius: 6, padding: '5px 4px' }}>
            <div style={{ fontSize: 15, fontWeight: 800, color: clr }}>{val}</div>
            <div style={{ fontSize: 9, color: '#475569' }}>{lbl}</div>
          </div>
        ))}
      </div>

      {/* Click hint */}
      <div style={{ textAlign: 'center', marginTop: 8, fontSize: 10, color: '#475569' }}>
        Click for full profile →
      </div>
    </div>
  );
}

export default function RefereePanel({ referees, matches, assignments }) {
  const [selected, setSelected] = useState(null);
  const [filterBadge, setFilterBadge] = useState('all');
  const [sortBy, setSortBy] = useState('ovr');

  const badges = ['all', 'FIFA', 'National', 'Regional', 'Youth'];

  const filtered = referees
    .filter(r => filterBadge === 'all' || r.badge === filterBadge)
    .map(r => {
      const p = refereeProfiles[r.id];
      const total = Object.values(assignments).filter(a =>
        a?.referee === r.id || a?.ar1 === r.id || a?.ar2 === r.id
      ).length;
      return { ...r, ovr: p?.currentSkill || 50, pot: p?.potential || 60, total };
    })
    .sort((a, b) => {
      if (sortBy === 'ovr') return b.ovr - a.ovr;
      if (sortBy === 'pot') return b.pot - a.pot;
      if (sortBy === 'workload') return b.total - a.total;
      if (sortBy === 'age') return a.age - b.age;
      return 0;
    });

  const selectedRef = selected ? referees.find(r => r.id === selected) : null;

  return (
    <div>
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 20, flexWrap: 'wrap', gap: 12 }}>
        <div>
          <h2 style={{ fontSize: 18, fontWeight: 700, color: '#f1f5f9', margin: 0 }}>Referee Pool</h2>
          <p style={{ color: '#64748b', fontSize: 12, margin: '2px 0 0' }}>43 referees · click any card for full profile</p>
        </div>
        <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap' }}>
          {/* Badge filter */}
          <div style={{ display: 'flex', gap: 4 }}>
            {badges.map(b => (
              <button key={b} onClick={() => setFilterBadge(b)} style={{
                padding: '5px 10px', borderRadius: 6, border: 'none', cursor: 'pointer', fontSize: 11, fontWeight: 600,
                background: filterBadge === b ? BADGE_COLORS[b] || '#3b82f6' : '#1a1d2e',
                color: filterBadge === b ? 'white' : '#64748b',
              }}>{b}</button>
            ))}
          </div>
          {/* Sort */}
          <select value={sortBy} onChange={e => setSortBy(e.target.value)} style={{
            background: '#1a1d2e', border: '1px solid #1e2235', color: '#94a3b8',
            borderRadius: 6, padding: '5px 10px', fontSize: 11, cursor: 'pointer',
          }}>
            <option value="ovr">Sort: OVR ↓</option>
            <option value="pot">Sort: Potential ↓</option>
            <option value="workload">Sort: Workload ↓</option>
            <option value="age">Sort: Age ↑</option>
          </select>
        </div>
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(210px, 1fr))', gap: 12 }}>
        {filtered.map(r => (
          <RefereeCard
            key={r.id}
            referee={r}
            assignments={assignments}
            onClick={() => setSelected(r.id)}
          />
        ))}
      </div>

      {selectedRef && (
        <RefereeProfileModal
          referee={selectedRef}
          matches={matches}
          assignments={assignments}
          onClose={() => setSelected(null)}
        />
      )}
    </div>
  );
}
