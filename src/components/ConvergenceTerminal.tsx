import React, { useState } from 'react';
import { useGame } from '../context/GameContext';
import { PATHS_DATA } from '../data/pathsData';

export const ConvergenceTerminal: React.FC = () => {
  const { convergenceKeys, updateConvergenceKey, executeConvergence, convergenceRevealed, navigateTo, solvedChallengeIds } = useGame();
  const [msg, setMsg] = useState<{ type: 'success' | 'error' | 'idle'; text: string }>({ type: 'idle', text: '' });

  const rows = [
    { i: 1 as const, name: 'Who', tone: '#E0A83E', key: convergenceKeys.key1, done: solvedChallengeIds.includes('A-10') },
    { i: 2 as const, name: 'How', tone: '#5ED6E3', key: convergenceKeys.key2, done: solvedChallengeIds.includes('B-10') },
    { i: 3 as const, name: 'Why', tone: '#E84D7E', key: convergenceKeys.key3, done: solvedChallengeIds.includes('C-10') },
  ];

  const go = (e: React.FormEvent) => {
    e.preventDefault();
    const r = executeConvergence();
    setMsg({ type: r.success ? 'success' : 'error', text: r.message });
  };

  return (
    <div className="flex-1 bg-[#07090F]">
      <div className="max-w-xl mx-auto px-6 py-16 text-center">
        {convergenceRevealed ? (
          <>
            <div className="text-[10px] tracking-[0.35em] text-[#5ED6E3]">■ THE MOUTH HAS SPOKEN</div>
            <h1 className="mt-4 font-display font-medium uppercase tracking-wide text-5xl text-[#F2F5FA]">It is <span className="font-lore italic normal-case text-[#8B93A9]">finished.</span></h1>
            <p className="mt-8 font-lore italic text-2xl text-[#F2F5FA] leading-relaxed">“You didn’t investigate the experiment. You were its second rehearsal.”</p>
            <p className="mt-6 text-[13px] text-[#5A6379] leading-relaxed">Meridian was not an accident. The 41 bytes never travelled — they were remembered. +1,000 PTS.</p>
            <div className="mt-8 flex justify-center gap-6 text-[12px] font-semibold tracking-[0.2em]">
              <button onClick={() => navigateTo('BOARD')} className="text-[#F2F5FA] border-b border-[#5ED6E3] pb-1">ROSTER →</button>
              <button onClick={() => navigateTo('MAP')} className="text-[#5A6379]">CHART →</button>
            </div>
          </>
        ) : (
          <>
            <div className="text-[10px] tracking-[0.35em] text-[#5A6379]">THE FINAL RITE // THREE TEETH, ONE MOUTH</div>
            <h1 className="mt-4 font-display font-medium uppercase tracking-wide text-4xl text-[#F2F5FA]">Lay down <span className="font-lore italic normal-case text-[#8B93A9]">all three</span></h1>
            <p className="mt-4 text-[13px] text-[#5A6379]">The last confession from A-10, B-10, C-10.</p>
            <form onSubmit={go} className="mt-10 text-left divide-y divide-[#1E2536]">
              {rows.map((r) => (
                <div key={r.i} className="py-6">
                  <div className="flex justify-between text-[11px] font-semibold tracking-[0.25em]">
                    <span style={{ color: r.tone }}>{r.i} · {r.name.toUpperCase()} {r.done ? '✓' : ''}</span>
                    <button type="button" onClick={() => updateConvergenceKey(r.i, r.i === 1 ? PATHS_DATA.A.convergenceKey : r.i === 2 ? PATHS_DATA.B.convergenceKey : PATHS_DATA.C.convergenceKey)} className="font-normal text-[#454C61] hover:text-[#8B93A9]">PLACE</button>
                  </div>
                  <input id={`convergence-key-${r.i}`} value={r.key} onChange={(e) => updateConvergenceKey(r.i, e.target.value)} placeholder={`BreachPoint{${r.name.toUpperCase()}_...}`} className="mt-2 w-full bg-transparent border-b border-[#1E2536] py-2 font-mono text-[13px] focus:outline-none placeholder-[#454C61]" style={{ color: r.tone }} />
                </div>
              ))}
              <div className="pt-8 text-center">
                <button type="submit" id="btn-execute-convergence" className="text-[13px] font-bold tracking-[0.25em] text-[#06232A] bg-[#5ED6E3] hover:bg-[#7CE3EE] px-8 py-3.5 transition-colors">CLOSE THE MOUTH (+1,000)</button>
                {msg.type !== 'idle' && <div className={`mt-4 text-[13px] ${msg.type === 'success' ? 'text-[#5ED6E3]' : 'text-[#E84D7E]'}`}>{msg.text}</div>}
              </div>
            </form>
          </>
        )}
      </div>
    </div>
  );
};
