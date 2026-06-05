import { LayoutDashboard, CalendarDays, Users, CheckSquare, ClipboardList, Trophy } from 'lucide-react';
import USOfficialsLogo from './USOfficialsLogo';

const ALL_NAV_ITEMS = [
  { id: 'dashboard', icon: LayoutDashboard, label: 'Dashboard', roles: ['admin'] },
  { id: 'matches', icon: CalendarDays, label: 'Matches', roles: ['admin'] },
  { id: 'referees', icon: Users, label: 'Referees', roles: ['admin', 'observer'] },
  { id: 'validation', icon: CheckSquare, label: 'Validation', roles: ['admin'] },
  { id: 'evaluations', icon: ClipboardList, label: 'Evaluations', roles: ['admin', 'observer'] },
  { id: 'merittable', icon: Trophy, label: 'Merit Table', roles: ['admin', 'observer'] },
];

const ROLE_COLORS = { admin: '#3b82f6', observer: '#8b5cf6', referee: '#34d399' };

export default function Sidebar({ activeView, setActiveView, stats, currentUser }) {
  const role = currentUser?.role || 'admin';
  const navItems = ALL_NAV_ITEMS.filter(item => item.roles.includes(role));

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

      {/* User info footer */}
      <div style={{ padding: '12px 16px', borderTop: '1px solid #1e2235' }}>
        {role === 'admin' && (
          <>
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
            <div style={{ fontSize: 11, color: '#64748b', marginBottom: 10 }}>
              {stats.approved} / {stats.total} confirmed
            </div>
          </>
        )}
        {currentUser && (
          <div style={{
            background: '#0f1117', borderRadius: 8, padding: '8px 10px',
            display: 'flex', alignItems: 'center', gap: 8,
          }}>
            <div style={{
              width: 28, height: 28, borderRadius: '50%',
              background: `${ROLE_COLORS[role] || '#64748b'}33`,
              border: `2px solid ${ROLE_COLORS[role] || '#64748b'}`,
              display: 'flex', alignItems: 'center', justifyContent: 'center',
              fontSize: 11, fontWeight: 700, color: ROLE_COLORS[role] || '#64748b',
              flexShrink: 0,
            }}>
              {currentUser.name[0]}
            </div>
            <div style={{ overflow: 'hidden' }}>
              <div style={{ fontSize: 11, color: '#e2e8f0', fontWeight: 600, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                {currentUser.name}
              </div>
              <div style={{
                fontSize: 9, fontWeight: 700, letterSpacing: 0.5,
                color: ROLE_COLORS[role] || '#64748b', textTransform: 'uppercase',
              }}>
                {role}
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
