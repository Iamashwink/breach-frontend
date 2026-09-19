import React from 'react';
import { useGame } from '../../context/GameContext';
import { ViewType } from '../../types';

const TABS: { label: string; view: ViewType }[] = [
  { label: 'OVERVIEW', view: 'ADMIN' },
  { label: 'EVENTS', view: 'ADMIN_EVENTS' },
  { label: 'CHALLENGES', view: 'ADMIN_CHALLENGES' },
  { label: 'TIME GLITCHES', view: 'ADMIN_GLITCHES' },
];

export const AdminNav: React.FC = () => {
  const { currentView, navigateTo } = useGame();

  return (
    <div className="border-b border-[#1E2536] bg-[#0A0D15] px-6 py-3">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-6">
          <button onClick={() => navigateTo('DASHBOARD')} className="text-[10px] tracking-[0.2em] text-[#5A6379] hover:text-[#5ED6E3] cursor-pointer">
            ← BACK TO CTF
          </button>
          <span className="text-[11px] tracking-[0.3em] text-[#E0A83E] font-semibold">ADMIN CONSOLE</span>
        </div>
      </div>
      <div className="mt-3 flex gap-1">
        {TABS.map((t) => {
          const on = currentView === t.view;
          return (
            <button
              key={t.view}
              onClick={() => navigateTo(t.view)}
              className={`px-4 py-2 text-[11px] tracking-[0.18em] cursor-pointer transition-colors ${
                on
                  ? 'text-[#E0A83E] bg-[#E0A83E]/[0.08] border-b-2 border-[#E0A83E]'
                  : 'text-[#5A6379] hover:text-[#8B93A9]'
              }`}
            >
              {t.label}
            </button>
          );
        })}
      </div>
    </div>
  );
};
