import React from 'react';
import { useGame } from '../context/GameContext';
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

/**
 * Closed, solid-filled, symmetrical locked padlock (muted slate).
 */
const LockedIcon: React.FC<{ size?: number; className?: string }> = ({ size = 12, className = '' }) => (
  <svg
    width={size}
    height={size}
    viewBox="0 0 24 24"
    fill="currentColor"
    className={`shrink-0 ${className}`}
  >
    <path
      fillRule="evenodd"
      clipRule="evenodd"
      d="M6 10V7a6 6 0 1 1 12 0v3h1a2 2 0 0 1 2 2v8a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-8a2 2 0 0 1 2-2h1zm2-3a4 4 0 1 1 8 0v3H8V7zm4 7a1.5 1.5 0 1 0 0 3 1.5 1.5 0 0 0 0-3z"
    />
  </svg>
);

/**
 * Open, solid-filled unlocked padlock with smoothly rounded open shackle (bright cyan/gold).
 * Features a soft rounded pill tip and a clear open gap above the lock body, matching
 * the smooth geometry and filled aesthetic of LockedIcon with zero sharp angles.
 */
const UnlockedIcon: React.FC<{ size?: number; className?: string }> = ({ size = 12, className = '' }) => (
  <svg
    width={size}
    height={size}
    viewBox="0 0 24 24"
    fill="currentColor"
    className={`shrink-0 ${className}`}
  >
    {/* Smoothly curved open shackle with rounded cap and clear open gap */}
    <path
      d="M6 10V6a5 5 0 0 1 10 0a1 1 0 0 1-2 0a3 3 0 0 0-6 0v4H6z"
    />
    {/* Identical rounded body with keyhole cutout */}
    <path
      fillRule="evenodd"
      clipRule="evenodd"
      d="M5 10a2 2 0 0 0-2 2v8a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-8a2 2 0 0 0-2-2H5zm7 4a1.5 1.5 0 1 0 0 3 1.5 1.5 0 0 0 0-3z"
    />
  </svg>
);

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
        className={`inline-flex items-center justify-center ${
          isMobile
            ? 'text-[#5A6379]'
            : 'w-5 h-5 rounded-[2px] bg-[#07090F] border border-[#1E2536] text-[#5A6379] group-hover:text-[#8B93A9]'
        }`}
      >
        <LockedIcon size={isMobile ? 11 : 12} />
      </span>
    );
  }

  // Unlocked path — uniform across all unlocked paths
  return (
    <span
      title={`Path ${pathId}: Unlocked`}
      className={`inline-flex items-center justify-center ${
        isMobile
          ? 'text-[#5ED6E3]'
          : 'w-5 h-5 rounded-[2px] bg-[#07090F] border border-[#1E2536] text-[#5ED6E3] group-hover:border-[#5ED6E3]/40'
      }`}
    >
      <UnlockedIcon size={isMobile ? 11 : 12} />
    </span>
  );
};

export const Header: React.FC = () => {
  const {
    currentView, activePath, navigateTo, toggleTour,
    score, currentUser, logout, chosenPath,
  } = useGame();

  const go = (view: ViewType, pathId?: PathId) => navigateTo(view, null, pathId);

  const isOn = (view: ViewType, pathId?: PathId) =>
    view === 'TRAIL' ? currentView === 'TRAIL' && activePath === pathId : currentView === view;

  // Map views sit flush against the top bar: no rail divider, no corner gap.
  const mapFlush = currentView === 'MAP' || currentView === 'TRAIL';

  return (
    <>
      {/* mobile */}
      <div className="lg:hidden border-b border-[#1E2536] bg-[#0B0E16] px-4 py-3 flex items-center justify-between">
        <button id="brand-logo-btn" onClick={() => navigateTo('GATE')} className="font-display tracking-[0.3em] text-sm text-[#F2F5FA]">BREACH POINT</button>
        <div className="flex items-center gap-3">
          <button
            id="header-points-hud"
            onClick={() => navigateTo('BOARD')}
            className="text-[13px] font-bold text-[#5ED6E3] font-mono drop-shadow-[0_0_8px_rgba(94,214,227,0.35)]"
          >
            ■ {score.toLocaleString()} PTS
          </button>
          <button id="btn-tour-guide" onClick={() => toggleTour(true)} className="text-[11px] text-[#5ED6E3] hover:text-[#7CE3EE] font-medium cursor-pointer">MANUAL</button>
        </div>
      </div>
      {/* sub-rail tabs for mobile */}
      <div className="lg:hidden flex items-center gap-1 px-4 py-2 border-b border-[#1E2536] bg-[#07090F] overflow-x-auto">
        {NAV.map((n) => {
          const on = isOn(n.view, n.pathId);
          return (
            <button key={`${n.view}-${n.pathId || ''}`} id={`nav-mobile-${n.view.toLowerCase()}${n.pathId ? `-${n.pathId.toLowerCase()}` : ''}`}
              onClick={() => go(n.view, n.pathId)}
              className={`text-[11px] tracking-[0.15em] py-1 px-2 whitespace-nowrap cursor-pointer flex items-center gap-1.5 ${on ? 'text-[#5ED6E3] border-b border-[#5ED6E3]' : 'text-[#8B93A9]'}`}>
              <span>{n.label}</span>
              {n.pathId && <PathLockStatus pathId={n.pathId} active={n.pathId === chosenPath} />}
            </button>
          );
        })}
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
          <div className="flex items-start">
            <button id="brand-logo-btn" onClick={() => navigateTo('GATE')} className="text-left">
              <div className="font-display text-[17px] font-semibold tracking-[0.28em] text-[#F2F5FA]">BREACH POINT</div>
              <div className="mt-1.5 text-[8.5px] leading-relaxed tracking-[0.22em] text-[#5ED6E3] font-medium">BY AXIOS</div>
            </button>
          </div>
        </div>

        <div className="px-5 py-3.5 border-b border-[#1E2536] bg-[#07090F]/60">
          <div className="flex items-center justify-between">
            <span className="text-[11px] tracking-[0.2em] text-[#C6CCDA] font-bold">SCORE</span>
            <button
              id="header-points-hud"
              onClick={() => navigateTo('BOARD')}
              className="font-mono text-[13.5px] font-bold text-[#5ED6E3] hover:text-[#7CE3EE] drop-shadow-[0_0_8px_rgba(94,214,227,0.35)] cursor-pointer transition-colors"
            >
              ■ {score.toLocaleString()} <span className="text-[10px] tracking-wider text-[#A6B2C8]">PTS</span>
            </button>
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

        <div className="mt-auto border-t border-[#1E2536] px-5 py-4 text-[11px] tracking-[0.14em]">
          <div className="flex items-center justify-between">
            <button id="btn-tour-guide" onClick={() => toggleTour(true)} className="text-[#5ED6E3] hover:text-[#7CE3EE] transition-colors cursor-pointer font-semibold">[ MANUAL ]</button>
            {currentUser && (
              <button onClick={logout} className="text-[#E84D7E] hover:text-[#FF6B9B] hover:brightness-125 font-bold transition-colors cursor-pointer">[ LOGOUT ]</button>
            )}
          </div>
        </div>
      </aside>
    </>
  );
};
