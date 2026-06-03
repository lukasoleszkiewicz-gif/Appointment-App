import { CheckCircle, XCircle, Bot, ChevronRight, CheckSquare } from 'lucide-react';

const BADGE_COLORS = { FIFA: '#f59e0b', National: '#3b82f6', Regional: '#8b5cf6', Youth: '#34d399' };

function RefBadge({ refId, referees, role }) {
  const ref = referees.find(r => r.id === refId);
  if (!ref) return null;
  return (
    <div style={{
      display: 'inline-flex', alignItems: 'center', gap: 6, background: '#0f1117',
      border: '1px solid #1e2235', borderRadius: 8, padding: '4px 10px', margin: '3px 4px 3px 0'
    }}>
      <span style={{
        fontSize: 9, fontWeight: 700, color: BADGE_COLORS[ref.badge] || '#94a3b8',
        background: `${BADGE_COLORS[ref.badge]}22`, padding: '1px 5px', borderRadius: 4
      }}>{role}</span>
      <span style={{ fontSize: 12, color: '#e2e8f0' }}>{ref.name}</span>
      <span style={{ fontSize: 10, color: '#64748b' }}>{ref.badge}</span>
    </div>
  );
}

function AIReason({ teamType, refName, badge }) {
  const isFinal = teamType.includes('FINAL');
  const isSemi = teamType.includes('Semifinal');
  const isPrime = teamType.includes('PRIME');

  const reasons = [];
  if (isFinal) reasons.push(`Final match — ${badge} badge referee selected for highest-stakes officiating`);
  else if (isSemi) reasons.push(`Semi-final — qualified referee ensures competitive integrity`);
  else if (isPrime) reasons.push(`PRIME category — experienced referee matched to elite competition level`);
  else reasons.push(`Workload-balanced assignment based on availability and match category`);

  if (badge === 'FIFA' || badge === 'National') reasons.push(`${refName} has top-tier certification suitable for this fixture`);

  return (
    <div style={{
      background: 'rgba(59,130,246,0.06)', border: '1px solid rgba(59,130,246,0.15)',
      borderRadius: 8, padding: '10px 12px', marginTop: 10
    }}>
      <div style={{ display: 'flex', alignItems: 'center', gap: 6, marginBottom: 6 }}>
        <Bot size={12} color="#60a5fa" />
        <span style={{ fontSize: 10, fontWeight: 700, color: '#60a5fa' }}>AI REASONING</span>
      </div>
      {reasons.map((r, i) => (
        <div key={i} style={{ display: 'flex', alignItems: 'flex-start', gap: 6, marginBottom: 4 }}>
          <ChevronRight size={11} color="#3b82f6" style={{ marginTop: 2, flexShrink: 0 }} />
          <span style={{ fontSize: 11, color: '#94a3b8' }}>{r}</span>
        </div>
      ))}
    </div>
  );
}

export default function ValidationQueue({ matches, assignments, referees, pending, onApprove, onReject, onApproveAll }) {
  const pendingMatches = matches.filter(m => pending.includes(m.id));

  return (
    <div>
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 24 }}>
        <div>
          <h2 style={{ fontSize: 18, fontWeight: 700, color: '#f1f5f9', margin: 0 }}>Validation Queue</h2>
          <p style={{ color: '#64748b', fontSize: 12, margin: '2px 0 0' }}>
            Review AI-proposed assignments — approve or reject each one
          </p>
        </div>
        {pending.length > 0 && (
          <button
            onClick={onApproveAll}
            style={{
              display: 'flex', alignItems: 'center', gap: 8,
              padding: '9px 18px', borderRadius: 9, border: 'none', cursor: 'pointer',
              background: 'linear-gradient(135deg, #059669, #047857)',
              color: 'white', fontWeight: 700, fontSize: 13,
            }}
          >
            <CheckSquare size={15} />
            Approve All ({pending.length})
          </button>
        )}
      </div>

      {pending.length === 0 ? (
        <div style={{
          background: '#13151f', border: '1px solid #1e2235', borderRadius: 16,
          padding: 48, textAlign: 'center'
        }}>
          <div style={{ fontSize: 48, marginBottom: 12 }}>✅</div>
          <div style={{ fontSize: 18, fontWeight: 700, color: '#f1f5f9', marginBottom: 8 }}>
            All caught up!
          </div>
          <div style={{ fontSize: 13, color: '#64748b' }}>
            No pending assignments to validate. Run the AI engine to generate new proposals.
          </div>
        </div>
      ) : (
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(420px, 1fr))', gap: 16 }}>
          {pendingMatches.map(m => {
            const a = assignments[m.id] || {};
            const mainRef = referees.find(r => r.id === a.referee);

            return (
              <div key={m.id} style={{
                background: '#13151f', border: '1px solid #1e3050',
                borderLeft: '3px solid #3b82f6', borderRadius: 12, padding: 18,
                animation: 'slide-in 0.3s ease-out'
              }}>
                {/* Header */}
                <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', marginBottom: 12 }}>
                  <div>
                    <div style={{ fontSize: 14, fontWeight: 700, color: '#f1f5f9', marginBottom: 2 }}>
                      {m.home} <span style={{ color: '#475569' }}>vs</span> {m.away}
                    </div>
                    <div style={{ display: 'flex', gap: 8, fontSize: 11, color: '#64748b' }}>
                      <span>{m.date}</span>
                      <span>·</span>
                      <span>{m.time}</span>
                      <span>·</span>
                      <span style={{ color: '#a78bfa' }}>{m.teamType}</span>
                    </div>
                    <div style={{ fontSize: 11, color: '#475569', marginTop: 2 }}>
                      📍 {m.venue}
                    </div>
                  </div>
                  <span style={{
                    background: 'rgba(59,130,246,0.15)', color: '#60a5fa',
                    fontSize: 10, fontWeight: 700, padding: '3px 8px', borderRadius: 6, whiteSpace: 'nowrap'
                  }}>AI Proposed</span>
                </div>

                {/* Assignments */}
                <div style={{ marginBottom: 8 }}>
                  {a.referee && <RefBadge refId={a.referee} referees={referees} role="REF" />}
                  {a.ar1 && <RefBadge refId={a.ar1} referees={referees} role="AR1" />}
                  {a.ar2 && <RefBadge refId={a.ar2} referees={referees} role="AR2" />}
                  {!a.referee && (
                    <span style={{ fontSize: 12, color: '#ef4444' }}>⚠ No referee could be assigned</span>
                  )}
                </div>

                {/* AI reason */}
                {mainRef && (
                  <AIReason teamType={m.teamType} refName={mainRef.name} badge={mainRef.badge} />
                )}

                {/* Actions */}
                <div style={{ display: 'flex', gap: 8, marginTop: 14 }}>
                  <button
                    onClick={() => onApprove(m.id)}
                    style={{
                      flex: 1, display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 6,
                      padding: '8px', borderRadius: 8, border: 'none', cursor: 'pointer',
                      background: 'rgba(5,150,105,0.15)', color: '#34d399', fontWeight: 600, fontSize: 12
                    }}
                  >
                    <CheckCircle size={14} /> Approve
                  </button>
                  <button
                    onClick={() => onReject(m.id)}
                    style={{
                      flex: 1, display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 6,
                      padding: '8px', borderRadius: 8, border: 'none', cursor: 'pointer',
                      background: 'rgba(239,68,68,0.1)', color: '#f87171', fontWeight: 600, fontSize: 12
                    }}
                  >
                    <XCircle size={14} /> Reject
                  </button>
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
