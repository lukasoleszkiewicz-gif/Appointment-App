import { useState, useEffect } from 'react';
import { CheckCircle2 } from 'lucide-react';

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

const CRITERIA = [
  { key: 'positioning', label: 'Positioning' },
  { key: 'gameManagement', label: 'Game Management' },
  { key: 'personality', label: 'Personality' },
  { key: 'decisionMaking', label: 'Decision Making' },
  { key: 'fitness', label: 'Fitness' },
];

const DEFAULT_SCORES = {
  positioning: 7.0,
  gameManagement: 7.0,
  personality: 7.0,
  decisionMaking: 7.0,
  fitness: 7.0,
  overall: 7.0,
};

function ScoreInput({ value, onChange }) {
  return (
    <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
      <input
        type="number"
        min={1}
        max={10}
        step={0.1}
        value={value}
        onChange={e => {
          const v = parseFloat(e.target.value);
          if (!isNaN(v) && v >= 1 && v <= 10) onChange(Math.round(v * 10) / 10);
        }}
        style={{
          width: 64, padding: '4px 8px', textAlign: 'center',
          background: '#0f1117', border: '1px solid #1e2235', borderRadius: 6,
          color: '#f1f5f9', fontSize: 14, fontWeight: 700,
        }}
      />
      <input
        type="range"
        min={1}
        max={10}
        step={0.1}
        value={value}
        onChange={e => onChange(parseFloat(e.target.value))}
        style={{ flex: 1, accentColor: '#3b82f6', cursor: 'pointer' }}
      />
    </div>
  );
}

function OverallScoreDisplay({ value }) {
  const color = value >= 8.5 ? '#f5c518' : value >= 7.5 ? '#34d399' : value >= 6.5 ? '#60a5fa' : '#94a3b8';
  return (
    <div style={{
      display: 'inline-block', padding: '6px 18px', borderRadius: 10,
      background: `${color}22`, border: `2px solid ${color}`,
      fontSize: 28, fontWeight: 900, color, letterSpacing: '-0.5px',
    }}>
      {value.toFixed(1)}
    </div>
  );
}

function getStoredEvaluations() {
  try {
    return JSON.parse(localStorage.getItem('estoril_evaluations') || '[]');
  } catch {
    return [];
  }
}

