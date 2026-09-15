import React, { createContext, useContext, useState, useEffect, useMemo } from 'react';
import { PathId, ViewType, Challenge } from '../types';
import { CHALLENGES_DATA } from '../data/challengesData';
import { PATHS_DATA } from '../data/pathsData';
import { OPERATIVES, Operative } from '../data/operativesData';
// TODO(backend): swap verifyOperativeSync for await fetchLogin() (POST /api/auth/login).
import { verifyOperativeSync, getRoster } from '../services/backend';
import { postChallengeNarration, PATH_EPILOGUES } from '../data/storyData';
import { calculateUserPoints, getPointsForChallenge } from '../utils/points';
import { viewToHash, parseHash, ParsedRoute } from '../utils/router';
import { soundFx } from '../utils/audio';

export interface ToastNotification {
  id: string;
  type: 'success' | 'error' | 'info';
  title: string;
  message: string;
  points?: number;
  pathId?: PathId;
}

export interface NarrationItem {
  id: string;
  kind: 'challenge' | 'path';
  title: string;
  speaker: string;
  subTag: string;
  lines: string[];
  nextChallengeId?: string | null;
}

interface PerUserProgress {
  solved: string[];
  hints: Record<string, number[]>;
  bytes: number;
  integrity: number;
  activePath: PathId;
  activeChallengeId: string | null;
  chosenPath: PathId | null;
  convergenceKeys: { key1: string; key2: string; key3: string };
  convergenceRevealed: boolean;
  elapsed: number;
  celebratedPaths: PathId[];
  unlockedPaths: PathId[]; // paths unlocked forever (first commit free, later unlocks cost points once)
  unlockPenalty: number; // points deducted for unlocking paths (one-time fee per path)
  skipped: string[]; // challenged skipped (unlocked, no points awarded)
  skipPenalty: number; // points deducted for skipping challenges
}

/** Points deducted once when unlocking a new path (unlocked paths stay open forever). */
export const PATH_UNLOCK_COST = 250;

/** Points deducted when skipping a challenge (no points awarded for it). */
export const CHALLENGE_SKIP_PENALTY = 100;

const FRESH_PROGRESS = (activePath: PathId = 'A'): PerUserProgress => ({
  solved: [],
  hints: {},
  bytes: 500,
  integrity: 100,
  activePath,
  activeChallengeId: null,
  chosenPath: null,
  convergenceKeys: { key1: '', key2: '', key3: '' },
  convergenceRevealed: false,
  elapsed: 0,
  celebratedPaths: [],
  unlockedPaths: [],
  unlockPenalty: 0,
  skipped: [],
  skipPenalty: 0,
});

const progressKey = (userId: string) => `achronos_progress_${userId}`;
const SESSION_KEY = 'achronos_session';

function loadProgress(userId: string): PerUserProgress {
  try {
    const saved = localStorage.getItem(progressKey(userId));
    if (saved) {
      const parsed = { ...FRESH_PROGRESS(), ...JSON.parse(saved) };
      // Migrate legacy switch model: committed path counts as unlocked, past
      // switch fees carry over as unlock fees.
      if (!Array.isArray(parsed.unlockedPaths)) parsed.unlockedPaths = parsed.chosenPath ? [parsed.chosenPath] : [];
      if (typeof parsed.unlockPenalty !== 'number') parsed.unlockPenalty = 0;
      const legacySwitch = (parsed as Record<string, unknown>).switchPenalty;
      if (typeof legacySwitch === 'number') {
        parsed.unlockPenalty += legacySwitch;
        delete (parsed as Record<string, unknown>).switchPenalty;
      }
      if (!Array.isArray(parsed.skipped)) parsed.skipped = [];
      if (typeof parsed.skipPenalty !== 'number') parsed.skipPenalty = 0;
      return parsed;
    }
  } catch { /* fall through */ }
  // One-time migration: adopt legacy global slot so existing demo progress isn't lost
  try {
    const legacy = localStorage.getItem('achronos_solved');
    if (legacy) {
      return {
        ...FRESH_PROGRESS(),
        solved: JSON.parse(legacy),
        hints: JSON.parse(localStorage.getItem('achronos_hints') || '{}'),
        bytes: parseInt(localStorage.getItem('achronos_bytes') || '500', 10),
        integrity: parseInt(localStorage.getItem('achronos_integrity') || '100', 10),
        activeChallengeId: 'A-07',
      };
    }
  } catch { /* ignore */ }
  return FRESH_PROGRESS();
}

