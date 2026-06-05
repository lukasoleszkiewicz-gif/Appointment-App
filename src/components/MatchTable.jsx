import { useState, useRef } from 'react';
import { Search, ChevronDown, Upload, Download, XCircle } from 'lucide-react';
import * as XLSX from 'xlsx';

const STATUS_COLORS = {
  approved: { bg: '#064e3b', text: '#34d399', label: 'Approved' },
  'ai-proposed': { bg: '#1e3a5f', text: '#60a5fa', label: 'AI Proposed' },
  manual: { bg: '#3b2f00', text: '#fbbf24', label: 'Manual' },
  unassigned: { bg: '#1f1f1f', text: '#6b7280', label: 'Unassigned' },
};

const BADGE_COLORS = { FIFA: '#f59e0b', National: '#3b82f6', Regional: '#8b5cf6', Youth: '#34d399' };

function RefSelect({ value, referees, onChange, placeholder, busy }) {
  return (
    <select
      value={value || ''}
      onChange={e => onChange(e.target.value ? parseInt(e.target.value) : null)}
      style={{
        background: '#0f1117', border: '1px solid #1e2235', borderRadius: 6,
        color: value ? '#e2e8f0' : '#475569', fontSize: 11, padding: '3px 6px',
        cursor: 'pointer', width: '100%', maxWidth: 160
      }}
    >
      <option value="">{placeholder}</option>
      {referees.map(r => (
        <option key={r.id} value={r.id}>{r.name}</option>
      ))}
    </select>
  );
}

function parseCSV(text) {
  const lines = text.trim().split('\n');
  if (lines.length < 2) return null;
  const header = lines[0].split(',').map(h => h.trim().replace(/^"|"$/g, ''));
  const colMap = {};
  header.forEach((h, i) => { colMap[h.toLowerCase()] = i; });

  const getCol = (row, ...names) => {
    for (const name of names) {
      const idx = colMap[name];
      if (idx !== undefined && row[idx] !== undefined) {
        return row[idx].trim().replace(/^"|"$/g, '');
      }
    }
    return '';
  };

  const parsed = [];
  for (let i = 1; i < lines.length; i++) {
    const row = lines[i].split(',');
    if (row.every(c => !c.trim())) continue;
    const rawId = getCol(row, 'match id', 'id');
    const cat = getCol(row, 'category', 'teamtype', 'team type', 'type');
    parsed.push({
      id: rawId ? parseInt(rawId) : i + 200000,
      phase: getCol(row, 'phase') || 'groups',
      category: cat,
      date: getCol(row, 'day', 'date'),
      time: getCol(row, 'hour', 'time'),
      game: rawId ? parseInt(rawId) : i + 200000,
      league: getCol(row, 'league') || 'Ibercup Estoril',
      gameExt: i,
      teamType: cat,
      length: 60,
      venue: getCol(row, 'field', 'venue'),
      home: getCol(row, 'team a', 'home team', 'home'),
      away: getCol(row, 'team b', 'away team', 'away'),
    });
  }
  return parsed.length > 0 ? parsed : null;
}

function exportExcel(matches, referees, assignments) {
  const refName = id => referees.find(r => r.id === id)?.name || '';

  const header = ['Match ID', 'Phase', 'Category', 'Day', 'Hour',
                  'Team A', 'Team B', 'Field',
                  'Referee 1', 'Referee 2', 'Referee 3', 'Referee 4'];

  const rows = matches.map(m => {
    const a = assignments[m.id] || {};
    return [
      m.id,
      m.phase || 'groups',
      m.category || m.teamType,
      m.date,
      m.time,
      m.home,
      m.away,
      m.venue,
      refName(a.referee),
      refName(a.ar1),
      refName(a.ar2),
      '',
    ];
  });

  const ws = XLSX.utils.aoa_to_sheet([header, ...rows]);

  // Column widths
  ws['!cols'] = [
    { wch: 10 }, { wch: 10 }, { wch: 22 }, { wch: 12 }, { wch: 8 },
    { wch: 30 }, { wch: 30 }, { wch: 28 },
    { wch: 24 }, { wch: 24 }, { wch: 24 }, { wch: 12 },
  ];

  const wb = XLSX.utils.book_new();
  XLSX.utils.book_append_sheet(wb, ws, 'Matches');
  XLSX.writeFile(wb, 'estoril_matches.xlsx');
}

