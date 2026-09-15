import React, { useState, useEffect } from 'react';
import { useGame } from '../context/GameContext';
import { DashboardOverlay } from './DashboardOverlay';
import { PathId, ViewType } from '../types';

const NAV: { label: string; view: ViewType; pathId?: PathId }[] = [
  { label: 'DASHBOARD', view: 'DASHBOARD' },
  { label: 'MAP', view: 'MAP' },
  { label: 'PATH A', view: 'TRAIL', pathId: 'A' },
  { label: 'PATH B', view: 'TRAIL', pathId: 'B' },
  { label: 'PATH C', view: 'TRAIL', pathId: 'C' },
  { label: 'LEADERBOARD', view: 'BOARD' },
];

/** Live 15:00 time-glitch countdown. */
const GlitchTimer: React.FC = () => {
  const { glitchEndsAt } = useGame();
  const [, tick] = useState(0);
  useEffect(() => {
    const t = setInterval(() => tick((x) => x + 1), 500);
    return () => clearInterval(t);
  }, []);
  if (!glitchEndsAt) return <span className="font-display text-4xl tracking-[0.1em] text-[#5A6379]">--:--</span>;
  const ms = Math.max(0, glitchEndsAt - Date.now());
  if (ms <= 0) return <span className="font-display text-2xl tracking-[0.15em] text-[#E84D7E]">◉ TIME GLITCH ACTIVE</span>;
  const mm = Math.floor(ms / 60000).toString().padStart(2, '0');
  const ss = Math.floor((ms % 60000) / 1000).toString().padStart(2, '0');
  return <span className="font-display text-4xl tracking-[0.1em] text-[#5ED6E3]">T−{mm}:{ss}</span>;
};

