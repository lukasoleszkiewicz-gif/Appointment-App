// ─── Ibercup Estoril AI Referee Assignment Engine ───────────────────────────
// Rules:
//  1. 7/9-aside → 1 referee only; 11-aside → 3 referees
//  2. Nationality mixing: no trio all from same country
//  3. ONE team per venue-day; role rotation is continuous across all matches
//  4. Max 5 matches per referee per day
//  5. Nation conflict: avoid main ref whose country matches the playing teams
//  6. Even workload distribution

const MATCH_BUFFER = 30;
const MAX_PER_DAY = 5;

function parseTime(str) {
  if (!str) return 0;
  const [h, m] = String(str).split(':').map(Number);
  return h * 60 + (m || 0);
}

export function needsOneRef(category = '') {
  const m = category.match(/Cat\s+[A-Z]+(\d+)/i);
  if (m) {
    const sides = parseInt(m[1]);
    return sides === 7 || sides === 9;
  }
  return /\b7\b|\b9\b/.test(category) && !/\b11\b/.test(category);
}

const NATION_HINTS = {
  Austria: ['austria', 'austrian', 'vienna', 'salzburg', 'tyrol'],
  England: ['england', 'english', 'london', 'manchester', 'arsenal', 'chelsea', 'suffolk'],
  Germany: ['german', 'germany', 'berlin', 'munich', 'münchen', 'frankfurt'],
  France: ['france', 'french', 'paris', 'lyon', 'marseille'],
  Spain: ['spain', 'spanish', 'madrid', 'barcelona', 'espana', 'españa'],
  Italy: ['italy', 'italian', 'roma', 'milan', 'milano', 'inter', 'juventus'],
  Portugal: ['portugal', 'portuguese', 'lisbon', 'porto', 'benfica', 'sporting', 'braga',
             'estoril', 'belenenses', 'carcavelos', 'tires', 'talaíde', 'talaide', 'atlântico',
             'atletico', 'académico', 'academia', 'casa pia', 'estrela'],
  Romania: ['romania', 'romanian', 'bucharest'],
  Denmark: ['denmark', 'danish', 'copenhagen'],
  Sweden: ['sweden', 'swedish', 'stockholm'],
  Wales: ['wales', 'welsh', 'cardiff', 'swansea'],
  USA: ['usa', 'united states', 'american'],
  Canada: ['canada', 'canadian'],
};

function detectTeamNationality(teamName = '') {
  const lower = teamName.toLowerCase();
  for (const [nation, hints] of Object.entries(NATION_HINTS)) {
    if (hints.some(h => lower.includes(h))) return nation;
  }
  return null;
}

function hasNationConflict(referee, match) {
  return referee.country === detectTeamNationality(match.home) ||
         referee.country === detectTeamNationality(match.away);
}

function hasTimeConflict(m1, m2) {
  if (m1.date !== m2.date) return false;
  const s1 = parseTime(m1.time);
  const e1 = s1 + (m1.length || 60) + MATCH_BUFFER;
  const s2 = parseTime(m2.time);
  const e2 = s2 + (m2.length || 60) + MATCH_BUFFER;
  return s1 < e2 && s2 < e1;
}

// Rotate roles continuously: index 0→R/AR1/AR2, 1→AR1/AR2/R, 2→AR2/R/AR1, ...
function rotateRoles(team, matchIndex) {
  const n = team.length;
  return {
    referee: team[matchIndex % n].id,
    ar1:     team[(matchIndex + 1) % n].id,
    ar2:     team[(matchIndex + 2) % n].id,
  };
}

// Score a candidate referee for selection
function scoreCandidate(ref, matchCount, dayCount, totalCount, venueBonus, conflictFree) {
  if (dayCount + matchCount > MAX_PER_DAY) return -Infinity;
  return (
    -totalCount * 3          // even distribution
    + venueBonus * 8         // prefer refs already working this venue
    + (conflictFree ? 5 : 0) // prefer no nation conflict
    + Math.random() * 0.5    // tiebreak variety
  );
}

// Pick a team of 3 for a venue's entire day (all matches assigned to this team, rotated)
function pickVenueDayTeam(matches, allRefs, dayCount, totalAssignments, venueRefHistory) {
  const count = matches.length; // how many matches this team will cover (each member gets `count` assignments)

  const eligible = allRefs.filter(r => {
    const dc = dayCount(r.id);
    return dc + count <= MAX_PER_DAY;
  });

  if (eligible.length < 3) {
    // Relax: allow up to MAX_PER_DAY regardless
    const relaxed = allRefs.filter(r => dayCount(r.id) < MAX_PER_DAY);
    if (relaxed.length < 3) return null;
    return buildDiverseTeam(relaxed, matches, dayCount, totalAssignments, venueRefHistory, count);
  }

  return buildDiverseTeam(eligible, matches, dayCount, totalAssignments, venueRefHistory, count);
}

