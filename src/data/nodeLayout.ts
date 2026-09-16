import { PathId } from '../types';

/**
 * Hand-placed coordinates for the node chart, as percentages of the SVG
 * viewport. Geometry only.
 *
 * This is the one thing the old local challenge file held that the backend has
 * no opinion about: the server owns which challenges exist, what they say and
 * whether they are open, but not where a node sits on a map. Keyed by slot
 * (`<path code>-<sequence>`), so a content change on the server lands in the
 * same position on the chart.
 */
export interface NodePosition {
  x: number;
  y: number;
}

export const NODE_POSITIONS: Record<string, NodePosition> = {
  'A-01': { x: 12, y: 78 },
  'A-02': { x: 22, y: 62 },
  'A-03': { x: 32, y: 42 },
  'A-04': { x: 43, y: 28 },
  'A-05': { x: 53, y: 48 },
  'A-06': { x: 62, y: 68 },
  'A-07': { x: 71, y: 52 },
  'A-08': { x: 80, y: 32 },
  'A-09': { x: 88, y: 58 },
  'A-10': { x: 94, y: 78 },
  'B-01': { x: 12, y: 78 },
  'B-02': { x: 22, y: 62 },
  'B-03': { x: 32, y: 42 },
  'B-04': { x: 43, y: 28 },
  'B-05': { x: 53, y: 48 },
  'B-06': { x: 62, y: 68 },
  'B-07': { x: 71, y: 52 },
  'B-08': { x: 80, y: 32 },
  'B-09': { x: 88, y: 58 },
  'B-10': { x: 94, y: 78 },
  'C-01': { x: 12, y: 78 },
  'C-02': { x: 22, y: 62 },
  'C-03': { x: 32, y: 42 },
  'C-04': { x: 43, y: 28 },
  'C-05': { x: 53, y: 48 },
  'C-06': { x: 62, y: 68 },
  'C-07': { x: 71, y: 52 },
  'C-08': { x: 80, y: 32 },
  'C-09': { x: 88, y: 58 },
  'C-10': { x: 94, y: 78 },
};

/** Slot code for a challenge: path "A" + sequence 7 -> "A-07". */
export const slotCode = (pathCode: string, sequence: number): string =>
  `${pathCode}-${String(sequence).padStart(2, '0')}`;

/**
 * Evenly spaced fallback, for a path longer than the hand-placed set or an
 * event whose content has been re-sequenced. A node with no coordinates would
 * otherwise stack at the origin.
 */
export function positionFor(slot: string, sequence: number, total: number): NodePosition {
  const known = NODE_POSITIONS[slot];
  if (known) return known;
  const span = Math.max(1, total - 1);
  const t = (sequence - 1) / span;
  return { x: 10 + t * 80, y: 50 + Math.sin(t * Math.PI * 2) * 26 };
}

export const PATH_CODES: PathId[] = ['A', 'B', 'C'];
