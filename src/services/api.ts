/**
 * HTTP client for the BreachPoint backend.
 *
 * One function per route, mirroring `breachpoint-backend/src/routes`. Nothing
 * in here knows about the game — it moves JSON and raises `ApiError`. The
 * translation between backend shapes and what the UI renders lives in
 * `services/backend.ts`.
 *
 * Auth is a Bearer token, not a cookie: the token is held in memory and
 * mirrored to localStorage so a refresh doesn't log the player out. It is
 * deliberately not sent cross-origin as a credential, which is why the backend
 * runs CORS without `credentials`.
 */

/** Base URL of the API, e.g. http://localhost:8080. */
export const API_BASE: string = (
  (import.meta.env.VITE_API_BASE_URL as string | undefined) ?? 'http://localhost:8080'
).replace(/\/$/, '');

/** Slug of the event this build plays. Resolved to an id once, at boot. */
export const EVENT_SLUG: string =
  (import.meta.env.VITE_EVENT_SLUG as string | undefined) ?? 'breachpoint-2026-r1';

const TOKEN_KEY = 'breachpoint_token';

let token: string | null = null;
try {
  token = localStorage.getItem(TOKEN_KEY);
} catch {
  /* private mode / storage blocked: session lasts until reload */
}

export const getToken = () => token;

export function setToken(next: string | null) {
  token = next;
  try {
    if (next) localStorage.setItem(TOKEN_KEY, next);
    else localStorage.removeItem(TOKEN_KEY);
  } catch {
    /* in-memory only */
  }
}

/**
 * A non-2xx response. `status` is kept because the UI reacts differently to
 * each: 401 means the token died and the player must log in again, 409 is a
 * legitimate game state ("already on a path"), 403 means the event is closed.
 */
export class ApiError extends Error {
  constructor(
    public status: number,
    message: string,
  ) {
    super(message);
    this.name = 'ApiError';
  }
}

/** Network failure, DNS, CORS — the request never reached the API. */
export class NetworkError extends Error {
  constructor(message: string) {
    super(message);
    this.name = 'NetworkError';
  }
}

async function request<T>(
  method: 'GET' | 'POST' | 'PATCH' | 'DELETE',
  path: string,
  body?: unknown,
): Promise<T> {
  const headers: Record<string, string> = {};
  if (body !== undefined) headers['Content-Type'] = 'application/json';
  if (token) headers['Authorization'] = `Bearer ${token}`;

  let res: Response;
  try {
    res = await fetch(`${API_BASE}${path}`, {
      method,
      headers,
      body: body === undefined ? undefined : JSON.stringify(body),
    });
  } catch {
    throw new NetworkError(
      `Cannot reach the API at ${API_BASE}. Is the backend running?`,
    );
  }

  // 204 and empty bodies are legitimate; don't try to parse them.
  const text = await res.text();
  let payload: unknown = null;
  if (text) {
    try {
      payload = JSON.parse(text);
    } catch {
      payload = null;
    }
  }

  if (!res.ok) {
    const message =
      (payload && typeof payload === 'object' && 'error' in payload
        ? String((payload as { error: unknown }).error)
        : null) ?? `Request failed (${res.status})`;
    // An expired or revoked token can't be recovered from by retrying; drop it
    // so the app falls back to the login screen instead of looping on 401s.
    if (res.status === 401) setToken(null);
    throw new ApiError(res.status, message);
  }

  return payload as T;
}

const get = <T>(path: string) => request<T>('GET', path);
const post = <T>(path: string, body?: unknown) => request<T>('POST', path, body ?? {});
const patch = <T>(path: string, body: unknown) => request<T>('PATCH', path, body);
const del = <T = void>(path: string) => request<T>('DELETE', path);

// ---------------------------------------------------------------- types ----

export interface AuthUser {
  id: string;
  username: string;
  isAdmin: boolean;
}

