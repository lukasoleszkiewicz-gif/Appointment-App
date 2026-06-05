import { useState } from 'react';

const COUNTRY_FLAGS = {
  'England': '🏴󠁧󠁢󠁥󠁮󠁧󠁿', 'Germany': '🇩🇪', 'France': '🇫🇷', 'Gibraltar': '🇬🇮',
  'Ireland': '🇮🇪', 'Austria': '🇦🇹', 'Italy': '🇮🇹', 'Spain': '🇪🇸',
  'Slovenia': '🇸🇮', 'Czechia': '🇨🇿', 'Poland': '🇵🇱', 'Sweden': '🇸🇪',
  'Wales': '🏴󠁧󠁢󠁷󠁬󠁳󠁿', 'USA': '🇺🇸', 'Canada': '🇨🇦', 'Belgium': '🇧🇪',
  'Denmark': '🇩🇰', 'Switzerland': '🇨🇭', 'China': '🇨🇳', 'Romania': '🇷🇴',
  'Moldova': '🇲🇩', 'Hungary': '🇭🇺', 'Faroe Islands': '🇫🇴', 'Egypt': '🇪🇬',
};

const BADGE_COLORS = { FIFA: '#f59e0b', National: '#3b82f6', Regional: '#8b5cf6', Youth: '#34d399' };

function getBadgeLevel(badge) {
  return badge === 'Youth' ? 'Local Referee' : 'Regional Referee';
}

function avg(arr) {
  if (!arr.length) return 0;
  return arr.reduce((s, v) => s + v, 0) / arr.length;
}

function overallColor(v) {
  if (v >= 8.5) return '#f5c518';
  if (v >= 7.5) return '#34d399';
  if (v >= 6.5) return '#60a5fa';
  return '#94a3b8';
}

const RANK_MEDALS = ['🥇', '🥈', '🥉'];
const RANK_BORDERS = ['#f5c518', '#94a3b8', '#cd7f32'];

function getStoredEvaluations() {
  try {
    return JSON.parse(localStorage.getItem('estoril_evaluations') || '[]');
  } catch {
    return [];
  }
}

const COLUMNS = [
  { key: 'rank', label: 'Rank', sortable: false },
  { key: 'name', label: 'Referee Name', sortable: true },
  { key: 'country', label: 'Country', sortable: true },
  { key: 'level', label: 'Level', sortable: false },
  { key: 'evalCount', label: 'Evaluations', sortable: true },
  { key: 'positioning', label: 'Positioning', sortable: true },
  { key: 'gameManagement', label: 'Game Mgmt', sortable: true },
  { key: 'personality', label: 'Personality', sortable: true },
  { key: 'decisionMaking', label: 'Decision', sortable: true },
  { key: 'fitness', label: 'Fitness', sortable: true },
  { key: 'overall', label: 'Overall', sortable: true },
];

