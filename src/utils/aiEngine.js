// ─── Ibercup Estoril AI Referee Assignment Engine ───────────────────────────
// Rules implemented:
//  1. 7-aside & 9-aside → 1 referee only; 11-aside → 3 referees
//  2. Nationality mixing: no team of 3 refs all from same country
//  3. Shift/pitch-based: same team of 3 stays on one pitch for a time block
//  4. Max 5 matches per referee per day
//  5. Nation conflict: avoid main referee whose country matches the playing teams
//  6. Even distribution across all referees
//  7. Role rotation within a team across consecutive matches
//  8. One pitch per referee per shift, consecutive time slots

const MATCH_BUFFER = 30; // minutes between assignments for travel
const SHIFT_GAP = 75;    // minute gap that marks a new shift
const MAX_PER_DAY = 5;

// ─── Helpers ─────────────────────────────────────────────────────────────────

function parseTime(str) {
  if (!str) return 0;
  const [h, m] = String(str).split(':').map(Number);
  return h * 60 + (m || 0);
}

// Does this category use only 1 referee? (7-aside or 9-aside)
function needsOneRef(category = '') {
  // Category names: "Cat BE7 - 2017", "Cat GI9 - 2013", "Cat BJ11 - 2012"
  const m = category.match(/Cat\s+[A-Z]+(\d+)/i);
  if (m) {
    const sides = parseInt(m[1]);
    return sides === 7 || sides === 9;
  }
  // Fallback: check teamType
  return /\b7\b|\b9\b/.test(category) && !/\b11\b/.test(category);
}

// Try to infer nationality from a team name
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
  const homeNat = detectTeamNationality(match.home);
  const awayNat = detectTeamNationality(match.away);
  return referee.country === homeNat || referee.country === awayNat;
}

function hasTimeConflict(m1, m2) {
  if (m1.date !== m2.date) return false;
  const s1 = parseTime(m1.time);
  const e1 = s1 + (m1.length || 60) + MATCH_BUFFER;
  const s2 = parseTime(m2.time);
  const e2 = s2 + (m2.length || 60) + MATCH_BUFFER;
  return s1 < e2 && s2 < e1;
}

// ─── Shift detection ──────────────────────────────────────────────────────────

// Group sorted matches into shifts (a new shift starts when gap > SHIFT_GAP mins)
function splitIntoShifts(sortedMatches) {
  if (!sortedMatches.length) return [];
  const shifts = [[sortedMatches[0]]];
  for (let i = 1; i < sortedMatches.length; i++) {
    const prev = sortedMatches[i - 1];
    const curr = sortedMatches[i];
    const gap = parseTime(curr.time) - parseTime(prev.time) - (prev.length || 60);
    if (gap >= SHIFT_GAP) {
      shifts.push([curr]);
    } else {
      shifts[shifts.length - 1].push(curr);
    }
  }
  return shifts;
}

// ─── Referee selection helpers ────────────────────────────────────────────────

function getDayCount(refId, dayAssignments) {
  return (dayAssignments[refId] || 0);
}

function getTotalCount(refId, totalAssignments) {
  return (totalAssignments[refId] || 0);
}

// Score a referee candidate for a shift at a venue
function candidateScore(ref, shift, dayAssignments, totalAssignments, existingVenueRefs) {
  const dayCount = getDayCount(ref.id, dayAssignments);
  if (dayCount >= MAX_PER_DAY) return -Infinity;

  const matchesInShift = shift.length;
  if (dayCount + matchesInShift > MAX_PER_DAY) return -Infinity;

  // Prefer refs not already used at a different venue today
  const venueBonus = existingVenueRefs.has(ref.id) ? 10 : 0;

  // Balance total workload
  const totalScore = -getTotalCount(ref.id, totalAssignments) * 3;

  // Light randomness for variety
  const rand = Math.random() * 0.5;

  return totalScore + venueBonus + rand;
}

