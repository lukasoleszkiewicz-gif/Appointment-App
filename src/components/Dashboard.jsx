import { useState } from 'react';
import { CalendarDays, Users, CheckSquare, AlertCircle, TrendingUp, Sparkles, ChevronRight } from 'lucide-react';

const COUNTRY_FLAGS = {
  'England': '🏴󠁧󠁢󠁥󠁮󠁧󠁿', 'Germany': '🇩🇪', 'France': '🇫🇷', 'Gibraltar': '🇬🇮',
  'Ireland': '🇮🇪', 'Austria': '🇦🇹', 'Italy': '🇮🇹', 'Spain': '🇪🇸',
  'Slovenia': '🇸🇮', 'Czechia': '🇨🇿', 'Poland': '🇵🇱', 'Sweden': '🇸🇪',
};

function StatCard({ icon: Icon, label, value, sub, color }) {
  return (
    <div style={{
      background: '#13151f', border: '1px solid #1e2235', borderRadius: 12, padding: '20px 24px',
      display: 'flex', alignItems: 'center', gap: 16
    }}>
      <div style={{
        width: 44, height: 44, borderRadius: 12, background: color + '22',
        display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0
      }}>
        <Icon size={20} color={color} />
      </div>
      <div>
        <div style={{ fontSize: 26, fontWeight: 700, color: '#f1f5f9' }}>{value}</div>
        <div style={{ fontSize: 12, color: '#64748b' }}>{label}</div>
        {sub && <div style={{ fontSize: 11, color: '#475569', marginTop: 2 }}>{sub}</div>}
      </div>
    </div>
  );
}

const DAY_LABELS = {
  '2026-03-31': 'Day 1 · Tue 31 Mar',
  '2026-04-01': 'Day 2 · Wed 1 Apr',
  '2026-04-02': 'Day 3 · Thu 2 Apr',
  '2026-04-03': 'Day 4 · Fri 3 Apr',
  '2026-04-04': 'Day 5 · Sat 4 Apr',
  '2026-04-05': 'Day 6 · Sun 5 Apr',
};

function DayPickerSection({ dates, matches, assignments, onRunAI, aiRunning }) {
  const [selectedDays, setSelectedDays] = useState(new Set());

  const toggle = (date) => {
    setSelectedDays(prev => {
      const next = new Set(prev);
      next.has(date) ? next.delete(date) : next.add(date);
      return next;
    });
  };

  const selectAll = () => setSelectedDays(new Set(dates));
  const clearAll = () => setSelectedDays(new Set());

  const handleRun = () => {
    onRunAI(selectedDays.size > 0 ? [...selectedDays] : null);
  };

  return (
    <div style={{
      background: 'linear-gradient(135deg, rgba(59,130,246,0.08), rgba(139,92,246,0.08))',
      border: '1px solid rgba(99,102,241,0.25)', borderRadius: 16, padding: 28, marginBottom: 24,
    }}>
      <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', gap: 20, flexWrap: 'wrap' }}>
        <div>
          <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 6 }}>
            <div style={{ fontSize: 26 }}>🤖</div>
            <div style={{ fontSize: 16, fontWeight: 700, color: '#f1f5f9' }}>AI Assignment Engine</div>
          </div>
          <div style={{ fontSize: 12, color: '#64748b', maxWidth: 480 }}>
            Select one or more tournament days to assign. The engine will apply shift/pitch grouping,
            role rotation, nationality mixing, and workload balancing.
          </div>
        </div>

        <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'flex-end', gap: 10 }}>
          {/* Day selector */}
          <div style={{ display: 'flex', flexWrap: 'wrap', gap: 8, justifyContent: 'flex-end' }}>
            {dates.map(d => {
              const count = matches.filter(m => m.date === d).length;
              const assigned = matches.filter(m => m.date === d && assignments[m.id]?.referee).length;
              const sel = selectedDays.has(d);
              return (
                <button
                  key={d}
                  onClick={() => toggle(d)}
                  style={{
                    padding: '8px 14px', borderRadius: 10, cursor: 'pointer', fontSize: 12,
                    fontWeight: 600, transition: 'all 0.15s',
                    border: sel ? '2px solid #3b82f6' : '1px solid #1e2235',
                    background: sel ? 'rgba(59,130,246,0.2)' : '#13151f',
                    color: sel ? '#60a5fa' : '#64748b',
                  }}
                >
                  <div style={{ fontWeight: 700 }}>{DAY_LABELS[d] || d}</div>
                  <div style={{ fontSize: 10, opacity: 0.8, marginTop: 2 }}>
                    {assigned}/{count} assigned
                  </div>
                </button>
              );
            })}
          </div>

          {/* Controls */}
          <div style={{ display: 'flex', gap: 8, alignItems: 'center' }}>
            <button onClick={selectAll} style={{
              fontSize: 11, color: '#60a5fa', background: 'none', border: 'none',
              cursor: 'pointer', padding: '2px 6px', textDecoration: 'underline'
            }}>Select all</button>
            <button onClick={clearAll} style={{
              fontSize: 11, color: '#64748b', background: 'none', border: 'none',
              cursor: 'pointer', padding: '2px 6px', textDecoration: 'underline'
            }}>Clear</button>

            <button
              onClick={handleRun}
              disabled={aiRunning || selectedDays.size === 0}
              style={{
                display: 'inline-flex', alignItems: 'center', gap: 8,
                padding: '10px 22px', borderRadius: 10, border: 'none', cursor: selectedDays.size === 0 || aiRunning ? 'not-allowed' : 'pointer',
                background: selectedDays.size === 0 || aiRunning
                  ? '#1e2235'
                  : 'linear-gradient(135deg, #3b82f6, #8b5cf6)',
                color: selectedDays.size === 0 || aiRunning ? '#475569' : 'white',
                fontWeight: 700, fontSize: 13, transition: 'all 0.2s',
              }}
            >
              <Sparkles size={14} />
              {aiRunning ? 'Running…' : `Assign ${selectedDays.size > 0 ? selectedDays.size : '?'} day${selectedDays.size !== 1 ? 's' : ''}`}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}

