import React, { useState, useEffect } from 'react';
import { useGame } from '../context/GameContext';
import { getCharacterForSpeaker } from '../data/charactersData';

export const BriefingModal: React.FC = () => {
  const { showBriefingModal, closeBriefing, briefingChallenge, navigateTo } = useGame();
  const slides = briefingChallenge?.briefing.slides || ['I signed off on ECLIPSE.'];
  const [idx, setIdx] = useState(0);
  const [shown, setShown] = useState('');
  const character = getCharacterForSpeaker(briefingChallenge?.briefing.speaker || '');

  useEffect(() => { setIdx(0); setShown(''); }, [briefingChallenge?.id, showBriefingModal]);
  useEffect(() => {
    if (!showBriefingModal) return;
    const full = slides[idx] || '';
    let i = 0; setShown('');
    const t = setInterval(() => { if (i < full.length) { setShown(full.slice(0, ++i)); } else clearInterval(t); }, 16);
    return () => clearInterval(t);
  }, [idx, showBriefingModal, briefingChallenge?.id]);

  if (!showBriefingModal || !briefingChallenge) return null;

  const next = () => {
    if (shown.length < (slides[idx]?.length || 0)) setShown(slides[idx]);
    else if (idx < slides.length - 1) setIdx(v => v + 1);
    else { closeBriefing(); navigateTo('CHALLENGE', briefingChallenge.id); }
  };

  return (
    <div className="fixed inset-x-0 bottom-0 z-50 flex justify-center px-4 pb-4 sm:px-6 sm:pb-6 pointer-events-none">
      <div className="pointer-events-auto w-full max-w-2xl border border-[#1E2536] bg-[#0B0E16] px-6 py-5">
        <div className="text-[10px] tracking-[0.3em] text-[#454C61] flex justify-between">
          <span>WITNESS LOG · {briefingChallenge.id}</span>
          <button onClick={closeBriefing}>CLOSE ✕</button>
        </div>
        <div className="mt-2 text-[12px] text-[#5A6379]"><span className="text-[#5ED6E3]">{character.name}</span> — {briefingChallenge.briefing.subTag}</div>
        <div onClick={next} className="mt-6 min-h-[140px] cursor-pointer">
          <p className="font-lore text-2xl leading-relaxed text-[#F2F5FA]">{shown}</p>
        </div>
        <div className="mt-8 flex items-center justify-between">
          <span className="text-[11px] text-[#454C61]">{idx + 1} / {slides.length}</span>
          <div className="flex gap-5 text-[12px] font-semibold tracking-[0.15em]">
            <button id="btn-briefing-map-return" onClick={closeBriefing} className="text-[#454C61]">FILE</button>
            <button id="btn-briefing-skip-to-challenge" onClick={() => { closeBriefing(); navigateTo('CHALLENGE', briefingChallenge.id); }} className="text-[#454C61]">SKIP</button>
            <button id="btn-briefing-next" onClick={next} className="text-[#5ED6E3] border-b border-[#5ED6E3] pb-0.5">{idx < slides.length - 1 ? 'NEXT →' : 'FACE IT →'}</button>
          </div>
        </div>
      </div>
    </div>
  );
};