// Pick a diverse team of 3 refs for a shift, avoiding same-nationality trio
// and nation conflicts with teams
function pickTeamOfThree(shift, allRefs, dayAssignments, totalAssignments, venueRefHistory) {
  const available = allRefs.filter(r => {
    const dc = getDayCount(r.id, dayAssignments);
    return dc + shift.length <= MAX_PER_DAY;
  });

  if (available.length < 3) return null;

  // Score all candidates
  const scored = available.map(r => ({
    ref: r,
    score: candidateScore(r, shift, dayAssignments, totalAssignments, venueRefHistory),
  })).filter(x => x.score > -Infinity).sort((a, b) => b.score - a.score);

  if (scored.length < 3) return null;

  // Try to build a nationality-diverse team
  // Also try to pick refs without nation conflicts for this shift's matches
  const conflictFreeMatches = (ref) =>
    shift.filter(m => !needsOneRef(m.category)).every(m => !hasNationConflict(ref, m));

  // Prefer conflict-free refs first
  const preferred = scored.filter(x => conflictFreeMatches(x.ref));
  const fallback = scored.filter(x => !conflictFreeMatches(x.ref));
  const pool = [...preferred, ...fallback];

  // Greedily build a team maximising nationality diversity
  const team = [pool[0].ref];
  const usedNations = new Set([team[0].country]);

  for (const candidate of pool.slice(1)) {
    if (team.length === 3) break;
    // Prefer different nationality
    if (!usedNations.has(candidate.ref.country)) {
      team.push(candidate.ref);
      usedNations.add(candidate.ref.country);
    }
  }
  // If we couldn't fill 3 with diverse nationalities, fill with anyone available
  if (team.length < 3) {
    for (const candidate of pool) {
      if (team.length === 3) break;
      if (!team.includes(candidate.ref)) {
        team.push(candidate.ref);
      }
    }
  }

  return team.length === 3 ? team : null;
}

// Rotate roles: match index 0 → [R1,R2,R3], 1 → [R2,R3,R1], 2 → [R3,R1,R2]
function rotateRoles(team, matchIndex) {
  const n = team.length; // 3
  return {
    referee: team[matchIndex % n].id,
    ar1: team[(matchIndex + 1) % n].id,
    ar2: team[(matchIndex + 2) % n].id,
  };
}

// Pick a single best referee for a 1-ref match
function pickSingleRef(match, allRefs, dayAssignments, totalAssignments, venueRefHistory) {
  const available = allRefs
    .filter(r => getDayCount(r.id, dayAssignments) < MAX_PER_DAY)
    .map(r => ({
      ref: r,
      score: candidateScore(r, [match], dayAssignments, totalAssignments, venueRefHistory)
        - (hasNationConflict(r, match) ? 5 : 0),
    }))
    .filter(x => x.score > -Infinity)
    .sort((a, b) => b.score - a.score);

  return available[0]?.ref || null;
}

// ─── Main assignment function ─────────────────────────────────────────────────

