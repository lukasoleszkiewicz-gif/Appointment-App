import { useState } from 'react';
import RefereeProfileModal from './RefereeProfileModal';
import { refereeProfiles } from '../data/refereeProfiles';

function getBadgeLevel(badge) {
  if (badge === 'Youth') return 'Local Referee';
  return 'Regional Referee';
}

const COUNTRY_FLAGS = {
  'England': '🏴󠁧󠁢󠁥󠁮󠁧󠁿', 'Germany': '🇩🇪', 'France': '🇫🇷', 'Gibraltar': '🇬🇮',
  'Ireland': '🇮🇪', 'Austria': '🇦🇹', 'Italy': '🇮🇹', 'Spain': '🇪🇸',
  'Slovenia': '🇸🇮', 'Czechia': '🇨🇿', 'Poland': '🇵🇱', 'Sweden': '🇸🇪',
  'Wales': '🏴󠁧󠁢󠁷󠁬󠁳󠁿', 'USA': '🇺🇸', 'Canada': '🇨🇦', 'Belgium': '🇧🇪',
  'Denmark': '🇩🇰', 'Switzerland': '🇨🇭', 'China': '🇨🇳', 'Romania': '🇷🇴',
  'Moldova': '🇲🇩', 'Hungary': '🇭🇺', 'Faroe Islands': '🇫🇴', 'Egypt': '🇪🇬',
};

const BADGE_COLORS = { FIFA: '#f59e0b', National: '#3b82f6', Regional: '#8b5cf6', Youth: '#34d399' };
const STATUS_COLORS = { Confirmed: '#34d399', Booked: '#60a5fa', Reserved: '#f59e0b' };

