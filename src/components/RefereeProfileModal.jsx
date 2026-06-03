import { X, Calendar, Briefcase, Flag, Star, TrendingUp, Award, Activity, Globe, Dumbbell } from 'lucide-react';
import StarRating, { SkillBar } from './StarRating';
import { refereeProfiles } from '../data/refereeProfiles';

const COUNTRY_FLAGS = {
  'England': '🏴󠁧󠁢󠁥󠁮󠁧󠁿', 'Germany': '🇩🇪', 'France': '🇫🇷', 'Gibraltar': '🇬🇮',
  'Ireland': '🇮🇪', 'Austria': '🇦🇹', 'Italy': '🇮🇹', 'Spain': '🇪🇸',
  'Slovenia': '🇸🇮', 'Czechia': '🇨🇿', 'Poland': '🇵🇱', 'Sweden': '🇸🇪',
};

const BADGE_COLORS = { FIFA: '#f59e0b', National: '#3b82f6', Regional: '#8b5cf6', Youth: '#34d399' };

const SKILL_ATTRS = [
  { key: 'positioning', label: 'Positioning' },
  { key: 'decisionSpeed', label: 'Decision Speed' },
  { key: 'authority', label: 'Match Authority' },
  { key: 'fitness', label: 'Fitness' },
  { key: 'lawsKnowledge', label: 'Laws Knowledge' },
  { key: 'communication', label: 'Communication' },
];

function computeAttributes(ref, profile) {
  const base = profile.currentSkill;
  const age = ref.age;
  const isVet = age > 35;
  const isYoung = age < 22;
  const badgeBonus = { FIFA: 18, National: 10, Regional: 4, Youth: 0 }[ref.badge] || 0;

  return {
    positioning: Math.min(99, base + badgeBonus * 0.4 + (isVet ? 8 : 0) + Math.random() * 5 | 0),
    decisionSpeed: Math.min(99, base + (isYoung ? 5 : isVet ? -3 : 3) + badgeBonus * 0.3 + Math.random() * 5 | 0),
    authority: Math.min(99, base + badgeBonus * 0.6 + (isVet ? 12 : isYoung ? -10 : 2) + Math.random() * 4 | 0),
    fitness: Math.min(99, base + (isYoung ? 12 : isVet ? -8 : 5) + Math.random() * 5 | 0),
    lawsKnowledge: Math.min(99, base + badgeBonus * 0.5 + (isVet ? 10 : 0) + Math.random() * 4 | 0),
    communication: Math.min(99, base + (profile.languages?.length > 2 ? 8 : 0) + badgeBonus * 0.3 + Math.random() * 5 | 0),
  };
}

function Avatar({ name, badge }) {
  const initials = name.split(' ').filter(Boolean).slice(0, 2).map(s => s[0]).join('');
  const color = BADGE_COLORS[badge] || '#64748b';
  return (
    <div style={{
      width: 90, height: 90, borderRadius: '50%',
      background: `linear-gradient(135deg, ${color}44, ${color}22)`,
      border: `3px solid ${color}`,
      display: 'flex', alignItems: 'center', justifyContent: 'center',
      fontSize: 28, fontWeight: 800, color, flexShrink: 0,
      letterSpacing: '-1px',
    }}>
      {initials}
    </div>
  );
}

function AgeSince(dob, years) {
  const d = new Date(dob);
  const age = new Date().getFullYear() - d.getFullYear();
  const startYear = new Date().getFullYear() - years;
  return { age, startYear };
}