function ByDateRow({ date, matches, assignments }) {
  const count = matches.filter(m => m.date === date).length;
  const assigned = matches.filter(m => m.date === date && assignments[m.id]?.referee).length;
  const approved = matches.filter(m => m.date === date && assignments[m.id]?.status === 'approved').length;
  const pct = count ? Math.round(assigned / count * 100) : 0;

  const dayNames = DAY_LABELS;

  return (
    <div style={{ display: 'flex', alignItems: 'center', gap: 12, padding: '10px 0', borderBottom: '1px solid #1a1d2e' }}>
      <div style={{ width: 90, fontSize: 12, fontWeight: 600, color: '#94a3b8' }}>{dayNames[date] || date}</div>
      <div style={{ width: 60, fontSize: 11, color: '#475569' }}>{count} matches</div>
      <div style={{ flex: 1, height: 6, background: '#1e2235', borderRadius: 4, overflow: 'hidden' }}>
        <div style={{
          height: '100%', background: 'linear-gradient(90deg, #3b82f6, #8b5cf6)',
          width: `${pct}%`, borderRadius: 4, transition: 'width 0.5s'
        }} />
      </div>
      <div style={{ width: 80, textAlign: 'right', fontSize: 12, color: '#60a5fa' }}>{assigned}/{count}</div>
      <div style={{
        width: 60, textAlign: 'right', fontSize: 11,
        color: approved === count ? '#34d399' : '#64748b'
      }}>{approved} ✓</div>
    </div>
  );
}

