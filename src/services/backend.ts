/**
 * BACKEND INTEGRATION LAYER (API-READY)
 * ---------------------------------------------------------------
 * Every game payload the backend will eventually own is fetched
 * through this module:
 *
 *  1. pre/post story narration — main game, paths, challenges
 *  2. challenge Q&A (question prompt + accepted answers)
 *  3. leaderboard stats
 *  4. login credentials (pre-provisioned roster)
 *  5. points allocation per challenge
 *  6. difficulty per challenge (Easy/Medium/Hard)
 *
 * TODAY: each getter returns the local mock (same data as before),
 * so the UI works with zero backend.
 *
 * WHEN THE BACKEND LANDS: replace the body of the corresponding
 * `fetchX` with e.g.
 *
 *    const res = await fetch(`${API_BASE}/api/challenges`);
 *    return (await res.json()) as ApiChallenge[];
 *
 * ...and swap the component's sync getter (`getX`) for the async
 * `fetchX`. Sync getters are kept so current call-sites don't need
 * an async rewrite; they are marked TODO(backend) below.
 */
import { Challenge, PathId, TeamScore } from '../types';
import { CHALLENGES_DATA } from '../data/challengesData';
import { MAIN_STORY, PATH_SUBSTORY, PATH_EPILOGUES, postChallengeNarration, preChallengeNarration } from '../data/storyData';
import { LEADERBOARD_DATA } from '../data/leaderboardData';
import { OPERATIVES, Operative, findOperative } from '../data/operativesData';
import { getPointsForChallenge } from '../utils/points';
import { getRandomizedDifficulty, DifficultyLevel } from '../utils/difficulty';

// TODO(backend): point at the deployed API, e.g. import.meta.env.VITE_API_BASE_URL
export let API_BASE = '';
export const setApiBase = (url: string) => { API_BASE = url; };

// ---------- 1. Story narration ----------
export interface ApiMainStory { title: string; tagline: string; body: string[]; facts: string[] }
export interface ApiPathStory { title: string; hook: string; beats: string[] }

/** TODO(backend): GET /api/story/main */
export async function fetchMainStory(): Promise<ApiMainStory> { return MAIN_STORY; }
/** TODO(backend): GET /api/story/paths/:id */
export async function fetchPathStory(pathId: PathId): Promise<ApiPathStory> { return PATH_SUBSTORY[pathId]; }
/** TODO(backend): GET /api/story/paths/:id/epilogue */
export async function fetchPathEpilogue(pathId: PathId): Promise<{ title: string; lines: string[] }> { return PATH_EPILOGUES[pathId]; }
/** TODO(backend): GET /api/challenges/:id/pre-story */
export async function fetchChallengePreStory(c: Challenge): Promise<string[]> { return preChallengeNarration(c); }
/** TODO(backend): GET /api/challenges/:id/post-story */
export async function fetchChallengePostStory(c: Challenge): Promise<string[]> { return postChallengeNarration(c); }

// Sync wrappers used by components today (swap for fetch* when backend lands)
export const getMainStory = (): ApiMainStory => MAIN_STORY;
export const getPathStory = (p: PathId): ApiPathStory => PATH_SUBSTORY[p];
export const getPathEpilogue = (p: PathId) => PATH_EPILOGUES[p];
export const getChallengePreStory = (c: Challenge): string[] => preChallengeNarration(c);
export const getChallengePostStory = (c: Challenge): string[] => postChallengeNarration(c);

// ---------- 2. Challenge Q&A ----------
export interface ApiQuestion { prompt: string; objectiveQuote?: string; artifactName: string; artifactContent: string; flagFormat: string }
export interface ApiAnswer { acceptedFlags: string[] }

/** TODO(backend): GET /api/challenges (question side) */
export async function fetchChallengeQuestion(c: Challenge): Promise<ApiQuestion> {
  return { prompt: c.objective, objectiveQuote: c.objectiveQuote, artifactName: c.artifactName, artifactContent: c.artifactContent, flagFormat: c.flagFormat };
}
/** TODO(backend): POST /api/challenges/:id/verify (answer side — never ship answers to client) */
export async function fetchChallengeAnswer(c: Challenge): Promise<ApiAnswer> { return { acceptedFlags: c.acceptedFlags }; }

export const getChallengeQuestion = (c: Challenge): ApiQuestion => ({
  prompt: c.objective, objectiveQuote: c.objectiveQuote, artifactName: c.artifactName,
  artifactContent: c.artifactContent, flagFormat: c.flagFormat,
});

// ---------- 3. Leaderboard ----------
/** TODO(backend): GET /api/leaderboard */
export async function fetchLeaderboard(): Promise<TeamScore[]> { return LEADERBOARD_DATA; }
export const getLeaderboard = (): TeamScore[] => LEADERBOARD_DATA;

// ---------- 4. Login credentials ----------
/** TODO(backend): POST /api/auth/login { callsign, accessCode } → { operative, token } */
export async function fetchLogin(callsign: string, accessCode: string): Promise<Operative | null> {
  const op = findOperative(callsign);
  return op && op.accessCode === accessCode ? op : null;
}
/** Sync version used by GameContext today */
export const verifyOperativeSync = (callsign: string, accessCode: string): Operative | null => {
  const op = findOperative(callsign);
  return op && op.accessCode === accessCode ? op : null;
};
export const getRoster = (): Operative[] => OPERATIVES;

// ---------- 5. Points allocation ----------
/** TODO(backend): GET /api/challenges → per-challenge `points`; GET /api/points/rules for the fallback table */
export async function fetchChallengePoints(c: Challenge): Promise<number> { return c.points || getPointsForChallenge(c); }
export const getChallengePoints = (c: Challenge): number => c.points || getPointsForChallenge(c);
export const getAllChallenges = (): Challenge[] => CHALLENGES_DATA;

// ---------- 6. Difficulty ----------
/** TODO(backend): GET /api/challenges → per-challenge `difficulty: 'Easy'|'Medium'|'Hard'` */
export async function fetchChallengeDifficulty(c: Challenge): Promise<DifficultyLevel> { return getRandomizedDifficulty(c.id); }
/** TEMPORARY: randomized until the backend ships difficulty */
export const getChallengeDifficulty = (c: { id: string }): DifficultyLevel => getRandomizedDifficulty(c.id);
