import React, { useState, useEffect } from 'react';
import { Lock, Unlock } from 'lucide-react';
import { useGame } from '../context/GameContext';
import { DashboardOverlay } from './DashboardOverlay';
import { PathId, ViewType } from '../types';

const NAV: { label: string; view: ViewType; pathId?: PathId }[] = [
  { label: 'DASHBOARD', view: 'DASHBOARD' },
  { label: 'TEAM', view: 'TEAM' },
  { label: 'MAP', view: 'MAP' },
  { label: 'PATH A', view: 'TRAIL', pathId: 'A' },
  { label: 'PATH B', view: 'TRAIL', pathId: 'B' },
  { label: 'PATH C', view: 'TRAIL', pathId: 'C' },
  { label: 'LEADERBOARD', view: 'BOARD' },
];

interface PathLockStatusProps {
  pathId: PathId;
  active: boolean;
  isMobile?: boolean;
}

const PathLockStatus: React.FC<PathLockStatusProps> = ({ pathId, active, isMobile = false }) => {
  const { isPathLocked, isPathComplete } = useGame();
  const locked = isPathLocked(pathId);
  const complete = isPathComplete(pathId);

  if (locked) {
    return (
      <span
        title={`Path ${pathId}: Locked`}
        className={`inline-flex items-center justify-center transition-all ${
          isMobile
            ? 'text-[#5A6379]'
            : 'w-5 h-5 rounded-[2px] bg-[#07090F] border border-[#1E2536] text-[#5A6379] group-hover:border-[#2B3347] group-hover:text-[#8B93A9]'
        }`}
      >
        <Lock size={isMobile ? 11 : 12} strokeWidth={2.2} />
      </span>
    );
  }

  // Unlocked path
  return (
    <span
      title={`Path ${pathId}: Unlocked${active ? ' · Active' : ''}${complete ? ' · Cleared' : ''}`}
      className={`inline-flex items-center justify-center transition-all ${
        isMobile
          ? active
            ? 'text-[#5ED6E3]'
            : complete
            ? 'text-[#E0A83E]'
            : 'text-[#8B93A9]'
          : `w-5 h-5 rounded-[2px] ${
              active
                ? 'bg-[#5ED6E3]/10 border border-[#5ED6E3]/60 text-[#5ED6E3] shadow-[0_0_8px_rgba(94,214,227,0.3)]'
                : complete
                ? 'bg-[#E0A83E]/10 border border-[#E0A83E]/50 text-[#E0A83E] shadow-[0_0_8px_rgba(224,168,62,0.25)]'
                : 'bg-[#07090F] border border-[#1E2536] text-[#8B93A9] group-hover:border-[#2B3347] group-hover:text-[#D5DBE7]'
            }`
      }`}
    >
      <Unlock size={isMobile ? 11 : 12} strokeWidth={2.2} />
    </span>
  );
};

/**
 * Countdown to the end of the active Time Glitch.
 *
 * Glitch windows are scheduled by an admin and served on the board — the
 * client cannot start one, and the old button that pretended to has been
 * removed. During a window every solve pays full initial points with no decay.
 */
const GlitchTimer: React.FC = () => {
  const { glitchEndsAt } = useGame();
  const [, tick] = useState(0);
  useEffect(() => {
    const t = setInterval(() => tick((x) => x + 1), 500);
    return () => clearInterval(t);
  }, []);
  if (!glitchEndsAt) return <span className="font-display text-4xl tracking-[0.1em] text-[#5A6379]">--:--</span>;
  const ms = Math.max(0, glitchEndsAt - Date.now());
  if (ms <= 0) return <span className="font-display text-2xl tracking-[0.15em] text-[#5A6379]">WINDOW CLOSED</span>;
  const mm = Math.floor(ms / 60000).toString().padStart(2, '0');
  const ss = Math.floor((ms % 60000) / 1000).toString().padStart(2, '0');
  return <span className="font-display text-4xl tracking-[0.1em] text-[#5ED6E3]">T−{mm}:{ss}</span>;
};

