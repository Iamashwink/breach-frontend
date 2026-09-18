import React, { useCallback, useEffect, useState } from 'react';
import { useGame } from '../context/GameContext';
import { DIFFICULTY_META } from '../services/backend';
import { TONE } from '../data/pathsData';
import { Hint } from '../types';

export const ChallengeView: React.FC = () => {
  const {
    activeChallenge, navigateTo, submitFlag, skipChallenge, openBriefing,
    getPathChallenges, skips, rewardMultiplier, loadHints, unlockHint, busy,
  } = useGame();

  const [flag, setFlag] = useState('');
  const [status, setStatus] = useState<{ type: 'idle' | 'success' | 'error'; message: string }>({
    type: 'idle',
    message: '',
  });
  const [hints, setHints] = useState<Hint[] | null>(null);
  const [showHints, setShowHints] = useState(false);
  const [confirmSkip, setConfirmSkip] = useState(false);

  const challengeId = activeChallenge?.id ?? null;

  const refreshHints = useCallback(async () => {
    if (!challengeId) return;
    setHints(await loadHints(challengeId));
  }, [challengeId, loadHints]);

  // Reset per-challenge UI when navigating between nodes.
  useEffect(() => {
    setFlag('');
    setStatus({ type: 'idle', message: '' });
    setHints(null);
    setShowHints(false);
    setConfirmSkip(false);
  }, [challengeId]);

  useEffect(() => {
    if (showHints && hints === null) void refreshHints();
  }, [showHints, hints, refreshHints]);

  if (!activeChallenge || !activeChallenge.id) {
    return (
      <div className="flex-1 bg-[#07090F] flex flex-col items-center justify-center gap-4 px-6 text-center">
        <div className="text-[13px] text-[#8B93A9]">
          {activeChallenge
            ? 'This node has not been revealed to your team yet.'
            : 'No challenge selected.'}
        </div>
        <button onClick={() => navigateTo('MAP')} className="text-[12px] text-[#5ED6E3] cursor-pointer">
          ← BACK TO CHART
        </button>
      </div>
    );
  }

  const tone = TONE[activeChallenge.pathId];
  const diff = DIFFICULTY_META[activeChallenge.difficulty];
  const solved = activeChallenge.status === 'solved';
  const skipped = activeChallenge.status === 'skipped';
  const closed = solved || skipped;

  // Siblings for prev/next come from the whole path so the arrows still work
  // across nodes that are revealed but not adjacent in the open set.
  const all = getPathChallenges(activeChallenge.pathId);
  const i = all.findIndex((c) => c.slot === activeChallenge.slot);
  const prev = i > 0 ? all[i - 1] : null;
  const next = i >= 0 && i < all.length - 1 ? all[i + 1] : null;

  const [flagHover, setFlagHover] = useState(false);
  // Fixed gold from the PRE-TRANSMISSION box (Path A amber), not the path tone.
  const GOLD = '#E0A83E';

  const submit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!flag.trim() || busy) return;
    const r = await submitFlag(activeChallenge.id, flag);
    setStatus({ type: r.success ? 'success' : 'error', message: r.message });
    if (r.success) setFlag('');
  };

  const doSkip = async () => {
    setConfirmSkip(false);
    const r = await skipChallenge(activeChallenge.id);
    if (!r.success) {
      setStatus({ type: 'error', message: r.message });
      return;
    }
    if (next && next.id) navigateTo('CHALLENGE', next.slot);
    else navigateTo('MAP');
  };

  const buyHint = async (hint: Hint) => {
    const r = await unlockHint(activeChallenge.id, hint.id);
    setStatus({ type: r.success ? 'success' : 'error', message: r.message });
    if (r.success) await refreshHints();
  };

  return (
    <div className="flex-1 bg-[#07090F]">
      <div className="w-full max-w-6xl mx-auto px-6 sm:px-10 py-10">
        <div className="flex justify-between text-[11px] tracking-[0.2em] text-[#454C61]">
          <button
            onClick={() => navigateTo('MAP', null, activeChallenge.pathId)}
            className="hover:text-[#8B93A9] cursor-pointer"
          >
            ← CHART
          </button>
          <span className="flex gap-4">
            <button onClick={() => prev && navigateTo('CHALLENGE', prev.slot)} disabled={!prev} className="disabled:opacity-30 cursor-pointer">←</button>
            <button onClick={() => next && navigateTo('CHALLENGE', next.slot)} disabled={!next} className="disabled:opacity-30 cursor-pointer">→</button>
          </span>
        </div>

        <div className="mt-10 text-[11px] font-semibold tracking-[0.25em]" style={{ color: tone }}>
          {activeChallenge.slot} · {activeChallenge.category}
          {solved ? ' · HELD ✓' : skipped ? ' · SKIPPED' : ''}
        </div>
        <h1 className="mt-3 font-display uppercase tracking-wide text-3xl sm:text-5xl leading-tight text-[#F2F5FA]">
          {activeChallenge.title}
        </h1>
        <div className="mt-3 flex flex-wrap items-center gap-3 text-[12px] text-[#5A6379]">
          <span
            className="font-bold tracking-[0.15em] px-1.5 py-0.5 border"
            style={{ color: diff.color, borderColor: `${diff.color}66` }}
          >
            {diff.label}
          </span>
          {/* The live price, priced by the server. The path multiplier is
              applied on top of it at solve time. */}
          <span className="text-[#F2F5FA]">
            · {Math.round(activeChallenge.currentPoints * rewardMultiplier)} PTS
          </span>
          {activeChallenge.currentPoints < activeChallenge.points && (
            <span className="text-[#454C61]">
              · decayed from {activeChallenge.points}
              {activeChallenge.solves > 0 && ` by ${activeChallenge.solves} solve${activeChallenge.solves === 1 ? '' : 's'}`}
            </span>
          )}
          {activeChallenge.solves === 0 && (
            <span className="text-[#E0A83E]">· UNSOLVED — FIRST BLOOD</span>
          )}
          {rewardMultiplier < 1 && (
            <span className="text-[#E84D7E]">· ×{rewardMultiplier.toFixed(2)} PATH PENALTY</span>
          )}
          {activeChallenge.maxAttempts !== null && (
            <span className="text-[#E0A83E]">· MAX {activeChallenge.maxAttempts} ATTEMPTS</span>
          )}
          {activeChallenge.isPathFinal && <span style={{ color: tone }}>· PATH FINAL — FRAGMENT</span>}
        </div>

        <div className="mt-10 text-[10px] font-semibold tracking-[0.3em] text-[#5A6379]">
          OBJECTIVE // {activeChallenge.era} · {activeChallenge.track}
        </div>
        <p className="mt-3 text-[15px] text-[#C6CCDA] leading-[1.8] max-w-3xl whitespace-pre-line">
          {activeChallenge.objective}
        </p>

        {/* Pre-transmission narration, served per-challenge from sz_path_challenge. */}
        {activeChallenge.preStory && (
          <div
            className="mt-8 border-l-2 pl-5 pr-5 py-4 max-w-3xl"
            style={{ borderColor: `${tone}88`, background: `${tone}08` }}
          >
            <div className="text-[10px] font-semibold tracking-[0.3em]" style={{ color: tone }}>
              PRE-TRANSMISSION // PATH {activeChallenge.pathId} · {activeChallenge.slot}
            </div>
            <p className="mt-3 font-lore italic text-[18px] leading-[1.7] text-[#E8ECF3]">
              “{activeChallenge.preStory}”
            </p>
            <button
              onClick={() => openBriefing(activeChallenge.slot)}
              className="mt-3 text-[12px] font-semibold tracking-[0.15em] hover:brightness-110 cursor-pointer"
              style={{ color: tone }}
            >
              HEAR FULL PRE-BRIEF →
            </button>
          </div>
        )}

        {/* The debrief the server released on solving. */}
        {solved && activeChallenge.postStory && (
          <div className="mt-8 border-l-2 border-[#5ED6E3]/60 bg-[#5ED6E3]/[0.04] pl-5 pr-5 py-4 max-w-3xl">
            <div className="text-[10px] font-semibold tracking-[0.3em] text-[#5ED6E3]">
              POST-TRANSMISSION // DEBRIEF {activeChallenge.slot}
            </div>
            <p className="mt-3 font-lore italic text-[17px] leading-[1.7] text-[#E8ECF3]">
              {activeChallenge.postStory}
            </p>
          </div>
        )}

        {/* Hints: priced in points and deducted from the team's score on unlock. */}
        <div className="mt-12 border-t border-[#1E2536] pt-8 max-w-4xl">
          <button
            onClick={() => setShowHints((s) => !s)}
            className="text-[10px] font-semibold tracking-[0.3em] text-[#5A6379] hover:text-[#8B93A9] cursor-pointer"
          >
            {showHints ? '▾' : '▸'} HINTS — PAID IN POINTS
          </button>
          {showHints && (
            <div className="mt-4 space-y-3">
              {hints === null && <div className="text-[12px] text-[#454C61]">Reading hint index…</div>}
              {hints?.length === 0 && (
                <div className="text-[12px] text-[#454C61]">No hints published for this challenge.</div>
              )}
              {hints?.map((hint, idx) => (
                <div key={hint.id} className="border border-[#1E2536] bg-[#0B0E16]/60 px-4 py-3">
                  <div className="flex items-center justify-between gap-4">
                    <span className="text-[11px] tracking-[0.2em] text-[#5A6379]">
                      HINT {idx + 1} · {hint.cost} PTS
                    </span>
                    {!hint.isUnlocked && (
                      <button
                        onClick={() => buyHint(hint)}
                        disabled={busy}
                        className="text-[11px] font-semibold tracking-[0.15em] text-[#E0A83E] hover:brightness-125 disabled:opacity-40 cursor-pointer"
                      >
                        DECRYPT −{hint.cost} PTS →
                      </button>
                    )}
                  </div>
                  {hint.isUnlocked && hint.body && (
                    <p className="mt-2 text-[13px] leading-relaxed text-[#C6CCDA]">{hint.body}</p>
                  )}
                </div>
              ))}
            </div>
          )}
        </div>

        <form onSubmit={submit} className="mt-10 max-w-4xl">
          <div
            className="relative border px-5 py-5 transition-all duration-300"
            onMouseEnter={() => setFlagHover(true)}
            onMouseLeave={() => setFlagHover(false)}
            style={{
              borderColor: flagHover ? GOLD : `${GOLD}3A`,
              background: flagHover
                ? `linear-gradient(180deg, ${GOLD}26, rgba(11,14,22,0.9) 60%)`
                : `linear-gradient(180deg, ${GOLD}07, rgba(11,14,22,0.92) 60%)`,
              boxShadow: flagHover
                ? `0 0 0 1px ${GOLD}55, 0 0 42px ${GOLD}66, inset 0 0 24px ${GOLD}11`
                : 'none',
            }}
          >
            <div
              className="absolute left-0 top-0 h-full transition-all duration-300"
              style={{
                width: '2px',
                background: flagHover ? GOLD : `${GOLD}66`,
                boxShadow: flagHover ? `0 0 20px ${GOLD}, 0 0 40px ${GOLD}88` : 'none',
              }}
            />
            <div className="flex items-center justify-between gap-3">
              <div className="text-[10px] font-bold tracking-[0.3em] text-[#8B93A9]">
                <span
                  className="mr-2 inline-block border px-1.5 py-0.5 text-[10px] transition-all duration-300"
                  style={
                    flagHover
                      ? { background: GOLD, borderColor: GOLD, color: '#07090F', boxShadow: `0 0 12px ${GOLD}` }
                      : { background: 'transparent', borderColor: `${GOLD}55`, color: GOLD }
                  }
                >
                  {'$>'}
                </span>
                CONFESS THE FLAG
              </div>
              <div
                className="text-[9px] tracking-[0.25em]"
                style={{ color: flagHover ? GOLD : `${GOLD}77` }}
              >
                {closed ? 'SEALED' : 'AWAITING INPUT'}
              </div>
            </div>
            <div
              className="mt-4 flex items-center gap-3 border bg-black/40 px-4 py-3 transition-colors duration-300"
              style={{ borderColor: flagHover ? `${GOLD}BB` : '#232B40' }}
            >
              <span className="font-bold" style={{ color: flagHover ? GOLD : `${GOLD}77` }}>$</span>
              <input
                value={flag}
                onChange={(e) => setFlag(e.target.value)}
                placeholder="BreachPoint{...}"
                disabled={closed}
                className="flex-1 bg-transparent text-[15px] tracking-[0.05em] text-[#F2F5FA] focus:outline-none placeholder-[#454C61] disabled:opacity-40"
              />
              <button
                type="submit"
                id="btn-submit-flag"
                disabled={closed || busy || !flag.trim()}
                className="shrink-0 px-5 py-2.5 text-[12px] font-bold tracking-[0.2em] disabled:opacity-30 disabled:cursor-not-allowed cursor-pointer transition-all duration-300"
                style={
                  flagHover
                    ? { background: GOLD, color: '#07090F', boxShadow: `0 0 22px ${GOLD}88` }
                    : { background: 'transparent', color: GOLD, border: `1px solid ${GOLD}55`, boxShadow: 'none' }
                }
              >
                {busy ? 'CHECKING…' : 'Hand over →'}
              </button>
            </div>
          </div>

          {closed && (
            <div className="mt-4 text-[12px] text-[#5A6379]">
              {solved ? 'Already held by your team.' : 'Skipped — this node is closed and scored zero.'}
            </div>
          )}
          {status.type !== 'idle' && (
            <div className={`mt-4 text-[13px] ${status.type === 'success' ? 'text-[#5ED6E3]' : 'text-[#E84D7E]'}`}>
              {status.message}
            </div>
          )}
          {status.type === 'success' && next && next.id && (
            <button
              type="button"
              onClick={() => navigateTo('CHALLENGE', next.slot)}
              className="mt-3 text-[12px] underline underline-offset-4 cursor-pointer"
              style={{ color: tone }}
            >
              Next: {next.slot} →
            </button>
          )}

          {!closed && (
            <div className="mt-6">
              {confirmSkip ? (
                <div className="border border-[#E84D7E]/40 bg-[#E84D7E]/[0.05] px-4 py-3">
                  <p className="text-[12px] leading-relaxed text-[#C6CCDA]">
                    Skipping closes {activeChallenge.slot} for <b>zero points</b> and drops every
                    reward on Path {activeChallenge.pathId} to <b>80%</b> for the rest of the run.
                    You have <b>{skips.remaining}</b> of {skips.quota} skips left.
                  </p>
                  <div className="mt-3 flex items-center gap-5 text-[11px] tracking-[0.2em]">
                    <button onClick={() => setConfirmSkip(false)} className="text-[#5A6379] hover:text-[#8B93A9] cursor-pointer">
                      ← CANCEL
                    </button>
                    <button onClick={doSkip} disabled={busy} className="text-[#E84D7E] font-bold disabled:opacity-40 cursor-pointer">
                      SPEND A SKIP →
                    </button>
                  </div>
                </div>
              ) : (
                <button
                  type="button"
                  onClick={() => setConfirmSkip(true)}
                  disabled={skips.remaining <= 0}
                  className="text-[11px] tracking-[0.2em] text-[#5A6379] hover:text-[#E84D7E] disabled:opacity-30 disabled:hover:text-[#5A6379] cursor-pointer"
                >
                  {skips.remaining > 0
                    ? `SKIP CHALLENGE — ${skips.remaining}/${skips.quota} LEFT →`
                    : 'NO SKIPS REMAINING'}
                </button>
              )}
            </div>
          )}
        </form>
      </div>
    </div>
  );
};
