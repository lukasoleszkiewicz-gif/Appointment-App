import { useState, useCallback } from 'react';
import { rawMatches, referees as initialReferees } from './data/matchData';
import { generateAIAssignments } from './utils/aiEngine';
import Sidebar from './components/Sidebar';
import Dashboard from './components/Dashboard';
import MatchTable from './components/MatchTable';
import RefereePanel from './components/RefereePanel';
import ValidationQueue from './components/ValidationQueue';
import AIStatusBar from './components/AIStatusBar';
import './index.css';

export default function App() {
  const [activeView, setActiveView] = useState('dashboard');
  const [assignments, setAssignments] = useState({});
  const [pendingValidation, setPendingValidation] = useState([]);
  const [aiRunning, setAiRunning] = useState(false);
  const [aiLog, setAiLog] = useState([]);
  const [filters, setFilters] = useState({ date: 'all', league: 'all', teamType: 'all', status: 'all' });

  const runAI = useCallback(async () => {
    setAiRunning(true);
    setAiLog([]);

    const steps = [
      'Analyzing 179 matches across 4 tournament days...',
      'Loading 43 referee profiles and badge levels...',
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

    const newAssignments = generateAIAssignments(rawMatches, initialReferees, assignments);

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
  }, [assignments]);

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

  const stats = {
    total: rawMatches.length,
    assigned: Object.keys(assignments).filter(id => assignments[id]?.referee).length,
    approved: Object.keys(assignments).filter(id => assignments[id]?.status === 'approved').length,
    pending: pendingValidation.length,
  };

  return (
    <div style={{ display: 'flex', height: '100vh', background: '#0f1117', color: '#e2e8f0', overflow: 'hidden' }}>
      <Sidebar activeView={activeView} setActiveView={setActiveView} stats={stats} />
      <div style={{ flex: 1, display: 'flex', flexDirection: 'column', overflow: 'hidden' }}>
        <AIStatusBar aiRunning={aiRunning} aiLog={aiLog} onRunAI={runAI} stats={stats} />
        <main style={{ flex: 1, overflow: 'auto', padding: '24px' }}>
          {activeView === 'dashboard' && (
            <Dashboard
              matches={rawMatches}
              assignments={assignments}
              referees={initialReferees}
              stats={stats}
              onRunAI={runAI}
              aiRunning={aiRunning}
              setActiveView={setActiveView}
            />
          )}
          {activeView === 'matches' && (
            <MatchTable
              matches={rawMatches}
              assignments={assignments}
              referees={initialReferees}
              filters={filters}
              setFilters={setFilters}
              onUpdate={updateAssignment}
              pendingValidation={pendingValidation}
            />
          )}
          {activeView === 'referees' && (
            <RefereePanel
              referees={initialReferees}
              matches={rawMatches}
              assignments={assignments}
            />
          )}
          {activeView === 'validation' && (
            <ValidationQueue
              matches={rawMatches}
              assignments={assignments}
              referees={initialReferees}
              pending={pendingValidation}
              onApprove={approveMatch}
              onReject={rejectMatch}
              onApproveAll={approveAll}
            />
          )}
        </main>
      </div>
    </div>
  );
}