export default function MeritTable({ referees }) {
  const [minEvals, setMinEvals] = useState(1);
  const [search, setSearch] = useState('');
  const [sortCol, setSortCol] = useState('overall');
  const [sortDir, setSortDir] = useState('desc');

  const evaluations = getStoredEvaluations();

  // Group evaluations by refereeId
  const byRef = {};
  evaluations.forEach(ev => {
    if (!byRef[ev.refereeId]) byRef[ev.refereeId] = [];
    byRef[ev.refereeId].push(ev);
  });

  // Build rows
  const rows = referees
    .filter(r => byRef[r.id] && byRef[r.id].length >= minEvals)
    .filter(r => !search || r.name.toLowerCase().includes(search.toLowerCase()) || r.country.toLowerCase().includes(search.toLowerCase()))
    .map(r => {
      const evs = byRef[r.id] || [];
      return {
        id: r.id,
        name: r.name,
        country: r.country,
        badge: r.badge,
        level: getBadgeLevel(r.badge),
        evalCount: evs.length,
        positioning: avg(evs.map(e => e.scores.positioning)),
        gameManagement: avg(evs.map(e => e.scores.gameManagement)),
        personality: avg(evs.map(e => e.scores.personality)),
        decisionMaking: avg(evs.map(e => e.scores.decisionMaking)),
        fitness: avg(evs.map(e => e.scores.fitness)),
        overall: avg(evs.map(e => e.scores.overall)),
      };
    })
    .sort((a, b) => {
      const va = a[sortCol], vb = b[sortCol];
      if (typeof va === 'string') return sortDir === 'asc' ? va.localeCompare(vb) : vb.localeCompare(va);
      return sortDir === 'asc' ? va - vb : vb - va;
    });

  const handleSort = (col) => {
    if (sortCol === col) {
      setSortDir(d => d === 'asc' ? 'desc' : 'asc');
    } else {
      setSortCol(col);
      setSortDir('desc');
    }
  };

  const SortIcon = ({ col }) => {
    if (!COLUMNS.find(c => c.key === col)?.sortable) return null;
    if (sortCol !== col) return <span style={{ color: '#334155', marginLeft: 4 }}>⇅</span>;
    return <span style={{ color: '#60a5fa', marginLeft: 4 }}>{sortDir === 'asc' ? '↑' : '↓'}</span>;
  };

  return (
    <div>
      {/* Header */}
      <div style={{ marginBottom: 20 }}>
        <h2 style={{ fontSize: 20, fontWeight: 800, color: '#f1f5f9', margin: 0 }}>Merit Table — Ibercup Estoril 2026</h2>
        <p style={{ color: '#64748b', fontSize: 12, margin: '4px 0 0' }}>Based on observer evaluations</p>
      </div>

      {/* Filter bar */}
      <div style={{ display: 'flex', gap: 10, alignItems: 'center', marginBottom: 16, flexWrap: 'wrap' }}>
        <input
          value={search}
          onChange={e => setSearch(e.target.value)}
          placeholder="Search referee or country..."
          style={{
            background: '#1a1d2e', border: '1px solid #1e2235', borderRadius: 8,
            color: '#e2e8f0', fontSize: 12, padding: '6px 12px', width: 200,
          }}
        />
        <div style={{ display: 'flex', gap: 4 }}>
          <span style={{ fontSize: 12, color: '#64748b', alignSelf: 'center', marginRight: 4 }}>Min evaluations:</span>
          {[1, 2, 3].map(n => (
            <button
              key={n}
              onClick={() => setMinEvals(n)}
              style={{
                padding: '5px 12px', borderRadius: 6, border: 'none', cursor: 'pointer',
                fontSize: 12, fontWeight: 600,
                background: minEvals === n ? '#3b82f6' : '#1a1d2e',
                color: minEvals === n ? 'white' : '#64748b',
              }}
            >{n}+</button>
          ))}
        </div>
        <span style={{ fontSize: 12, color: '#475569', marginLeft: 'auto' }}>
          {rows.length} referee{rows.length !== 1 ? 's' : ''}
        </span>
      </div>

      {/* Table */}
      {rows.length === 0 ? (
        <div style={{
          background: '#13151f', border: '1px solid #1e2235', borderRadius: 12,
          padding: 48, textAlign: 'center', color: '#475569', fontSize: 14,
        }}>
          No evaluations yet. Observers can submit evaluations from the Evaluations tab.
        </div>
      ) : (
        <div style={{ background: '#13151f', border: '1px solid #1e2235', borderRadius: 12, overflow: 'hidden' }}>
          <div style={{ overflowX: 'auto' }}>
            <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: 12 }}>
              <thead>
                <tr style={{ background: '#1e2235', borderBottom: '1px solid #252840' }}>
                  {COLUMNS.map(({ key, label, sortable }) => (
                    <th
                      key={key}
                      onClick={sortable ? () => handleSort(key) : undefined}
                      style={{
                        padding: '10px 14px', textAlign: 'left', color: '#64748b',
                        fontWeight: 600, whiteSpace: 'nowrap',
                        cursor: sortable ? 'pointer' : 'default',
                        userSelect: 'none',
                        ...(key === 'overall' ? { color: '#f5c518' } : {}),
                      }}
                    >
                      {label}
                      {sortable && <SortIcon col={key} />}
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {rows.map((row, i) => {
                  const rank = i + 1;
                  const borderColor = rank <= 3 ? RANK_BORDERS[rank - 1] : 'transparent';
                  return (
                    <tr
                      key={row.id}
                      style={{
                        borderBottom: '1px solid #111318',
                        background: i % 2 === 0 ? '#13151f' : '#0f1117',
                        borderLeft: `3px solid ${borderColor}`,
                        transition: 'background 0.1s',
                      }}
                      onMouseEnter={e => e.currentTarget.style.background = '#15182a'}
                      onMouseLeave={e => e.currentTarget.style.background = i % 2 === 0 ? '#13151f' : '#0f1117'}
                    >
                      <td style={{ padding: '8px 14px', color: '#94a3b8', fontWeight: 700, fontSize: rank <= 3 ? 16 : 12 }}>
                        {rank <= 3 ? RANK_MEDALS[rank - 1] : rank}
                      </td>
                      <td style={{ padding: '8px 14px', color: '#f1f5f9', fontWeight: 600 }}>{row.name}</td>
                      <td style={{ padding: '8px 14px', color: '#94a3b8' }}>
                        <span style={{ marginRight: 6 }}>{COUNTRY_FLAGS[row.country] || '🏳️'}</span>
                        {row.country}
                      </td>
                      <td style={{ padding: '8px 14px' }}>
                        <span style={{
                          background: `${BADGE_COLORS[row.badge]}22`, color: BADGE_COLORS[row.badge],
                          fontSize: 10, fontWeight: 700, padding: '2px 8px', borderRadius: 5,
                        }}>{row.level}</span>
                      </td>
                      <td style={{ padding: '8px 14px', color: '#94a3b8', textAlign: 'center' }}>{row.evalCount}</td>
                      {['positioning', 'gameManagement', 'personality', 'decisionMaking', 'fitness'].map(key => (
                        <td key={key} style={{ padding: '8px 14px', color: '#94a3b8', textAlign: 'center' }}>
                          {row[key].toFixed(1)}
                        </td>
                      ))}
                      <td style={{ padding: '8px 14px', textAlign: 'center' }}>
                        <span style={{
                          fontSize: 15, fontWeight: 900,
                          color: overallColor(row.overall),
                          background: `${overallColor(row.overall)}18`,
                          padding: '3px 10px', borderRadius: 6,
                          border: `1px solid ${overallColor(row.overall)}44`,
                        }}>
                          {row.overall.toFixed(2)}
                        </span>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </div>
      )}
    </div>
  );
}
