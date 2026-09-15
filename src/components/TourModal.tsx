import React, { useState } from 'react';
import { useGame } from '../context/GameContext';

export const TourModal: React.FC = () => {
  const { tourOpen, toggleTour, navigateTo } = useGame();
  const [step, setStep] = useState(0);
  if (!tourOpen) return null;

  const pages = [
    ['The night', '41 bytes landed in three places sharing no wire. “We have already tried this once.”'],
    ['Three paths', 'A · Who — who built it. B · How — how it moves. C · Why — why it rehearses. Ten levels each.'],
    ['Weight', 'Levels pay 150–500 PTS. Confess as axios{...}. Wrong ones cost condition.'],
    ['Hands', '1 2 3 paths · M map · L roster · C rite · ESC back.'],
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
