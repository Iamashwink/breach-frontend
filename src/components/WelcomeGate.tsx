import React, { useState } from 'react';
import { useGame } from '../context/GameContext';
import { DIFFICULTY_META } from '../services/backend';

/**
 * The welcome challenge, played inline on the dashboard.
 *
 * It belongs to no path, so it appears on no chart and no trail — and the
 * server refuses path selection until it is solved. Without somewhere to submit
 * its flag the whole event is sealed behind a gate with no handle, so the gate
 * carries its own input rather than borrowing the challenge page.
 */
export const WelcomeGate: React.FC = () => {
  const { welcome, submitFlag, busy } = useGame();
  const [flag, setFlag] = useState('');
  const [status, setStatus] = useState<{ type: 'idle' | 'error'; message: string }>({
    type: 'idle',
    message: '',
  });

  if (!welcome) return null;

  const solved = welcome.status === 'solved';
  const diff = DIFFICULTY_META[welcome.difficulty];

  const submit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!flag.trim() || busy) return;
    const r = await submitFlag(welcome.id, flag);
    if (r.success) {
      setFlag('');
      setStatus({ type: 'idle', message: '' });
    } else {
      setStatus({ type: 'error', message: r.message });
    }
  };

  if (solved) {
    return (
      <section className="mb-4 border border-[#1E2536] bg-[#0B0E16]/50 px-5 py-3 text-[11px] tracking-[0.15em] text-[#5A6379]">
        ✓ {welcome.title.toUpperCase()} — DECODED. ALL THREE PATHS ARE OPEN TO YOU.
      </section>
    );
  }

  return (
    <section className="mb-4 border border-[#5ED6E3]/40 bg-[#5ED6E3]/[0.04] px-5 py-4">
      <div className="text-[10px] tracking-[0.25em] text-[#5ED6E3]">
        OPEN THIS FIRST // PATH SELECTION IS SEALED UNTIL IT FALLS
      </div>
      <div className="mt-2 flex flex-wrap items-center gap-3">
        <span className="font-display text-lg text-[#F2F5FA]">{welcome.title}</span>
        <span
          className="text-[10px] font-bold tracking-[0.15em] px-1.5 py-0.5 border"
          style={{ color: diff.color, borderColor: `${diff.color}66` }}
        >
          {diff.label}
        </span>
        <span className="text-[11px] text-[#5A6379]">{welcome.currentPoints} PTS</span>
      </div>
      <p className="mt-2 text-[13px] leading-relaxed text-[#9AA2B5] whitespace-pre-line">
        {welcome.objective}
      </p>

      <form onSubmit={submit} className="mt-4 flex items-center gap-3 border-b border-[#2C3550] pb-2">
        <span className="text-[#454C61]">$</span>
        <input
          id="welcome-flag"
          value={flag}
          onChange={(e) => setFlag(e.target.value)}
          placeholder="BreachPoint{...}"
          className="flex-1 bg-transparent font-mono text-[14px] text-[#F2F5FA] focus:outline-none placeholder-[#454C61]"
        />
        <button
          type="submit"
          id="btn-submit-welcome"
          disabled={busy || !flag.trim()}
          className="text-[12px] font-semibold tracking-[0.15em] text-[#5ED6E3] disabled:opacity-30 cursor-pointer"
        >
          {busy ? 'CHECKING…' : 'DECODE →'}
        </button>
      </form>
      {status.type === 'error' && (
        <div className="mt-3 text-[13px] text-[#E84D7E]">{status.message}</div>
      )}
    </section>
  );
};
