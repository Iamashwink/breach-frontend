import React, { useState } from 'react';
import { useGame } from '../context/GameContext';
import { TONE } from '../data/pathsData';
import { FragmentKey, PathId } from '../types';

const FRAGMENT_ROWS: { key: FragmentKey; label: string; path: PathId }[] = [
  { key: 'who', label: 'WHO', path: 'A' },
  { key: 'how', label: 'HOW', path: 'B' },
  { key: 'why', label: 'WHY', path: 'C' },
];

/**
 * The endgame.
 *
 * One challenge, one flag — the server gates it on holding all three fragments
 * and checks the answer like any other submission. The old three-input form
 * (with a PLACE button that filled in the answers from a client-side table)
 * is gone: the flags were never the client's to hold.
 */
export const ConvergenceTerminal: React.FC = () => {
  const { convergence, fragments, submitFlag, navigateTo, paths, busy } = useGame();
  const [flag, setFlag] = useState('');
  const [msg, setMsg] = useState<{ type: 'success' | 'error' | 'idle'; text: string }>({
    type: 'idle',
    text: '',
  });

  const solved = convergence?.status === 'solved';

  const go = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!convergence || !flag.trim() || busy) return;
    const r = await submitFlag(convergence.id, flag);
    setMsg({ type: r.success ? 'success' : 'error', text: r.message });
    if (r.success) setFlag('');
  };

  return (
    <div className="flex-1 bg-[#07090F]">
      <div className="max-w-xl mx-auto px-6 py-16 text-center">
        {solved ? (
          <>
            <div className="text-[10px] tracking-[0.35em] text-[#5ED6E3]">■ THE MOUTH HAS SPOKEN</div>
            <h1 className="mt-4 font-display font-medium uppercase tracking-wide text-5xl text-[#F2F5FA]">
              It is <span className="font-lore italic normal-case text-[#8B93A9]">finished.</span>
            </h1>
            <p className="mt-8 font-lore italic text-2xl text-[#F2F5FA] leading-relaxed">
              “You didn’t investigate the experiment. You were its second rehearsal.”
            </p>
            <div className="mt-8 flex justify-center gap-6 text-[12px] font-semibold tracking-[0.2em]">
              <button onClick={() => navigateTo('BOARD')} className="text-[#F2F5FA] border-b border-[#5ED6E3] pb-1 cursor-pointer">
                ROSTER →
              </button>
              <button onClick={() => navigateTo('MAP')} className="text-[#5A6379] cursor-pointer">
                CHART →
              </button>
            </div>
          </>
        ) : (
          <>
            <div className="text-[10px] tracking-[0.35em] text-[#5A6379]">
              THE FINAL RITE // THREE TEETH, ONE MOUTH
            </div>
            <h1 className="mt-4 font-display font-medium uppercase tracking-wide text-4xl text-[#F2F5FA]">
              Lay down <span className="font-lore italic normal-case text-[#8B93A9]">all three</span>
            </h1>

            <div className="mt-10 text-left divide-y divide-[#1E2536]">
              {FRAGMENT_ROWS.map((row) => {
                const held = fragments.includes(row.key);
                const path = paths.find((p) => p.code === row.path);
                return (
                  <div key={row.key} className="py-5 flex items-center justify-between gap-4">
                    <div>
                      <div className="text-[11px] font-semibold tracking-[0.25em]" style={{ color: TONE[row.path] }}>
                        {row.label} — PATH {row.path}
                      </div>
                      <div className="mt-1 text-[11px] text-[#5A6379]">
                        {path?.name ?? '—'} · {path?.solved ?? 0}/{path?.total ?? 10}
                      </div>
                    </div>
                    <span
                      className="text-[11px] font-bold tracking-[0.2em]"
                      style={{ color: held ? TONE[row.path] : '#454C61' }}
                    >
                      {held ? '✦ HELD' : '— SEALED'}
                    </span>
                  </div>
                );
              })}
            </div>

            {convergence ? (
              <form onSubmit={go} className="mt-10 text-left">
                <div className="text-[10px] tracking-[0.3em] text-[#5ED6E3]">{convergence.title}</div>
                <p className="mt-3 text-[13px] leading-relaxed text-[#9AA2B5]">{convergence.objective}</p>
                <div className="mt-6 flex items-center gap-3 border-b border-[#2C3550] pb-3">
                  <span className="text-[#454C61]">$</span>
                  <input
                    id="convergence-flag"
                    value={flag}
                    onChange={(e) => setFlag(e.target.value)}
                    placeholder="BreachPoint{...}"
                    className="flex-1 bg-transparent font-mono text-[14px] text-[#F2F5FA] focus:outline-none placeholder-[#454C61]"
                  />
                </div>
                <div className="mt-8 text-center">
                  <button
                    type="submit"
                    id="btn-execute-convergence"
                    disabled={busy || !flag.trim()}
                    className="text-[13px] font-bold tracking-[0.25em] text-[#06232A] bg-[#5ED6E3] hover:bg-[#7CE3EE] disabled:opacity-30 px-8 py-3.5 transition-colors cursor-pointer"
                  >
                    {busy ? 'CHECKING…' : `CLOSE THE MOUTH (+${convergence.points})`}
                  </button>
                  {msg.type !== 'idle' && (
                    <div className={`mt-4 text-[13px] ${msg.type === 'success' ? 'text-[#5ED6E3]' : 'text-[#E84D7E]'}`}>
                      {msg.text}
                    </div>
                  )}
                </div>
              </form>
            ) : (
              <p className="mt-10 text-[13px] leading-relaxed text-[#5A6379]">
                The terminal stays shut until all three fragments are in hand. Finish a path to its
                final node and it hands you one — {fragments.length} of 3 so far.
              </p>
            )}
          </>
        )}
      </div>
    </div>
  );
};
