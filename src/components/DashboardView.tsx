import React, { useState } from 'react';
import { useGame } from '../context/GameContext';
import { PATH_UNLOCK_COST } from '../context/GameContext';
import { getPathStory, getChallengePreStory } from '../services/backend';
import { PATHS_DATA } from '../data/pathsData';
import { CHALLENGES_DATA } from '../data/challengesData';
import { DashboardOverlay } from './DashboardOverlay';
import { PathId } from '../types';

const TONE: Record<PathId, string> = { A: '#E0A83E', B: '#5ED6E3', C: '#E84D7E' };

export const DashboardView: React.FC = () => {
  // Stories resolve via src/services/backend.ts —
  // swap getMainStory/getPathStory for fetchMainStory/fetchPathStory when the API lands.
  const PATH_SUBSTORY = { A: getPathStory('A'), B: getPathStory('B'), C: getPathStory('C') };
  const {
    currentUser, chosenPath, choosePath, unlockPath,
    isPathComplete, isPathLocked, needsNextPath,
    navigateTo, pathScores, getPathSolvedCount, solvedChallengeIds,
    resumeChallengeId, logout,
  } = useGame();
  const [pendingUnlock, setPendingUnlock] = useState<PathId | null>(null);

  const pathPoints = (id: PathId) => (id === 'A' ? pathScores.pathA : id === 'B' ? pathScores.pathB : pathScores.pathC);
  // Opening narration per path (TODO backend: GET /api/story/paths/:id/pre-story)
  const pathPreStory = (id: PathId) => {
    const first = CHALLENGES_DATA.find((c) => c.pathId === id && c.index === 1);
    if (!first) return null;
    const lines = getChallengePreStory(first);
    return { speaker: first.briefing.speaker, subTag: first.briefing.subTag, opener: lines[0], more: lines.length - 1 };
  };

  const totalSolved = solvedChallengeIds.length;
  const resumeChallenge = CHALLENGES_DATA.find((c) => c.id === resumeChallengeId) || null;

  const renderPathAction = (id: PathId) => {
    if (isPathComplete(id)) {
      return (
        <div className="mt-3 px-5 py-2.5 text-[12px] font-bold tracking-[0.2em] text-center border" style={{ color: TONE[id], borderColor: `${TONE[id]}55` }}>
          COMPLETE ✓ 10/10
        </div>
      );
    }
    if (!chosenPath || id === chosenPath || needsNextPath || !isPathLocked(id)) {
      const label = !chosenPath ? `COMMIT TO PATH ${id} →` : `ENTER PATH ${id} →`;
      const go = () => {
        if (!chosenPath || needsNextPath) choosePath(id);
        else if (id === chosenPath) navigateTo('TRAIL', null, id);
        else unlockPath(id);
      };
      return (
        <button id={`btn-enter-path-${id.toLowerCase()}`} onClick={go} className="mt-3 w-full px-5 py-2.5 text-[12px] font-bold tracking-[0.2em] text-[#06232A] cursor-pointer" style={{ background: TONE[id] }}>
          {label}
        </button>
      );
    }
    // Locked: visible, entry sealed — one-time unlock fee, open forever after
    return (
      <div className="mt-3">
        <button onClick={() => setPendingUnlock(id)} className="w-full px-5 py-2.5 border text-[11px] font-bold tracking-[0.2em] cursor-pointer hover:bg-white/[0.03]" style={{ borderColor: `${TONE[id]}66`, color: TONE[id] }}>
          ■ LOCKED — UNLOCK −{PATH_UNLOCK_COST} PTS
        </button>
        <button onClick={() => navigateTo('TRAIL', null, id)} className="mt-2 w-full text-[10.5px] tracking-[0.2em] text-[#5A6379] hover:text-[#8B93A9] cursor-pointer">
          VIEW TRAIL (READ-ONLY) →
        </button>
      </div>
    );
  };

  return (
    <div className="flex-1 bg-[#07090F] scan-faint">
      <div className="max-w-5xl mx-auto px-5 sm:px-8 py-10">
        {/* path options — always visible, side by side, dossier content inline */}
        <section>
            {needsNextPath && chosenPath && (
              <div className="mb-3 border border-[#5ED6E3]/40 bg-[#5ED6E3]/[0.04] px-5 py-3 text-[12px] tracking-[0.1em] text-[#5ED6E3]">
                PATH {chosenPath} COMPLETE — CHOOSE YOUR NEXT PATH ({3 - (['A', 'B', 'C'] as PathId[]).filter((p) => isPathComplete(p)).length} REMAIN)
              </div>
            )}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
              {(['A', 'B', 'C'] as PathId[]).map((id) => {
                const pre = pathPreStory(id);
                const sealed = isPathLocked(id);
                return (
                  <div key={id} className="border border-[#1E2536] bg-[#0B0E16]/50 px-5 py-4 flex flex-col" style={id === chosenPath && !isPathComplete(id) ? { borderLeft: `3px solid ${TONE[id]}` } : {}}>
                    <div className="text-[11px] font-semibold tracking-[0.25em]" style={{ color: TONE[id] }}>
                      PATH {id} · {PATHS_DATA[id].title}
                    </div>
                    <div className="text-[10.5px] text-[#9AA2B5] mt-1">KEY {PATHS_DATA[id].keyNumber} ({PATHS_DATA[id].discovers}) · Led by {PATHS_DATA[id].lead}</div>
                    <p className="mt-2 font-lore italic text-[15px] text-[#D5DBE7] leading-snug">{PATH_SUBSTORY[id].hook}</p>
                    <div className="mt-2 text-[11px] text-[#9AA2B5]">{PATHS_DATA[id].pastSummary} → {PATHS_DATA[id].presentSummary} → {PATHS_DATA[id].futureSummary}</div>
                    {pre && (
                      <div className="mt-3 border-l-2 pl-3 py-0.5" style={{ borderColor: `${TONE[id]}77` }}>
                        <div className="text-[9px] tracking-[0.25em] text-[#8B93A9]">
                          PRE-STORY // <span style={{ color: TONE[id] }}>{pre.speaker}</span>
                        </div>
                        <p className="mt-1 font-lore italic text-[14px] leading-snug text-[#F2F5FA]">“{pre.opener}”</p>
                      </div>
                    )}
                    <div className="mt-3 text-[11px] text-[#8B93A9]">
                      <b style={{ color: TONE[id] }}>{getPathSolvedCount(id)}/10</b> · <b className="text-[#F2F5FA]">{pathPoints(id).toLocaleString()}</b> PTS
                      {sealed && <span className="ml-2 text-[#E84D7E]">■ SEALED</span>}
                      {id === chosenPath && !isPathComplete(id) && <span className="ml-2" style={{ color: TONE[id] }}>● ACTIVE</span>}
                    </div>
                    <div className="mt-auto">{renderPathAction(id)}</div>
                  </div>
                );
              })}
            </div>
        </section>

        {/* ROW 2 — resume */}
        <section className="mt-4">
          <button
            id="btn-resume-challenge"
            onClick={() => resumeChallenge && navigateTo('CHALLENGE', resumeChallenge.id)}
            disabled={!resumeChallenge}
            className="w-full border border-[#5ED6E3]/40 bg-[#5ED6E3]/[0.04] px-4 py-5 text-center hover:bg-[#5ED6E3]/[0.08] disabled:opacity-40 disabled:cursor-not-allowed cursor-pointer"
          >
            <span className="block text-[13px] font-bold tracking-[0.25em] text-[#5ED6E3]">RESUME</span>
            <span className="mt-1 block text-[10px] tracking-[0.15em] text-[#5A6379]">
              {resumeChallenge ? `${resumeChallenge.id} · ${resumeChallenge.title}` : 'NO ACTIVE TRAIL'}
            </span>
          </button>
        </section>

        {/* ROW 3 — full-width GO TO RITE (existing destination: Convergence Terminal) */}
        <button
          id="btn-dashboard-rite"
          onClick={() => navigateTo('CONVERGENCE')}
          className="mt-4 w-full py-3.5 bg-[#5ED6E3] hover:bg-[#7CE3EE] text-[#06232A] text-[12px] font-bold tracking-[0.22em] transition-colors cursor-pointer"
        >
          GO TO RITE — ENTER THE FINAL FLAGS →
        </button>
      </div>

      {/* path-unlock confirm: one-time fee, unlocked paths stay open forever */}
      {pendingUnlock && (
        <DashboardOverlay title="UNLOCK PATH" onClose={() => setPendingUnlock(null)}>
          <p className="font-lore italic text-[19px] leading-relaxed text-[#F2F5FA]">
            “Unlock PATH {pendingUnlock} and cross over from PATH {chosenPath}?”
          </p>
          <p className="mt-3 text-[13px] leading-relaxed text-[#9AA2B5]">
            Unlocking deducts <b className="text-[#E84D7E]">{PATH_UNLOCK_COST} PTS</b> from
            your total — once. Unlocked paths stay open forever. Solved challenges stay solved.
          </p>
          <div className="mt-6 flex items-center justify-between">
            <button onClick={() => setPendingUnlock(null)} className="text-[11px] tracking-[0.2em] text-[#5A6379] hover:text-[#8B93A9] cursor-pointer">
              ← STAY ON PATH {chosenPath}
            </button>
            <button
              id="btn-confirm-unlock"
              onClick={() => { unlockPath(pendingUnlock); setPendingUnlock(null); }}
              className="px-6 py-2.5 bg-[#E84D7E] hover:brightness-110 text-[#07090F] text-[12px] font-bold tracking-[0.2em] cursor-pointer"
            >
              UNLOCK −{PATH_UNLOCK_COST} PTS →
            </button>
          </div>
        </DashboardOverlay>
      )}
    </div>
  );
};