export const Header: React.FC = () => {
  const {
    currentView, activePath, navigateTo, toggleTour,
    score, currentUser, logout, chosenPath, isPathComplete, isPathLocked,
    glitchEndsAt, glitchLabel, refresh,
  } = useGame();
  const [showGlitch, setShowGlitch] = useState(false);

  const go = (view: ViewType, pathId?: PathId) => navigateTo(view, null, pathId);

  const isOn = (view: ViewType, pathId?: PathId) =>
    view === 'TRAIL' ? currentView === 'TRAIL' && activePath === pathId : currentView === view;

  // Map views sit flush against the top bar: no rail divider, no corner gap.
  const mapFlush = currentView === 'MAP' || currentView === 'TRAIL';

  const openGlitch = () => {
    void refresh();
    setShowGlitch(true);
  };

  return (
    <>
      {/* mobile */}
      <div className="lg:hidden border-b border-[#1E2536] bg-[#0B0E16] px-4 py-3 flex items-center justify-between">
        <button id="brand-logo-btn" onClick={() => navigateTo('GATE')} className="font-display tracking-[0.3em] text-sm text-[#F2F5FA]">BREACH POINT</button>
        <div className="flex items-center gap-3">
          <button id="header-points-hud" onClick={() => navigateTo('BOARD')} className="text-[12px] text-[#5ED6E3]">■ {score.toLocaleString()}</button>
          <button id="btn-tour-guide" onClick={() => toggleTour(true)} className="text-[11px] text-[#5A6379]">MANUAL</button>
        </div>
      </div>
      <div className="lg:hidden border-b border-[#1E2536] bg-[#07090F] px-4 py-2 flex gap-4 overflow-x-auto">
        {NAV.map((n) => (
          <button key={`${n.view}-${n.pathId || ''}`} id={`nav-btn-${n.view.toLowerCase()}${n.pathId ? `-${n.pathId.toLowerCase()}` : ''}`} onClick={() => go(n.view, n.pathId)}
            className={`text-[11px] tracking-[0.15em] py-1 whitespace-nowrap cursor-pointer inline-flex items-center gap-1.5 ${isOn(n.view, n.pathId) ? 'text-[#5ED6E3]' : 'text-[#5A6379]'}`}>
            <span>{n.label}</span>
            {n.pathId && <PathLockStatus pathId={n.pathId} active={n.pathId === chosenPath} isMobile />}
          </button>
        ))}
        {currentUser?.isAdmin && (
          <button id="nav-btn-admin-mobile" onClick={() => go('ADMIN')}
            className={`text-[11px] tracking-[0.15em] py-1 whitespace-nowrap cursor-pointer ${currentView.startsWith('ADMIN') ? 'text-[#E0A83E]' : 'text-[#E0A83E]/60'}`}>
            ADMIN
          </button>
        )}
      </div>

      {/* desktop rail — classified archive */}
      <aside className={`hidden lg:flex w-[224px] shrink-0 flex-col bg-[#0A0D15] min-h-screen sticky top-0 h-screen m-0 ${mapFlush ? 'border-r-0' : 'border-r border-[#1E2536]'}`}>
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
            <button id="header-points-hud" onClick={() => navigateTo('BOARD')} className="text-[#5ED6E3] cursor-pointer">■ {score.toLocaleString()} PTS</button>
          </div>
        </div>

        <nav className="py-2">
          {NAV.map((n) => {
            const on = isOn(n.view, n.pathId);
            return (
              <button key={`${n.view}-${n.pathId || ''}`} id={`nav-btn-${n.view.toLowerCase()}${n.pathId ? `-${n.pathId.toLowerCase()}` : ''}`}
                onClick={() => go(n.view, n.pathId)}
                className={`w-full flex items-center justify-between px-5 py-[9px] font-display text-[13.5px] tracking-[0.18em] transition-colors cursor-pointer group ${on ? 'text-[#5ED6E3] bg-[#5ED6E3]/[0.06]' : 'text-[#8B93A9] hover:text-[#D5DBE7]'}`}
                style={on ? { boxShadow: 'inset 2px 0 0 #5ED6E3' } : {}}>
                <span>{n.label}</span>
                {n.pathId && <PathLockStatus pathId={n.pathId} active={n.pathId === chosenPath} />}
              </button>
            );
          })}
          {currentUser?.isAdmin && (
            <>
              <div className="mx-5 my-2 border-t border-[#1E2536]" />
              <button id="nav-btn-admin" onClick={() => go('ADMIN')}
                className={`w-full flex items-center px-5 py-[9px] font-display text-[13.5px] tracking-[0.18em] transition-colors cursor-pointer ${currentView.startsWith('ADMIN') ? 'text-[#E0A83E] bg-[#E0A83E]/[0.06]' : 'text-[#E0A83E]/60 hover:text-[#E0A83E]'}`}
                style={currentView.startsWith('ADMIN') ? { boxShadow: 'inset 2px 0 0 #E0A83E' } : {}}>
                <span>ADMIN</span>
              </button>
            </>
          )}
        </nav>

        <div className="mt-auto border-t border-[#1E2536] px-5 py-4 text-[10px] tracking-[0.14em]">
          <div className="flex items-center justify-between text-[#5A6379]">
            <button id="btn-tour-guide" onClick={() => toggleTour(true)} className="hover:text-[#8B93A9] cursor-pointer">[ MANUAL ]</button>
            {currentUser && <button onClick={logout} className="hover:text-[#E84D7E] cursor-pointer">[ LOGOUT ]</button>}
          </div>
          <button onClick={() => void refresh()} className="mt-2 text-[#454C61] hover:text-[#5ED6E3] cursor-pointer">[ SYNC ]</button>
          <button onClick={openGlitch} className="mt-2 text-[#454C61] hover:text-[#5ED6E3] cursor-pointer">
            [ TIME GLITCH{glitchEndsAt ? ' ◉' : ''} ]
          </button>
        </div>
      </aside>

      {/* time glitch warning: 15:00 countdown to the event */}
      {showGlitch && (
        <DashboardOverlay title="TIME GLITCH" onClose={() => setShowGlitch(false)}>
          <p className="font-lore italic text-[19px] leading-relaxed text-[#F2F5FA]">
            {glitchEndsAt
              ? `“${glitchLabel ?? 'The clock slips'}. Decay is suspended — every seal pays full value until it closes.”`
              : '“No slip right now. When one opens, every seal pays its full undecayed value until the window shuts.”'}
          </p>
          <div className="mt-5 text-center">
            <GlitchTimer />
          </div>
          <div className="mt-5 text-center text-[10px] tracking-[0.2em] text-[#454C61]">
            SCHEDULED BY CONTROL · NOT PLAYER-TRIGGERED
          </div>
        </DashboardOverlay>
      )}
    </>
  );
};
