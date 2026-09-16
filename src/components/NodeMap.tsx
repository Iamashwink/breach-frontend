import React, { useState } from 'react';
import { useGame } from '../context/GameContext';
import { CHALLENGES_DATA } from '../data/challengesData';
import { getChallengeDifficulty } from '../services/backend';
import { DIFFICULTY_META } from '../utils/difficulty';
import { PathId } from '../types';
import { DifficultyLevel } from '../utils/difficulty';

/** Star fills for tooltip: Easy 1/3, Medium 1.5/3, Hard 3/3. Half = 0.5. */
function starFills(level: DifficultyLevel): (0 | 0.5 | 1)[] {
  if (level === 'Easy') return [1, 0, 0];
  if (level === 'Medium') return [1, 0.5, 0];
  return [1, 1, 1];
}

/**
 * SINGLE CONFLUENCE MAP — all three lanes on one sheet, draining
 * into one ECHO mouth. No per-path tabs; lane keys only focus.
 */
const TONE: Record<PathId, { c: string; name: string; glyph: string; lane: number }> = {
  A: { c: '#E0A83E', name: 'THE ARCHIVIST', glyph: '▽', lane: 200 },
  B: { c: '#5ED6E3', name: 'THE BREACH', glyph: '△', lane: 500 },
  C: { c: '#E84D7E', name: 'THE PROTOCOL', glyph: '◇', lane: 800 },
};

const STRATA = [
  { label: 'PAST', sub: '01 – 03', y0: 8, y1: 190 },
  { label: 'PRESENT', sub: '04 – 07', y0: 190, y1: 380 },
  { label: 'FUTURE', sub: '08 – 10', y0: 380, y1: 510 },
  { label: 'ENDGAME', sub: 'ECHO', y0: 510, y1: 600, accent: true },
];

const MOUTH = { x: 500, y: 555 };

// y for node index 1..10 falls through its era bed
function nodeY(index: number): number {
  if (index <= 3) return 40 + ((index - 1) + 0.5) * ((190 - 16) / 3);
  if (index <= 7) return 198 + ((index - 4) + 0.5) * ((380 - 198) / 4);
  return 388 + ((index - 8) + 0.5) * ((510 - 388) / 3);
}

// lanes drift toward the mouth as they descend
function nodeX(pathId: PathId, index: number): number {
  const base = TONE[pathId].lane;
  const pull = Math.pow(index / 10, 1.35) * 0.82;
  return base + (MOUTH.x - base) * pull;
}

