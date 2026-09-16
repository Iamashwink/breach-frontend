import React, { useState } from 'react';
import { useGame } from '../context/GameContext';
import { DashboardOverlay } from './DashboardOverlay';
import { WelcomeGate } from './WelcomeGate';
import { PATH_SKINS, TONE, FRAGMENT_LABEL } from '../data/pathsData';
import { PathId } from '../types';

const FREE_SWITCH_THRESHOLD = 8;

export const DashboardView: React.FC = () => {
  const {
    paths, chosenPath, choosePath, switchPath, navigateTo,
    getPathChallenges, resumeSlot, welcome, convergence, fragments,
    skips, rewardMultiplier, busy, team,
  } = useGame();

  const [pendingSwitch, setPendingSwitch] = useState<PathId | null>(null);

  const activePath = paths.find((p) => p.isActive) ?? null;
  const solvesOnActive = activePath?.solved ?? 0;
  const switchIsFree = solvesOnActive >= FREE_SWITCH_THRESHOLD;

  const resumeChallenge = resumeSlot
    ? getPathChallenges((resumeSlot[0] as PathId)).find((c) => c.slot === resumeSlot) ?? null
    : null;

  // The welcome challenge gates path selection: the server refuses `select`
  // until it is solved, so the dashboard leads with it rather than offering
  // three buttons that would all be rejected.
  const welcomeOpen = !!welcome && welcome.status !== 'solved';

  const renderPathAction = (code: PathId) => {
    const path = paths.find((p) => p.code === code);
    if (!path) return null;

    if (path.isActive) {
      const complete = path.solved + path.skipped >= path.total && path.total > 0;
      if (complete) {
        return (
          <div
            className="mt-3 px-5 py-2.5 text-[12px] font-bold tracking-[0.2em] text-center border"
            style={{ color: TONE[code], borderColor: `${TONE[code]}55` }}
          >
            COMPLETE ✓ {path.solved}/{path.total}
          </div>
        );
      }
      return (
        <button
          id={`btn-enter-path-${code.toLowerCase()}`}
          onClick={() => navigateTo('TRAIL', null, code)}
          className="mt-3 w-full px-5 py-2.5 text-[12px] font-bold tracking-[0.2em] text-[#06232A] cursor-pointer"
          style={{ background: TONE[code] }}
        >
          ENTER PATH {code} →
        </button>
      );
    }

    // Already run and left. The (team, path) unique constraint means this is
    // permanent — say so rather than offering a button the server will refuse.
    if (path.isAttempted) {
      return (
        <div className="mt-3 px-5 py-2.5 border border-[#1E2536] text-[11px] font-bold tracking-[0.2em] text-center text-[#454C61]">
          CLOSED — ALREADY RUN
        </div>
      );
    }

    if (!chosenPath) {
      return (
        <button
          id={`btn-enter-path-${code.toLowerCase()}`}
          onClick={() => choosePath(code)}
          disabled={welcomeOpen || busy}
          title={welcomeOpen ? `Solve ${welcome?.title ?? 'the welcome challenge'} first — it gates path selection.` : undefined}
          className="mt-3 w-full px-5 py-2.5 text-[12px] font-bold tracking-[0.2em] text-[#06232A] disabled:opacity-30 disabled:cursor-not-allowed cursor-pointer"
          style={{ background: TONE[code] }}
        >
          {welcomeOpen ? `SEALED — DECODE FIRST` : `COMMIT TO PATH ${code} →`}
        </button>
      );
    }

    return (
      <div className="mt-3">
        <button
          onClick={() => setPendingSwitch(code)}
          disabled={busy}
          className="w-full px-5 py-2.5 border text-[11px] font-bold tracking-[0.2em] cursor-pointer hover:bg-white/[0.03] disabled:opacity-40"
          style={{ borderColor: `${TONE[code]}66`, color: TONE[code] }}
        >
          {switchIsFree ? `SWITCH TO PATH ${code} — FREE` : `SWITCH TO PATH ${code} — 80%`}
        </button>
        <button
          onClick={() => navigateTo('TRAIL', null, code)}
          className="mt-2 w-full text-[10.5px] tracking-[0.2em] text-[#5A6379] hover:text-[#8B93A9] cursor-pointer"
        >
          VIEW TRAIL (READ-ONLY) →
        </button>
      </div>
    );
  };

  return (
    <div className="flex-1 bg-[#07090F] scan-faint">
      <div className="max-w-5xl mx-auto px-5 sm:px-8 py-10">
        <WelcomeGate />

        {activePath && rewardMultiplier < 1 && (
          <div className="mb-3 border border-[#E84D7E]/40 bg-[#E84D7E]/[0.05] px-5 py-3 text-[12px] tracking-[0.1em] text-[#E84D7E]">
            PATH {activePath.code} PENALISED — REWARDS AT {Math.round(rewardMultiplier * 100)}%
            {' · '}
            {skips.used} OF {skips.quota} SKIPS SPENT
          </div>
        )}

        <section>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
            {(['A', 'B', 'C'] as PathId[]).map((code) => {
              const path = paths.find((p) => p.code === code);
              const skin = PATH_SKINS[code];
              const held = path ? fragments.includes(path.delivers) : false;
              return (
                <div
                  key={code}
                  className="border border-[#1E2536] bg-[#0B0E16]/50 px-5 py-4 flex flex-col"
                  style={path?.isActive ? { borderLeft: `3px solid ${TONE[code]}` } : {}}
                >
                  <div className="text-[11px] font-semibold tracking-[0.25em]" style={{ color: TONE[code] }}>
                    PATH {code} · {path?.name ?? '—'}
                  </div>
                  <div className="text-[10.5px] text-[#5A6379] mt-1">
                    KEY {skin.keyNumber} ({path ? FRAGMENT_LABEL[path.delivers] : '—'}) · Led by {skin.lead}
                  </div>
                  <p className="mt-2 font-lore italic text-[14px] text-[#8B93A9] leading-snug line-clamp-4">
                    {path?.introNarration ?? 'Awaiting transmission.'}
                  </p>
                  <div className="mt-3 text-[11px] text-[#5A6379]">
                    <b style={{ color: TONE[code] }}>{path?.solved ?? 0}/{path?.total ?? 10}</b>
                    {' · '}
                    <b className="text-[#F2F5FA]">{(path?.points ?? 0).toLocaleString()}</b> PTS
                    {path?.isActive && <span className="ml-2" style={{ color: TONE[code] }}>● ACTIVE</span>}
                    {held && <span className="ml-2 text-[#5ED6E3]">✦ FRAGMENT HELD</span>}
                    {path?.skipped ? <span className="ml-2 text-[#E84D7E]">{path.skipped} SKIPPED</span> : null}
                  </div>
                  <div className="mt-auto">{renderPathAction(code)}</div>
                </div>
              );
            })}
          </div>
        </section>

        <section className="mt-4">
          <button
            id="btn-resume-challenge"
            onClick={() => resumeChallenge && navigateTo('CHALLENGE', resumeChallenge.slot)}
            disabled={!resumeChallenge}
            className="w-full border border-[#5ED6E3]/40 bg-[#5ED6E3]/[0.04] px-4 py-5 text-center hover:bg-[#5ED6E3]/[0.08] disabled:opacity-40 disabled:cursor-not-allowed cursor-pointer"
          >
            <span className="block text-[13px] font-bold tracking-[0.25em] text-[#5ED6E3]">RESUME</span>
            <span className="mt-1 block text-[10px] tracking-[0.15em] text-[#5A6379]">
              {resumeChallenge ? `${resumeChallenge.slot} · ${resumeChallenge.title}` : 'NO ACTIVE TRAIL'}
            </span>
          </button>
        </section>

        <button
          id="btn-dashboard-rite"
          onClick={() => navigateTo('CONVERGENCE')}
          disabled={!convergence}
          className="mt-4 w-full py-3.5 bg-[#5ED6E3] hover:bg-[#7CE3EE] disabled:opacity-30 disabled:cursor-not-allowed text-[#06232A] text-[12px] font-bold tracking-[0.22em] transition-colors cursor-pointer"
        >
          {convergence
            ? 'GO TO RITE — THE FINAL FLAG →'
            : `CONVERGENCE SEALED — ${fragments.length}/3 FRAGMENTS`}
        </button>

        {team?.joinCode && (
          <div className="mt-6 text-[10px] tracking-[0.25em] text-[#454C61]">
            CELL {team.name} · JOIN CODE <span className="text-[#5A6379]">{team.joinCode}</span>
          </div>
        )}
      </div>

      {pendingSwitch && (
        <DashboardOverlay title="SWITCH PATH" onClose={() => setPendingSwitch(null)}>
          <p className="font-lore italic text-[19px] leading-relaxed text-[#F2F5FA]">
            “Leave Path {chosenPath} for Path {pendingSwitch}?”
          </p>
          <p className="mt-3 text-[13px] leading-relaxed text-[#9AA2B5]">
            {switchIsFree ? (
              <>
                You have <b className="text-[#5ED6E3]">{solvesOnActive}</b> solves on Path {chosenPath} —
                at {FREE_SWITCH_THRESHOLD} or more the switch is free and Path {pendingSwitch} pays
                full rewards.
              </>
            ) : (
              <>
                You have <b className="text-[#E84D7E]">{solvesOnActive}</b> of {FREE_SWITCH_THRESHOLD}{' '}
                solves needed for a free switch. Leaving now means Path {pendingSwitch} pays{' '}
                <b className="text-[#E84D7E]">80%</b> for its whole run.
              </>
            )}
          </p>
          <p className="mt-3 text-[12px] leading-relaxed text-[#5A6379]">
            Points already banked on Path {chosenPath} are kept. Path {chosenPath} closes permanently —
            a path can only be run once.
          </p>
          <div className="mt-6 flex items-center justify-between">
            <button
              onClick={() => setPendingSwitch(null)}
              className="text-[11px] tracking-[0.2em] text-[#5A6379] hover:text-[#8B93A9] cursor-pointer"
            >
              ← STAY ON PATH {chosenPath}
            </button>
            <button
              id="btn-confirm-switch"
              onClick={() => { void switchPath(pendingSwitch); setPendingSwitch(null); }}
              disabled={busy}
              className="px-6 py-2.5 bg-[#E84D7E] hover:brightness-110 disabled:opacity-40 text-[#07090F] text-[12px] font-bold tracking-[0.2em] cursor-pointer"
            >
              SWITCH TO PATH {pendingSwitch} →
            </button>
          </div>
        </DashboardOverlay>
      )}
    </div>
  );
};