function buildDiverseTeam(pool, matches, dayCount, totalAssignments, venueRefHistory, matchCount) {
  const scored = pool.map(r => {
    const cf = matches.every(m => !hasNationConflict(r, m));
    return {
      ref: r,
      score: scoreCandidate(
        r, matchCount,
        dayCount(r.id),
        totalAssignments[r.id] || 0,
        venueRefHistory.has(r.id) ? 1 : 0,
        cf,
      ),
    };
  }).filter(x => x.score > -Infinity).sort((a, b) => b.score - a.score);

  if (scored.length < 3) return null;

  // Greedy nationality-diverse team
  const team = [scored[0].ref];
  const nations = new Set([team[0].country]);

  for (const { ref } of scored.slice(1)) {
    if (team.length === 3) break;
    if (!nations.has(ref.country)) {
      team.push(ref);
      nations.add(ref.country);
    }
  }
  if (team.length < 3) {
    for (const { ref } of scored) {
      if (team.length === 3) break;
      if (!team.find(t => t.id === ref.id)) team.push(ref);
    }
  }

  return team.length === 3 ? team : null;
}

function pickSingleRef(match, allRefs, dayCount, totalAssignments, venueRefHistory) {
  const scored = allRefs
    .filter(r => dayCount(r.id) < MAX_PER_DAY)
    .map(r => ({
      ref: r,
      score: scoreCandidate(
        r, 1, dayCount(r.id), totalAssignments[r.id] || 0,
        venueRefHistory.has(r.id) ? 1 : 0,
        !hasNationConflict(r, match),
      ),
    }))
    .filter(x => x.score > -Infinity)
    .sort((a, b) => b.score - a.score);

  return scored[0]?.ref || null;
}

// ─── Main ────────────────────────────────────────────────────────────────────