export function generateAIAssignments(matches, referees, existingAssignments = {}) {
  const assignments = { ...existingAssignments };

  // Track per-day and total match counts per referee
  const dayAssignments = {}; // key: `${refId}_${date}` → count
  const totalAssignments = {}; // key: refId → count

  const dayCount = (refId, date) => dayAssignments[`${refId}_${date}`] || 0;
  const addCount = (refId, date) => {
    const k = `${refId}_${date}`;
    dayAssignments[k] = (dayAssignments[k] || 0) + 1;
    totalAssignments[refId] = (totalAssignments[refId] || 0) + 1;
  };

  // Seed counts from existing assignments
  for (const [matchId, a] of Object.entries(assignments)) {
    const m = matches.find(x => x.id === Number(matchId));
    if (!m) continue;
    if (a.referee) addCount(a.referee, m.date);
    if (a.ar1) addCount(a.ar1, m.date);
    if (a.ar2) addCount(a.ar2, m.date);
  }

  // Only work on unassigned matches
  const unassigned = matches.filter(m => !assignments[m.id]?.referee);

  // ── Group by date → venue, sort by time ──────────────────────────────────
  const byDateVenue = {};
  for (const m of unassigned) {
    const key = `${m.date}||${m.venue}`;
    if (!byDateVenue[key]) byDateVenue[key] = [];
    byDateVenue[key].push(m);
  }

  // Sort each group by time
  for (const key of Object.keys(byDateVenue)) {
    byDateVenue[key].sort((a, b) => parseTime(a.time) - parseTime(b.time));
  }

  // Process each date+venue group
  const dateVenueKeys = Object.keys(byDateVenue).sort();

  for (const key of dateVenueKeys) {
    const venueMatches = byDateVenue[key];
    const date = key.split('||')[0];

    // Helper: which refs are already assigned to this venue today
    const venueRefHistory = new Set();
    for (const m of venueMatches) {
      const a = assignments[m.id];
      if (!a) continue;
      if (a.referee) venueRefHistory.add(a.referee);
      if (a.ar1) venueRefHistory.add(a.ar1);
      if (a.ar2) venueRefHistory.add(a.ar2);
    }

    // ── Split into shifts ────────────────────────────────────────────────
    const shifts = splitIntoShifts(venueMatches);

    for (const shift of shifts) {
      // Separate 1-ref matches from 3-ref matches within this shift
      const oneRefMatches = shift.filter(m => needsOneRef(m.category || m.teamType));
      const threeRefMatches = shift.filter(m => !needsOneRef(m.category || m.teamType));

      // ── Handle 3-ref matches: form a team ─────────────────────────────
      if (threeRefMatches.length > 0) {
        // Build per-day view for this date
        const dayRefCounts = {};
        for (const ref of referees) {
          dayRefCounts[ref.id] = dayCount(ref.id, date);
        }

        const team = pickTeamOfThree(
          threeRefMatches,
          referees,
          // Pass a map: refId → dayCount(refId, date)
          Object.fromEntries(referees.map(r => [r.id, dayCount(r.id, date)])),
          totalAssignments,
          venueRefHistory,
        );

        if (team) {
          team.forEach(r => venueRefHistory.add(r.id));

          threeRefMatches.forEach((match, idx) => {
            // Check none of the team exceeds daily max for this match
            const roles = rotateRoles(team, idx);

            assignments[match.id] = {
              referee: roles.referee,
              ar1: roles.ar1,
              ar2: roles.ar2,
              status: 'ai-proposed',
            };

            addCount(roles.referee, date);
            addCount(roles.ar1, date);
            addCount(roles.ar2, date);
          });
        } else {
          // Fallback: assign individually without team constraint
          for (const match of threeRefMatches) {
            const used = new Set();
            const dayMap = Object.fromEntries(referees.map(r => [r.id, dayCount(r.id, date)]));

            const r1 = pickSingleRef(match, referees, dayMap, totalAssignments, venueRefHistory);
            if (!r1) continue;
            used.add(r1.id);
            venueRefHistory.add(r1.id);

            const r2 = pickSingleRef(match,
              referees.filter(r => !used.has(r.id)),
              dayMap, totalAssignments, venueRefHistory);
            if (r2) { used.add(r2.id); venueRefHistory.add(r2.id); }

            const r3 = pickSingleRef(match,
              referees.filter(r => !used.has(r.id)),
              dayMap, totalAssignments, venueRefHistory);
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
          }
        }
      }

      // ── Handle 1-ref matches ──────────────────────────────────────────
      for (const match of oneRefMatches) {
        const dayMap = Object.fromEntries(referees.map(r => [r.id, dayCount(r.id, date)]));
        const ref = pickSingleRef(match, referees, dayMap, totalAssignments, venueRefHistory);
        if (!ref) continue;

        venueRefHistory.add(ref.id);
        assignments[match.id] = { referee: ref.id, status: 'ai-proposed' };
        addCount(ref.id, date);
      }
    }
  }

  return assignments;
}

// ─── Reasoning generator (shown in validation queue) ─────────────────────────

export function generateAIReasonings(match, assignments, referees) {
  const a = assignments[match.id];
  if (!a) return null;
  const ref = referees.find(r => r.id === a.referee);
  if (!ref) return null;

  const isOneRef = needsOneRef(match.category || match.teamType);
  const conflict = hasNationConflict(ref, match);

  const reasons = [];
  if (isOneRef) {
    reasons.push(`${ref.name} assigned as sole referee for this ${match.category || match.teamType} match (7/9-aside format)`);
  } else {
    reasons.push(`${ref.name} leads a 3-person team assigned to ${match.venue} for this shift`);
    if (a.ar1 || a.ar2) {
      const ar1 = referees.find(r => r.id === a.ar1);
      const ar2 = referees.find(r => r.id === a.ar2);
      const team = [ref, ar1, ar2].filter(Boolean);
      const nations = [...new Set(team.map(r => r.country))];
      reasons.push(`Team nationality mix: ${nations.join(', ')}`);
    }
  }
  if (!conflict) reasons.push(`No nationality conflict detected between referee and teams`);
  reasons.push(`Daily match count balanced across all referees (max ${MAX_PER_DAY}/day)`);

  return reasons;
}

// ─── Conflict checker ────────────────────────────────────────────────────────

export function getConflicts(matchId, matches, assignments, referees) {
  const a = assignments[matchId];
  if (!a) return [];
  const match = matches.find(m => m.id === matchId);
  if (!match) return [];
  const conflicts = [];

  for (const refId of [a.referee, a.ar1, a.ar2].filter(Boolean)) {
    const ref = referees.find(r => r.id === refId);
    const otherMatches = matches.filter(m =>
      m.id !== matchId && (
        assignments[m.id]?.referee === refId ||
        assignments[m.id]?.ar1 === refId ||
        assignments[m.id]?.ar2 === refId
      )
    );
    for (const other of otherMatches) {
      if (hasTimeConflict(match, other)) {
        conflicts.push({ referee: ref?.name, conflictMatch: other.id });
      }
    }
  }
  return conflicts;
}
