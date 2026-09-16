import React, { useEffect, useMemo, useState } from 'react';
import { useGame } from '../context/GameContext';
import { getCharacterForSpeaker } from '../data/charactersData';
import { PATH_SKINS } from '../data/pathsData';
import { toSlides } from '../data/storyData';

/**
 * Pre-transmission briefing, typed out a slide at a time.
 *
 * The words are the server's `pre_story` for that challenge, split into slides
 * client-side; the face and name fronting them are the path's lead, which is
 * presentation the API has no column for.
 */
export const BriefingModal: React.FC = () => {
  const { showBriefingModal, closeBriefing, briefingChallenge, navigateTo } = useGame();

  const slides = useMemo(
    () => (briefingChallenge?.preStory ? toSlides(briefingChallenge.preStory) : []),
    [briefingChallenge?.preStory],
  );
  const speaker = briefingChallenge ? PATH_SKINS[briefingChallenge.pathId].lead : '';
  const character = getCharacterForSpeaker(speaker);

  const [idx, setIdx] = useState(0);
  const [shown, setShown] = useState('');

  useEffect(() => {
    setIdx(0);
    setShown('');
  }, [briefingChallenge?.slot, showBriefingModal]);

  useEffect(() => {
    if (!showBriefingModal) return;
    const full = slides[idx] || '';
    let i = 0;
    setShown('');
    const t = setInterval(() => {
      if (i < full.length) setShown(full.slice(0, ++i));
      else clearInterval(t);
    }, 16);
    return () => clearInterval(t);
  }, [idx, showBriefingModal, slides]);

  if (!showBriefingModal || !briefingChallenge || slides.length === 0) return null;

  const enterChallenge = () => {
    closeBriefing();
    navigateTo('CHALLENGE', briefingChallenge.slot);
  };

  const next = () => {
    if (shown.length < (slides[idx]?.length || 0)) setShown(slides[idx]);
    else if (idx < slides.length - 1) setIdx((v) => v + 1);
    else enterChallenge();
  };

  return (
    <div className="fixed inset-x-0 bottom-0 z-50 flex justify-center px-4 pb-4 sm:px-6 sm:pb-6 pointer-events-none">
      <div className="pointer-events-auto w-full max-w-2xl border border-[#1E2536] bg-[#0B0E16] px-6 py-5">
        <div className="text-[10px] tracking-[0.3em] text-[#454C61] flex justify-between">
          <span>WITNESS LOG · {briefingChallenge.slot}</span>
          <button onClick={closeBriefing} className="cursor-pointer">CLOSE ✕</button>
        </div>
        <div className="mt-2 text-[12px] text-[#5A6379]">
          <span className="text-[#5ED6E3]">{character.name}</span> — PATH {briefingChallenge.pathId} ·{' '}
          {briefingChallenge.title}
        </div>
        <div onClick={next} className="mt-6 min-h-[140px] cursor-pointer">
          <p className="font-lore text-2xl leading-relaxed text-[#F2F5FA]">{shown}</p>
        </div>
        <div className="mt-8 flex items-center justify-between">
          <span className="text-[11px] text-[#454C61]">{idx + 1} / {slides.length}</span>
          <div className="flex gap-5 text-[12px] font-semibold tracking-[0.15em]">
            <button id="btn-briefing-map-return" onClick={closeBriefing} className="text-[#454C61] cursor-pointer">FILE</button>
            <button id="btn-briefing-skip-to-challenge" onClick={enterChallenge} className="text-[#454C61] cursor-pointer">SKIP</button>
            <button id="btn-briefing-next" onClick={next} className="text-[#5ED6E3] border-b border-[#5ED6E3] pb-0.5 cursor-pointer">
              {idx < slides.length - 1 ? 'NEXT →' : 'FACE IT →'}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};