export default function Dashboard({ matches, assignments, referees, stats, onRunAI, aiRunning, setActiveView }) {
  const pct = stats.total ? Math.round(stats.assigned / stats.total * 100) : 0;

  // Derive all unique tournament days from the actual matches
  const allDates = [...new Set(matches.map(m => m.date))].sort();
  const dates = allDates;

  const refWorkload = referees.map(r => {
    const count = Object.values(assignments).filter(a =>
      a?.referee === r.id || a?.ar1 === r.id || a?.ar2 === r.id
    ).length;
    return { ...r, count };
  }).sort((a, b) => b.count - a.count).slice(0, 8);

  const teamTypes = [...new Set(matches.map(m => m.teamType.split(' ').slice(0, 2).join(' ')))];
  const byType = teamTypes.slice(0, 6).map(tt => {
    const ms = matches.filter(m => m.teamType.startsWith(tt.replace(' PRIME', '').replace(' FINAL', '')));
    const as_ = ms.filter(m => assignments[m.id]?.referee).length;
    return { type: tt, total: ms.length, assigned: as_ };
  });

  return (
    <div>
      <div style={{ marginBottom: 24 }}>
        <h1 style={{ fontSize: 22, fontWeight: 700, color: '#f1f5f9', margin: '0 0 4px' }}>
          Ibercup Estoril 2026 — Referee Assignment
        </h1>
        <p style={{ color: '#64748b', fontSize: 13 }}>
          Ibercup Estoril · June 19–22, 2026 · AI-powered assignment engine
        </p>
      </div>

      {/* KPI Cards */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: 16, marginBottom: 24 }}>
        <StatCard icon={CalendarDays} label="Total Matches" value={stats.total} sub="Ibercup Estoril" color="#3b82f6" />
        <StatCard icon={TrendingUp} label="Assigned" value={stats.assigned} sub={`${pct}% coverage`} color="#8b5cf6" />
        <StatCard icon={CheckSquare} label="Approved" value={stats.approved} sub="Human validated" color="#34d399" />
        <StatCard icon={AlertCircle} label="Pending Review" value={stats.pending} sub="Awaiting validation" color="#f59e0b" />
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 20, marginBottom: 24 }}>
        {/* Daily breakdown */}
        <div style={{ background: '#13151f', border: '1px solid #1e2235', borderRadius: 12, padding: 20 }}>
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 16 }}>
            <div style={{ fontWeight: 600, fontSize: 14, color: '#f1f5f9' }}>Assignment by Day</div>
            <button onClick={() => setActiveView('matches')} style={{
              display: 'flex', alignItems: 'center', gap: 4, color: '#60a5fa', fontSize: 12,
              background: 'none', border: 'none', cursor: 'pointer'
            }}>View all <ChevronRight size={14} /></button>
          </div>
          {dates.map(d => <ByDateRow key={d} date={d} matches={matches} assignments={assignments} />)}
        </div>

        {/* Top referees */}
        <div style={{ background: '#13151f', border: '1px solid #1e2235', borderRadius: 12, padding: 20 }}>
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 16 }}>
            <div style={{ fontWeight: 600, fontSize: 14, color: '#f1f5f9' }}>Referee Workload</div>
            <button onClick={() => setActiveView('referees')} style={{
              display: 'flex', alignItems: 'center', gap: 4, color: '#60a5fa', fontSize: 12,
              background: 'none', border: 'none', cursor: 'pointer'
            }}>View all <ChevronRight size={14} /></button>
          </div>
          {refWorkload.map(r => (
            <div key={r.id} style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 8 }}>
              <div style={{ fontSize: 14 }}>{COUNTRY_FLAGS[r.country] || '🏳️'}</div>
              <div style={{ flex: 1, fontSize: 12, color: '#94a3b8', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
                {r.name}
              </div>
              <div style={{ width: 80, height: 4, background: '#1e2235', borderRadius: 4, overflow: 'hidden' }}>
                <div style={{
                  height: '100%', background: r.count > 0 ? 'linear-gradient(90deg, #3b82f6, #8b5cf6)' : 'transparent',
                  width: `${Math.min(r.count / 5 * 100, 100)}%`, borderRadius: 4
                }} />
              </div>
              <div style={{ width: 20, textAlign: 'right', fontSize: 12, color: '#64748b' }}>{r.count}</div>
            </div>
          ))}
          {refWorkload.every(r => r.count === 0) && (
            <div style={{ color: '#475569', fontSize: 12, textAlign: 'center', paddingTop: 20 }}>
              Run AI Assignment to see workload distribution
            </div>
          )}
        </div>
      </div>

      {/* AI Assignment — Day Picker */}
      <DayPickerSection
        dates={dates}
        matches={matches}
        assignments={assignments}
        onRunAI={onRunAI}
        aiRunning={aiRunning}
      />

      {/* League breakdown */}
      {stats.assigned > 0 && (
        <div style={{ background: '#13151f', border: '1px solid #1e2235', borderRadius: 12, padding: 20 }}>
          <div style={{ fontWeight: 600, fontSize: 14, color: '#f1f5f9', marginBottom: 16 }}>Coverage by Team Type</div>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: 12 }}>
            {byType.map(({ type, total, assigned }) => (
              <div key={type} style={{ background: '#0f1117', borderRadius: 8, padding: '12px 14px' }}>
                <div style={{ fontSize: 12, fontWeight: 600, color: '#94a3b8', marginBottom: 6 }}>{type}</div>
                <div style={{ fontSize: 20, fontWeight: 700, color: '#f1f5f9' }}>{assigned}/{total}</div>
                <div style={{ height: 3, background: '#1e2235', borderRadius: 4, overflow: 'hidden', marginTop: 8 }}>
                  <div style={{
                    height: '100%', background: '#3b82f6', width: `${total ? assigned / total * 100 : 0}%`
                  }} />
                </div>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