export interface AuthResponse {
  token: string;
  user: AuthUser;
}

export interface ApiEvent {
  id: string;
  name: string;
  slug: string;
  description: string | null;
  startsAt: string | null;
  endsAt: string | null;
  isPublished: boolean;
  isFrozen: boolean;
}

export interface ApiTeamMember {
  userId: string;
  username: string;
  role: 'captain' | 'member';
}

export interface ApiTeam {
  id: string;
  name: string;
  joinCode: string;
  eventId: string;
  myRole?: 'captain' | 'member';
  members?: ApiTeamMember[];
}

export type ChallengeStatus = 'solved' | 'skipped' | 'open';

export interface ApiBoardChallenge {
  id: string;
  title: string;
  description: string;
  categoryId: number;
  difficulty: 'easy' | 'medium' | 'hard' | 'expert';
  initialPoints: number;
  minPoints: number;
  /** What a solve pays right now, after decay, before the path multiplier. */
  currentPoints: number;
  /** Teams that have already solved it — what drove the decay. */
  solves: number;
  maxAttempts: number | null;
  author: string | null;
  sequence: number;
  tier: 'past' | 'present' | 'future';
  isPathFinal: boolean;
  status: ChallengeStatus;
  preStory: string;
  /** Withheld by the server until the challenge is solved. */
  postStory: string | null;
}

export interface ApiStandaloneChallenge {
  id: string;
  title: string;
  description: string;
  categoryId: number;
  difficulty: 'easy' | 'medium' | 'hard' | 'expert';
  initialPoints: number;
  minPoints: number;
  currentPoints: number;
  solves: number;
  maxAttempts: number | null;
  author: string | null;
  status: ChallengeStatus;
  /**
   * True for the convergence final (gated on all three fragments), false for
   * the welcome gate. Derived server-side from the prerequisite graph.
   */
  isFinal: boolean;
}

export interface ApiBoardPath {
  id: string;
  code: string;
  name: string;
  delivers: 'who' | 'how' | 'why';
  introNarration: string;
  isActive: boolean;
  isAttempted: boolean;
  isAvailable: boolean;
  rewardMultiplier: string | null;
  entryReason: string | null;
  solved: number;
  skipped: number;
  total: number;
  points: number;
}

export interface ApiActivePath {
  id: string;
  code: string;
  name: string;
  delivers: 'who' | 'how' | 'why';
  introNarration: string;
  rewardMultiplier: string;
  entryReason: string;
  solved: number;
  total: number;
}

export interface ApiTimeGlitch {
  active: { id: string; label: string | null; endsAt: string } | null;
  next: { id: string; label: string | null; startsAt: string; endsAt: string } | null;
}

/** What a team closed on a path, by sequence — including paths it has left. */
export interface ApiPathHistory {
  pathId: string;
  code: string;
  solved: number[];
  skipped: number[];
}

export interface ApiBoard {
  team: { id: string; name: string };
  score: number;
  rank: number | null;
  solveCount: number;
  pathScores: { A: number; B: number; C: number; standalone: number };
  paths: ApiBoardPath[];
  path: ApiActivePath | null;
  challenges: ApiBoardChallenge[];
  history: ApiPathHistory[];
  standalone: ApiStandaloneChallenge[];
  skips: { used: number; remaining: number; quota: number };
  fragments: ('who' | 'how' | 'why')[];
  timeGlitch: ApiTimeGlitch;
}

export interface ApiSubmitResult {
  verdict: 'correct' | 'incorrect' | 'duplicate' | 'rate_limited';
  message: string;
  basePoints?: number;
  multiplier?: string;
  pointsAwarded?: number;
  solveOrder?: number;
  firstBlood?: boolean;
  timeGlitch?: { id: string; label: string | null } | null;
  postStory?: string | null;
  fragment?: 'who' | 'how' | 'why' | null;
  revealed?: string[];
}