export default function EvaluationForm({ referees, matches, currentUser }) {
  const [search, setSearch] = useState('');
  const [selectedRefId, setSelectedRefId] = useState(null);
  const [scores, setScores] = useState({ ...DEFAULT_SCORES });
  const [notes, setNotes] = useState('');
  const [matchId, setMatchId] = useState('');
  const [evaluations, setEvaluations] = useState(getStoredEvaluations);
  const [submitted, setSubmitted] = useState(false);

  const isAdmin = currentUser.role === 'admin';
  const myEvals = evaluations.filter(e => isAdmin ? true : e.evaluatorId === currentUser.id);
  const evaluatedRefIds = new Set(myEvals.map(e => e.refereeId));

  const filtered = referees.filter(r =>
    !search || r.name.toLowerCase().includes(search.toLowerCase()) || r.country.toLowerCase().includes(search.toLowerCase())
  );

  const selectedRef = referees.find(r => r.id === selectedRefId) || null;

  // Admins see ALL evaluations for the selected ref; observers see only their own
  const evalsForRef = selectedRefId
    ? evaluations.filter(e => e.refereeId === selectedRefId).sort((a, b) => new Date(b.date) - new Date(a.date))
    : [];
  const myEvalsForRef = isAdmin ? evalsForRef : evalsForRef.filter(e => e.evaluatorId === currentUser.id);

  const handleScoreChange = (key, value) => {
    setScores(prev => ({ ...prev, [key]: value }));
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    if (!selectedRef) return;

    const entry = {
      id: Date.now(),
      evaluatorId: currentUser.id,
      evaluatorName: currentUser.name,
      refereeId: selectedRef.id,
      refereeName: selectedRef.name,
      matchId: matchId ? parseInt(matchId) : null,
      date: new Date().toISOString(),
      scores: { ...scores },
      notes,
    };

    const updated = [...evaluations, entry];
    localStorage.setItem('estoril_evaluations', JSON.stringify(updated));
    setEvaluations(updated);
    setSubmitted(true);
    setTimeout(() => setSubmitted(false), 2500);
    setScores({ ...DEFAULT_SCORES });
    setNotes('');
    setMatchId('');
  };

  const deleteEvaluation = (evalId) => {
    if (!window.confirm('Delete this evaluation? This cannot be undone.')) return;
    const updated = evaluations.filter(e => e.id !== evalId);
    localStorage.setItem('estoril_evaluations', JSON.stringify(updated));
    setEvaluations(updated);
  };

  const inputStyle = {
    background: '#1a1d2e', border: '1px solid #1e2235', borderRadius: 8,
    color: '#e2e8f0', fontSize: 12, padding: '6px 10px',
  };

  return (
    <div style={{ display: 'flex', gap: 0, height: '100%', minHeight: 0 }}>
      {/* Left panel — referee list */}
      <div style={{
        width: 260, flexShrink: 0, background: '#13151f', borderRight: '1px solid #1e2235',
        display: 'flex', flexDirection: 'column', borderRadius: 12, overflow: 'hidden',
        marginRight: 20,
      }}>
        <div style={{ padding: '14px 14px 10px', borderBottom: '1px solid #1e2235' }}>
          <div style={{ fontSize: 13, fontWeight: 700, color: '#f1f5f9', marginBottom: 8 }}>Select Referee</div>
          <input
            value={search}
            onChange={e => setSearch(e.target.value)}
            placeholder="Search name or country..."
            style={{ ...inputStyle, width: '100%', boxSizing: 'border-box' }}
          />
        </div>
        <div style={{ flex: 1, overflowY: 'auto' }}>
          {filtered.map(r => {
            const isSelected = r.id === selectedRefId;
            const hasEval = evaluatedRefIds.has(r.id);
            return (
              <button
                key={r.id}
                onClick={() => { setSelectedRefId(r.id); setSubmitted(false); }}
                style={{
                  width: '100%', display: 'flex', alignItems: 'center', gap: 10,
                  padding: '10px 14px', border: 'none', cursor: 'pointer', textAlign: 'left',
                  background: isSelected ? 'rgba(59,130,246,0.12)' : 'transparent',
                  borderLeft: isSelected ? '3px solid #3b82f6' : '3px solid transparent',
                  transition: 'all 0.1s',
                }}
              >
                <span style={{ fontSize: 18 }}>{COUNTRY_FLAGS[r.country] || '🏳️'}</span>
                <div style={{ flex: 1, overflow: 'hidden' }}>
                  <div style={{ fontSize: 12, fontWeight: 600, color: isSelected ? '#f1f5f9' : '#94a3b8', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{r.name}</div>
                  <div style={{ fontSize: 10, color: '#475569', display: 'flex', gap: 6 }}>
                    <span>{getBadgeLevel(r.badge)}</span>
                    <span>·</span>
                    <span>{r.country}</span>
                    {r.age && <><span>·</span><span>Age {r.age}</span></>}
                  </div>
                </div>
                {hasEval && <CheckCircle2 size={14} color="#34d399" />}
              </button>
            );
          })}
        </div>
      </div>

      {/* Right panel — form */}
      <div style={{ flex: 1, overflowY: 'auto' }}>
        {!selectedRef ? (
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', height: 300, color: '#475569', fontSize: 14 }}>
            Select a referee to begin evaluation
          </div>
        ) : (
          <div>
            {/* Referee header */}
            <div style={{
              background: '#13151f', border: '1px solid #1e2235', borderRadius: 12,
              padding: '16px 20px', marginBottom: 16,
              display: 'flex', alignItems: 'center', gap: 14,
            }}>
              <span style={{ fontSize: 28 }}>{COUNTRY_FLAGS[selectedRef.country] || '🏳️'}</span>
              <div style={{ flex: 1 }}>
                <div style={{ fontSize: 16, fontWeight: 800, color: '#f1f5f9' }}>{selectedRef.name}</div>
                <div style={{ fontSize: 12, color: '#64748b', display: 'flex', gap: 8, alignItems: 'center' }}>
                  <span>{selectedRef.country}</span>
                  {selectedRef.age && <><span style={{ color: '#1e2235' }}>·</span><span>Age {selectedRef.age}</span></>}
                </div>
              </div>
              <span style={{
                background: `${BADGE_COLORS[selectedRef.badge]}22`, color: BADGE_COLORS[selectedRef.badge],
                fontSize: 11, fontWeight: 700, padding: '4px 12px', borderRadius: 6,
              }}>{getBadgeLevel(selectedRef.badge)}</span>
            </div>

            {/* Evaluation form */}
            <form onSubmit={handleSubmit}>
              <div style={{ background: '#13151f', border: '1px solid #1e2235', borderRadius: 12, padding: '20px', marginBottom: 16 }}>
                <div style={{ fontSize: 13, fontWeight: 700, color: '#f1f5f9', marginBottom: 16 }}>Match Evaluation</div>

                {/* Match selector */}
                <div style={{ marginBottom: 20 }}>
                  <label style={{ display: 'block', fontSize: 11, fontWeight: 600, color: '#64748b', marginBottom: 6, letterSpacing: 0.5 }}>MATCH</label>
                  <select
                    value={matchId}
                    onChange={e => setMatchId(e.target.value)}
                    style={{ ...inputStyle, width: '100%', boxSizing: 'border-box', cursor: 'pointer' }}
                  >
                    <option value="">General Evaluation</option>
                    {matches.map(m => (
                      <option key={m.id} value={m.id}>{m.home} vs {m.away} — {m.date} {m.time}</option>
                    ))}
                  </select>
                </div>

                {/* Criteria */}
                {CRITERIA.map(({ key, label }) => (
                  <div key={key} style={{ marginBottom: 16 }}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 6 }}>
                      <label style={{ fontSize: 12, fontWeight: 600, color: '#94a3b8' }}>{label}</label>
                      <span style={{ fontSize: 10, color: '#475569' }}>
                        FIFA scale: 6.0 poor · 7.0 average · 8.0 good · 8.5 very good · 9.0 excellent
                      </span>
                    </div>
                    <ScoreInput value={scores[key]} onChange={v => handleScoreChange(key, v)} />
                  </div>
                ))}

                {/* Overall */}
                <div style={{ borderTop: '1px solid #1e2235', paddingTop: 16, marginTop: 8 }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 10 }}>
                    <label style={{ fontSize: 13, fontWeight: 700, color: '#f1f5f9' }}>Overall Note</label>
                    <span style={{ fontSize: 10, color: '#475569' }}>
                      FIFA scale: 6.0 poor · 7.0 average · 8.0 good · 8.5 very good · 9.0 excellent
                    </span>
                  </div>
                  <div style={{ display: 'flex', alignItems: 'center', gap: 14 }}>
                    <OverallScoreDisplay value={scores.overall} />
                    <input
                      type="range"
                      min={1}
                      max={10}
                      step={0.1}
                      value={scores.overall}
                      onChange={e => handleScoreChange('overall', parseFloat(e.target.value))}
                      style={{ flex: 1, accentColor: '#f5c518', cursor: 'pointer' }}
                    />
                    <input
                      type="number"
                      min={1}
                      max={10}
                      step={0.1}
                      value={scores.overall}
                      onChange={e => {
                        const v = parseFloat(e.target.value);
                        if (!isNaN(v) && v >= 1 && v <= 10) handleScoreChange('overall', Math.round(v * 10) / 10);
                      }}
                      style={{ width: 64, padding: '6px 8px', textAlign: 'center', background: '#0f1117', border: '1px solid #1e2235', borderRadius: 6, color: '#f1f5f9', fontSize: 14, fontWeight: 700 }}
                    />
                  </div>
                </div>

                {/* Notes */}
                <div style={{ marginTop: 16 }}>
                  <label style={{ display: 'block', fontSize: 11, fontWeight: 600, color: '#64748b', marginBottom: 6, letterSpacing: 0.5 }}>NOTES / COMMENTS (OPTIONAL)</label>
                  <textarea
                    value={notes}
                    onChange={e => setNotes(e.target.value)}
                    rows={3}
                    placeholder="Add any observations or comments..."
                    style={{ ...inputStyle, width: '100%', boxSizing: 'border-box', resize: 'vertical', fontFamily: 'inherit' }}
                  />
                </div>

                {/* Submit */}
                <div style={{ marginTop: 16, display: 'flex', alignItems: 'center', gap: 12 }}>
                  <button
                    type="submit"
                    style={{
                      padding: '10px 24px', background: 'linear-gradient(135deg, #3b82f6, #8b5cf6)',
                      border: 'none', borderRadius: 8, color: 'white', fontSize: 13,
                      fontWeight: 700, cursor: 'pointer',
                    }}
                  >
                    Submit Evaluation
                  </button>
                  {submitted && (
                    <span style={{ color: '#34d399', fontSize: 13, fontWeight: 600, display: 'flex', alignItems: 'center', gap: 6 }}>
                      <CheckCircle2 size={16} /> Saved!
                    </span>
                  )}
                </div>
              </div>
            </form>

            {/* Past evaluations */}
            {myEvalsForRef.length > 0 && (
              <div style={{ background: '#13151f', border: '1px solid #1e2235', borderRadius: 12, padding: '16px 20px' }}>
                <div style={{ fontSize: 13, fontWeight: 700, color: '#f1f5f9', marginBottom: 12 }}>
                  {isAdmin ? 'All Evaluations' : 'Your Previous Evaluations'} ({myEvalsForRef.length})
                </div>
                <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
                  {myEvalsForRef.map(ev => {
                    const match = ev.matchId ? matches.find(m => m.id === ev.matchId) : null;
                    const scoreColor = ev.scores.overall >= 8.5 ? '#f5c518' : ev.scores.overall >= 7.5 ? '#34d399' : ev.scores.overall >= 6.5 ? '#60a5fa' : '#94a3b8';
                    return (
                      <div key={ev.id} style={{
                        background: '#0f1117', borderRadius: 8, padding: '10px 14px',
                        display: 'flex', alignItems: 'center', gap: 12,
                      }}>
                        <div style={{ fontSize: 22, fontWeight: 900, color: scoreColor, minWidth: 44, textAlign: 'center' }}>
                          {ev.scores.overall.toFixed(1)}
                        </div>
                        <div style={{ flex: 1 }}>
                          <div style={{ fontSize: 11, color: '#94a3b8', fontWeight: 600 }}>
                            {match ? `${match.home} vs ${match.away}` : 'General Evaluation'}
                          </div>
                          {isAdmin && (
                            <div style={{ fontSize: 10, color: '#8b5cf6', marginBottom: 2 }}>
                              by {ev.evaluatorName}
                            </div>
                          )}
                          <div style={{ fontSize: 10, color: '#475569' }}>
                            {new Date(ev.date).toLocaleDateString('en-GB', { day: 'numeric', month: 'short', year: 'numeric', hour: '2-digit', minute: '2-digit' })}
                          </div>
                          {ev.notes && <div style={{ fontSize: 10, color: '#64748b', marginTop: 3, fontStyle: 'italic' }}>{ev.notes}</div>}
                        </div>
                        <div style={{ fontSize: 10, color: '#475569', textAlign: 'right' }}>
                          <div>P: {ev.scores.positioning.toFixed(1)}</div>
                          <div>GM: {ev.scores.gameManagement.toFixed(1)}</div>
                          <div>DM: {ev.scores.decisionMaking.toFixed(1)}</div>
                        </div>
                        {isAdmin && (
                          <button
                            onClick={() => deleteEvaluation(ev.id)}
                            title="Delete evaluation"
                            style={{
                              background: 'rgba(239,68,68,0.1)', border: '1px solid rgba(239,68,68,0.3)',
                              borderRadius: 6, padding: '5px 8px', cursor: 'pointer',
                              color: '#f87171', fontSize: 11, fontWeight: 700, flexShrink: 0,
                            }}
                          >✕</button>
                        )}
                      </div>
                    );
                  })}
                </div>
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
}
