import { useState, useCallback, useEffect } from 'react';
import { rawMatches, referees as initialReferees } from './data/matchData';
import { generateAIAssignments } from './utils/aiEngine';
import Sidebar from './components/Sidebar';
import Dashboard from './components/Dashboard';
import MatchTable from './components/MatchTable';
import RefereePanel from './components/RefereePanel';
import ValidationQueue from './components/ValidationQueue';
import AIStatusBar from './components/AIStatusBar';
import LoginScreen from './components/LoginScreen';
import EvaluationForm from './components/EvaluationForm';
import MeritTable from './components/MeritTable';
import './index.css';

const LS_USER_KEY = 'estoril_user';

function getDefaultView(role) {
  if (role === 'admin') return 'dashboard';
  if (role === 'observer') return 'referees';
  if (role === 'referee') return 'myassignments';
  return 'dashboard';
}

export default function App() {
  const [currentUser, setCurrentUser] = useState(() => {
    try {
      const stored = localStorage.getItem(LS_USER_KEY);
      return stored ? JSON.parse(stored) : null;
    } catch {
      return null;
    }
  });

  const [activeView, setActiveView] = useState(() => {
    try {
      const stored = localStorage.getItem(LS_USER_KEY);
      const user = stored ? JSON.parse(stored) : null;
      return user ? getDefaultView(user.role) : 'dashboard';
    } catch {
      return 'dashboard';
    }
  });

  const [assignments, setAssignments] = useState({});
  const [pendingValidation, setPendingValidation] = useState([]);
  const [aiRunning, setAiRunning] = useState(false);
  const [aiLog, setAiLog] = useState([]);
  const [filters, setFilters] = useState({ date: 'all', league: 'all', teamType: 'all', status: 'all' });
  const [matches, setMatches] = useState(rawMatches);

  const handleLogin = useCallback((user) => {
    localStorage.setItem(LS_USER_KEY, JSON.stringify(user));
    setCurrentUser(user);
    setActiveView(getDefaultView(user.role));
  }, []);

  const handleLogout = useCallback(() => {
    localStorage.removeItem(LS_USER_KEY);
    setCurrentUser(null);
    setActiveView('dashboard');
  }, []);

  const runAI = useCallback(async () => {
    setAiRunning(true);
    setAiLog([]);

    const steps = [
      `Analyzing ${matches.length} matches across 4 tournament days...`,
      `Loading ${initialReferees.length} Estoril referee profiles and badge levels...`,
      'Computing availability windows and time conflicts...',
      'Applying experience-to-match-level scoring...',
      'Prioritizing finals and semi-finals...',
      'Balancing workload distribution...',
      'Checking for double-booking conflicts...',
      'Generating assignment proposals...',
    ];

    for (let i = 0; i < steps.length; i++) {
      await new Promise(r => setTimeout(r, 400));
      setAiLog(prev => [...prev, { text: steps[i], done: false }]);
    }

    const newAssignments = generateAIAssignments(matches, initialReferees, assignments);

    await new Promise(r => setTimeout(r, 300));
    setAiLog(prev => prev.map(l => ({ ...l, done: true })));

    const proposed = Object.keys(newAssignments)
      .filter(id => !assignments[id])
      .map(id => parseInt(id));

    setPendingValidation(prev => [...new Set([...prev, ...proposed])]);
    setAssignments(newAssignments);

    await new Promise(r => setTimeout(r, 500));
    setAiRunning(false);
    setActiveView('validation');
  }, [assignments, matches]);

  const approveMatch = useCallback((matchId) => {
    setAssignments(prev => ({
      ...prev,
      [matchId]: { ...prev[matchId], status: 'approved' }
    }));
    setPendingValidation(prev => prev.filter(id => id !== matchId));
  }, []);

  const rejectMatch = useCallback((matchId) => {
    setAssignments(prev => {
      const next = { ...prev };
      delete next[matchId];
      return next;
    });
    setPendingValidation(prev => prev.filter(id => id !== matchId));
  }, []);

  const approveAll = useCallback(() => {
    setAssignments(prev => {
      const next = { ...prev };
      pendingValidation.forEach(id => {
        if (next[id]) next[id] = { ...next[id], status: 'approved' };
      });
      return next;
    });
    setPendingValidation([]);
  }, [pendingValidation]);

  const updateAssignment = useCallback((matchId, field, refId) => {
    setAssignments(prev => ({
      ...prev,
      [matchId]: { ...prev[matchId], [field]: refId, status: prev[matchId]?.status || 'manual' }
    }));
  }, []);

  const handleImportMatches = useCallback((newMatches) => {
    setMatches(newMatches);
    setAssignments({});
    setPendingValidation([]);
  }, []);

  const stats = {
    total: matches.length,
    assigned: Object.keys(assignments).filter(id => assignments[id]?.referee).length,
    approved: Object.keys(assignments).filter(id => assignments[id]?.status === 'approved').length,
    pending: pendingValidation.length,
  };

  if (!currentUser) {
    return <LoginScreen onLogin={handleLogin} />;
  }

  const role = currentUser.role;

  return (
    <div style={{ display: 'flex', height: '100vh', background: '#0f1117', color: '#e2e8f0', overflow: 'hidden' }}>
      <Sidebar activeView={activeView} setActiveView={setActiveView} stats={stats} currentUser={currentUser} />
      <div style={{ flex: 1, display: 'flex', flexDirection: 'column', overflow: 'hidden' }}>
        {/* Top bar with logout */}
        <div style={{
          display: 'flex', alignItems: 'center', justifyContent: 'flex-end',
          padding: '8px 20px', borderBottom: '1px solid #1e2235',
          background: '#13151f', flexShrink: 0, gap: 12,
        }}>
          <span style={{ fontSize: 12, color: '#64748b' }}>
            Signed in as <strong style={{ color: '#94a3b8' }}>{currentUser.name}</strong>
          </span>
          <button
            onClick={handleLogout}
            style={{
              padding: '5px 14px', background: 'rgba(239,68,68,0.1)',
              border: '1px solid rgba(239,68,68,0.3)', borderRadius: 6,
              color: '#f87171', fontSize: 12, fontWeight: 600, cursor: 'pointer',
            }}
          >
            Logout
          </button>
        </div>

        {role === 'admin' && (
          <AIStatusBar aiRunning={aiRunning} aiLog={aiLog} onRunAI={runAI} stats={stats} refereeCount={initialReferees.length} />
        )}

        <main style={{ flex: 1, overflow: 'auto', padding: '24px' }}>
          {/* Referee role: simple read-only view */}
          {role === 'referee' && (
            <div style={{
              display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center',
              height: '60%', gap: 16,
            }}>
              <div style={{ fontSize: 48 }}>📋</div>
              <h2 style={{ fontSize: 20, fontWeight: 700, color: '#f1f5f9', margin: 0 }}>My Assignments</h2>
              <p style={{ color: '#64748b', fontSize: 14 }}>Your assignments will appear here</p>
            </div>
          )}

          {role !== 'referee' && (
            <>
              {activeView === 'dashboard' && role === 'admin' && (
                <Dashboard
                  matches={matches}
                  assignments={assignments}
                  referees={initialReferees}
                  stats={stats}
                  onRunAI={runAI}
                  aiRunning={aiRunning}
                  setActiveView={setActiveView}
                />
              )}
              {activeView === 'matches' && role === 'admin' && (
                <MatchTable
                  matches={matches}
                  assignments={assignments}
                  referees={initialReferees}
                  filters={filters}
                  setFilters={setFilters}
                  onUpdate={updateAssignment}
                  pendingValidation={pendingValidation}
                  onImportMatches={handleImportMatches}
                />
              )}
              {activeView === 'referees' && (
                <RefereePanel
                  referees={initialReferees}
                  matches={matches}
                  assignments={assignments}
                />
              )}
              {activeView === 'validation' && role === 'admin' && (
                <ValidationQueue
                  matches={matches}
                  assignments={assignments}
                  referees={initialReferees}
                  pending={pendingValidation}
                  onApprove={approveMatch}
                  onReject={rejectMatch}
                  onApproveAll={approveAll}
                />
              )}
              {activeView === 'evaluations' && (
                <EvaluationForm
                  referees={initialReferees}
                  matches={matches}
                  currentUser={currentUser}
                />
              )}
              {activeView === 'merittable' && (
                <MeritTable
                  referees={initialReferees}
                />
              )}
            </>
          )}
        </main>
      </div>
    </div>
  );
}
