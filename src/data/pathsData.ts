import { FragmentKey, PathId, PathSkin } from '../types';

/**
 * Presentation only.
 *
 * Everything a path *says* — its name, its narration, what it delivers — comes
 * from `sz_path` on the server. What's left here is the styling the server has
 * no opinion about: the accent colour each path is drawn in, the in-fiction
 * lead whose portrait fronts its briefings, and the alchemical mark on the
 * chart.
 *
 * The flags that used to live in this file (`convergenceKey`) are gone. They
 * were the real answers, shipped to every client and pasted into the input by
 * a "PLACE" button; the server checks flags now and never sends them out.
 */
export const PATH_SKINS: Record<PathId, PathSkin> = {
  A: {
    id: 'A',
    keyNumber: 1,
    lead: 'DR. WREN OKAFOR',
    role: 'Former Lead Ethicist, Meridian Disaster Historian',
    symbol: '🜃',
    tone: '#E0A83E',
  },
  B: {
    id: 'B',
    keyNumber: 2,
    lead: '"CUTTER"',
    role: 'Lead Incident Responder, Maritime Logistics Cyber Command',
    symbol: '🜁',
    tone: '#5ED6E3',
  },
  C: {
    id: 'C',
    keyNumber: 3,
    lead: 'ANALYST SENA PARK',
    role: 'Principal Researcher, Synthetic Futures & Ethics Group',
    symbol: '🜂',
    tone: '#E84D7E',
  },
};

/** Accent colour per path, the one thing nearly every view needs. */
export const TONE: Record<PathId, string> = {
  A: PATH_SKINS.A.tone,
  B: PATH_SKINS.B.tone,
  C: PATH_SKINS.C.tone,
};

/** The question each path answers, for labels like "WHO TRACK". */
export const FRAGMENT_LABEL: Record<FragmentKey, string> = {
  who: 'WHO',
  how: 'HOW',
  why: 'WHY',
};

export const isPathId = (code: string): code is PathId =>
  code === 'A' || code === 'B' || code === 'C';
