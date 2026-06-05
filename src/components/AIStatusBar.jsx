import { Bot, Loader, CheckCircle, Sparkles } from 'lucide-react';

export default function AIStatusBar({ aiRunning, aiLog, onRunAI, stats, refereeCount }) {
  const lastLog = aiLog[aiLog.length - 1];
  const refCount = refereeCount || stats.total;

  return (
    <div style={{
      background: '#13151f', borderBottom: '1px solid #1e2235',
      padding: '10px 24px', display: 'flex', alignItems: 'center', gap: 16, minHeight: 52
    }}>
      <div style={{ display: 'flex', alignItems: 'center', gap: 8, flex: 1 }}>
        <div style={{
          width: 28, height: 28, borderRadius: 8,
          background: aiRunning ? 'rgba(59,130,246,0.2)' : 'rgba(139,92,246,0.15)',
          display: 'flex', alignItems: 'center', justifyContent: 'center',
          ...(aiRunning ? { animation: 'pulse-glow 2s infinite' } : {})
        }}>
          {aiRunning ? <Loader size={14} color="#60a5fa" className="spinner" style={{ animation: 'spin 1s linear infinite' }} /> : <Bot size={14} color="#a78bfa" />}
        </div>

        {aiRunning && lastLog ? (
          <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
            <span style={{ fontSize: 12, color: '#60a5fa', fontWeight: 500 }}>AI Agent:</span>
            <span style={{ fontSize: 12, color: '#94a3b8' }}>{lastLog.text}</span>
            <span style={{ display: 'inline-flex', gap: 2 }}>
              {[0, 1, 2].map(i => (
                <span key={i} style={{
                  width: 4, height: 4, borderRadius: '50%', background: '#60a5fa', display: 'inline-block',
                  animation: `pulse-glow 1.2s ease-in-out ${i * 0.2}s infinite`
                }} />
              ))}
            </span>
          </div>
        ) : aiLog.length > 0 ? (
          <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
            <CheckCircle size={13} color="#34d399" />
            <span style={{ fontSize: 12, color: '#34d399', fontWeight: 500 }}>
              AI assigned {stats.assigned} matches — awaiting validation
            </span>
          </div>
        ) : (
          <span style={{ fontSize: 12, color: '#475569' }}>
            AI agent ready · {stats.total} matches · {refCount} Estoril referees available
          </span>
        )}
      </div>

      <button
        onClick={onRunAI}
        disabled={aiRunning}
        style={{
          display: 'flex', alignItems: 'center', gap: 6,
          padding: '7px 16px', borderRadius: 8, border: 'none', cursor: aiRunning ? 'not-allowed' : 'pointer',
          background: aiRunning ? '#1e2235' : 'linear-gradient(135deg, #3b82f6, #8b5cf6)',
          color: aiRunning ? '#475569' : 'white', fontWeight: 600, fontSize: 13,
          transition: 'all 0.2s',
        }}
      >
        <Sparkles size={14} />
        {aiRunning ? 'Running...' : 'Run AI Assignment'}
      </button>
    </div>
  );
}
