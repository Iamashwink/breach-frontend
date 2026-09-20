import React from 'react';
import { useGame } from '../context/GameContext';
import { PATH_SKINS, TONE, FRAGMENT_LABEL } from '../data/pathsData';
import { PathId } from '../types';

export const PathCompletionModal: React.FC = () => {
  const { pathCompletionPrompt, closeCompletionPrompt, paths, switchPath, navigateTo, busy } = useGame();

  if (!pathCompletionPrompt) return null;

  const { pathCode, fragment } = pathCompletionPrompt;
  const currentSkin = PATH_SKINS[pathCode];
  const currentPath = paths.find((p) => p.code === pathCode);

  // Remaining paths that have NOT been attempted yet
  const unattemptedPaths = paths.filter((p) => !p.isAttempted && !p.isActive && p.code !== pathCode);

  const handleChooseNext = async (nextCode: PathId) => {
    closeCompletionPrompt();
    await switchPath(nextCode);
    navigateTo('TRAIL', null, nextCode);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/85 backdrop-blur-md animate-fade-in">
      <div className="relative w-full max-w-2xl border-2 border-[#5ED6E3] bg-[#0B0E16] p-6 sm:p-8 shadow-[0_0_50px_rgba(94,214,227,0.25)]">
        {/* Glow corner accents */}
        <div className="absolute top-0 left-0 w-3 h-3 border-t-2 border-l-2 border-[#5ED6E3]" />
        <div className="absolute top-0 right-0 w-3 h-3 border-t-2 border-r-2 border-[#5ED6E3]" />
        <div className="absolute bottom-0 left-0 w-3 h-3 border-b-2 border-l-2 border-[#5ED6E3]" />
        <div className="absolute bottom-0 right-0 w-3 h-3 border-b-2 border-r-2 border-[#5ED6E3]" />

        <div className="flex items-center justify-between border-b border-[#1E2536] pb-4">
          <div className="flex items-center gap-2">
            <span className="w-2.5 h-2.5 bg-[#5ED6E3] shadow-[0_0_10px_#5ED6E3]" />
            <span className="text-[11px] font-bold tracking-[0.3em] text-[#5ED6E3] uppercase">
              PATH {pathCode} COMPLETE · TRANSMISSION SECURED
            </span>
          </div>
          <button
            onClick={closeCompletionPrompt}
            className="text-[11px] tracking-[0.2em] text-[#5A6379] hover:text-[#F2F5FA] cursor-pointer"
          >
            DISMISS ✕
          </button>
        </div>

        <div className="mt-6 text-center">
          <div className="inline-block px-3 py-1 border border-[#5ED6E3]/40 bg-[#5ED6E3]/10 text-[10px] font-bold tracking-[0.3em] text-[#5ED6E3] uppercase mb-3">
            ✦ {fragment.toUpperCase()} FRAGMENT ACQUIRED ✦
          </div>
          <h2 className="font-display uppercase text-2xl sm:text-3xl text-[#F2F5FA] tracking-wide">
            PATH {pathCode} CLEARED
          </h2>
          <p className="mt-3 font-lore italic text-[16px] text-[#A6B2C8] max-w-lg mx-auto leading-relaxed">
            “You have pulled the {fragment.toUpperCase()} key out of {currentPath?.name ?? `Path ${pathCode}`}. The signal converges, but the architecture demands more.”
          </p>
        </div>

        <div className="mt-6 p-4 border border-[#1E2536] bg-[#07090F]/80">
          <div className="text-[10px] tracking-[0.25em] text-[#5ED6E3] font-bold uppercase mb-1">
            FREE PATH SWITCH // ZERO POINTS DEDUCTED
          </div>
          <p className="text-[12px] text-[#C6CCDA] leading-relaxed">
            Because you completed Path {pathCode}, switching to your next path is{' '}
            <b className="text-[#5ED6E3]">100% FREE</b> (0 points deducted, full reward multiplier).
            Previous paths remain <b className="text-[#F2F5FA]">UNLOCKED and SOLVABLE</b> at any time.
          </p>
        </div>

        <div className="mt-6">
          <div className="text-[10px] tracking-[0.25em] text-[#5A6379] font-bold uppercase mb-3">
            SELECT NEXT PATH TO COMMIT:
          </div>

          {unattemptedPaths.length > 0 ? (
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              {unattemptedPaths.map((p) => {
                const code = p.code as PathId;
                const skin = PATH_SKINS[code];
                return (
                  <button
                    key={code}
                    onClick={() => void handleChooseNext(code)}
                    disabled={busy}
                    className="p-4 border text-left transition-all hover:scale-[1.01] hover:brightness-110 disabled:opacity-40 cursor-pointer flex flex-col justify-between"
                    style={{
                      borderColor: `${TONE[code]}88`,
                      background: `${TONE[code]}12`,
                      boxShadow: `0 0 15px ${TONE[code]}22`,
                    }}
                  >
                    <div>
                      <div className="text-[11px] font-bold tracking-[0.2em]" style={{ color: TONE[code] }}>
                        PATH {code} · {p.name}
                      </div>
                      <div className="text-[10px] text-[#5A6379] mt-1">
                        KEY: {FRAGMENT_LABEL[p.delivers].toUpperCase()} · Led by {skin.lead}
                      </div>
                      <p className="mt-2 text-[11px] font-lore italic text-[#8B93A9] line-clamp-2">
                        {p.introNarration}
                      </p>
                    </div>
                    <div className="mt-4 pt-3 border-t border-white/10 flex items-center justify-between">
                      <span className="text-[10px] font-bold tracking-wider text-[#5ED6E3]">
                        FREE · 100% REWARDS
                      </span>
                      <span className="text-[11px] font-bold tracking-[0.15em]" style={{ color: TONE[code] }}>
                        SELECT →
                      </span>
                    </div>
                  </button>
                );
              })}
            </div>
          ) : (
            <div className="p-4 border border-[#1E2536] bg-[#07090F] text-center text-[12px] text-[#5A6379]">
              All three paths have been entered! Convergence Final awaits at the Terminal.
            </div>
          )}
        </div>

        <div className="mt-6 pt-4 border-t border-[#1E2536] flex flex-wrap items-center justify-between gap-3">
          <button
            onClick={() => {
              closeCompletionPrompt();
              navigateTo('TRAIL', null, pathCode);
            }}
            className="text-[11px] tracking-[0.2em] text-[#5A6379] hover:text-[#8B93A9] cursor-pointer"
          >
            ← REMAIN ON PATH {pathCode} TO SOLVE MORE
          </button>
          <button
            onClick={() => {
              closeCompletionPrompt();
              navigateTo('DASHBOARD');
            }}
            className="px-4 py-2 border border-[#1E2536] text-[11px] tracking-[0.2em] text-[#F2F5FA] hover:bg-white/[0.05] cursor-pointer"
          >
            VIEW DASHBOARD →
          </button>
        </div>
      </div>
    </div>
  );
};