export default function RefereeProfileModal({ referee, matches, assignments, onClose }) {
  if (!referee) return null;
  const profile = refereeProfiles[referee.id];
  if (!profile) return null;

  const { age, startYear } = AgeSince(profile.dob, profile.yearsAsReferee);
  const attrs = computeAttributes(referee, profile);

  const assignedMatches = matches.filter(m =>
    assignments[m.id]?.referee === referee.id ||
    assignments[m.id]?.ar1 === referee.id ||
    assignments[m.id]?.ar2 === referee.id
  );

  const BADGE_LABEL = { FIFA: 'FIFA International', National: 'National Level', Regional: 'Regional Level', Youth: 'Youth / Trainee' };

  return (
    <div
      onClick={onClose}
      style={{
        position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.75)',
        display: 'flex', alignItems: 'center', justifyContent: 'center',
        zIndex: 1000, padding: 20,
      }}
    >
      <div
        onClick={e => e.stopPropagation()}
        style={{
          background: '#13151f', border: '1px solid #1e2235',
          borderRadius: 18, width: '100%', maxWidth: 860,
          maxHeight: '90vh', overflow: 'hidden',
          display: 'flex', flexDirection: 'column',
          boxShadow: '0 24px 64px rgba(0,0,0,0.6)',
          animation: 'slide-in 0.25s ease-out',
        }}
      >
        {/* Header */}
        <div style={{
          display: 'flex', alignItems: 'center', gap: 20, padding: '20px 24px',
          background: 'linear-gradient(135deg, rgba(59,130,246,0.08), rgba(139,92,246,0.08))',
          borderBottom: '1px solid #1e2235', flexShrink: 0,
        }}>
          <Avatar name={referee.name} badge={referee.badge} />

          <div style={{ flex: 1 }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 4 }}>
              <span style={{ fontSize: 20 }}>{COUNTRY_FLAGS[referee.country] || '🏳️'}</span>
              <h2 style={{ fontSize: 20, fontWeight: 800, color: '#f1f5f9', margin: 0 }}>{referee.name}</h2>
              <span style={{
                background: `${BADGE_COLORS[referee.badge]}22`, color: BADGE_COLORS[referee.badge],
                fontSize: 11, fontWeight: 700, padding: '3px 10px', borderRadius: 6,
              }}>{referee.badge}</span>
            </div>
            <div style={{ fontSize: 12, color: '#64748b', marginBottom: 8 }}>
              {profile.hometown} · {BADGE_LABEL[referee.badge]}
            </div>
            {/* Stars row */}
            <div style={{ display: 'flex', gap: 20, alignItems: 'center' }}>
              <div>
                <div style={{ fontSize: 10, color: '#64748b', marginBottom: 3 }}>CURRENT LEVEL</div>
                <StarRating value={profile.currentSkill} size={18} showNumber color="#f5c518" />
              </div>
              <div style={{ width: 1, height: 32, background: '#1e2235' }} />
              <div>
                <div style={{ fontSize: 10, color: '#7c3aed', marginBottom: 3 }}>POTENTIAL</div>
                <StarRating value={profile.potential} size={18} showNumber color="#a78bfa" />
              </div>
            </div>
          </div>

          {/* Big skill number - FIFA style */}
          <div style={{ textAlign: 'center', marginRight: 8 }}>
            <div style={{
              fontSize: 52, fontWeight: 900, lineHeight: 1,
              color: profile.currentSkill >= 80 ? '#f5c518' : profile.currentSkill >= 65 ? '#60a5fa' : '#94a3b8',
            }}>
              {profile.currentSkill}
            </div>
            <div style={{ fontSize: 9, color: '#475569', fontWeight: 600, letterSpacing: 1 }}>OVR</div>
          </div>

          <div style={{ textAlign: 'center' }}>
            <div style={{
              fontSize: 36, fontWeight: 800, lineHeight: 1, color: '#a78bfa',
            }}>
              {profile.potential}
            </div>
            <div style={{ fontSize: 9, color: '#7c3aed', fontWeight: 600, letterSpacing: 1 }}>POT</div>
          </div>

          <button onClick={onClose} style={{
            background: 'rgba(255,255,255,0.05)', border: 'none', borderRadius: 8,
            padding: 8, cursor: 'pointer', color: '#64748b',
          }}>
            <X size={18} />
          </button>
        </div>

        {/* Body */}
        <div style={{ flex: 1, overflow: 'auto', display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 0 }}>
          {/* Left column */}
          <div style={{ padding: '20px 24px', borderRight: '1px solid #1e2235', display: 'flex', flexDirection: 'column', gap: 20 }}>

            {/* Personal info */}
            <section>
              <div style={{ fontSize: 11, fontWeight: 700, color: '#475569', letterSpacing: 1, marginBottom: 12 }}>PERSONAL INFORMATION</div>
              <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
                {[
                  [Calendar, 'Date of Birth', `${new Date(profile.dob).toLocaleDateString('en-GB', { day: 'numeric', month: 'long', year: 'numeric' })} (Age ${age})`],
                  [Flag, 'Nationality', profile.nationality],
                  [Activity, 'Refereeing Since', `${startYear} (${profile.yearsAsReferee} year${profile.yearsAsReferee !== 1 ? 's' : ''})`],
                  [Briefcase, 'Occupation', profile.occupation],
                  [Dumbbell, 'Physical', `${profile.physical.height} · ${profile.physical.weight} · Fitness: ${profile.physical.fitness}`],
                  [Globe, 'Languages', profile.languages.join(', ')],
                ].map(([Icon, lbl, val]) => (
                  <div key={lbl} style={{ display: 'flex', gap: 10, alignItems: 'flex-start' }}>
                    <Icon size={13} color="#475569" style={{ marginTop: 2, flexShrink: 0 }} />
                    <div>
                      <div style={{ fontSize: 10, color: '#475569' }}>{lbl}</div>
                      <div style={{ fontSize: 12, color: '#e2e8f0', fontWeight: 500 }}>{val}</div>
                    </div>
                  </div>
                ))}
              </div>
            </section>

            {/* Bio */}
            <section>
              <div style={{ fontSize: 11, fontWeight: 700, color: '#475569', letterSpacing: 1, marginBottom: 8 }}>PROFILE</div>
              <p style={{ fontSize: 12, color: '#94a3b8', lineHeight: 1.65, margin: 0 }}>{profile.bio}</p>
            </section>

            {/* Badges */}
            <section>
              <div style={{ fontSize: 11, fontWeight: 700, color: '#475569', letterSpacing: 1, marginBottom: 8 }}>CERTIFICATIONS</div>
              <div style={{ display: 'flex', flexWrap: 'wrap', gap: 6 }}>
                {profile.badges.map(b => (
                  <span key={b} style={{
                    background: '#1a1d2e', border: '1px solid #1e2235',
                    color: '#94a3b8', fontSize: 10, padding: '3px 8px', borderRadius: 6
                  }}>{b}</span>
                ))}
              </div>
            </section>

            {/* Strengths / Weaknesses */}
            <section>
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12 }}>
                <div>
                  <div style={{ fontSize: 11, fontWeight: 700, color: '#059669', letterSpacing: 1, marginBottom: 8 }}>STRENGTHS</div>
                  {profile.strengths.map(s => (
                    <div key={s} style={{ display: 'flex', alignItems: 'center', gap: 6, marginBottom: 5 }}>
                      <span style={{ color: '#34d399', fontSize: 14 }}>+</span>
                      <span style={{ fontSize: 11, color: '#94a3b8' }}>{s}</span>
                    </div>
                  ))}
                </div>
                <div>
                  <div style={{ fontSize: 11, fontWeight: 700, color: '#dc2626', letterSpacing: 1, marginBottom: 8 }}>WEAKNESSES</div>
                  {profile.weaknesses.map(w => (
                    <div key={w} style={{ display: 'flex', alignItems: 'center', gap: 6, marginBottom: 5 }}>
                      <span style={{ color: '#f87171', fontSize: 14 }}>−</span>
                      <span style={{ fontSize: 11, color: '#94a3b8' }}>{w}</span>
                    </div>
                  ))}
                </div>
              </div>
            </section>
          </div>

          {/* Right column */}
          <div style={{ padding: '20px 24px', display: 'flex', flexDirection: 'column', gap: 20 }}>

            {/* Attribute bars — FIFA style */}
            <section>
              <div style={{ fontSize: 11, fontWeight: 700, color: '#475569', letterSpacing: 1, marginBottom: 12 }}>SKILL ATTRIBUTES</div>
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '4px 20px' }}>
                {SKILL_ATTRS.map(({ key, label }) => {
                  const cur = attrs[key];
                  const pot = Math.min(99, Math.round(cur * (profile.potential / profile.currentSkill)));
                  return <SkillBar key={key} label={label} current={cur} potential={pot} />;
                })}
              </div>
              <div style={{ display: 'flex', gap: 16, marginTop: 10 }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: 5 }}>
                  <div style={{ width: 10, height: 4, background: 'linear-gradient(90deg,#f5c518,#ff9800)', borderRadius: 2 }} />
                  <span style={{ fontSize: 10, color: '#64748b' }}>Current</span>
                </div>
                <div style={{ display: 'flex', alignItems: 'center', gap: 5 }}>
                  <div style={{ width: 10, height: 4, background: 'rgba(139,92,246,0.5)', borderRadius: 2 }} />
                  <span style={{ fontSize: 10, color: '#64748b' }}>Potential</span>
                </div>
              </div>
            </section>

            {/* Season stats */}
            <section>
              <div style={{ fontSize: 11, fontWeight: 700, color: '#475569', letterSpacing: 1, marginBottom: 12 }}>CAREER STATISTICS</div>
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: 8 }}>
                {[
                  ['Total Matches', profile.stats.matchesTotal],
                  ['This Season', profile.stats.matchesThisSeason],
                  ['Yellows', profile.stats.yellowCards],
                  ['Reds', profile.stats.redCards],
                  ['Tournament Assignments', assignedMatches.length],
                  ['Avg Rating', profile.stats.avgRating.toFixed(1)],
                ].map(([lbl, val]) => (
                  <div key={lbl} style={{ background: '#0f1117', borderRadius: 8, padding: '10px 12px', textAlign: 'center' }}>
                    <div style={{ fontSize: 18, fontWeight: 800, color: '#f1f5f9' }}>{val}</div>
                    <div style={{ fontSize: 10, color: '#475569', marginTop: 2 }}>{lbl}</div>
                  </div>
                ))}
              </div>
            </section>

            {/* Career history */}
            <section>
              <div style={{ fontSize: 11, fontWeight: 700, color: '#475569', letterSpacing: 1, marginBottom: 12 }}>CAREER HISTORY</div>
              <div style={{ display: 'flex', flexDirection: 'column', gap: 0 }}>
                {profile.careerHistory.map((c, i) => (
                  <div key={i} style={{ display: 'flex', gap: 12, paddingBottom: 12, position: 'relative' }}>
                    {/* Timeline line */}
                    {i < profile.careerHistory.length - 1 && (
                      <div style={{ position: 'absolute', left: 19, top: 20, width: 1, bottom: 0, background: '#1e2235' }} />
                    )}
                    <div style={{
                      width: 20, height: 20, borderRadius: '50%', background: '#1e2235',
                      border: '2px solid #3b82f6', display: 'flex', alignItems: 'center',
                      justifyContent: 'center', flexShrink: 0, marginTop: 1, zIndex: 1,
                    }}>
                      <div style={{ width: 6, height: 6, borderRadius: '50%', background: '#3b82f6' }} />
                    </div>
                    <div>
                      <div style={{ fontSize: 10, color: '#3b82f6', fontWeight: 700 }}>{c.year}</div>
                      <div style={{ fontSize: 12, color: '#e2e8f0', fontWeight: 500 }}>{c.role}</div>
                      <div style={{ fontSize: 11, color: '#64748b' }}>{c.league}</div>
                    </div>
                  </div>
                ))}
              </div>
            </section>

            {/* Tournament assignments */}
            {assignedMatches.length > 0 && (
              <section>
                <div style={{ fontSize: 11, fontWeight: 700, color: '#475569', letterSpacing: 1, marginBottom: 8 }}>
                  THIS TOURNAMENT ({assignedMatches.length} MATCHES)
                </div>
                <div style={{ maxHeight: 140, overflowY: 'auto', display: 'flex', flexDirection: 'column', gap: 6 }}>
                  {assignedMatches.map(m => {
                    const role = assignments[m.id]?.referee === referee.id ? 'REF' :
                      assignments[m.id]?.ar1 === referee.id ? 'AR1' : 'AR2';
                    return (
                      <div key={m.id} style={{
                        background: '#0f1117', borderRadius: 8, padding: '7px 10px',
                        display: 'flex', alignItems: 'center', gap: 8,
                      }}>
                        <span style={{
                          background: role === 'REF' ? 'rgba(59,130,246,0.2)' : 'rgba(139,92,246,0.2)',
                          color: role === 'REF' ? '#60a5fa' : '#a78bfa',
                          fontSize: 9, fontWeight: 800, padding: '2px 6px', borderRadius: 4,
                        }}>{role}</span>
                        <span style={{ fontSize: 11, color: '#e2e8f0', flex: 1 }}>{m.home} vs {m.away}</span>
                        <span style={{ fontSize: 10, color: '#475569' }}>{m.time}</span>
                      </div>
                    );
                  })}
                </div>
              </section>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