function RefereeCard({ referee, assignments, onClick }) {
  const profile = refereeProfiles[referee.id];
  const asMain = Object.values(assignments).filter(a => a?.referee === referee.id).length;
  const asAR = Object.values(assignments).filter(a => a?.ar1 === referee.id || a?.ar2 === referee.id).length;
  const total = asMain + asAR;
  const approved = Object.values(assignments).filter(a =>
    a?.status === 'approved' && (a?.referee === referee.id || a?.ar1 === referee.id || a?.ar2 === referee.id)
  ).length;

  const level = getBadgeLevel(referee.badge);

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
      {/* Top row */}
      <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 10 }}>
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
          <div style={{ fontSize: 10, color: '#64748b' }}>{referee.country}</div>
        </div>
      </div>

      {/* Level badge */}
      <div style={{ marginBottom: 10 }}>
        <span style={{
          background: `${BADGE_COLORS[referee.badge]}22`, color: BADGE_COLORS[referee.badge],
          fontSize: 9, fontWeight: 700, padding: '2px 8px', borderRadius: 5, letterSpacing: 0.5,
        }}>{level}</span>
      </div>

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
  const [sortBy, setSortBy] = useState('name');
  const [viewMode, setViewMode] = useState('cards');
  const [tableSort, setTableSort] = useState({ col: 'name', dir: 'asc' });
  const [search, setSearch] = useState('');

  const badges = ['all', 'National', 'Regional', 'Youth'];

  const enriched = referees
    .filter(r => filterBadge === 'all' || r.badge === filterBadge)
    .filter(r => {
      if (!search) return true;
      const s = search.toLowerCase();
      return r.name.toLowerCase().includes(s) || r.country.toLowerCase().includes(s);
    })
    .map(r => {
      const total = Object.values(assignments).filter(a =>
        a?.referee === r.id || a?.ar1 === r.id || a?.ar2 === r.id
      ).length;
      return { ...r, total };
    });

  const filtered = [...enriched].sort((a, b) => {
    if (viewMode === 'cards') {
      if (sortBy === 'workload') return b.total - a.total;
      if (sortBy === 'age') return a.age - b.age;
      if (sortBy === 'name') return a.name.localeCompare(b.name);
      return 0;
    } else {
      const { col, dir } = tableSort;
      let va = a[col], vb = b[col];
      if (typeof va === 'string') va = va.toLowerCase();
      if (typeof vb === 'string') vb = vb.toLowerCase();
      if (va < vb) return dir === 'asc' ? -1 : 1;
      if (va > vb) return dir === 'asc' ? 1 : -1;
      return 0;
    }
  });

  const selectedRef = selected ? referees.find(r => r.id === selected) : null;

  const toggleTableSort = (col) => {
    setTableSort(prev => prev.col === col ? { col, dir: prev.dir === 'asc' ? 'desc' : 'asc' } : { col, dir: 'asc' });
  };

  const SortIcon = ({ col }) => {
    if (tableSort.col !== col) return <span style={{ color: '#334155', marginLeft: 4 }}>⇅</span>;
    return <span style={{ color: '#60a5fa', marginLeft: 4 }}>{tableSort.dir === 'asc' ? '↑' : '↓'}</span>;
  };

  return (
    <div>
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 20, flexWrap: 'wrap', gap: 12 }}>
        <div>
          <h2 style={{ fontSize: 18, fontWeight: 700, color: '#f1f5f9', margin: 0 }}>Referee Pool</h2>
          <p style={{ color: '#64748b', fontSize: 12, margin: '2px 0 0' }}>{referees.length} referees · click any card for full profile</p>
        </div>
        <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap', alignItems: 'center' }}>
          {/* Search */}
          <input
            value={search}
            onChange={e => setSearch(e.target.value)}
            placeholder="Search name, country..."
            style={{
              background: '#1a1d2e', border: '1px solid #1e2235', borderRadius: 6,
              color: '#e2e8f0', fontSize: 11, padding: '5px 10px', width: 160,
            }}
          />

          {/* View toggle */}
          <div style={{ display: 'flex', gap: 2, background: '#1a1d2e', borderRadius: 6, padding: 2 }}>
            {['cards', 'table'].map(mode => (
              <button key={mode} onClick={() => setViewMode(mode)} style={{
                padding: '4px 10px', borderRadius: 5, border: 'none', cursor: 'pointer', fontSize: 11, fontWeight: 600,
                background: viewMode === mode ? '#3b82f6' : 'transparent',
                color: viewMode === mode ? 'white' : '#64748b',
              }}>{mode === 'cards' ? 'Cards' : 'Table'}</button>
            ))}
          </div>

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

          {/* Sort (cards only) */}
          {viewMode === 'cards' && (
            <select value={sortBy} onChange={e => setSortBy(e.target.value)} style={{
              background: '#1a1d2e', border: '1px solid #1e2235', color: '#94a3b8',
              borderRadius: 6, padding: '5px 10px', fontSize: 11, cursor: 'pointer',
            }}>
              <option value="name">Sort: Name ↑</option>
              <option value="workload">Sort: Workload ↓</option>
              <option value="age">Sort: Age ↑</option>
            </select>
          )}
        </div>
      </div>

      {viewMode === 'cards' ? (
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
      ) : (
        <div style={{ background: '#13151f', border: '1px solid #1e2235', borderRadius: 12, overflow: 'hidden' }}>
          <div style={{ overflowX: 'auto' }}>
            <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: 12 }}>
              <thead>
                <tr style={{ background: '#1e2235', borderBottom: '1px solid #252840' }}>
                  {[
                    { label: '#', col: 'id' },
                    { label: 'Name', col: 'name' },
                    { label: 'Country', col: 'country' },
                    { label: 'Age', col: 'age' },
                    { label: 'Level', col: 'badge' },
                    { label: 'Matches Officiated', col: 'matchesOfficiated' },
                    { label: 'Matches as Referee', col: 'matchesAsReferee' },
                    { label: 'Status', col: 'status' },
                    { label: 'Actions', col: null },
                  ].map(({ label, col }) => (
                    <th
                      key={label}
                      onClick={col ? () => toggleTableSort(col) : undefined}
                      style={{
                        padding: '10px 14px', textAlign: 'left', color: '#64748b',
                        fontWeight: 600, whiteSpace: 'nowrap',
                        cursor: col ? 'pointer' : 'default',
                        userSelect: 'none',
                      }}
                    >
                      {label}{col && <SortIcon col={col} />}
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {filtered.map((r, i) => (
                  <tr
                    key={r.id}
                    style={{
                      borderBottom: '1px solid #111318',
                      background: i % 2 === 0 ? '#13151f' : '#0f1117',
                      transition: 'background 0.1s',
                    }}
                    onMouseEnter={e => e.currentTarget.style.background = '#15182a'}
                    onMouseLeave={e => e.currentTarget.style.background = i % 2 === 0 ? '#13151f' : '#0f1117'}
                  >
                    <td style={{ padding: '8px 14px', color: '#475569' }}>{r.id}</td>
                    <td style={{ padding: '8px 14px', color: '#f1f5f9', fontWeight: 600 }}>{r.name}</td>
                    <td style={{ padding: '8px 14px', color: '#94a3b8' }}>
                      <span style={{ marginRight: 6 }}>{COUNTRY_FLAGS[r.country] || '🏳️'}</span>
                      {r.country}
                    </td>
                    <td style={{ padding: '8px 14px', color: '#94a3b8' }}>{r.age}</td>
                    <td style={{ padding: '8px 14px' }}>
                      <span style={{
                        background: `${BADGE_COLORS[r.badge]}22`, color: BADGE_COLORS[r.badge],
                        fontSize: 10, fontWeight: 700, padding: '2px 8px', borderRadius: 5,
                      }}>{getBadgeLevel(r.badge)}</span>
                    </td>
                    <td style={{ padding: '8px 14px', color: '#94a3b8' }}>{r.matchesOfficiated || '—'}</td>
                    <td style={{ padding: '8px 14px', color: '#94a3b8' }}>{r.matchesAsReferee || '—'}</td>
                    <td style={{ padding: '8px 14px' }}>
                      <span style={{
                        color: STATUS_COLORS[r.status] || '#94a3b8',
                        fontSize: 11, fontWeight: 600,
                      }}>{r.status || '—'}</span>
                    </td>
                    <td style={{ padding: '8px 14px' }}>
                      <button
                        onClick={() => setSelected(r.id)}
                        style={{
                          padding: '4px 10px', borderRadius: 6, border: '1px solid #1e2235',
                          background: '#1a1d2e', color: '#60a5fa', fontSize: 11,
                          cursor: 'pointer', fontWeight: 600,
                        }}
                      >
                        View Profile
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

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