export function generateAIAssignments(matches, referees, existingAssignments = {}, promptConstraints = {}) {
  const assignments = { ...existingAssignments };

  // Per-day counts: `${refId}_${date}` → count
  const dayCounts = {};
  const totalAssignments = {};

  const dayCount = (refId, date) => dayCounts[`${refId}_${date}`] || 0;
  const addCount = (refId, date) => {
    const k = `${refId}_${date}`;
    dayCounts[k] = (dayCounts[k] || 0) + 1;
    totalAssignments[refId] = (totalAssignments[refId] || 0) + 1;
  };

  // Seed from existing assignments
  for (const [matchId, a] of Object.entries(assignments)) {
    const m = matches.find(x => x.id === Number(matchId));
    if (!m) continue;
    if (a.referee) addCount(a.referee, m.date);
    if (a.ar1)     addCount(a.ar1, m.date);
    if (a.ar2)     addCount(a.ar2, m.date);
  }

  const unassigned = matches.filter(m => !assignments[m.id]?.referee);

  // Group by date+venue, sort by time
  const byDateVenue = {};
  for (const m of unassigned) {
    const key = `${m.date}||${m.venue}`;
    if (!byDateVenue[key]) byDateVenue[key] = [];
    byDateVenue[key].push(m);
  }
  for (const key of Object.keys(byDateVenue)) {
    byDateVenue[key].sort((a, b) => parseTime(a.time) - parseTime(b.time));
  }

  for (const key of Object.keys(byDateVenue).sort()) {
    const venueMatches = byDateVenue[key];
    const date = key.split('||')[0];

    const venueRefHistory = new Set();

    const oneRefMatches   = venueMatches.filter(m => needsOneRef(m.category || m.teamType));
    const threeRefMatches = venueMatches.filter(m => !needsOneRef(m.category || m.teamType));

    // ── 3-ref matches: ONE team per venue-day, continuous role rotation ──────
    if (threeRefMatches.length > 0) {
      // Split into chunks if matches > MAX_PER_DAY (each team member gets chunk.length assignments)
      const chunkSize = MAX_PER_DAY;
      const chunks = [];
      for (let i = 0; i < threeRefMatches.length; i += chunkSize) {
        chunks.push(threeRefMatches.slice(i, i + chunkSize));
      }

      let globalMatchIdx = 0; // continuous across all chunks at this venue

      for (const chunk of chunks) {
        const team = pickVenueDayTeam(
          chunk,
          referees,
          (refId) => dayCount(refId, date),
          totalAssignments,
          venueRefHistory,
        );

        if (team) {
          team.forEach(r => venueRefHistory.add(r.id));

          // Reset rotation to 0 for a new team (new chunk)
          let chunkStartIdx = globalMatchIdx;

          for (let i = 0; i < chunk.length; i++) {
            const match = chunk[i];
            // Use continuous index so rotation doesn't restart mid-venue
            const roles = rotateRoles(team, chunkStartIdx + i);

            assignments[match.id] = {
              referee: roles.referee,
              ar1:     roles.ar1,
              ar2:     roles.ar2,
              status: 'ai-proposed',
            };

            addCount(roles.referee, date);
            addCount(roles.ar1, date);
            addCount(roles.ar2, date);
          }
          globalMatchIdx += chunk.length;
        } else {
          // Fallback: assign individually
          for (const match of chunk) {
            const used = new Set();
            const dc = (refId) => dayCount(refId, date);

            const r1 = pickSingleRef(match, referees, dc, totalAssignments, venueRefHistory);
            if (!r1) { globalMatchIdx++; continue; }
            used.add(r1.id); venueRefHistory.add(r1.id);

            const r2 = pickSingleRef(match, referees.filter(r => !used.has(r.id)), dc, totalAssignments, venueRefHistory);
            if (r2) { used.add(r2.id); venueRefHistory.add(r2.id); }

            const r3 = pickSingleRef(match, referees.filter(r => !used.has(r.id)), dc, totalAssignments, venueRefHistory);
            if (r3) { used.add(r3.id); venueRefHistory.add(r3.id); }

            assignments[match.id] = {
              referee: r1.id,
              ...(r2 ? { ar1: r2.id } : {}),
              ...(r3 ? { ar2: r3.id } : {}),
              status: 'ai-proposed',
            };

            addCount(r1.id, date);
            if (r2) addCount(r2.id, date);
            if (r3) addCount(r3.id, date);
            globalMatchIdx++;
          }
        }
      }
    }

    // ── 1-ref matches ────────────────────────────────────────────────────────
    for (const match of oneRefMatches) {
      const dc = (refId) => dayCount(refId, date);
      const ref = pickSingleRef(match, referees, dc, totalAssignments, venueRefHistory);
      if (!ref) continue;
      venueRefHistory.add(ref.id);
      assignments[match.id] = { referee: ref.id, status: 'ai-proposed' };
      addCount(ref.id, date);
    }
  }

  return assignments;
}

export function generateAIReasonings(match, assignments, referees) {
  const a = assignments[match.id];
  if (!a) return null;
  const ref = referees.find(r => r.id === a.referee);
  if (!ref) return null;
  const isOneRef = needsOneRef(match.category || match.teamType);
  const reasons = [];
  if (isOneRef) {
    reasons.push(`${ref.name} assigned as sole referee (7/9-aside format)`);
  } else {
    reasons.push(`${ref.name} leads a 3-person team rotating roles at ${match.venue}`);
    const ar1 = referees.find(r => r.id === a.ar1);
    const ar2 = referees.find(r => r.id === a.ar2);
    const nations = [...new Set([ref, ar1, ar2].filter(Boolean).map(r => r.country))];
    reasons.push(`Nationality mix: ${nations.join(', ')}`);
  }
  if (!hasNationConflict(ref, match)) reasons.push('No nationality conflict with competing teams');
  reasons.push(`Workload balanced across all referees (max ${MAX_PER_DAY}/day)`);
  return reasons;
}

export function getConflicts(matchId, matches, assignments, referees) {
  const a = assignments[matchId];
  if (!a) return [];
  const match = matches.find(m => m.id === matchId);
  if (!match) return [];
  const conflicts = [];
  for (const refId of [a.referee, a.ar1, a.ar2].filter(Boolean)) {
    const ref = referees.find(r => r.id === refId);
    for (const other of matches) {
      if (other.id === matchId) continue;
      const oa = assignments[other.id];
      if (!oa) continue;
      if (oa.referee === refId || oa.ar1 === refId || oa.ar2 === refId) {
        if (hasTimeConflict(match, other)) conflicts.push({ referee: ref?.name, conflictMatch: other.id });
      }
    }
  }
  return conflicts;
}
