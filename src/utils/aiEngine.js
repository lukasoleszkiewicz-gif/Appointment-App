// AI Referee Assignment Engine
// Simulates intelligent agentic assignment with real constraints

const MATCH_DURATION_BUFFER = 30; // minutes buffer between assignments

function parseTime(timeStr) {
  const [h, m] = timeStr.split(':').map(Number);
  return h * 60 + m;
}

function hasTimeConflict(match1, match2) {
  const start1 = parseTime(match1.time);
  const end1 = start1 + (match1.length || 70) + MATCH_DURATION_BUFFER;
  const start2 = parseTime(match2.time);
  const end2 = start2 + (match2.length || 70) + MATCH_DURATION_BUFFER;
  return match1.date === match2.date && start1 < end2 && start2 < end1;
}

function getRefereeExperienceScore(referee, match) {
  // Senior matches (U17+, PRIME, FINAL, Semifinal) prefer older/higher-badge refs
  const isSeniorMatch = match.teamType.includes('U17') || match.teamType.includes('U19') ||
    match.teamType.includes('PRIME') || match.teamType.includes('FINAL') ||
    match.teamType.includes('Semifinal');
  const isFinalMatch = match.teamType.includes('FINAL');

  const badgeScore = { 'FIFA': 4, 'National': 3, 'Regional': 2, 'Youth': 1 };
  const badge = badgeScore[referee.badge] || 1;
  const ageScore = Math.min(referee.age / 50, 1);

  if (isFinalMatch) return badge * 2 + ageScore;
  if (isSeniorMatch) return badge * 1.5 + ageScore;
  return badge + ageScore;
}

function getWorkloadScore(referee) {
  // Prefer evenly distributed workload
  return -referee.assignedCount;
}

function calculateFitScore(referee, match, assignments, allMatches) {
  // Check for time conflicts with already assigned matches
  const refAssignments = allMatches.filter(m =>
    assignments[m.id]?.referee === referee.id ||
    assignments[m.id]?.ar1 === referee.id ||
    assignments[m.id]?.ar2 === referee.id
  );

  for (const assigned of refAssignments) {
    if (hasTimeConflict(match, assigned)) return -Infinity;
  }

  const experienceScore = getRefereeExperienceScore(referee, match);
  const workloadScore = getWorkloadScore(referee);
  const randomness = Math.random() * 0.3; // slight randomness for realism

  return experienceScore * 3 + workloadScore * 2 + randomness;
}

export function generateAIAssignments(matches, referees, existingAssignments = {}) {
  const assignments = { ...existingAssignments };
  const refList = referees.map(r => ({ ...r, assignedCount: 0 }));

  // Count existing assignments
  Object.values(assignments).forEach(a => {
    if (a.referee) { const r = refList.find(r => r.id === a.referee); if (r) r.assignedCount++; }
    if (a.ar1) { const r = refList.find(r => r.id === a.ar1); if (r) r.assignedCount++; }
    if (a.ar2) { const r = refList.find(r => r.id === a.ar2); if (r) r.assignedCount++; }
  });

  // Sort: finals and semis first, then by date/time
  const priority = ['FINAL', 'Semifinal', 'PRIME', 'U19', 'U17', 'U16', 'U15', 'U14', 'U13'];
  const sortedMatches = [...matches].filter(m => !assignments[m.id]?.referee).sort((a, b) => {
    const aPriority = priority.findIndex(p => a.teamType.includes(p));
    const bPriority = priority.findIndex(p => b.teamType.includes(p));
    return aPriority - bPriority;
  });

  for (const match of sortedMatches) {
    const isSenior = match.teamType.includes('U17') || match.teamType.includes('U19') ||
      match.teamType.includes('PRIME') || match.teamType.includes('FINAL');
    const needsAR = match.length >= 70 && isSenior;

    // Pick best referee
    let candidates = [...refList];

    // Finals require FIFA or National badge
    if (match.teamType.includes('FINAL')) {
      const elite = candidates.filter(r => r.badge === 'FIFA' || r.badge === 'National');
      if (elite.length > 0) candidates = elite;
    }

    candidates.sort((a, b) =>
      calculateFitScore(b, match, assignments, matches) -
      calculateFitScore(a, match, assignments, matches)
    );

    const mainRef = candidates[0];
    if (!mainRef || calculateFitScore(mainRef, match, assignments, matches) === -Infinity) continue;

    assignments[match.id] = { referee: mainRef.id, status: 'ai-proposed' };
    mainRef.assignedCount++;

    if (needsAR) {
      const remaining = candidates.slice(1).filter(r =>
        calculateFitScore(r, match, { ...assignments, [match.id]: assignments[match.id] }, matches) !== -Infinity
      );

      if (remaining[0]) {
        assignments[match.id].ar1 = remaining[0].id;
        remaining[0].assignedCount++;
      }
      if (remaining[1]) {
        assignments[match.id].ar2 = remaining[1].id;
        remaining[1].assignedCount++;
      }
    }
  }

  return assignments;
}

export function generateAIReasonings(match, assignments, referees) {
  const a = assignments[match.id];
  if (!a) return null;

  const ref = referees.find(r => r.id === a.referee);
  if (!ref) return null;

  const reasons = [];
  const isFinal = match.teamType.includes('FINAL');
  const isSemi = match.teamType.includes('Semifinal');
  const isSenior = match.teamType.includes('U17') || match.teamType.includes('U19');

  if (isFinal) reasons.push(`${ref.name} selected for final based on ${ref.badge} badge and ${ref.age} years experience`);
  else if (isSemi) reasons.push(`Semi-final priority: ${ref.name} (${ref.badge}) ensures high-level officiating`);
  else reasons.push(`${ref.name} assigned based on workload balance and match-level suitability`);

  if (isSenior) reasons.push(`Senior category (${match.teamType}) requires qualified assistant referees`);
  if (a.ar1 || a.ar2) reasons.push(`AR roles assigned to avoid time conflicts across ${match.date}`);

  return reasons;
}

export function getConflicts(matchId, matches, assignments, referees) {
  const a = assignments[matchId];
  if (!a) return [];
  const match = matches.find(m => m.id === matchId);
  const conflicts = [];

  const refs = [a.referee, a.ar1, a.ar2].filter(Boolean);
  for (const refId of refs) {
    const ref = referees.find(r => r.id === refId);
    const otherMatches = matches.filter(m => m.id !== matchId && (
      assignments[m.id]?.referee === refId ||
      assignments[m.id]?.ar1 === refId ||
      assignments[m.id]?.ar2 === refId
    ));
    for (const other of otherMatches) {
      if (hasTimeConflict(match, other)) {
        conflicts.push({ referee: ref?.name, conflictMatch: other.game });
      }
    }
  }
  return conflicts;
}
