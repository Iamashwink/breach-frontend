export type DifficultyLevel = 'Easy' | 'Medium' | 'Hard';

const LEVELS: DifficultyLevel[] = ['Easy', 'Medium', 'Hard'];

/** Stable hash so the "randomized for now" difficulty doesn't reshuffle every render. */
function hashString(s: string): number {
  let h = 2166136261;
  for (let i = 0; i < s.length; i++) {
    h ^= s.charCodeAt(i);
    h = Math.imul(h, 16777619);
  }
  return Math.abs(h);
}

/**
 * TEMPORARY (pre-backend): pseudo-random difficulty per challenge id.
 * TODO(backend): delete this and use `challenge.difficulty` from the API
 * (`GET /api/challenges` → `{ id, difficulty: 'Easy'|'Medium'|'Hard', ... }`).
 */
export function getRandomizedDifficulty(challengeId: string): DifficultyLevel {
  return LEVELS[hashString(challengeId) % LEVELS.length];
}

/** Legacy `DIFFICULTY I/II/III` → Easy/Medium/Hard (kept for reference). */
export function legacyToLevel(d: string): DifficultyLevel {
  if (d.includes('III')) return 'Hard';
  if (d.includes('II')) return 'Medium';
  return 'Easy';
}

export const DIFFICULTY_META: Record<DifficultyLevel, { color: string; label: string }> = {
  Easy: { color: '#5ED6E3', label: 'EASY' },
  Medium: { color: '#E0A83E', label: 'MEDIUM' },
  Hard: { color: '#E84D7E', label: 'HARD' },
};
