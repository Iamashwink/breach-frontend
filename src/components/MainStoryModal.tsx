import React from 'react';
import { useGame } from '../context/GameContext';
import { getMainStory } from '../services/backend';

/**
 * Full-story window: covers the whole page above everything else (z-[70])
 * and opens only via the SHOW STORY button in the top panel.
 */
export const MainStoryModal: React.FC = () => {
  const { storyOpen, setStoryOpen } = useGame();
  const MAIN_STORY = getMainStory();

  if (!storyOpen) return null;

  return (
    <div className="fixed inset-0 z-[70] bg-black/85 scan-faint overflow-y-auto" role="dialog" aria-modal="true" aria-label="Main story">
      <div className="min-h-full flex items-start sm:items-center justify-center p-4 sm:p-8">
        <div className="w-full max-w-3xl border border-[#1E2536] bg-[#0B0E16] px-5 sm:px-8 py-6">
          <div className="flex items-center justify-between gap-4">
            <div className="text-[10px] font-semibold tracking-[0.25em] text-[#5ED6E3]">MAIN STORY // {MAIN_STORY.title}</div>
            <button onClick={() => setStoryOpen(false)} className="text-[11px] tracking-[0.2em] text-[#5A6379] hover:text-[#E84D7E] cursor-pointer">
              [ CLOSE ]
            </button>
          </div>
          <h2 className="mt-2 font-display text-xl text-[#F2F5FA] italic font-lore normal-case">“{MAIN_STORY.tagline}”</h2>
          <div className="mt-4 space-y-3">
            {MAIN_STORY.body.map((p, i) => (
              <p key={i} className="text-[13px] leading-relaxed text-[#9AA2B5]">{p}</p>
            ))}
          </div>
          <div className="mt-4 flex flex-wrap gap-x-3 gap-y-1 text-[10px] tracking-[0.25em] text-[#5A6379]">
            {MAIN_STORY.facts.map((f) => (<span key={f}>· {f}</span>))}
          </div>
          <button
            onClick={() => setStoryOpen(false)}
            className="mt-6 w-full py-3 bg-[#5ED6E3] hover:bg-[#7CE3EE] text-[#06232A] text-[12px] font-bold tracking-[0.22em] transition-colors cursor-pointer"
          >
            CLOSE →
          </button>
        </div>
      </div>
    </div>
  );
};
