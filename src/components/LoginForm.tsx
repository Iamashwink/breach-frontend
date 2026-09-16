import React, { useState } from 'react';
import { useGame } from '../context/GameContext';

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
 * Sign in or register against `/auth`.
 *
 * Accounts are per-person, not per-team: the roster is open, and teams are
 * formed on the next screen. That is the backend's model — `core_user` holds a
 * person, `core_team` holds the thing that scores.
 */
export const LoginForm: React.FC = () => {
  const { login, signup, authError, busy } = useGame();
  const [mode, setMode] = useState<'login' | 'signup'>('login');
  const [username, setUsername] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);

  const isSignup = mode === 'signup';
  const canSubmit =
    !busy && email.trim().length > 0 && password.length > 0 && (!isSignup || username.trim().length >= 3);

  const submit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!canSubmit) return;
    if (isSignup) await signup(username, email, password);
    else await login(email, password);
  };

  return (
    <div className="relative border border-[#1E2536] bg-[#0A0D15]/90 px-7 py-8 sm:px-9">
      <CornerTicks />
      <h1 className="font-display font-bold uppercase leading-[1.05] tracking-tight text-[#F2F5FA] text-3xl sm:text-4xl">
        Identify<br />yourself.
      </h1>

      <div className="mt-5 flex gap-4 text-[10px] tracking-[0.25em]">
        <button
          type="button"
          onClick={() => setMode('login')}
          className={`pb-1 cursor-pointer ${!isSignup ? 'text-[#5ED6E3] border-b border-[#5ED6E3]' : 'text-[#5A6379] hover:text-[#8B93A9]'}`}
        >
          SIGN IN
        </button>
        <button
          type="button"
          onClick={() => setMode('signup')}
          className={`pb-1 cursor-pointer ${isSignup ? 'text-[#5ED6E3] border-b border-[#5ED6E3]' : 'text-[#5A6379] hover:text-[#8B93A9]'}`}
        >
          REGISTER
        </button>
      </div>

      <form onSubmit={submit} className="mt-6">
        {isSignup && (
          <>
            <label className="block text-[10px] tracking-[0.3em] text-[#5A6379]">CALLSIGN</label>
            <div className="mt-2 flex items-center gap-3 border border-[#1E2536] bg-black/40 px-4 py-3 focus-within:border-[#5ED6E3]/60">
              <input
                id="signup-username"
                value={username}
                onChange={(e) => setUsername(e.target.value)}
                placeholder="3–30 CHARACTERS"
                autoComplete="username"
                className="flex-1 bg-transparent font-mono text-[14px] tracking-[0.08em] text-[#5ED6E3] focus:outline-none placeholder-[#454C61]"
              />
              <span className="text-[9px] tracking-[0.2em] text-[#454C61]">ID:OPR</span>
            </div>
          </>
        )}

        <label className={`block text-[10px] tracking-[0.3em] text-[#5A6379] ${isSignup ? 'mt-6' : ''}`}>EMAIL</label>
        <div className="mt-2 flex items-center gap-3 border border-[#1E2536] bg-black/40 px-4 py-3 focus-within:border-[#5ED6E3]/60">
          <input
            id="login-email"
            type="email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            placeholder="operative@axios.net"
            autoComplete="email"
            className="flex-1 bg-transparent font-mono text-[14px] tracking-[0.08em] text-[#5ED6E3] focus:outline-none placeholder-[#454C61]"
          />
        </div>

        <div className="mt-6 flex items-center justify-between">
          <label className="block text-[10px] tracking-[0.3em] text-[#5A6379]">PASSWORD</label>
          <button
            type="button"
            onClick={() => setShowPassword((s) => !s)}
            className="text-[10px] tracking-[0.25em] text-[#5A6379] hover:text-[#8B93A9] cursor-pointer"
          >
            {showPassword ? 'HIDE' : 'SHOW'}
          </button>
        </div>
        <div className="mt-2 border border-[#1E2536] bg-black/40 px-4 py-3 focus-within:border-[#5ED6E3]/60">
          <input
            id="login-password"
            type={showPassword ? 'text' : 'password'}
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            placeholder="••••••••••••"
            autoComplete={isSignup ? 'new-password' : 'current-password'}
            className="w-full bg-transparent font-mono text-[14px] tracking-[0.3em] text-[#D5DBE7] focus:outline-none placeholder-[#454C61]"
          />
        </div>
        {isSignup && (
          <div className="mt-2 text-[10px] tracking-[0.15em] text-[#454C61]">MINIMUM 8 CHARACTERS</div>
        )}

        {authError && <div className="mt-4 text-[13px] text-[#E84D7E]">{authError}</div>}

        <button
          type="submit"
          id="btn-login"
          disabled={!canSubmit}
          className="mt-6 w-full bg-[#5ED6E3] hover:bg-[#7CE3EE] disabled:opacity-30 disabled:cursor-not-allowed px-10 py-4 text-[#06232A] text-[12px] font-bold tracking-[0.3em] transition-colors cursor-pointer"
        >
          {busy ? 'CONNECTING…' : isSignup ? 'PROVISION OPERATIVE →' : 'ENTER THE ARCHIVE →'}
        </button>
      </form>
    </div>
  );
};
