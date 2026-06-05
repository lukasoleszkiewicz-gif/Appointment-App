import { useState, useEffect } from 'react';

const LS_KEY = 'estoril_prompts';

const PRESETS = [
  { id: 'rotate', label: 'Rotate roles per match', text: 'Rotate referee roles (Referee → AR1 → AR2) across consecutive matches at each pitch, so no one is always main referee.' },
  { id: 'max3', label: 'Max 3 matches/day', text: 'Limit each referee to a maximum of 3 matches per day to prevent fatigue.' },
  { id: 'balance', label: 'Balance workload evenly', text: 'Distribute matches as evenly as possible across all available referees.' },
  { id: 'nationality', label: 'Mix nationalities per team', text: 'Ensure every 3-person team includes referees of at least 2 different nationalities.' },
  { id: 'noconflict', label: 'Avoid nation conflicts', text: 'Never assign a referee as main referee in a match where either team is from the same country as the referee.' },
  { id: 'seniorfinals', label: 'Senior refs for finals/semis', text: 'Assign the most experienced (Regional or National badge) referees to semi-finals and finals.' },
  { id: 'pitchstay', label: 'Keep teams on one pitch', text: 'Once a team of 3 is formed for a pitch, keep them on that pitch for the whole day.' },
  { id: 'rest', label: 'Min 60 min rest between matches', text: 'Ensure at least 60 minutes between consecutive assignments for each referee.' },
];

const CATEGORY_OPTIONS = [
  'Any category',
  'Cat B7 – 7-aside',
  'Cat B9 – 9-aside',
  'Cat B11 – 11-aside',
  'Cat BK11 – 11-aside (older)',
  'Finals & Semi-Finals',
];

