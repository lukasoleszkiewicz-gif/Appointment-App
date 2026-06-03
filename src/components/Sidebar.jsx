import { LayoutDashboard, CalendarDays, Users, CheckSquare } from 'lucide-react';
import USOfficialsLogo from './USOfficialsLogo';

const navItems = [
  { id: 'dashboard', icon: LayoutDashboard, label: 'Dashboard' },
  { id: 'matches', icon: CalendarDays, label: 'Matches' },
  { id: 'referees', icon: Users, label: 'Referees' },
  { id: 'validation', icon: CheckSquare, label: 'Validation' },
];

export default function Sidebar({ activeView, setActiveView, stats }) {
  return (
    <div style={{
      width: 220, background: '#13151f', borderRight: '1px solid #1e2235',
      display: 'flex', flexDirection: 'column', flexShrink: 0
    }}>
      {/* Logo */}
      <div style={{ padding: '16px 12px', borderBottom: '1px solid #1e2235' }}>
        <USOfficialsLogo size="normal" />
        <div style={{ fontSize: 10, color: '#475569', marginTop: 6, paddingLeft: 2 }}>
          AI Referee Assignment
        </div>
      </div>

      {/* Nav */}
      <nav style={{ flex: 1, padding: '12px 8px' }}>
        {navItems.map(({ id, icon: Icon, label }) => {
          const isActive = activeView === id;
          const badge = id === 'validation' && stats.pending > 0 ? stats.pending : null;
          return (
            <button
              key={id}
              onClick={() => setActiveView(id)}
              style={{
                width: '100%', display: 'flex', alignItems: 'center', gap: 10,
                padding: '9px 12px', borderRadius: 8, border: 'none', cursor: 'pointer',
                background: isActive ? 'rgba(59, 130, 246, 0.15)' : 'transparent',
                color: isActive ? '#60a5fa' : '#94a3b8',
                fontWeight: isActive ? 600 : 400, fontSize: 13,
                marginBottom: 2, transition: 'all 0.15s', textAlign: 'left',
              }}
            >
              <Icon size={16} />
              <span style={{ flex: 1 }}>{label}</span>
              {badge && (
                <span style={{
                  background: '#ef4444', color: 'white', borderRadius: 10,
                  fontSize: 10, fontWeight: 700, padding: '1px 6px', minWidth: 18, textAlign: 'center'
                }}>{badge}</span>
              )}
            </button>
          );
        })}
      </nav>

      {/* Stats footer */}
      <div style={{ padding: '12px 16px', borderTop: '1px solid #1e2235' }}>
        <div style={{ fontSize: 11, color: '#475569', marginBottom: 8 }}>ASSIGNMENT PROGRESS</div>
        <div style={{
          height: 4, background: '#1e2235', borderRadius: 4, overflow: 'hidden', marginBottom: 6
        }}>
          <div style={{
            height: '100%', borderRadius: 4,
            background: 'linear-gradient(90deg, #3b82f6, #8b5cf6)',
            width: `${stats.total ? (stats.approved / stats.total * 100) : 0}%`,
            transition: 'width 0.5s ease'
          }} />
        </div>
        <div style={{ fontSize: 11, color: '#64748b' }}>
          {stats.approved} / {stats.total} confirmed
        </div>
      </div>
    </div>
  );
}
