import React, { useState } from 'react';
import { useGame } from '../context/GameContext';
// TODO(backend): swap getRoster() for await fetchLogin/roster (GET /api/operatives).

/** Corner-tick frame accents (login panel, site cards). */
export const CornerTicks: React.FC<{ color?: string }> = ({ color = '#5ED6E3' }) => (
  <>
    <span className="absolute left-0 top-0 h-2.5 w-2.5 border-l border-t" style={{ borderColor: `${color}88` }} />
    <span className="absolute right-0 top-0 h-2.5 w-2.5 border-r border-t" style={{ borderColor: `${color}88` }} />
    <span className="absolute bottom-0 left-0 h-2.5 w-2.5 border-b border-l" style={{ borderColor: `${color}88` }} />
    <span className="absolute bottom-0 right-0 h-2.5 w-2.5 border-b border-r" style={{ borderColor: `${color}88` }} />
  </>
);

/**
 * Operative login form (callsign + access code, pre-provisioned roster only).
 * Shared by the standalone login route and the combined landing page.
 */
export const LoginForm: React.FC = () => {
  const { login, authError } = useGame();
  const [callsign, setCallsign] = useState('');
  const [code, setCode] = useState('');
  const [showCode, setShowCode] = useState(false);

  const submit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!callsign.trim() || !code) return;
    login(callsign, code);
  };

  return (
    <div className="relative border border-[#1E2536] bg-[#0A0D15]/90 px-7 py-8 sm:px-9">
      <CornerTicks />
      <h1 className="font-display font-bold uppercase leading-[1.05] tracking-tight text-[#F2F5FA] text-3xl sm:text-4xl">
        Identify<br />yourself.
      </h1>

      <form onSubmit={submit} className="mt-8">
        <label className="block text-[10px] tracking-[0.3em] text-[#5A6379]">USERNAME</label>
        <div className="mt-2 flex items-center gap-3 border border-[#1E2536] bg-black/40 px-4 py-3 focus-within:border-[#5ED6E3]/60">
          <input
            id="login-callsign"
            value={callsign}
            onChange={(e) => setCallsign(e.target.value.toUpperCase())}
            placeholder="ENTER TEAM NAME"
            autoComplete="username"
            className="flex-1 bg-transparent font-mono text-[14px] tracking-[0.08em] text-[#5ED6E3] focus:outline-none placeholder-[#454C61]"
          />
          <span className="text-[9px] tracking-[0.2em] text-[#454C61]">ID:OPR</span>
        </div>

        <div className="mt-6 flex items-center justify-between">
          <label className="block text-[10px] tracking-[0.3em] text-[#5A6379]">PASSWORD</label>
          <button type="button" onClick={() => setShowCode((s) => !s)} className="text-[10px] tracking-[0.25em] text-[#5A6379] hover:text-[#8B93A9] cursor-pointer">
            {showCode ? 'SHOW' : 'HIDE'}
          </button>
        </div>
        <div className="mt-2 border border-[#1E2536] bg-black/40 px-4 py-3 focus-within:border-[#5ED6E3]/60">
          <input
            id="login-code"
            type={showCode ? 'text' : 'password'}
            value={code}
            onChange={(e) => setCode(e.target.value)}
            placeholder="••••••••••••"
            autoComplete="current-password"
            className="w-full bg-transparent font-mono text-[14px] tracking-[0.3em] text-[#D5DBE7] focus:outline-none placeholder-[#454C61]"
          />
        </div>

        {authError && <div className="mt-4 text-[13px] text-[#E84D7E]">{authError}</div>}

        <button
          type="submit"
          id="btn-login"
          disabled={!callsign.trim() || !code}
          className="mt-6 w-full bg-[#5ED6E3] hover:bg-[#7CE3EE] disabled:opacity-30 disabled:cursor-not-allowed px-10 py-4 text-[#06232A] text-[12px] font-bold tracking-[0.3em] transition-colors cursor-pointer"
        >
          ENTER THE ARCHIVE →
        </button>
      </form>
    </div>
  );
};
