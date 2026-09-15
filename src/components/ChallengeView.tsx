import React, { useState } from 'react';
import { useGame } from '../context/GameContext';
import { CHALLENGES_DATA } from '../data/challengesData';
import { getChallengeQuestion, getChallengeDifficulty, getChallengePoints } from '../services/backend';
import { DIFFICULTY_META } from '../utils/difficulty';

const TONE = { A: { c: '#E0A83E' }, B: { c: '#5ED6E3' }, C: { c: '#E84D7E' } } as const;

export const ChallengeView: React.FC = () => {
  const { activeChallenge, navigateTo, submitFlag, skipChallenge, openBriefing, solvedChallengeIds } = useGame();
  const [flag, setFlag] = useState('');
  const [status, setStatus] = useState<{ type: 'idle' | 'success' | 'error'; message: string }>({ type: 'idle', message: '' });

  if (!activeChallenge) {
    return <div className="flex-1 bg-[#07090F] flex items-center justify-center"><button onClick={() => navigateTo('MAP')} className="text-[12px] text-[#5A6379]">← Back</button></div>;
  }

  const tone = TONE[activeChallenge.pathId];
  // Q&A + difficulty + points resolve via src/services/backend.ts
  // (TODO: swap for fetchChallengeQuestion/fetchChallengeDifficulty/fetchChallengePoints).
  const question = getChallengeQuestion(activeChallenge);
  const diff = getChallengeDifficulty(activeChallenge);
  const pts = getChallengePoints(activeChallenge);
  const solved = solvedChallengeIds.includes(activeChallenge.id);
  const all = CHALLENGES_DATA.filter(c => c.pathId === activeChallenge.pathId);
  const i = all.findIndex(c => c.id === activeChallenge.id);
  const prev = i > 0 ? all[i - 1] : null;
  const next = i < all.length - 1 ? all[i + 1] : null;

  const submit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!flag.trim()) return;
    const r = submitFlag(activeChallenge.id, flag);
    setStatus(r.success ? { type: 'success', message: r.message } : { type: 'error', message: r.message });
    if (r.success) setFlag('');
  };

  const skip = () => {
    if (solved) return;
    if (!window.confirm(`Skip ${activeChallenge.id} for −100 PTS? No points will be awarded.`)) return;
    const r = skipChallenge(activeChallenge.id);
    if (!r.success) {
      setStatus({ type: 'error', message: r.message });
      return;
    }
    if (next) navigateTo('CHALLENGE', next.id);
    else navigateTo('MAP');
  };

  const downloadArtifact = () => {
    const blob = new Blob([question.artifactContent], { type: 'text/plain;charset=utf-8' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = question.artifactName || `${activeChallenge.id}.txt`;
    link.click();
    URL.revokeObjectURL(url);
  };

  return (
    <div className="flex-1 bg-[#07090F]">
      <div className="w-full max-w-6xl mx-auto px-6 sm:px-10 py-10">
        <div className="flex justify-between text-[11px] tracking-[0.2em] text-[#454C61]">
          <button onClick={() => navigateTo('MAP', null, activeChallenge.pathId)} className="hover:text-[#8B93A9]">← CHART</button>
          <span className="flex gap-4">
            <button onClick={() => prev && navigateTo('CHALLENGE', prev.id)} disabled={!prev} className="disabled:opacity-30">←</button>
            <button onClick={() => next && navigateTo('CHALLENGE', next.id)} disabled={!next} className="disabled:opacity-30">→</button>
          </span>
        </div>

        <div className="mt-10 text-[11px] font-semibold tracking-[0.25em]" style={{ color: tone.c }}>{activeChallenge.id} · {activeChallenge.category} {solved ? '· HELD ✓' : ''}</div>
        <h1 className="mt-3 font-display uppercase tracking-wide text-3xl sm:text-5xl leading-tight text-[#F2F5FA]">{activeChallenge.subtitle || activeChallenge.title}</h1>
        <div className="mt-3 flex flex-wrap items-center gap-3 text-[12px] text-[#5A6379]">
          <span className="font-bold tracking-[0.15em] px-1.5 py-0.5 border" style={{ color: DIFFICULTY_META[diff].color, borderColor: `${DIFFICULTY_META[diff].color}66` }}>{DIFFICULTY_META[diff].label}</span>
          <span>· +{pts} PTS</span>
        </div>

        <div className="mt-10 text-[10px] font-semibold tracking-[0.3em] text-[#5A6379]">OBJECTIVE // FLAG FORMAT: {question.flagFormat}</div>
        <p className="mt-3 text-[15px] text-[#C6CCDA] leading-[1.8] max-w-3xl">{question.prompt}</p>

        {/* PRE-TRANSMISSION NARRATION — the keeper briefs you before you touch the artifact */}
        <div className="mt-8 border-l-2 pl-5 pr-5 py-4 max-w-3xl" style={{ borderColor: `${tone.c}88`, background: `${tone.c}08` }}>
          <div className="text-[10px] font-semibold tracking-[0.3em]" style={{ color: tone.c }}>
            PRE-TRANSMISSION // {activeChallenge.briefing.speaker} — {activeChallenge.briefing.subTag}
          </div>
          <p className="mt-3 font-lore italic text-[18px] leading-[1.7] text-[#E8ECF3]">
            “{activeChallenge.briefing.slides[0]}”
          </p>
          <button onClick={() => openBriefing(activeChallenge.id)} className="mt-3 text-[12px] font-semibold tracking-[0.15em] hover:brightness-110" style={{ color: tone.c }}>
            HEAR FULL PRE-BRIEF ({activeChallenge.briefing.slides.length}) →
          </button>
        </div>

        <div className="mt-12 border-t border-[#1E2536] pt-8 max-w-4xl">
          <div className="flex flex-wrap items-center gap-5 text-[11px] font-semibold tracking-[0.2em]">
            <span className="text-[#F2F5FA]">{question.artifactName || 'ARTIFACT'}</span>
            <button onClick={downloadArtifact} className="text-[#5ED6E3] hover:text-[#7CE3EE] cursor-pointer">DOWNLOAD FILE</button>
            <button onClick={() => navigator.clipboard.writeText(question.artifactContent)} className="ml-auto font-normal text-[#454C61] hover:text-[#8B93A9] cursor-pointer">COPY</button>
          </div>
          <pre className="mt-5 font-mono text-[13px] leading-[1.9] whitespace-pre-wrap border border-[#1E2536] bg-[#0B0E16]/60 px-5 py-5" style={{ color: `${tone.c}CC` }}>{question.artifactContent}</pre>
        </div>

        <form onSubmit={submit} className="mt-12 border-t border-[#1E2536] pt-8 max-w-4xl">
          <div className="text-[10px] tracking-[0.3em] text-[#454C61]">CONFESS THE FLAG</div>
          <div className="mt-4 flex items-center gap-3 border-b border-[#2C3550] pb-3">
            <span className="text-[#454C61]">$</span>
            <input value={flag} onChange={(e) => setFlag(e.target.value)} placeholder="axios{...}" className="flex-1 bg-transparent text-[15px] text-[#F2F5FA] focus:outline-none placeholder-[#454C61]" />
            <button type="submit" id="btn-submit-flag" className="text-[13px] font-semibold" style={{ color: tone.c }}>Hand over →</button>
          </div>
          {status.type !== 'idle' && <div className={`mt-4 text-[13px] ${status.type === 'success' ? 'text-[#5ED6E3]' : 'text-[#E84D7E]'}`}>{status.message}</div>}
          {status.type === 'success' && (
            <div className="mt-3 border border-[#5ED6E3]/30 bg-[#5ED6E3]/[0.04] px-4 py-3 text-[12px] text-[#8B93A9]">
              Post-transmission debrief queued — it will surface automatically.
            </div>
          )}
          {status.type === 'success' && next && <button onClick={() => navigateTo('CHALLENGE', next.id)} className="mt-1 text-[12px] underline underline-offset-4" style={{ color: tone.c }}>Next: {next.id} →</button>}
          {!solved && (
            <div className="mt-6">
              <button onClick={skip} className="text-[11px] tracking-[0.2em] text-[#5A6379] hover:text-[#E84D7E] cursor-pointer">
                SKIP CHALLENGE −100 PTS →
              </button>
            </div>
          )}
        </form>
      </div>
    </div>
  );
};