export default function MatchTable({ matches, assignments, referees, filters, setFilters, onUpdate, pendingValidation, onImportMatches, onRejectAll }) {
  const [search, setSearch] = useState('');
  const [page, setPage] = useState(0);
  const [importError, setImportError] = useState('');
  const fileInputRef = useRef(null);
  const PER_PAGE = 20;

  // Derive unique dates from matches
  const uniqueDates = ['all', ...Array.from(new Set(matches.map(m => m.date))).sort()];
  const uniqueCategories = ['all', ...Array.from(new Set(matches.map(m => m.category || m.teamType))).sort()];
  const uniquePhases = ['all', ...Array.from(new Set(matches.map(m => m.phase || 'groups'))).sort()];
  const statuses = ['all', 'approved', 'ai-proposed', 'unassigned'];

  const filtered = matches.filter(m => {
    if (filters.date !== 'all' && m.date !== filters.date) return false;
    if (filters.league !== 'all' && (m.category || m.teamType) !== filters.league) return false;
    if (filters.phase && filters.phase !== 'all' && (m.phase || 'groups') !== filters.phase) return false;
    if (filters.status !== 'all') {
      const status = assignments[m.id]?.status || 'unassigned';
      if (status !== filters.status) return false;
    }
    if (search) {
      const s = search.toLowerCase();
      if (!m.home.toLowerCase().includes(s) && !m.away.toLowerCase().includes(s) &&
        !m.venue.toLowerCase().includes(s) && !m.teamType.toLowerCase().includes(s)) return false;
    }
    return true;
  });

  const pages = Math.ceil(filtered.length / PER_PAGE);
  const visible = filtered.slice(page * PER_PAGE, (page + 1) * PER_PAGE);

  const handleFileChange = (e) => {
    const file = e.target.files[0];
    if (!file) return;
    setImportError('');
    const reader = new FileReader();
    reader.onload = (ev) => {
      const text = ev.target.result;
      const parsed = parseCSV(text);
      if (!parsed) {
        setImportError('Could not parse CSV. Expected columns: Date, Time, Category, Home Team, Away Team, Venue');
        return;
      }
      onImportMatches(parsed);
    };
    reader.readAsText(file);
    e.target.value = '';
  };

  const FilterPill = ({ label, value, options, onChange }) => (
    <div style={{ position: 'relative', display: 'inline-flex', alignItems: 'center' }}>
      <select
        value={value}
        onChange={e => { onChange(e.target.value); setPage(0); }}
        style={{
          background: value !== 'all' ? 'rgba(59,130,246,0.15)' : '#1a1d2e',
          border: `1px solid ${value !== 'all' ? '#3b82f6' : '#1e2235'}`,
          color: value !== 'all' ? '#60a5fa' : '#94a3b8',
          borderRadius: 8, padding: '6px 28px 6px 10px', fontSize: 12, cursor: 'pointer',
          appearance: 'none',
        }}
      >
        {options.map(o => (
          <option key={o} value={o}>{o === 'all' ? `All ${label}` : o}</option>
        ))}
      </select>
      <ChevronDown size={12} style={{ position: 'absolute', right: 8, pointerEvents: 'none', color: '#64748b' }} />
    </div>
  );

  return (
    <div>
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 20 }}>
        <div>
          <h2 style={{ fontSize: 18, fontWeight: 700, color: '#f1f5f9', margin: 0 }}>Match List</h2>
          <p style={{ color: '#64748b', fontSize: 12, margin: '2px 0 0' }}>{filtered.length} matches</p>
        </div>
        <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
          {importError && (
            <span style={{ fontSize: 11, color: '#f87171', maxWidth: 260 }}>{importError}</span>
          )}
          <input
            ref={fileInputRef}
            type="file"
            accept=".csv"
            style={{ display: 'none' }}
            onChange={handleFileChange}
          />
          {onRejectAll && pendingValidation.length > 0 && (
            <button
              onClick={onRejectAll}
              style={{
                display: 'flex', alignItems: 'center', gap: 6,
                padding: '7px 14px', borderRadius: 8, border: '1px solid #ef4444',
                background: 'rgba(239,68,68,0.1)', color: '#f87171',
                cursor: 'pointer', fontSize: 12, fontWeight: 600,
              }}
            >
              <XCircle size={13} />
              Reject All ({pendingValidation.length})
            </button>
          )}
          <button
            onClick={() => exportExcel(matches, referees, assignments)}
            style={{
              display: 'flex', alignItems: 'center', gap: 6,
              padding: '7px 14px', borderRadius: 8, border: '1px solid #3b82f6',
              background: 'rgba(59,130,246,0.1)', color: '#60a5fa',
              cursor: 'pointer', fontSize: 12, fontWeight: 600,
            }}
          >
            <Download size={13} />
            Export
          </button>
          <button
            onClick={() => fileInputRef.current?.click()}
            style={{
              display: 'flex', alignItems: 'center', gap: 6,
              padding: '7px 14px', borderRadius: 8, border: '1px solid #22c55e',
              background: 'rgba(34,197,94,0.1)', color: '#22c55e',
              cursor: 'pointer', fontSize: 12, fontWeight: 600,
            }}
          >
            <Upload size={13} />
            Import Matches
          </button>
        </div>
      </div>

      {/* Filters */}
      <div style={{ display: 'flex', gap: 8, marginBottom: 16, flexWrap: 'wrap', alignItems: 'center' }}>
        <div style={{ position: 'relative' }}>
          <Search size={13} style={{ position: 'absolute', left: 10, top: '50%', transform: 'translateY(-50%)', color: '#475569' }} />
          <input
            value={search}
            onChange={e => { setSearch(e.target.value); setPage(0); }}
            placeholder="Search team, venue..."
            style={{
              background: '#1a1d2e', border: '1px solid #1e2235', borderRadius: 8,
              color: '#e2e8f0', fontSize: 12, padding: '6px 10px 6px 30px', width: 200
            }}
          />
        </div>
        <FilterPill label="Days" value={filters.date} options={uniqueDates} onChange={v => setFilters(f => ({ ...f, date: v }))} />
        <FilterPill label="Phase" value={filters.phase || 'all'} options={uniquePhases} onChange={v => setFilters(f => ({ ...f, phase: v }))} />
        <FilterPill label="Category" value={filters.league} options={uniqueCategories} onChange={v => setFilters(f => ({ ...f, league: v }))} />
        <FilterPill label="Status" value={filters.status} options={statuses} onChange={v => setFilters(f => ({ ...f, status: v }))} />
      </div>

      {/* Table */}
      <div style={{ background: '#13151f', border: '1px solid #1e2235', borderRadius: 12, overflow: 'hidden' }}>
        <div style={{ overflowX: 'auto' }}>
          <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: 12 }}>
            <thead>
              <tr style={{ borderBottom: '1px solid #1e2235' }}>
                {['Match ID', 'Phase', 'Category', 'Day', 'Hour', 'Team A', 'Team B', 'Field', 'Referee 1', 'Referee 2', 'Referee 3', 'Status'].map(h => (
                  <th key={h} style={{ padding: '10px 12px', textAlign: 'left', color: '#475569', fontWeight: 600, whiteSpace: 'nowrap' }}>{h}</th>
                ))}
              </tr>
            </thead>
            <tbody>
              {visible.map((m, i) => {
                const a = assignments[m.id] || {};
                const status = a.status || 'unassigned';
                const sc = STATUS_COLORS[status] || STATUS_COLORS.unassigned;
                const isPending = pendingValidation.includes(m.id);
                const refName = id => referees.find(r => r.id === id)?.name || '';

                return (
                  <tr key={m.id} style={{
                    borderBottom: '1px solid #111318',
                    background: isPending ? 'rgba(59,130,246,0.04)' : i % 2 === 0 ? 'transparent' : 'rgba(255,255,255,0.01)',
                  }}>
                    <td style={{ padding: '8px 12px', color: '#64748b', whiteSpace: 'nowrap', fontSize: 11 }}>{m.id}</td>
                    <td style={{ padding: '8px 12px', whiteSpace: 'nowrap' }}>
                      <span style={{ fontSize: 10, color: '#f59e0b', fontWeight: 600, textTransform: 'uppercase', letterSpacing: '0.5px' }}>{m.phase || 'groups'}</span>
                    </td>
                    <td style={{ padding: '8px 12px', whiteSpace: 'nowrap' }}>
                      <span style={{ fontSize: 11, color: '#a78bfa', fontWeight: 500 }}>{m.category || m.teamType}</span>
                    </td>
                    <td style={{ padding: '8px 12px', color: '#94a3b8', whiteSpace: 'nowrap' }}>{m.date}</td>
                    <td style={{ padding: '8px 12px', color: '#94a3b8', whiteSpace: 'nowrap' }}>{m.time}</td>
                    <td style={{ padding: '8px 12px', color: '#e2e8f0', fontWeight: 500, maxWidth: 150, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{m.home}</td>
                    <td style={{ padding: '8px 12px', color: '#94a3b8', maxWidth: 150, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{m.away}</td>
                    <td style={{ padding: '8px 12px', color: '#64748b', maxWidth: 140, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{m.venue}</td>
                    <td style={{ padding: '8px 12px', minWidth: 170 }}>
                      <RefSelect
                        value={a.referee}
                        referees={referees}
                        onChange={v => onUpdate(m.id, 'referee', v)}
                        placeholder="— Referee 1 —"
                      />
                    </td>
                    <td style={{ padding: '8px 12px', minWidth: 140 }}>
                      <RefSelect
                        value={a.ar1}
                        referees={referees}
                        onChange={v => onUpdate(m.id, 'ar1', v)}
                        placeholder="Referee 2"
                      />
                    </td>
                    <td style={{ padding: '8px 12px', minWidth: 140 }}>
                      <RefSelect
                        value={a.ar2}
                        referees={referees}
                        onChange={v => onUpdate(m.id, 'ar2', v)}
                        placeholder="Referee 3"
                      />
                    </td>
                    <td style={{ padding: '8px 12px' }}>
                      <span style={{
                        background: sc.bg, color: sc.text, borderRadius: 6,
                        padding: '2px 8px', fontSize: 10, fontWeight: 600, whiteSpace: 'nowrap'
                      }}>{sc.label}</span>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>

        {/* Pagination */}
        {pages > 1 && (
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 8, padding: '12px', borderTop: '1px solid #1e2235' }}>
            <button onClick={() => setPage(p => Math.max(0, p - 1))} disabled={page === 0}
              style={{ background: '#1a1d2e', border: '1px solid #1e2235', color: '#94a3b8', borderRadius: 6, padding: '4px 12px', cursor: page === 0 ? 'not-allowed' : 'pointer', fontSize: 12 }}>
              ‹ Prev
            </button>
            <span style={{ color: '#64748b', fontSize: 12 }}>{page + 1} / {pages}</span>
            <button onClick={() => setPage(p => Math.min(pages - 1, p + 1))} disabled={page === pages - 1}
              style={{ background: '#1a1d2e', border: '1px solid #1e2235', color: '#94a3b8', borderRadius: 6, padding: '4px 12px', cursor: page === pages - 1 ? 'not-allowed' : 'pointer', fontSize: 12 }}>
              Next ›
            </button>
          </div>
        )}
      </div>
    </div>
  );
}