interface GameContextType {
  currentView: ViewType;
  activePath: PathId;
  activeChallengeId: string | null;
  activeChallenge: Challenge | null;
  solvedChallengeIds: string[];
  skippedChallengeIds: string[];
  unlockedHintIds: Record<string, number[]>;
  bytesBalance: number;
  integrityScore: number;
  elapsedSeconds: number;
  formattedTimer: string;
  showBriefingModal: boolean;
  briefingChallenge: Challenge | null;
  convergenceKeys: {
    key1: string;
    key2: string;
    key3: string;
  };
  convergenceRevealed: boolean;
  tourOpen: boolean;
  storyOpen: boolean;

  // Auth (pre-provisioned roster, no signup)
  currentUser: Operative | null;
  authError: string | null;
  login: (callsign: string, accessCode: string) => { success: boolean; message: string };
  logout: () => void;

  // Dashboard
  chosenPath: PathId | null;
  choosePath: (path: PathId) => void;
  unlockPath: (path: PathId) => void;
  unlockPenalty: number;
  isPathComplete: (pathId: PathId) => boolean;
  isPathLocked: (pathId: PathId) => boolean;
  needsNextPath: boolean;
  resumeChallengeId: string | null;
  celebratedPaths: PathId[];
  notify: (type: 'success' | 'error' | 'info', title: string, message: string) => void;

  // Story narration queue (post-challenge + path completion)
  narrationQueue: NarrationItem[];
  dismissNarration: () => void;

  // Time glitch countdown (15:00 warning timer, session-scoped)
  glitchEndsAt: number | null;
  startGlitch: () => void;
  clearGlitch: () => void;

  // Points System
  pathScores: {
    pathA: number;
    pathB: number;
    pathC: number;
    total: number;
  };
  getPathPoints: (pathId: PathId) => number;
  teamName: string;
  setTeamName: (name: string) => void;

  // Audio & Notification
  audioEnabled: boolean;
  toggleAudio: () => void;
  toast: ToastNotification | null;
  dismissToast: () => void;

  // Actions
  navigateTo: (view: ViewType, challengeId?: string | null, pathId?: PathId) => void;
  setActivePath: (path: PathId) => void;
  submitFlag: (challengeId: string, flagInput: string) => { success: boolean; message: string; points?: number; pathId?: PathId };
  skipChallenge: (challengeId: string) => { success: boolean; message: string };
  unlockHint: (challengeId: string, hintId: number, cost: number) => { success: boolean; message: string };
  openBriefing: (challengeId: string) => void;
  closeBriefing: () => void;
  updateConvergenceKey: (keyIndex: 1 | 2 | 3, val: string) => void;
  executeConvergence: () => { success: boolean; message: string };
  toggleTour: (open?: boolean) => void;
  setStoryOpen: (open: boolean) => void;
  resetProgress: () => void;
  isNodeUnlocked: (challenge: Challenge) => boolean;
  getNodeState: (challenge: Challenge) => 'SOLVED' | 'PLAY_NEXT' | 'LOCKED';
  getPathSolvedCount: (pathId: PathId) => number;
}

const GameContext = createContext<GameContextType | undefined>(undefined);

