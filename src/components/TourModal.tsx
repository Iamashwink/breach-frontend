import React, { useState } from 'react';
import { useGame } from '../context/GameContext';

export const TourModal: React.FC = () => {
  const { tourOpen, toggleTour, navigateTo } = useGame();
  const [step, setStep] = useState(0);
  if (!tourOpen) return null;

  // Kept in step with the server's rules: reveal window, skip quota and free
  // switch threshold all live in `services/signal-zero/config.ts`.
  const pages = [
    ['The night', '41 bytes landed in three places sharing no wire. “We have already tried this once.”'],
    ['Open the gate', 'Solve Transmission Zero first. Until it falls, no path will take you.'],
    ['Three paths', 'A · Who built it. B · How it moves. C · Why it rehearses. Ten nodes each — but you run one path at a time, and a path you leave closes forever.'],
    ['The window', 'Two nodes open at the start; each one you close opens another, so three sit in front of you. The rest stay sealed.'],
    ['Weight', 'Flags read BreachPoint{...}. A node’s value decays as other teams solve it — first blood is worth the most. Hints are paid out of your score.'],
    ['Cost', 'Four skips for the whole event. A skip scores zero and drops that path to 80%. Switching paths before eight solves costs the same 80%.'],
    ['The rite', 'Each path’s final node hands over a fragment. Hold all three and the Convergence opens.'],
  ];

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-6 bg-black/80" onClick={() => toggleTour(false)}>
      <div className="w-full max-w-md" onClick={(e) => e.stopPropagation()}>
        <div className="text-[10px] tracking-[0.3em] text-[#454C61] flex justify-between"><span>MANUAL · {step + 1}/{pages.length}</span><button onClick={() => toggleTour(false)}>✕</button></div>
        <h2 className="mt-4 font-display text-2xl uppercase tracking-wide text-[#F2F5FA]">{pages[step][0]}</h2>
        <p className="mt-3 text-[14px] text-[#8B93A9] leading-relaxed">{pages[step][1]}</p>
        <div className="mt-8 flex justify-between text-[12px] font-semibold tracking-[0.15em]">
          <button onClick={() => setStep(v => Math.max(0, v - 1))} disabled={step === 0} className="text-[#454C61] disabled:opacity-30">← BACK</button>
          <button id="btn-tour-next-step" onClick={() => { if (step < pages.length - 1) setStep(v => v + 1); else { toggleTour(false); navigateTo('DASHBOARD'); } }} className="text-[#5ED6E3] border-b border-[#5ED6E3] pb-0.5">
            {step === pages.length - 1 ? 'OPEN DASHBOARD →' : 'NEXT →'}
          </button>
        </div>
      </div>
    </div>
  );
};
