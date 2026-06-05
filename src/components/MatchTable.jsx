import { useState, useRef } from 'react';
import { Search, ChevronDown, Upload, Download, XCircle, ArrowUpDown, Plus, Trash2, ArrowUp, ArrowDown } from 'lucide-react';
import * as XLSX from 'xlsx';

const STATUS_COLORS = {
  approved: { bg: '#064e3b', text: '#34d399', label: 'Validated' },
  'needs-action': { bg: '#44260a', text: '#fb923c', label: 'Needs Action' },
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

const SORT_COLUMNS = [
  { key: 'date',     label: 'Day' },
  { key: 'time',     label: 'Hour' },
  { key: 'venue',    label: 'Field' },
  { key: 'phase',    label: 'Phase' },
  { key: 'category', label: 'Category' },
  { key: 'home',     label: 'Team A' },
  { key: 'away',     label: 'Team B' },
  { key: 'id',       label: 'Match ID' },
];

function applyMultiSort(rows, sortLevels) {
  if (!sortLevels.length) return rows;
  return [...rows].sort((a, b) => {
    for (const { key, dir } of sortLevels) {
      const av = String(a[key] ?? '').toLowerCase();
      const bv = String(b[key] ?? '').toLowerCase();
      // numeric comparison for id / time
      const an = parseFloat(av), bn = parseFloat(bv);
      const cmp = !isNaN(an) && !isNaN(bn) ? an - bn : av.localeCompare(bv);
      if (cmp !== 0) return dir === 'asc' ? cmp : -cmp;
    }
    return 0;
  });
}

export default function MatchTable({ matches, assignments, referees, filters, setFilters, onUpdate, pendingValidation, onImportMatches, onRejectAll, onApprove, onReject }) {
  const [search, setSearch] = useState('');
  const [page, setPage] = useState(0);
  const [perPage, setPerPage] = useState(20);
  const [importError, setImportError] = useState('');
  const [sortLevels, setSortLevels] = useState([{ key: 'date', dir: 'asc' }, { key: 'time', dir: 'asc' }]);
  const [showSort, setShowSort] = useState(false);
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

  const sorted = applyMultiSort(filtered, sortLevels);
  const effectivePerPage = perPage === 0 ? sorted.length || 1 : perPage;
  const pages = Math.ceil(sorted.length / effectivePerPage);
  const visible = sorted.slice(page * effectivePerPage, (page + 1) * effectivePerPage);

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

  const addSortLevel = () => {
    const used = new Set(sortLevels.map(s => s.key));
    const next = SORT_COLUMNS.find(c => !used.has(c.key));
    if (next) setSortLevels(prev => [...prev, { key: next.key, dir: 'asc' }]);
  };
  const removeSortLevel = (i) => setSortLevels(prev => prev.filter((_, idx) => idx !== i));
  const updateSortLevel = (i, patch) => setSortLevels(prev => prev.map((s, idx) => idx === i ? { ...s, ...patch } : s));

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

  // Day calendar — compact tabs above the table
  const DAY_LABELS = {
    '2026-03-31': { short: '31 Mar', label: 'Day 1' },
    '2026-04-01': { short: '1 Apr',  label: 'Day 2' },
    '2026-04-02': { short: '2 Apr',  label: 'Day 3' },
    '2026-04-03': { short: '3 Apr',  label: 'Day 4' },
    '2026-04-04': { short: '4 Apr',  label: 'Day 5' },
    '2026-04-05': { short: '5 Apr',  label: 'Day 6' },
  };

  return (
    <div>
      {/* Day calendar strip */}
      <div style={{ display: 'flex', gap: 8, marginBottom: 16, flexWrap: 'wrap' }}>
        <button
          onClick={() => { setFilters(f => ({ ...f, date: 'all' })); setPage(0); }}
          style={{
            padding: '8px 14px', borderRadius: 10, cursor: 'pointer', fontSize: 12, fontWeight: 700,
            border: filters.date === 'all' ? '2px solid #3b82f6' : '1px solid #1e2235',
            background: filters.date === 'all' ? 'rgba(59,130,246,0.2)' : '#13151f',
            color: filters.date === 'all' ? '#60a5fa' : '#64748b',
          }}
        >All Days</button>
        {uniqueDates.filter(d => d !== 'all').map(d => {
          const count = matches.filter(m => m.date === d).length;
          const assigned = matches.filter(m => m.date === d && assignments[m.id]?.referee).length;
          const sel = filters.date === d;
          const info = DAY_LABELS[d] || { short: d, label: d };
          return (
            <button key={d} onClick={() => { setFilters(f => ({ ...f, date: d })); setPage(0); }} style={{
              padding: '7px 14px', borderRadius: 10, cursor: 'pointer', fontSize: 12,
              border: sel ? '2px solid #3b82f6' : '1px solid #1e2235',
              background: sel ? 'rgba(59,130,246,0.18)' : '#13151f',
              color: sel ? '#60a5fa' : '#64748b', fontWeight: sel ? 700 : 500,
              textAlign: 'left',
            }}>
              <div style={{ fontWeight: 700, fontSize: 11 }}>{info.label} · {info.short}</div>
              <div style={{ fontSize: 10, marginTop: 1, opacity: 0.75 }}>{assigned}/{count} assigned</div>
            </button>
          );
        })}
      </div>

      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 16 }}>
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
        <FilterPill label="Phase" value={filters.phase || 'all'} options={uniquePhases} onChange={v => setFilters(f => ({ ...f, phase: v }))} />
        <FilterPill label="Category" value={filters.league} options={uniqueCategories} onChange={v => setFilters(f => ({ ...f, league: v }))} />
        <FilterPill label="Status" value={filters.status} options={statuses} onChange={v => setFilters(f => ({ ...f, status: v }))} />

        {/* Sort toggle button */}
        <button
          onClick={() => setShowSort(s => !s)}
          style={{
            display: 'flex', alignItems: 'center', gap: 5,
            padding: '6px 12px', borderRadius: 8, fontSize: 12, cursor: 'pointer',
            border: showSort ? '1px solid #8b5cf6' : '1px solid #1e2235',
            background: showSort ? 'rgba(139,92,246,0.15)' : '#1a1d2e',
            color: showSort ? '#a78bfa' : '#94a3b8', fontWeight: 600,
          }}
        >
          <ArrowUpDown size={12} />
          Sort {sortLevels.length > 0 && <span style={{ background: '#8b5cf6', color: '#fff', borderRadius: 10, fontSize: 10, padding: '0 5px', marginLeft: 2 }}>{sortLevels.length}</span>}
        </button>
      </div>

      {/* Multi-level sort panel */}
      {showSort && (
        <div style={{
          background: '#13151f', border: '1px solid #1e2235', borderRadius: 10,
          padding: '14px 16px', marginBottom: 12,
        }}>
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 10 }}>
            <span style={{ fontSize: 12, fontWeight: 700, color: '#94a3b8', letterSpacing: 0.5 }}>SORT ORDER</span>
            {sortLevels.length > 0 && (
              <button onClick={() => setSortLevels([])} style={{
                fontSize: 11, color: '#64748b', background: 'none', border: 'none',
                cursor: 'pointer', textDecoration: 'underline',
              }}>Clear all</button>
            )}
          </div>

          {sortLevels.length === 0 && (
            <div style={{ fontSize: 12, color: '#475569', marginBottom: 8 }}>No sort applied — showing default order.</div>
          )}

          <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
            {sortLevels.map((level, i) => (
              <div key={i} style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                {/* Level badge */}
                <div style={{
                  width: 22, height: 22, borderRadius: 6, background: '#1a1d2e',
                  display: 'flex', alignItems: 'center', justifyContent: 'center',
                  fontSize: 10, fontWeight: 800, color: '#8b5cf6', flexShrink: 0,
                }}>{String.fromCharCode(65 + i)}</div>

                {/* Column selector */}
                <div style={{ position: 'relative' }}>
                  <select
                    value={level.key}
                    onChange={e => updateSortLevel(i, { key: e.target.value })}
                    style={{
                      background: '#0f1117', border: '1px solid #1e2235', borderRadius: 6,
                      color: '#e2e8f0', fontSize: 12, padding: '5px 28px 5px 10px',
                      cursor: 'pointer', appearance: 'none', minWidth: 130,
                    }}
                  >
                    {SORT_COLUMNS.map(c => (
                      <option key={c.key} value={c.key}
                        disabled={sortLevels.some((s, idx) => idx !== i && s.key === c.key)}>
                        {c.label}
                      </option>
                    ))}
                  </select>
                  <ChevronDown size={11} style={{ position: 'absolute', right: 8, top: '50%', transform: 'translateY(-50%)', pointerEvents: 'none', color: '#475569' }} />
                </div>

                {/* Asc / Desc toggle */}
                <button
                  onClick={() => updateSortLevel(i, { dir: level.dir === 'asc' ? 'desc' : 'asc' })}
                  style={{
                    display: 'flex', alignItems: 'center', gap: 4,
                    padding: '5px 10px', borderRadius: 6, cursor: 'pointer', fontSize: 11, fontWeight: 600,
                    border: '1px solid #1e2235', background: '#0f1117', color: '#94a3b8',
                  }}
                >
                  {level.dir === 'asc' ? <ArrowUp size={11} /> : <ArrowDown size={11} />}
                  {level.dir === 'asc' ? 'A → Z' : 'Z → A'}
                </button>

                {/* Remove */}
                <button onClick={() => removeSortLevel(i)} style={{
                  background: 'none', border: 'none', cursor: 'pointer', color: '#475569', padding: 4,
                }}>
                  <Trash2 size={13} />
                </button>
              </div>
            ))}
          </div>

          {/* Add level */}
          {sortLevels.length < SORT_COLUMNS.length && (
            <button
              onClick={addSortLevel}
              style={{
                display: 'flex', alignItems: 'center', gap: 5, marginTop: 10,
                padding: '5px 12px', borderRadius: 6, border: '1px dashed #1e2235',
                background: 'transparent', color: '#475569', fontSize: 11, cursor: 'pointer',
              }}
            >
              <Plus size={12} /> Add sort level
            </button>
          )}
        </div>
      )}

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
                    <td style={{ padding: '8px 12px', whiteSpace: 'nowrap', minWidth: 220 }}>
                      <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
                        {/* Status badge / cycle button */}
                        {a.referee ? (
                          <div style={{ display: 'flex', gap: 4 }}>
                            <button
                              title="Validate"
                              onClick={() => onApprove && onApprove(m.id)}
                              style={{
                                padding: '3px 8px', borderRadius: 6, fontSize: 10, fontWeight: 700,
                                cursor: 'pointer', border: '1px solid #22c55e',
                                background: status === 'approved' ? '#064e3b' : 'rgba(34,197,94,0.08)',
                                color: status === 'approved' ? '#34d399' : '#22c55e',
                              }}
                            >✓ Validate</button>
                            <button
                              title="Needs further action"
                              onClick={() => onUpdate(m.id, 'status', status === 'needs-action' ? 'ai-proposed' : 'needs-action')}
                              style={{
                                padding: '3px 8px', borderRadius: 6, fontSize: 10, fontWeight: 700,
                                cursor: 'pointer', border: '1px solid #f97316',
                                background: status === 'needs-action' ? '#44260a' : 'rgba(249,115,22,0.08)',
                                color: status === 'needs-action' ? '#fb923c' : '#f97316',
                              }}
                            >⚠ Action</button>
                            <button
                              title="Reject"
                              onClick={() => onReject && onReject(m.id)}
                              style={{
                                padding: '3px 8px', borderRadius: 6, fontSize: 10, fontWeight: 700,
                                cursor: 'pointer', border: '1px solid #ef4444',
                                background: 'rgba(239,68,68,0.08)',
                                color: '#f87171',
                              }}
                            >✗</button>
                          </div>
                        ) : (
                          <span style={{
                            background: sc.bg, color: sc.text, borderRadius: 6,
                            padding: '2px 8px', fontSize: 10, fontWeight: 600,
                          }}>{sc.label}</span>
                        )}
                      </div>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>

        {/* Pagination + rows-per-page */}
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '10px 16px', borderTop: '1px solid #1e2235', gap: 12 }}>
          {/* Rows per page */}
          <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
            <span style={{ fontSize: 11, color: '#475569' }}>Rows per page:</span>
            {[20, 50, 100, 0].map(n => (
              <button key={n} onClick={() => { setPerPage(n); setPage(0); }} style={{
                padding: '3px 10px', borderRadius: 6, fontSize: 11, cursor: 'pointer', fontWeight: 600,
                border: perPage === n ? '1px solid #8b5cf6' : '1px solid #1e2235',
                background: perPage === n ? 'rgba(139,92,246,0.15)' : '#1a1d2e',
                color: perPage === n ? '#a78bfa' : '#64748b',
              }}>{n === 0 ? 'All' : n}</button>
            ))}
          </div>

          {/* Page nav */}
          {pages > 1 && (
            <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
              <button onClick={() => setPage(0)} disabled={page === 0}
                style={{ background: '#1a1d2e', border: '1px solid #1e2235', color: '#94a3b8', borderRadius: 6, padding: '3px 8px', cursor: page === 0 ? 'not-allowed' : 'pointer', fontSize: 12 }}>
                «
              </button>
              <button onClick={() => setPage(p => Math.max(0, p - 1))} disabled={page === 0}
                style={{ background: '#1a1d2e', border: '1px solid #1e2235', color: '#94a3b8', borderRadius: 6, padding: '3px 10px', cursor: page === 0 ? 'not-allowed' : 'pointer', fontSize: 12 }}>
                ‹ Prev
              </button>
              <span style={{ color: '#64748b', fontSize: 12, minWidth: 70, textAlign: 'center' }}>
                {page + 1} / {pages}
              </span>
              <button onClick={() => setPage(p => Math.min(pages - 1, p + 1))} disabled={page === pages - 1}
                style={{ background: '#1a1d2e', border: '1px solid #1e2235', color: '#94a3b8', borderRadius: 6, padding: '3px 10px', cursor: page === pages - 1 ? 'not-allowed' : 'pointer', fontSize: 12 }}>
                Next ›
              </button>
              <button onClick={() => setPage(pages - 1)} disabled={page === pages - 1}
                style={{ background: '#1a1d2e', border: '1px solid #1e2235', color: '#94a3b8', borderRadius: 6, padding: '3px 8px', cursor: page === pages - 1 ? 'not-allowed' : 'pointer', fontSize: 12 }}>
                »
              </button>
            </div>
          )}

          <span style={{ fontSize: 11, color: '#475569' }}>{sorted.length} matches total</span>
        </div>
      </div>
    </div>
  );
}