export const NodeMap: React.FC = () => {
  const {
    activeChallengeId, solvedChallengeIds, integrityScore, pathScores,
    navigateTo, openBriefing, getNodeState,
  } = useGame();

  const fallback = CHALLENGES_DATA.find((c) => getNodeState(c) === 'PLAY_NEXT') || CHALLENGES_DATA[0];
  const initial = CHALLENGES_DATA.find((c) => c.id === activeChallengeId) || fallback;
  const [selId, setSelId] = useState<string>(initial.id);
  const [hoverId, setHoverId] = useState<string | null>(null);
  const [focus, setFocus] = useState<PathId | null>(null);

  const sel = CHALLENGES_DATA.find((c) => c.id === selId) || initial;
  const hovered = hoverId ? CHALLENGES_DATA.find((c) => c.id === hoverId) || null : null;
  const teeth = (['A-10', 'B-10', 'C-10'] as const).filter((id) => solvedChallengeIds.includes(id)).length;
  const solvedTotal = solvedChallengeIds.length;

  const laneChallenges = (p: PathId) => CHALLENGES_DATA.filter((c) => c.pathId === p);
  const lanePts = (p1: { x: number; y: number }[]) => [...p1.map((p) => `${p.x},${p.y}`), `${MOUTH.x},${MOUTH.y}`].join(' ');

  const dimmed = (p: PathId) => focus !== null && focus !== p;

  return (
    <div className="flex-1 bg-[#07090F] scan-faint m-0 p-0">
      <div className="px-4 sm:px-6 pt-0">
        {/* lane keys (focus) + vitals */}
        <div className="flex flex-wrap items-stretch gap-2">
          <span className="self-center text-[10px] tracking-[0.3em] text-[#5A6379] mr-1">CONFLUENCE</span>
          {(['A', 'B', 'C'] as PathId[]).map((p) => {
            const on = focus === p;
            return (
              <button
                key={p}
                id={`btn-tab-path-${p.toLowerCase()}`}
                onClick={() => setFocus((f) => (f === p ? null : p))}
                title={on ? 'Show all lanes' : `Focus lane ${p}`}
                className={`px-4 py-2.5 border text-[11.5px] font-semibold tracking-[0.18em] transition-colors ${on ? 'bg-[#141A2B] text-[#F2F5FA]' : 'border-[#1E2536] text-[#5A6379] hover:text-[#8B93A9]'}`}
                style={on ? { borderColor: `${TONE[p].c}88`, boxShadow: `inset 0 2px 0 ${TONE[p].c}` } : {}}
              >
                <span style={{ color: TONE[p].c }}>{TONE[p].glyph}</span> {p} {TONE[p].name}
              </button>
            );
          })}
          <div className="flex flex-wrap gap-2 lg:ml-auto text-[11px] tracking-[0.12em]">
            <span className="px-3 py-2.5 border border-[#1E2536] text-[#5A6379]"><span className="text-[#E0A83E]">★</span> <b className="text-[#F2F5FA]">{teeth}/3</b> FRAGMENTS</span>
            <span className="px-3 py-2.5 border border-[#1E2536] text-[#5A6379]"><span className="text-[#E84D7E]">●</span> <b className="text-[#F2F5FA]">{integrityScore}%</b> INTEGRITY</span>
          </div>
        </div>

        {/* legend */}
        <div className="mt-3 flex flex-wrap items-center gap-x-5 gap-y-1 text-[10px] tracking-[0.25em] text-[#5A6379]">
          <span><span className="text-[#E0A83E]">▽</span> WHO <b className="text-[#8B93A9]">{pathScores.pathA}</b></span>
          <span><span className="text-[#5ED6E3]">△</span> HOW <b className="text-[#8B93A9]">{pathScores.pathB}</b></span>
          <span><span className="text-[#E84D7E]">◇</span> WHY <b className="text-[#8B93A9]">{pathScores.pathC}</b></span>
          <span><span className="text-[#F2F5FA]">●</span> HELD</span>
          <span><span className="text-[#F2F5FA]">○</span> NEXT</span>
          <span><span className="text-[#2C3550]">×</span> SEALED</span> 
          <span className="ml-auto">PRIED: <b className="text-[#F2F5FA]">{solvedTotal}</b>/30</span>
        </div>
      </div>

      <div className="mt-0 border-t border-[#1E2536]">
        {/* unified chart */}
        <div className="relative overflow-x-auto p-4">
          <div className="min-w-[860px] max-w-[1060px] mx-auto">
            <svg viewBox="0 0 1000 600" className="w-full h-auto select-none">
              {/* strata beds */}
              {STRATA.map((s) => (
                <g key={s.label}>
                  <rect x="90" y={s.y0} width="890" height={s.y1 - s.y0} fill={s.accent ? '#E84D7E08' : 'transparent'} stroke="#1E2536" strokeWidth="1" strokeDasharray={s.accent ? '' : '2 5'} />
                  <text x="10" y={s.y0 + 20} fill={s.accent ? '#E84D7E' : '#5A6379'} fontSize="10" letterSpacing="3" fontFamily="IBM Plex Mono">{s.label}</text>
                  <text x="10" y={s.y0 + 34} fill="#2C3550" fontSize="8" letterSpacing="1" fontFamily="IBM Plex Mono">{s.sub}</text>
                </g>
              ))}

              {/* lane threads */}
              {(['A', 'B', 'C'] as PathId[]).map((p) => {
                const nodes = laneChallenges(p).map((c) => ({ x: nodeX(p, c.index), y: nodeY(c.index) }));
                return (
                  <g key={p} opacity={dimmed(p) ? 0.18 : 1}>
                    <polyline points={lanePts(nodes)} fill="none" stroke="#2C3550" strokeWidth="5" opacity="0.35" />
                    <polyline points={lanePts(nodes)} fill="none" stroke={TONE[p].c} strokeWidth="1.6" strokeDasharray="9 7" opacity="0.6" />
                    {/* solid weld over held stretches */}
                    {laneChallenges(p).slice(0, -1).map((c, i) => {
                      if (!solvedChallengeIds.includes(c.id)) return null;
                      const a = nodes[i];
                      const b = nodes[i + 1];
                      return <line key={c.id} x1={a.x} y1={a.y} x2={b.x} y2={b.y} stroke={TONE[p].c} strokeWidth="2.4" opacity="0.9" />;
                    })}
                    {/* lane tag */}
                    <text x={TONE[p].lane} y={30} textAnchor="middle" fontSize="10" letterSpacing="2" fill={TONE[p].c} fontFamily="IBM Plex Mono" opacity="0.9">
                      {TONE[p].glyph} LANE {p}
                    </text>
                  </g>
                );
              })}

              {/* seals — all 30 */}
              {(['A', 'B', 'C'] as PathId[]).map((p) =>
                laneChallenges(p).map((c) => {
                  const x = nodeX(p, c.index);
                  const y = nodeY(c.index);
                  const st = getNodeState(c);
                  const isSel = sel.id === c.id;
                  const isHov = hoverId === c.id;
                  const held = st === 'SOLVED';
                  const nextUp = st === 'PLAY_NEXT';
                  return (
                    <g
                      key={c.id}
                      transform={`translate(${x},${y})`}
                      opacity={dimmed(p) ? 0.25 : 1}
                      className="cursor-pointer"
                      onClick={() => { setSelId(c.id); openBriefing(c.id); }}
                      onMouseEnter={() => setHoverId(c.id)}
                      onMouseLeave={() => setHoverId(null)}
                    >
                      {(isSel || isHov) && (
                        <rect x="-26" y="-26" width="52" height="52" fill="none" stroke="#F2F5FA" strokeWidth="1" strokeDasharray="4 3" transform="rotate(45)" opacity="0.85" />
                      )}
                      {nextUp && (
                        <circle r="22" fill="none" stroke={TONE[p].c} strokeWidth="1" opacity="0.55">
                          <animate attributeName="r" values="18;27;18" dur="3s" repeatCount="indefinite" />
                          <animate attributeName="opacity" values="0.55;0;0.55" dur="3s" repeatCount="indefinite" />
                        </circle>
                      )}
                      {held && (
                        <g fill={TONE[p].c} opacity="0.9">
                          <rect x="-11" y="-34" width="4.5" height="4.5" transform="rotate(45 -11 -34)" />
                          <rect x="-2.2" y="-34" width="4.5" height="4.5" transform="rotate(45 -2.2 -34)" />
                          <rect x="6.5" y="-34" width="4.5" height="4.5" transform="rotate(45 6.5 -34)" />
                        </g>
                      )}
                      <circle r="16" fill={held ? `${TONE[p].c}2E` : '#0B0E16'} stroke={held || nextUp ? (nextUp ? '#F2F5FA' : TONE[p].c) : '#2C3550'} strokeWidth={held || nextUp ? 2 : 1.2} />
                      <text y="4.5" textAnchor="middle" fontSize="10.5" fontWeight="bold" fill={held || nextUp ? '#F2F5FA' : '#454C61'} fontFamily="IBM Plex Mono">
                        {held ? '●' : st === 'LOCKED' ? '×' : String(c.index).padStart(2, '0')}
                      </text>
                      <text y="31" textAnchor="middle" fontSize="8.5" letterSpacing="1" fill={held || nextUp || isSel ? '#8B93A9' : '#3A4358'} fontFamily="IBM Plex Mono">
                        {p}-{String(c.index).padStart(2, '0')}
                      </text>
                      {isHov && (() => {
                        const level = getChallengeDifficulty(c);
                        const starColor = DIFFICULTY_META[level].color;
                        const fills = starFills(level);
                        return (
                          <g transform="translate(0,-70)">
                            <rect x="-110" y="-38" width="220" height="76" fill="#0B0E16" stroke={TONE[p].c} />
                            <text y="-20" textAnchor="middle" fontSize="9" letterSpacing="2" fill="#F2F5FA" fontFamily="IBM Plex Mono">
                              {c.category.toUpperCase()}
                            </text>
                            <text y="-4" textAnchor="middle" fontSize="8.5" letterSpacing="1.5" fill="#8B93A9" fontFamily="IBM Plex Mono">
                              {(c.title || '').toUpperCase().slice(0, 28)}
                            </text>
                            <text y="10" textAnchor="middle" fontSize="8" letterSpacing="1" fill="#5A6379" fontFamily="IBM Plex Mono">
                              {(c.subtitle || '').toUpperCase().slice(0, 32)}
                            </text>
                            <text y="27" textAnchor="middle" fontSize="11" letterSpacing="3" fontFamily="IBM Plex Mono">
                              {fills.map((f, i) => (
                                f === 1 ? (
                                  <tspan key={i} fill={starColor}>★</tspan>
                                ) : f === 0.5 ? (
                                  <tspan key={i} fill={starColor} opacity={0.5}>★</tspan>
                                ) : (
                                  <tspan key={i} fill="#454C61">☆</tspan>
                                )
                              ))}
                            </text>
                          </g>
                        );
                      })()}
                    </g>
                  );
                })
              )}

              {/* the single mouth */}
              <g transform={`translate(${MOUTH.x},${MOUTH.y})`} className="cursor-pointer" onClick={() => navigateTo('CONVERGENCE')}>
                <circle r="34" fill="#E84D7E14" stroke="#E84D7E" strokeWidth="1.5">
                  <animate attributeName="r" values="32;36;32" dur="4s" repeatCount="indefinite" />
                </circle>
                <circle r="24" fill="none" stroke="#E84D7E" strokeWidth="1" strokeDasharray="3 4" opacity="0.7" />
                <circle r="4" fill={teeth === 3 ? '#5ED6E3' : '#2C3550'}>
                  {teeth === 3 && <animate attributeName="opacity" values="1;0.4;1" dur="2s" repeatCount="indefinite" />}
                </circle>
                <g transform="translate(0,48)">
                  <rect x="-70" y="-10" width="140" height="20" fill="#07090F" stroke="#E84D7E88" />
                  <text y="4" textAnchor="middle" fontSize="9" letterSpacing="2" fill="#C6CCDA" fontFamily="IBM Plex Mono">ECHO · {teeth}/3 TEETH</text>
                </g>
              </g>
            </svg>
          </div>
          {hovered && (() => {
            const level = getChallengeDifficulty(hovered);
            const starColor = DIFFICULTY_META[level].color;
            const fills = starFills(level);
            return (
              <div className="max-w-[1060px] mx-auto mt-1 text-[11px] tracking-[0.1em] text-[#5A6379] flex items-center gap-2">
                <span className="text-[#F2F5FA]">{hovered.category.toUpperCase()}</span>
                <span className="text-[#8B93A9]">{(hovered.title || '').toUpperCase()}</span>
                <span className="tracking-[0.2em]">
                  {fills.map((f, i) => (
                    f === 1 ? (
                      <span key={i} style={{ color: starColor }}>★</span>
                    ) : f === 0.5 ? (
                      <span key={i} style={{ color: starColor, opacity: 0.5 }}>★</span>
                    ) : (
                      <span key={i} className="text-[#454C61]">☆</span>
                    )
                  ))}
                </span>
              </div>
            );
          })()}
        </div>
      </div>
    </div>
  );
};