export interface ApiSkipResult {
  skipped: string;
  skipsUsed: number;
  skipsRemaining: number;
  rewardMultiplier: string;
  revealed: string[];
  message: string;
}

export interface ApiHint {
  id: string;
  challengeId: string;
  cost: number;
  sortOrder: number;
  requiresHintId: string | null;
  isUnlocked: boolean;
  /** Null until this team has paid for it. */
  body: string | null;
}

export interface ApiScoreboardEntry {
  teamId: string;
  displayName: string;
  isSolo: boolean;
  score: number | string;
  solveCount: number;
  lastSolveAt: string | null;
  rank: number;
}

export interface ApiScoreboard {
  frozen: boolean;
  frozenAt: string | null;
  entries: ApiScoreboardEntry[];
}

export interface ApiPathList {
  welcomeSolved: boolean;
  canSelect: boolean;
  paths: {
    id: string;
    code: string;
    name: string;
    delivers: 'who' | 'how' | 'why';
    introNarration: string;
    isActive: boolean;
    isAvailable: boolean;
    rewardMultiplier: string | null;
  }[];
}

export interface ApiSwitchResult {
  path: { id: string; code: string; name: string };
  free: boolean;
  solvesInPreviousPath: number;
  message: string;
}

// --------------------------------------------------------- admin types ----

export interface AdminChallenge {
  id: string;
  title: string;
  description: string;
  categoryId: number;
  difficulty: 'easy' | 'medium' | 'hard' | 'expert';
  initialPoints: number;
  minPoints: number;
  decayThreshold: number | null;
  decayType: 'logarithmic' | 'linear' | 'static';
  state: 'hidden' | 'visible' | 'locked';
  maxAttempts: number | null;
  author: string | null;
}

export interface AdminHint {
  id: string;
  challengeId: string;
  body: string;
  cost: number;
  sortOrder: number;
  requiresHintId: string | null;
}

export interface AdminTimeGlitch {
  id: string;
  label: string | null;
  startsAt: string;
  endsAt: string;
}

export interface CreateChallengeBody {
  title: string;
  description: string;
  categoryId: number;
  difficulty: 'easy' | 'medium' | 'hard' | 'expert';
  initialPoints: number;
  minPoints: number;
  decayThreshold?: number;
  decayType?: 'logarithmic' | 'linear' | 'static';
  flag: string;
  maxAttempts?: number;
  author?: string;
}

export interface PatchChallengeBody {
  title?: string;
  description?: string;
  categoryId?: number;
  difficulty?: 'easy' | 'medium' | 'hard' | 'expert';
  initialPoints?: number;
  minPoints?: number;
  decayThreshold?: number;
  decayType?: 'logarithmic' | 'linear' | 'static';
  flag?: string;
  state?: 'hidden' | 'visible' | 'locked';
  maxAttempts?: number | null;
  author?: string;
}

// ------------------------------------------------------------ endpoints ----