export const GameProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  // ---- Auth ----
  const [currentUser, setCurrentUser] = useState<Operative | null>(() => {
    try {
      const id = localStorage.getItem(SESSION_KEY);
      return OPERATIVES.find((o) => o.id === id) || null;
    } catch { return null; }
  });
  const [authError, setAuthError] = useState<string | null>(null);

  // ---- Per-user progress (initialized from slot, reloaded on login) ----
  const [progress, setProgress] = useState<PerUserProgress>(() => {
    try {
      const id = localStorage.getItem(SESSION_KEY);
      if (id && OPERATIVES.some((o) => o.id === id)) return loadProgress(id);
    } catch { /* ignore */ }
    return FRESH_PROGRESS();
  });

  const solvedChallengeIds = progress.solved;
  const skippedChallengeIds = progress.skipped;
  const unlockedHintIds = progress.hints;
  const bytesBalance = progress.bytes;
  const integrityScore = progress.integrity;
  const activePath = progress.activePath;
  const activeChallengeId = progress.activeChallengeId;
  const chosenPath = progress.chosenPath;
  const convergenceKeys = progress.convergenceKeys;
  const convergenceRevealed = progress.convergenceRevealed;
  const elapsedSeconds = progress.elapsed;
  const celebratedPaths = progress.celebratedPaths;

  const patchProgress = (patch: Partial<PerUserProgress>) =>
    setProgress((p) => ({ ...p, ...patch }));

  // Persist per-user slot + legacy mirror (leaderboard compat)
  useEffect(() => {
    if (!currentUser) return;
    try {
      localStorage.setItem(progressKey(currentUser.id), JSON.stringify(progress));
      localStorage.setItem('achronos_solved', JSON.stringify(progress.solved));
      localStorage.setItem('achronos_hints', JSON.stringify(progress.hints));
      localStorage.setItem('achronos_bytes', progress.bytes.toString());
      localStorage.setItem('achronos_integrity', progress.integrity.toString());
      localStorage.setItem('achronos_team', currentUser.displayName);
    } catch { /* storage full/blocked: game still works in-memory */ }
  }, [progress, currentUser]);

  const syncHash = (view: ViewType, challengeId?: string | null, pathId?: PathId) => {
    try {
      const h = viewToHash(view, challengeId, pathId);
      if (window.location.hash !== h) window.location.hash = h;
    } catch { /* non-browser env */ }
  };

  const login = (callsign: string, accessCode: string) => {
    const op = verifyOperativeSync(callsign, accessCode);
    if (!op) {
      const known = getRoster().some(
        (o) => o.callsign.toLowerCase() === callsign.trim().toLowerCase()
      );
      const msg = known
        ? 'Access code rejected. Checksum mismatch.'
        : 'Unknown callsign. No new operatives are provisioned — contact command.';
      setAuthError(msg);
      return { success: false, message: msg };
    }
    setAuthError(null);
    setCurrentUser(op);
    setProgress(loadProgress(op.id));
    setNarrationQueue([]);
    try { localStorage.setItem(SESSION_KEY, op.id); } catch { /* ignore */ }
    setTeamNameState(op.displayName);
    setCurrentView('DASHBOARD');
    syncHash('DASHBOARD');
    soundFx.playClick();
    return { success: true, message: `Welcome, ${op.displayName}.` };
  };

  const logout = () => {
    soundFx.playClick();
    setCurrentUser(null);
    setAuthError(null);
    setGlitchEndsAt(null);
    try { localStorage.removeItem(SESSION_KEY); } catch { /* ignore */ }
    setCurrentView('LOGIN');
    syncHash('LOGIN');
  };

  const unlockUnion = (list: PathId[], id: PathId): PathId[] =>
    (list.includes(id) ? list : [...list, id]);

  const choosePath = (path: PathId) => {
    soundFx.playClick();
    patchProgress({
      chosenPath: path,
      activePath: path,
      unlockedPaths: progress.unlockedPaths.includes(path) ? progress.unlockedPaths : [...progress.unlockedPaths, path],
    });
    setCurrentView('DASHBOARD');
    syncHash('DASHBOARD');
  };

  // ---- View / misc state (URL-synced: every page has its own hash route) ----
  const [currentView, setCurrentView] = useState<ViewType>(() => {
    const r = parseHash(typeof window !== 'undefined' ? window.location.hash : '');
    if (r && (currentUser || r.view === 'GATE' || r.view === 'LOGIN')) return r.view;
    return currentUser ? 'DASHBOARD' : 'LOGIN';
  });

  const [teamName, setTeamNameState] = useState<string>(() => {
    return localStorage.getItem('achronos_team') || currentUser?.displayName || 'OPERATIVE';
  });

  const [audioEnabled, setAudioEnabled] = useState<boolean>(() => {
    const saved = localStorage.getItem('achronos_audio');
    return saved !== null ? saved === 'true' : true;
  });

  const [toast, setToast] = useState<ToastNotification | null>(null);
  const [narrationQueue, setNarrationQueue] = useState<NarrationItem[]>([]);
  const [glitchEndsAt, setGlitchEndsAt] = useState<number | null>(null);

  const startGlitch = () => {
    soundFx.playClick();
    setGlitchEndsAt(Date.now() + 15 * 60 * 1000);
  };
  const clearGlitch = () => setGlitchEndsAt(null);

  const [showBriefingModal, setShowBriefingModal] = useState<boolean>(false);
  const [briefingChallengeId, setBriefingChallengeId] = useState<string | null>(null);
  const [tourOpen, setTourOpen] = useState<boolean>(false);
  const [storyOpen, setStoryOpen] = useState<boolean>(false);

  // Keep soundFx in sync with audioEnabled
  useEffect(() => {
    soundFx.enabled = audioEnabled;
    localStorage.setItem('achronos_audio', audioEnabled.toString());
  }, [audioEnabled]);

  const toggleAudio = () => {
    setAudioEnabled(prev => !prev);
  };

  const setTeamName = (name: string) => {
    const cleaned = name.trim().toUpperCase() || 'OPERATIVE';
    setTeamNameState(cleaned);
    localStorage.setItem('achronos_team', cleaned);
  };

  const dismissToast = () => {
    setToast(null);
  };

  const notify = (type: 'success' | 'error' | 'info', title: string, message: string) => {
    if (type === 'error') soundFx.playError();
    else soundFx.playClick();
    setToast({ id: Date.now().toString(), type, title, message });
  };

  const dismissNarration = () => {
    soundFx.playClick();
    setNarrationQueue((q) => {
      const [head, ...rest] = q;
      // If this narration points at a next challenge, jump there on continue
      if (head?.nextChallengeId) {
        const c = CHALLENGES_DATA.find((x) => x.id === head.nextChallengeId);
        if (c) {
          patchProgress({ activeChallengeId: c.id, activePath: c.pathId });
          setCurrentView('CHALLENGE');
        }
      }
      return rest;
    });
  };

  // Automatically dismiss toast after 4.5s
  useEffect(() => {
    if (toast) {
      const t = setTimeout(() => setToast(null), 4500);
      return () => clearTimeout(t);
    }
  }, [toast]);

  // Dynamic calculation of points earned under each path (minus unlock + skip penalties)
  const pathScores = useMemo(() => {
    const scoredIds = solvedChallengeIds.filter((id) => !progress.skipped.includes(id));
    const baseScores = calculateUserPoints(scoredIds, CHALLENGES_DATA);
    const total = Math.max(0, baseScores.total + (convergenceRevealed ? 1000 : 0) - progress.unlockPenalty - progress.skipPenalty);
    return { ...baseScores, total };
  }, [solvedChallengeIds, convergenceRevealed, progress.unlockPenalty, progress.skipped, progress.skipPenalty]);

  const getPathPoints = (pathId: PathId): number => {
    if (pathId === 'A') return pathScores.pathA;
    if (pathId === 'B') return pathScores.pathB;
    return pathScores.pathC;
  };

  // Timer tick (per-user elapsed)
  useEffect(() => {
    if (!currentUser) return;
    const timer = setInterval(() => {
      setProgress((p) => ({ ...p, elapsed: p.elapsed + 1 }));
    }, 1000);
    return () => clearInterval(timer);
  }, [currentUser]);

  // Format timer string: T+ 04:13:42
  const formatTimer = (totalSeconds: number): string => {
    const hours = Math.floor(totalSeconds / 3600);
    const minutes = Math.floor((totalSeconds % 3600) / 60);
    const seconds = totalSeconds % 60;
    const pad = (n: number) => n.toString().padStart(2, '0');
    return `T+ ${pad(hours)}:${pad(minutes)}:${pad(seconds)}`;
  };

  const activeChallenge = CHALLENGES_DATA.find(c => c.id === activeChallengeId) || null;
  const briefingChallenge = CHALLENGES_DATA.find(c => c.id === briefingChallengeId) || activeChallenge || CHALLENGES_DATA[0];

  const getPathSolvedCount = (pathId: PathId) => {
    return CHALLENGES_DATA.filter(c => c.pathId === pathId && solvedChallengeIds.includes(c.id)).length;
  };

  // Path access control: paths are unlocked one by one and stay open forever.
  // Locked paths stay visible (maps viewable) but their challenges are sealed.
  const isPathComplete = (pathId: PathId) => getPathSolvedCount(pathId) >= 10;
  const isPathLocked = (pathId: PathId) => {
    if (progress.unlockedPaths.includes(pathId)) return false;
    if (progress.unlockedPaths.length === 0) return false; // nothing committed yet: all committable
    return true;
  };
  // Current path done but paths remain → dashboard must prompt the next choice
  const needsNextPath = !!progress.chosenPath && isPathComplete(progress.chosenPath) &&
    (['A', 'B', 'C'] as PathId[]).some((p) => !isPathComplete(p));

  // Unlock a path forever: free for the first commit, free while moving
  // between unlocked paths or after finishing the active path — otherwise a
  // one-time unlock fee.
  const unlockPath = (target: PathId) => {
    const alreadyUnlocked = progress.unlockedPaths.includes(target);
    const firstCommit = progress.unlockedPaths.length === 0;
    const progressing = !!progress.chosenPath && isPathComplete(progress.chosenPath);
    const cost = alreadyUnlocked || firstCommit || progressing ? 0 : PATH_UNLOCK_COST;
    if (cost > 0) soundFx.playError();
    else soundFx.playClick();
    setProgress((p) => ({
      ...p,
      chosenPath: target,
      activePath: target,
      unlockedPaths: p.unlockedPaths.includes(target) ? p.unlockedPaths : [...p.unlockedPaths, target],
      unlockPenalty: p.unlockPenalty + cost,
    }));
    setCurrentView('DASHBOARD');
    syncHash('DASHBOARD');
  };

  const isNodeUnlocked = (challenge: Challenge): boolean => {
    if (challenge.index === 1) return true;
    const prevChallengeId = `${challenge.pathId}-${challenge.index - 1 < 10 ? '0' + (challenge.index - 1) : challenge.index - 1}`;
    return solvedChallengeIds.includes(prevChallengeId);
  };

  const getNodeState = (challenge: Challenge): 'SOLVED' | 'PLAY_NEXT' | 'LOCKED' => {
    if (solvedChallengeIds.includes(challenge.id)) {
      return 'SOLVED';
    }
    if (isNodeUnlocked(challenge)) {
      return 'PLAY_NEXT';
    }
    return 'LOCKED';
  };

  // Resume target: first playable unsolved node in chosen path (or, after a
  // completion, across the remaining paths), else active challenge
  const resumeChallengeId = useMemo(() => {
    const pool = needsNextPath
      ? CHALLENGES_DATA.filter((c) => !isPathComplete(c.pathId))
      : chosenPath
        ? CHALLENGES_DATA.filter((c) => c.pathId === chosenPath)
        : CHALLENGES_DATA;
    const scope = pool.slice().sort((a, b) => a.index - b.index);
    const next = scope.find((c) => getNodeState(c) === 'PLAY_NEXT');
    if (next) return next.id;
    if (activeChallengeId && CHALLENGES_DATA.some((c) => c.id === activeChallengeId)) return activeChallengeId;
    const anywhere = CHALLENGES_DATA.find((c) => getNodeState(c) === 'PLAY_NEXT');
    return anywhere ? anywhere.id : null;
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [solvedChallengeIds, chosenPath, activeChallengeId, needsNextPath]);

  const navigateTo = (view: ViewType, challengeId?: string | null, pathId?: PathId) => {
    soundFx.playClick();
    if (!currentUser && view !== 'LOGIN' && view !== 'GATE') {
      setCurrentView('LOGIN');
      syncHash('LOGIN');
      return;
    }
    // Locked paths are view-only: block challenge entry, send back to dashboard
    const targetChallengeId = challengeId ?? (view === 'CHALLENGE' ? progress.activeChallengeId : null);
    if (view === 'CHALLENGE' && targetChallengeId) {
      const c = CHALLENGES_DATA.find((x) => x.id === targetChallengeId);
      if (c && isPathLocked(c.pathId)) {
        setToast({
          id: Date.now().toString(),
          type: 'error',
          title: `PATH ${c.pathId} SEALED`,
          message: `Path ${progress.chosenPath} is active. Finish it, or unlock PATH ${c.pathId} (−${PATH_UNLOCK_COST} PTS). Unlocked paths stay open forever. Maps stay viewable.`,
        });
        soundFx.playError();
        setCurrentView('DASHBOARD');
        syncHash('DASHBOARD');
        return;
      }
    }
    if (pathId) patchProgress({ activePath: pathId });
    if (challengeId) {
      const c = CHALLENGES_DATA.find((x) => x.id === challengeId);
      patchProgress({
        activeChallengeId: challengeId,
        ...(c ? { activePath: c.pathId } : {}),
        // First time opening a challenge locks in the dashboard path
        ...(c && !progress.chosenPath ? { chosenPath: c.pathId, unlockedPaths: unlockUnion(progress.unlockedPaths, c.pathId) } : {}),
      });
    }
    setCurrentView(view);
    // Every page gets its own URL (hash route)
    syncHash(
      view,
      challengeId ?? (view === 'CHALLENGE' ? progress.activeChallengeId : null),
      pathId ?? (view === 'MAP' || view === 'TRAIL' ? progress.activePath : null)
    );
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  // Browser back/forward + deep links: apply the hash route to state
  useEffect(() => {
    const applyRoute = (route: ParsedRoute) => {
      if (!currentUser && route.view !== 'LOGIN' && route.view !== 'GATE') {
        setCurrentView('LOGIN');
        return;
      }
      if (route.view === 'CHALLENGE' && route.challengeId) {
        const c = CHALLENGES_DATA.find((x) => x.id === route.challengeId);
        if (c) {
          setProgress((p) => ({
            ...p,
            activeChallengeId: c.id,
            activePath: c.pathId,
            ...(p.chosenPath ? {} : { chosenPath: c.pathId, unlockedPaths: unlockUnion(p.unlockedPaths, c.pathId) }),
          }));
        }
      } else if (route.view === 'MAP' && route.pathId) {
        setProgress((p) => ({ ...p, activePath: route.pathId as PathId }));
      } else if (route.view === 'TRAIL' && route.pathId) {
        setProgress((p) => ({ ...p, activePath: route.pathId as PathId }));
      }
      setCurrentView(route.view);
      window.scrollTo({ top: 0 });
    };
    const onHashChange = () => {
      const r = parseHash(window.location.hash);
      if (r) applyRoute(r);
    };
    // Apply deep link on first mount (e.g. #/challenge/B-05)
    const initial = parseHash(window.location.hash);
    if (initial) applyRoute(initial);
    window.addEventListener('hashchange', onHashChange);
    return () => window.removeEventListener('hashchange', onHashChange);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [currentUser]);

  const setActivePath = (path: PathId) => {
    patchProgress({ activePath: path });
  };

  const openBriefing = (challengeId: string) => {
    soundFx.playClick();
    setBriefingChallengeId(challengeId);
    setShowBriefingModal(true);
  };

  const closeBriefing = () => {
    soundFx.playClick();
    setShowBriefingModal(false);
  };

  const unlockHint = (challengeId: string, hintId: number, cost: number) => {
    const currentHints = unlockedHintIds[challengeId] || [];
    if (currentHints.includes(hintId)) {
      return { success: true, message: 'Hint already decrypted.' };
    }
    if (bytesBalance < cost) {
      soundFx.playError();
      return { success: false, message: `Insufficient bytes. Required: ${cost} B, Available: ${bytesBalance} B` };
    }
    soundFx.playDecrypt();
    patchProgress({
      bytes: bytesBalance - cost,
      hints: { ...unlockedHintIds, [challengeId]: [...(unlockedHintIds[challengeId] || []), hintId] },
    });
    return { success: true, message: `Hint ${hintId} decrypted for ${cost} bytes.` };
  };

  const submitFlag = (challengeId: string, flagInput: string) => {
    const challenge = CHALLENGES_DATA.find(c => c.id === challengeId);
    if (!challenge) {
      return { success: false, message: 'Challenge not found.' };
    }

    const cleanInput = flagInput.trim();
    if (!cleanInput) {
      return { success: false, message: 'Please enter a flag before submitting.' };
    }

    if (solvedChallengeIds.includes(challengeId)) {
      soundFx.playClick();
      return { success: true, message: 'Challenge already verified! Flag confirmed.' };
    }

    const isValid = challenge.acceptedFlags.some(
      f => f.toLowerCase() === cleanInput.toLowerCase() ||
           cleanInput.toLowerCase().includes(f.toLowerCase().replace(/^(axios|breachpoint)\{/, '').replace(/\}$/, ''))
    );

    if (isValid) {
      const rewardBytes = challenge.rewardBytes;
      const rewardPoints = challenge.points || getPointsForChallenge(challenge);

      const nextSolved = [...solvedChallengeIds, challengeId];
      const nextBytes = bytesBalance + rewardBytes;
      const nextIntegrity = Math.min(100, integrityScore + 3);
      const nextKeys = { ...convergenceKeys };
      if (challengeId === 'A-10') nextKeys.key1 = PATHS_DATA.A.convergenceKey;
      else if (challengeId === 'B-10') nextKeys.key2 = PATHS_DATA.B.convergenceKey;
      else if (challengeId === 'C-10') nextKeys.key3 = PATHS_DATA.C.convergenceKey;

      // Path completion detection
      const pathCountAfter = CHALLENGES_DATA.filter(
        (c) => c.pathId === challenge.pathId && (nextSolved.includes(c.id))
      ).length;
      const pathJustCompleted = pathCountAfter === 10 && !celebratedPaths.includes(challenge.pathId);

      patchProgress({
        solved: nextSolved,
        bytes: nextBytes,
        integrity: nextIntegrity,
        convergenceKeys: nextKeys,
        chosenPath: progress.chosenPath || challenge.pathId,
        unlockedPaths: unlockUnion(progress.unlockedPaths, progress.chosenPath || challenge.pathId),
        activeChallengeId: challengeId,
        celebratedPaths: pathJustCompleted ? [...celebratedPaths, challenge.pathId] : celebratedPaths,
      });

      soundFx.playSuccess();

      const pointsMessage = `+${rewardPoints} POINTS awarded to Path ${challenge.pathId}!`;
      setToast({
        id: Date.now().toString(),
        type: 'success',
        title: `FLAG VERIFIED — ${challenge.id}`,
        message: pointsMessage,
        points: rewardPoints,
        pathId: challenge.pathId,
      });

      // Queue post-challenge narration, then path epilogue if the path just closed
      const nextInPath = CHALLENGES_DATA.find(
        (c) => c.pathId === challenge.pathId && c.index === challenge.index + 1
      );
      const items: NarrationItem[] = [
        {
          id: `${challengeId}-post-${Date.now()}`,
          kind: 'challenge',
          title: `POST-TRANSMISSION — ${challenge.id} ${challenge.title}`,
          speaker: challenge.briefing.speaker,
          subTag: `PATH ${challenge.pathId} · DEBRIEF ${challenge.id}`,
          lines: postChallengeNarration(challenge),
          nextChallengeId: null, // stay; modal Continue just closes (Next button lives in ChallengeView)
        },
      ];
      if (pathJustCompleted) {
        const epi = PATH_EPILOGUES[challenge.pathId];
        items.push({
          id: `${challenge.pathId}-epilogue-${Date.now()}`,
          kind: 'path',
          title: epi.title,
          speaker: challenge.briefing.speaker,
          subTag: `PATH ${challenge.pathId} · COMPLETE 10/10`,
          lines: epi.lines,
          nextChallengeId: nextInPath ? undefined : null,
        });
      }
      setNarrationQueue((q) => [...q, ...items]);

      return {
        success: true,
        message: `FLAG ACCEPTED! ${pointsMessage}`,
        points: rewardPoints,
        pathId: challenge.pathId,
      };
    } else {
      // Penalty: cost integrity
      soundFx.playError();
      patchProgress({ integrity: Math.max(10, integrityScore - 4) });

      setToast({
        id: Date.now().toString(),
        type: 'error',
        title: 'FLAG REJECTED',
        message: 'Checksum mismatch. Anomaly integrity decreased by 4%.',
      });

      return {
        success: false,
        message: 'INCORRECT FLAG. Checksum mismatch. Integrity decreased by 4%.',
      };
    }
  };

  // Skip a challenge: counts as resolved (unlocks the next node) but awards
  // no points and deducts CHALLENGE_SKIP_PENALTY from the total, forever.
  const skipChallenge = (challengeId: string) => {
    const challenge = CHALLENGES_DATA.find((c) => c.id === challengeId);
    if (!challenge) {
      return { success: false, message: 'Challenge not found.' };
    }
    if (solvedChallengeIds.includes(challengeId)) {
      return { success: false, message: 'Challenge already resolved.' };
    }
    soundFx.playClick();
    patchProgress({
      solved: [...solvedChallengeIds, challengeId],
      skipped: [...progress.skipped, challengeId],
      skipPenalty: progress.skipPenalty + CHALLENGE_SKIP_PENALTY,
      activeChallengeId: challengeId,
      chosenPath: progress.chosenPath || challenge.pathId,
      unlockedPaths: unlockUnion(progress.unlockedPaths, progress.chosenPath || challenge.pathId),
    });
    setToast({
      id: Date.now().toString(),
      type: 'info',
      title: `CHALLENGE SKIPPED — ${challengeId}`,
      message: `No points awarded. −${CHALLENGE_SKIP_PENALTY} PTS deducted.`,
    });
    return { success: true, message: `CHALLENGE SKIPPED — ${challengeId}. No points awarded. −${CHALLENGE_SKIP_PENALTY} PTS.` };
  };

  const updateConvergenceKey = (keyIndex: 1 | 2 | 3, val: string) => {
    patchProgress({ convergenceKeys: { ...convergenceKeys, [`key${keyIndex}`]: val } });
  };

  const executeConvergence = () => {
    const key1Valid = convergenceKeys.key1.trim().toLowerCase() === PATHS_DATA.A.convergenceKey.toLowerCase();
    const key2Valid = convergenceKeys.key2.trim().toLowerCase() === PATHS_DATA.B.convergenceKey.toLowerCase();
    const key3Valid = convergenceKeys.key3.trim().toLowerCase() === PATHS_DATA.C.convergenceKey.toLowerCase();

    if (key1Valid && key2Valid && key3Valid) {
      soundFx.playConvergence();
      patchProgress({ convergenceRevealed: true, integrity: 100, bytes: bytesBalance + 1000 });

      setToast({
        id: Date.now().toString(),
        type: 'success',
        title: 'CONVERGENCE ACHIEVED',
        message: 'All 3 temporal fragments synchronized! +1,000 BONUS POINTS awarded.',
        points: 1000,
      });

      return {
        success: true,
        message: 'CONVERGENCE VERIFIED. All three ECHO fragments synchronized. Commencing Transmission Zero reveal.',
      };
    }

    soundFx.playError();
    const missing = [];
    if (!key1Valid) missing.push('Key 1 (WHO)');
    if (!key2Valid) missing.push('Key 2 (HOW)');
    if (!key3Valid) missing.push('Key 3 (WHY)');

    return {
      success: false,
      message: `CONVERGENCE MISMATCH: ${missing.join(', ')} invalid or unverified.`,
    };
  };

  const toggleTour = (open?: boolean) => {
    soundFx.playClick();
    setTourOpen(prev => (open !== undefined ? open : !prev));
  };

  const resetProgress = () => {
    patchProgress(FRESH_PROGRESS(activePath));
    setNarrationQueue([]);
  };

  return (
    <GameContext.Provider
      value={{
        currentView,
        activePath,
        activeChallengeId,
        activeChallenge,
        solvedChallengeIds,
        skippedChallengeIds,
        unlockedHintIds,
        bytesBalance,
        integrityScore,
        elapsedSeconds,
        formattedTimer: formatTimer(elapsedSeconds),
        showBriefingModal,
        briefingChallenge,
        convergenceKeys,
        convergenceRevealed,
        tourOpen,
        storyOpen,
        currentUser,
        authError,
        login,
        logout,
        chosenPath,
        choosePath,
        unlockPath,
        unlockPenalty: progress.unlockPenalty,
        isPathComplete,
        isPathLocked,
        needsNextPath,
        resumeChallengeId,
        celebratedPaths,
        notify,
        narrationQueue,
        dismissNarration,
        glitchEndsAt,
        startGlitch,
        clearGlitch,
        pathScores,
        getPathPoints,
        teamName,
        setTeamName,
        audioEnabled,
        toggleAudio,
        toast,
        dismissToast,
        navigateTo,
        setActivePath,
        submitFlag,
        skipChallenge,
        unlockHint,
        openBriefing,
        closeBriefing,
        updateConvergenceKey,
        executeConvergence,
        toggleTour,
        setStoryOpen,
        resetProgress,
        isNodeUnlocked,
        getNodeState,
        getPathSolvedCount,
      }}
    >
      {children}
    </GameContext.Provider>
  );
};

export const useGame = () => {
  const context = useContext(GameContext);
  if (!context) {
    throw new Error('useGame must be used within a GameProvider');
  }
  return context;
};