export default function PromptPanel() {
  const [saved, setSaved] = useState(() => {
    try { return JSON.parse(localStorage.getItem(LS_KEY)) || []; } catch { return []; }
  });
  const [text, setText] = useState('');
  const [category, setCategory] = useState('Any category');
  const [activePresets, setActivePresets] = useState(new Set());
  const [flash, setFlash] = useState(false);

  useEffect(() => {
    localStorage.setItem(LS_KEY, JSON.stringify(saved));
  }, [saved]);

  const togglePreset = (preset) => {
    setActivePresets(prev => {
      const next = new Set(prev);
      if (next.has(preset.id)) {
        next.delete(preset.id);
        setText(t => t.replace('\n' + preset.text, '').replace(preset.text, '').trim());
      } else {
        next.add(preset.id);
        setText(t => (t ? t + '\n' : '') + preset.text);
      }
      return next;
    });
  };

  const savePrompt = () => {
    if (!text.trim()) return;
    const entry = {
      id: Date.now(),
      text: text.trim(),
      category,
      createdAt: new Date().toISOString(),
    };
    setSaved(prev => [entry, ...prev]);
    setText('');
    setActivePresets(new Set());
    setCategory('Any category');
    setFlash(true);
    setTimeout(() => setFlash(false), 1500);
  };

  const deletePrompt = (id) => {
    setSaved(prev => prev.filter(p => p.id !== id));
  };

  return (
    <div style={{ maxWidth: 800 }}>
      <div style={{ marginBottom: 24 }}>
        <h2 style={{ fontSize: 20, fontWeight: 700, color: '#f1f5f9', margin: '0 0 4px' }}>AI Prompt</h2>
        <p style={{ color: '#64748b', fontSize: 13, margin: 0 }}>
          Write custom appointment instructions or pick from common presets. Saved prompts are applied in the next AI run.
        </p>
      </div>

      {/* Preset chips */}
      <div style={{ marginBottom: 16 }}>
        <div style={{ fontSize: 11, fontWeight: 700, color: '#475569', letterSpacing: 0.5, marginBottom: 8 }}>
          COMMON PRESETS — click to add to prompt
        </div>
        <div style={{ display: 'flex', flexWrap: 'wrap', gap: 8 }}>
          {PRESETS.map(p => {
            const active = activePresets.has(p.id);
            return (
              <button
                key={p.id}
                onClick={() => togglePreset(p)}
                style={{
                  padding: '6px 14px', borderRadius: 20, fontSize: 12, fontWeight: 600,
                  cursor: 'pointer', transition: 'all 0.15s',
                  border: active ? '1px solid #3b82f6' : '1px solid #1e2235',
                  background: active ? 'rgba(59,130,246,0.2)' : '#13151f',
                  color: active ? '#60a5fa' : '#64748b',
                }}
              >
                {active ? '✓ ' : '+ '}{p.label}
              </button>
            );
          })}
        </div>
      </div>

      {/* Category selector */}
      <div style={{ display: 'flex', gap: 12, marginBottom: 12, alignItems: 'center' }}>
        <div style={{ fontSize: 12, color: '#64748b' }}>Apply to:</div>
        <select
          value={category}
          onChange={e => setCategory(e.target.value)}
          style={{
            background: '#1a1d2e', border: '1px solid #1e2235', color: '#94a3b8',
            borderRadius: 8, padding: '6px 12px', fontSize: 12, cursor: 'pointer',
          }}
        >
          {CATEGORY_OPTIONS.map(o => <option key={o}>{o}</option>)}
        </select>
      </div>

      {/* Text area */}
      <textarea
        value={text}
        onChange={e => setText(e.target.value)}
        placeholder="Write custom appointment instructions here, e.g.:&#10;'Appoint Richard Jeffries as main referee for all finals.'&#10;'Keep observers from England off Day 1 pitches.'&#10;'Prioritise referees under 35 for 7-aside matches.'"
        rows={6}
        style={{
          width: '100%', background: '#13151f', border: '1px solid #1e2235',
          borderRadius: 10, color: '#e2e8f0', fontSize: 13, padding: '12px 14px',
          resize: 'vertical', fontFamily: 'inherit', lineHeight: 1.6,
          boxSizing: 'border-box',
        }}
      />

      <div style={{ display: 'flex', justifyContent: 'flex-end', marginTop: 10, gap: 10 }}>
        {text && (
          <button
            onClick={() => { setText(''); setActivePresets(new Set()); }}
            style={{
              padding: '8px 18px', borderRadius: 8, border: '1px solid #1e2235',
              background: 'transparent', color: '#64748b', fontSize: 13, cursor: 'pointer',
            }}
          >
            Clear
          </button>
        )}
        <button
          onClick={savePrompt}
          disabled={!text.trim()}
          style={{
            padding: '8px 22px', borderRadius: 8, border: 'none', fontSize: 13, fontWeight: 700,
            cursor: text.trim() ? 'pointer' : 'not-allowed',
            background: flash
              ? '#064e3b'
              : text.trim()
                ? 'linear-gradient(135deg, #3b82f6, #8b5cf6)'
                : '#1e2235',
            color: flash ? '#34d399' : text.trim() ? 'white' : '#475569',
            transition: 'all 0.2s',
          }}
        >
          {flash ? '✓ Saved' : 'Save Prompt'}
        </button>
      </div>

      {/* Saved prompts */}
      {saved.length > 0 && (
        <div style={{ marginTop: 28 }}>
          <div style={{ fontSize: 11, fontWeight: 700, color: '#475569', letterSpacing: 0.5, marginBottom: 12 }}>
            SAVED PROMPTS ({saved.length})
          </div>
          <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
            {saved.map(p => (
              <div
                key={p.id}
                style={{
                  background: '#13151f', border: '1px solid #1e2235', borderRadius: 10,
                  padding: '12px 14px', display: 'flex', gap: 12, alignItems: 'flex-start',
                }}
              >
                <div style={{ flex: 1 }}>
                  <div style={{ display: 'flex', gap: 8, alignItems: 'center', marginBottom: 4 }}>
                    <span style={{
                      fontSize: 10, fontWeight: 700, background: 'rgba(139,92,246,0.15)',
                      color: '#a78bfa', padding: '2px 8px', borderRadius: 5,
                    }}>{p.category}</span>
                    <span style={{ fontSize: 10, color: '#334155' }}>
                      {new Date(p.createdAt).toLocaleString('en-GB', { dateStyle: 'short', timeStyle: 'short' })}
                    </span>
                  </div>
                  <div style={{ fontSize: 13, color: '#94a3b8', lineHeight: 1.5, whiteSpace: 'pre-wrap' }}>{p.text}</div>
                </div>
                <button
                  onClick={() => deletePrompt(p.id)}
                  title="Delete"
                  style={{
                    background: 'none', border: 'none', color: '#334155', cursor: 'pointer',
                    fontSize: 16, lineHeight: 1, padding: '2px 4px', flexShrink: 0,
                  }}
                >×</button>
              </div>
            ))}
          </div>
        </div>
      )}

      {saved.length === 0 && (
        <div style={{
          marginTop: 32, textAlign: 'center', color: '#334155', fontSize: 13,
          padding: '24px', border: '1px dashed #1e2235', borderRadius: 10,
        }}>
          No saved prompts yet — add instructions above to guide the AI engine.
        </div>
      )}
    </div>
  );
}