export const api = {
  // auth
  signup: (username: string, email: string, password: string) =>
    post<AuthResponse>('/auth/signup', { username, email, password }),
  login: (email: string, password: string) =>
    post<AuthResponse>('/auth/login', { email, password }),
  me: () => get<AuthUser>('/auth/me'),

  // events
  listEvents: () => get<ApiEvent[]>('/events'),

  // categories — names for the ids the board sends
  listCategories: () => get<{ id: number; name: string }[]>('/categories'),

  // teams
  createTeam: (eventId: string, name: string) =>
    post<ApiTeam>(`/events/${eventId}/teams`, { name }),
  joinTeam: (eventId: string, name: string, joinCode: string) =>
    post<ApiTeam>(`/events/${eventId}/teams/join`, { name, joinCode }),
  myTeam: (eventId: string) => get<ApiTeam>(`/events/${eventId}/teams/me`),

  // the event page, in one call
  board: (eventId: string) => get<ApiBoard>(`/events/${eventId}/board`),

  // paths
  listPaths: (eventId: string) => get<ApiPathList>(`/events/${eventId}/paths`),
  selectPath: (eventId: string, pathId: string) =>
    post<unknown>(`/events/${eventId}/paths/select`, { pathId }),
  switchPath: (eventId: string, pathId: string) =>
    post<ApiSwitchResult>(`/events/${eventId}/paths/switch`, { pathId }),

  // play
  submitFlag: (eventId: string, challengeId: string, flag: string) =>
    post<ApiSubmitResult>(`/events/${eventId}/challenges/${challengeId}/submit`, { flag }),
  skipChallenge: (eventId: string, challengeId: string) =>
    post<ApiSkipResult>(`/events/${eventId}/skips`, { challengeId }),

  // hints
  listHints: (eventId: string, challengeId: string) =>
    get<ApiHint[]>(`/events/${eventId}/challenges/${challengeId}/hints`),
  unlockHint: (eventId: string, challengeId: string, hintId: string) =>
    post<ApiHint>(`/events/${eventId}/challenges/${challengeId}/hints/${hintId}/unlock`),

  // board
  scoreboard: (eventId: string) => get<ApiScoreboard>(`/events/${eventId}/scoreboard`),
  timeGlitch: (eventId: string) => get<ApiTimeGlitch>(`/events/${eventId}/time-glitch`),

  // ---- admin ----

  // events
  adminCreateEvent: (body: { name: string; slug?: string; description?: string; startsAt?: string; endsAt?: string }) =>
    post<ApiEvent>('/admin/events', body),
  adminPatchEvent: (eventId: string, body: { name?: string; description?: string; startsAt?: string | null; endsAt?: string | null; isPublished?: boolean; isFrozen?: boolean }) =>
    patch<ApiEvent>(`/admin/events/${eventId}`, body),

  // categories
  adminCreateCategory: (name: string) =>
    post<{ id: number; name: string }>('/admin/categories', { name }),
  adminDeleteCategory: (id: number) =>
    del(`/admin/categories/${id}`),

  // challenges
  adminListChallenges: (eventId: string) =>
    get<AdminChallenge[]>(`/admin/events/${eventId}/challenges`),
  adminCreateChallenge: (eventId: string, body: CreateChallengeBody) =>
    post<AdminChallenge>(`/admin/events/${eventId}/challenges`, body),
  adminPatchChallenge: (eventId: string, challengeId: string, body: PatchChallengeBody) =>
    patch<AdminChallenge>(`/admin/events/${eventId}/challenges/${challengeId}`, body),

  // hints
  adminListHints: (eventId: string, challengeId: string) =>
    get<AdminHint[]>(`/admin/events/${eventId}/challenges/${challengeId}/hints`),
  adminCreateHint: (eventId: string, challengeId: string, body: { body: string; cost?: number; sortOrder?: number; requiresHintId?: string }) =>
    post<AdminHint>(`/admin/events/${eventId}/challenges/${challengeId}/hints`, body),
  adminDeleteHint: (eventId: string, challengeId: string, hintId: string) =>
    del(`/admin/events/${eventId}/challenges/${challengeId}/hints/${hintId}`),

  // time glitches
  adminListGlitches: (eventId: string) =>
    get<AdminTimeGlitch[]>(`/admin/events/${eventId}/time-glitches`),
  adminCreateGlitch: (eventId: string, body: { label?: string; startsAt: string; endsAt: string }) =>
    post<AdminTimeGlitch>(`/admin/events/${eventId}/time-glitches`, body),
  adminGenerateGlitches: (eventId: string, body: { everyMinutes?: number; durationMinutes?: number; firstAt?: string }) =>
    post<AdminTimeGlitch[]>(`/admin/events/${eventId}/time-glitches/generate`, body),
  adminDeleteGlitch: (eventId: string, glitchId: string) =>
    del(`/admin/events/${eventId}/time-glitches/${glitchId}`),
};