export const Header: React.FC = () => {
  const {
    currentView, activePath, navigateTo, toggleTour,
    pathScores, resetProgress,
    currentUser, logout, chosenPath, isPathComplete, isPathLocked,
    glitchEndsAt, startGlitch,
  } = useGame();
  const [showGlitch, setShowGlitch] = useState(false);

  const go = (view: ViewType, pathId?: PathId) => navigateTo(view, null, pathId);

  // Status mark per path entry: ● active · ✓ complete · ■ sealed
  const pathMark = (pathId?: PathId) => {
    if (!pathId) return '';
    if (isPathComplete(pathId)) return ' ✓';
    if (pathId === chosenPath) return ' ●';
    if (isPathLocked(pathId)) return ' ■';
    return '';
  };
  const isOn = (view: ViewType, pathId?: PathId) =>
    view === 'TRAIL' ? currentView === 'TRAIL' && activePath === pathId : currentView === view;

  const openGlitch = () => {
    if (!glitchEndsAt) startGlitch();
    setShowGlitch(true);
  };

  return (
    <>
      {/* mobile */}
      <div className="lg:hidden border-b border-[#1E2536] bg-[#0B0E16] px-4 py-3 flex items-center justify-between">
        <button id="brand-logo-btn" onClick={() => navigateTo('GATE')} className="font-display tracking-[0.3em] text-sm text-[#F2F5FA]">BREACH POINT</button>
        <div className="flex items-center gap-3">
          <button id="header-points-hud" onClick={() => navigateTo('BOARD')} className="text-[12px] text-[#5ED6E3]">■ {pathScores.total.toLocaleString()}</button>
          <button id="btn-tour-guide" onClick={() => toggleTour(true)} className="text-[11px] text-[#5A6379]">MANUAL</button>
        </div>
      </div>
      <div className="lg:hidden border-b border-[#1E2536] bg-[#07090F] px-4 py-2 flex gap-4 overflow-x-auto">
        {NAV.map((n) => (
          <button key={`${n.view}-${n.pathId || ''}`} id={`nav-btn-${n.view.toLowerCase()}${n.pathId ? `-${n.pathId.toLowerCase()}` : ''}`} onClick={() => go(n.view, n.pathId)}
            className={`text-[11px] tracking-[0.15em] py-1 whitespace-nowrap cursor-pointer ${isOn(n.view, n.pathId) ? 'text-[#5ED6E3]' : 'text-[#5A6379]'}`}>
            {n.label}{pathMark(n.pathId)}
          </button>
        ))}
      </div>

      {/* desktop rail — classified archive */}
      <aside className="hidden lg:flex w-[224px] shrink-0 flex-col bg-[#0A0D15] border-r border-[#1E2536] min-h-screen sticky top-0 h-screen">
        <div className="px-5 pt-5 pb-4 border-b border-[#1E2536]">
          <div className="flex items-start justify-between">
            <button id="brand-logo-btn" onClick={() => navigateTo('GATE')} className="text-left">
              <div className="font-display text-[17px] font-semibold tracking-[0.28em] text-[#F2F5FA]">BREACH POINT</div>
              <div className="mt-1.5 text-[8.5px] leading-relaxed tracking-[0.22em] text-[#5A6379]">BY AXIOS</div>
            </button>
            <span className="mt-1 w-2 h-2 bg-[#5ED6E3] shadow-[0_0_8px_#5ED6E3]" />
          </div>
        </div>

        <div className="px-5 py-3.5 border-b border-[#1E2536] text-[10px] leading-relaxed tracking-[0.12em]">
          <div className="flex justify-between"><span className="text-[#5A6379]">SCORE</span>
            <button id="header-points-hud" onClick={() => navigateTo('BOARD')} className="text-[#5ED6E3] cursor-pointer">■ {pathScores.total.toLocaleString()} PTS</button>
          </div>
        </div>

        <nav className="py-2">
          {NAV.map((n) => {
            const on = isOn(n.view, n.pathId);
            return (
              <button key={`${n.view}-${n.pathId || ''}`} id={`nav-btn-${n.view.toLowerCase()}${n.pathId ? `-${n.pathId.toLowerCase()}` : ''}`}
                onClick={() => go(n.view, n.pathId)}
                className={`w-full flex items-center px-5 py-[9px] font-display text-[13.5px] tracking-[0.18em] transition-colors cursor-pointer ${on ? 'text-[#5ED6E3] bg-[#5ED6E3]/[0.06]' : 'text-[#8B93A9] hover:text-[#D5DBE7]'}`}
                style={on ? { boxShadow: 'inset 2px 0 0 #5ED6E3' } : {}}>
                <span>{n.label}{pathMark(n.pathId)}</span>
              </button>
            );
          })}
        </nav>

        <div className="mt-auto border-t border-[#1E2536] px-5 py-4 text-[10px] tracking-[0.14em]">
          <div className="flex items-center justify-between text-[#5A6379]">
            <button id="btn-tour-guide" onClick={() => toggleTour(true)} className="hover:text-[#8B93A9] cursor-pointer">[ MANUAL ]</button>
            {currentUser && <button onClick={logout} className="hover:text-[#E84D7E] cursor-pointer">[ LOGOUT ]</button>}
          </div>
          <button onClick={() => { if (window.confirm('Purge local record and restart?')) resetProgress(); }} className="mt-2 text-[#454C61] hover:text-[#E84D7E] cursor-pointer">[ PURGE ]</button>
          <button onClick={openGlitch} className="mt-2 text-[#454C61] hover:text-[#5ED6E3] cursor-pointer">[ TIME GLITCH ]</button>
        </div>
      </aside>

      {/* time glitch warning: 15:00 countdown to the event */}
      {showGlitch && (
        <DashboardOverlay title="TIME GLITCH" onClose={() => setShowGlitch(false)}>
          <p className="font-lore italic text-[19px] leading-relaxed text-[#F2F5FA]">
            “Time glitch is about to start in 15 mins. All operatives stand by.”
          </p>
          <div className="mt-5 text-center">
            <GlitchTimer />
          </div>
          <div className="mt-5 text-center">
            <button onClick={() => { startGlitch(); }} className="text-[11px] tracking-[0.2em] text-[#5A6379] hover:text-[#8B93A9] cursor-pointer">
              ↻ RESTART TIMER
            </button>
          </div>
        </DashboardOverlay>
      )}
    </>
  );
};
