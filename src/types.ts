export type PathId = 'A' | 'B' | 'C';

export type EraType = 'PAST' | 'PRESENT' | 'FUTURE' | 'ENDGAME';

export interface PathInfo {
  id: PathId;
  keyNumber: number;
  title: string;
  lead: string;
  role: string;
  symbol: string;
  accentColor: string; // 'amber' | 'cyan' | 'purple'
  bgBadgeColor: string;
  lore: string;
  pastSummary: string;
  presentSummary: string;
  futureSummary: string;
  discovers: 'WHO' | 'HOW' | 'WHY';
  convergenceFragment: string;
  convergenceKey: string;
}

export interface BriefingSlide {
  text: string;
  characterExpression?: string;
}

export interface ChallengeHint {
  id: number;
  cost: number;
  text: string;
}

export interface Challenge {
  id: string; // e.g. 'A-01'
  pathId: PathId;
  index: number;
  title: string;
  subtitle: string;
  era: 'PAST' | 'PRESENT' | 'FUTURE';
  location: string;
  track: string;
  category: string;
  difficulty: 'DIFFICULTY I' | 'DIFFICULTY II' | 'DIFFICULTY III';
  points: number;
  rewardBytes: number;
  solvesCount: number;
  totalTeams: number;
  firstBlood: string;
  objective: string;
  objectiveQuote?: string;
  artifactName: string;
  artifactContent: string;
  flagFormat: string;
  acceptedFlags: string[];
  hints: ChallengeHint[];
  briefing: {
    speaker: string;
    subTag: string;
    slides: string[];
  };
  evidenceSnippet: string;
  xPosPercent: number; // For SVG graph layout
  yPosPercent: number;
}

export interface TeamScore {
  rank: number;
  name: string;
  points: number;
  bytes: number;
  solves: {
    pathA: number;
    pathB: number;
    pathC: number;
  };
  pathPoints: {
    pathA: number;
    pathB: number;
    pathC: number;
  };
  lastSubmission: string;
  specialty?: string;
  country?: string;
}

export type ViewType = 'GATE' | 'LOGIN' | 'DASHBOARD' | 'MAP' | 'TRAIL' | 'CHALLENGE' | 'CONVERGENCE' | 'BOARD';

export interface UserGameState {
  activePath: PathId;
  activeChallengeId: string | null;
  solvedChallengeIds: string[];
  unlockedHintIds: Record<string, number[]>; // challengeId -> hintIds
  bytesBalance: number;
  integrityScore: number;
  elapsedSeconds: number;
  showBriefingModal: boolean;
  briefingChallengeId: string | null;
  convergenceKeys: {
    key1: string; // WHO
    key2: string; // HOW
    key3: string; // WHY
  };
  convergenceUnlocked: boolean;
  tourOpen: boolean;
}
