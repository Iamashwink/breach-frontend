import { PathId, ViewType } from '../types';

export interface ParsedRoute {
  view: ViewType;
  challengeId: string | null;
  pathId: PathId | null;
}

/**
 * Hash routing (works on any static host, no server rewrites needed).
 * Every page gets its own URL:
 *   #/gate  #/login  #/dashboard
 *   #/map  #/path/B  #/challenge/A-07  #/rite  #/board
 *
 * (Legacy #/paths and #/incident links fall through to #/dashboard.)
 *
 * TODO(backend): no changes needed — routes are frontend-only.
 */
export function viewToHash(view: ViewType, challengeId?: string | null, pathId?: PathId): string {
  switch (view) {
    case 'GATE': return '#/gate';
    case 'LOGIN': return '#/login';
    case 'DASHBOARD': return '#/dashboard';
    case 'MAP': return pathId ? `#/map/${pathId}` : '#/map';
    case 'TRAIL': return pathId ? `#/path/${pathId}` : '#/dashboard';
    case 'CHALLENGE': return challengeId ? `#/challenge/${challengeId}` : '#/challenge';
    case 'CONVERGENCE': return '#/rite';
    case 'BOARD': return '#/board';
    default: return '#/dashboard';
  }
}

export function parseHash(hash: string): ParsedRoute | null {
  const clean = (hash || '').replace(/^#/, '');
  const segs = clean.split('/').filter(Boolean);
  if (segs.length === 0) return null;
  const [head, param] = segs;
  const asPath = (p?: string): PathId | null =>
    p === 'A' || p === 'B' || p === 'C' ? p : null;

  switch (head) {
    case 'gate': return { view: 'GATE', challengeId: null, pathId: null };
    case 'login': return { view: 'LOGIN', challengeId: null, pathId: null };
    case 'dashboard':
    case 'incident':
    case 'paths': return { view: 'DASHBOARD', challengeId: null, pathId: null };
    case 'map': return { view: 'MAP', challengeId: null, pathId: asPath(param) };
    case 'path': case 'trail': {
      const p = asPath(param);
      return p ? { view: 'TRAIL', challengeId: null, pathId: p } : { view: 'MAP', challengeId: null, pathId: null };
    }
    case 'challenge':
      if (param && /^[ABC]-\d{2}$/.test(param)) return { view: 'CHALLENGE', challengeId: param, pathId: asPath(param[0]) };
      return { view: 'MAP', challengeId: null, pathId: null };
    case 'rite':
    case 'convergence': return { view: 'CONVERGENCE', challengeId: null, pathId: null };
    case 'board': return { view: 'BOARD', challengeId: null, pathId: null };
    default: return null;
  }
}
