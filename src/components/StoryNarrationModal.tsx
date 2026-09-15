import React from 'react';
import { useGame } from '../context/GameContext';

/**
 * Post-challenge + path-completion narration modal.
 * Queued in GameContext.submitFlag; dismiss advances the queue.
 * Pre-challenge narration lives in ChallengeView (briefing) — this covers the "post" half.
 */
export const StoryNarrationModal: React.FC = () => {
  const { narrationQueue, dismissNarration, navigateTo } = useGame();
  const head = narrationQueue[0];
  if (!head) return null;

  return (
    <div className="fixed inset-x-0 bottom-0 z-50 flex justify-center px-4 pb-4 sm:px-6 sm:pb-6 pointer-events-none">
      <div className="pointer-events-auto w-full max-w-2xl border border-[#1E2536] bg-[#0B0E16] px-6 py-5">
        <div className="text-[10px] tracking-[0.3em] text-[#454C61] flex justify-between">
          <span>{head.kind === 'path' ? 'PATH COMPLETE // EPILOGUE' : 'DEBRIEF // POST-TRANSMISSION'}</span>
          <button onClick={dismissNarration}>CONTINUE ✕</button>
        </div>
        <div className="mt-2 text-[13px] font-bold tracking-[0.1em] text-[#F2F5FA]">{head.title}</div>
        <div className="mt-1 text-[11px] text-[#5A6379]"><span className="text-[#5ED6E3]">{head.speaker}</span> — {head.subTag}</div>
        <div className="mt-5 space-y-3">
          {head.lines.map((l, i) => (
            <p key={i} className={i === 0 ? 'font-lore italic text-[19px] leading-relaxed text-[#F2F5FA]' : 'text-[13px] leading-relaxed text-[#9AA2B5]'}>
              {l}
            </p>
          ))}
        </div>
        {narrationQueue.length > 1 && (
          <div className="mt-3 text-[10px] tracking-[0.25em] text-[#454C61]">+{narrationQueue.length - 1} MORE TRANSMISSION{narrationQueue.length > 2 ? 'S' : ''} QUEUED</div>
        )}
        <div className="mt-6 flex items-center justify-between">
          <button onClick={() => { dismissNarration(); navigateTo('DASHBOARD'); }} className="text-[11px] tracking-[0.2em] text-[#5A6379] hover:text-[#8B93A9]">
            ← DASHBOARD
          </button>
          <button id="btn-narration-continue" onClick={dismissNarration} className="px-6 py-2.5 bg-[#5ED6E3] hover:bg-[#7CE3EE] text-[#06232A] text-[12px] font-bold tracking-[0.2em]">
            CONTINUE →
          </button>
        </div>
      </div>
    </div>
  );
};
