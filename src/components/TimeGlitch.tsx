import React, { useCallback, useEffect, useRef, useState } from 'react';

/**
 * TIME GLITCH
 * -----------------------------------------------------------------------------
 * Three phases, one component:
 *   1. ANNOUNCE  — full-screen takeover when the window opens (~4.6s)
 *                  animates current -> initial points rewind, pauses for review
 *   2. WINDOW    — live countdown while the window runs
 *   3. RESET     — full temporal collapse animation returning initial -> current
 *
 * Mount once, near <ToastBanner /> in App.tsx:
 *
 *   <TimeGlitch
 *     active={glitchActive}
 *     endsAt={glitchEndsAt}
 *     sample={{ initial: 500, current: 300 }}
 *     onReset={() => refresh()}
 *   />
 */

export type TimeGlitchPhase = 'idle' | 'announce' | 'window' | 'reset';

export interface TimeGlitchProps {
  /** True for the whole duration of the glitch window. */
  active: boolean;
  /** Epoch ms when the window closes and points reset. */
  endsAt: number;
  /** The representative node shown rewinding and returning. */
  sample?: {
    initial?: number;
    current?: number;
    original?: number;
    decayed?: number;
    slot?: string;
    title?: string;
  };
  /** Fired once the takeover collapses into the HUD bar. */
  onAnnounced?: () => void;
  /** Fired at T−0 or when glitch ends. */
  onReset?: () => void;
}

const NOISE = '▚▞01<>/\\#*%&ΔΞ+=';
const pad = (n: number) => String(n).padStart(2, '0');
const fmt = (s: number) => `${pad(Math.floor(s / 60))}:${pad(s % 60)}`;

export const TimeGlitch: React.FC<TimeGlitchProps> = ({
  active,
  endsAt,
  sample,
  onAnnounced,
  onReset,
}) => {
  const initialVal = sample?.initial ?? sample?.original ?? 500;
  const rawCurrent = sample?.current ?? sample?.decayed ?? 300;
  const currentVal = rawCurrent < initialVal ? rawCurrent : Math.max(10, Math.round(initialVal * 0.65));
  const slotLabel = sample?.slot ?? '';

  const [phase, setPhase] = useState<TimeGlitchPhase>('idle');
  const [remaining, setRemaining] = useState(0);
  const [titleText, setTitleText] = useState('');
  const [rewound, setRewound] = useState(currentVal);
  const [decayCount, setDecayCount] = useState(initialVal);
  const [struck, setStruck] = useState(false);
  const [resetStruck, setResetStruck] = useState(false);
  const [jolt, setJolt] = useState(0);
  const [reveal, setReveal] = useState({
    rotor: false,
    eyebrow: false,
    core: false,
    rule: false,
    ledger: false,
    note: false,
    chip: false,
  });
  const [split, setSplit] = useState(false);

  const timers = useRef<number[]>([]);
  const raf = useRef<number>(0);
  const fired = useRef(false);
  const prevActive = useRef(active);

  const reduced =
    typeof window !== 'undefined' &&
    window.matchMedia?.('(prefers-reduced-motion: reduce)').matches;

  const at = useCallback((ms: number, fn: () => void) => {
    timers.current.push(window.setTimeout(fn, ms));
  }, []);

  const clearAll = useCallback(() => {
    timers.current.forEach(clearTimeout);
    timers.current = [];
    cancelAnimationFrame(raf.current);
  }, []);

  /* ── per-character decode ───────────────────────────────────────────── */
  const scramble = useCallback((text: string, dur: number) => {
    const start = performance.now();
    const seeds = [...text].map((_, i) => i * (dur / (text.length * 1.9)));
    const frame = (now: number) => {
      const t = now - start;
      let out = '';
      for (let i = 0; i < text.length; i++) {
        const c = text[i];
        if (c === ' ') {
          out += ' ';
          continue;
        }
        if (t > seeds[i] + dur * 0.42) out += c;
        else if (t > seeds[i]) out += NOISE[(Math.random() * NOISE.length) | 0];
        else out += ' ';
      }
      setTitleText(out);
      if (t < dur) raf.current = requestAnimationFrame(frame);
      else setTitleText(text);
    };
    raf.current = requestAnimationFrame(frame);
  }, []);

  /* ── counter running backwards: currentVal -> initialVal ──────────── */
  const rewind = useCallback((from: number, to: number, dur: number) => {
    const start = performance.now();
    const frame = (now: number) => {
      const p = Math.min(1, (now - start) / dur);
      const eased = 1 - Math.pow(1 - p, 3);
      let v = Math.round(from + (to - from) * eased);
      if (p < 0.62 && Math.random() > 0.55) {
        v = to - ((Math.random() * Math.max(10, Math.abs(to - from) * 0.35)) | 0);
      }
      setRewound(Math.max(from, Math.min(to, v)));
      if (p < 1) {
        raf.current = requestAnimationFrame(frame);
      } else {
        setRewound(to);
      }
    };
    raf.current = requestAnimationFrame(frame);
  }, []);

  /* ── counter running forward: initialVal -> currentVal ────────────── */
  const forwardDecay = useCallback((from: number, to: number, dur: number) => {
    const start = performance.now();
    const frame = (now: number) => {
      const p = Math.min(1, (now - start) / dur);
      const eased = 1 - Math.pow(1 - p, 3);
      let v = Math.round(from - (from - to) * eased);
      if (p < 0.62 && Math.random() > 0.55) {
        v = to + ((Math.random() * Math.max(10, Math.abs(from - to) * 0.35)) | 0);
      }
      setDecayCount(Math.max(to, Math.min(from, v)));
      if (p < 1) {
        raf.current = requestAnimationFrame(frame);
      } else {
        setDecayCount(to);
      }
    };
    raf.current = requestAnimationFrame(frame);
  }, []);

  /* ── reset / return animation sequence ────────────────────────────── */
  const triggerReset = useCallback(() => {
    if (fired.current) return;
    fired.current = true;
    clearAll();
    setPhase('reset');
    setResetStruck(false);
    setDecayCount(initialVal);

    if (reduced) {
      setResetStruck(true);
      setDecayCount(currentVal);
      at(600, () => onReset?.());
      at(2400, () => setPhase('idle'));
      return;
    }

    at(400, () => setResetStruck(true));
    at(550, () => forwardDecay(initialVal, currentVal, 1000));
    at(1600, () => onReset?.());
    // Pause on final decayed value for ~1.4s so the player clearly reads it:
    at(3000, () => setPhase('idle'));
  }, [clearAll, initialVal, currentVal, reduced, at, onReset, forwardDecay]);

  /* ── announcement sequence ──────────────────────────────────────────── */
  useEffect(() => {
    if (!active) return;

    clearAll();
    fired.current = false;
    setPhase('announce');
    setRewound(currentVal);
    setStruck(false);
    setReveal({
      rotor: false,
      eyebrow: false,
      core: false,
      rule: false,
      ledger: false,
      note: false,
      chip: false,
    });

    if (reduced) {
      setReveal({
        rotor: true,
        eyebrow: true,
        core: true,
        rule: true,
        ledger: true,
        note: true,
        chip: true,
      });
      setTitleText('TIME GLITCH');
      setStruck(true);
      setRewound(initialVal);
      at(3500, () => {
        setPhase('window');
        onAnnounced?.();
      });
      return clearAll;
    }

    at(250, () => setReveal((r) => ({ ...r, rotor: true })));
    at(300, () => setReveal((r) => ({ ...r, core: true })));
    [320, 700, 1500, 2250].forEach((d) => at(d, () => setJolt((j) => j + 1)));
    at(380, () => setReveal((r) => ({ ...r, eyebrow: true })));
    at(550, () => {
      setSplit(true);
      scramble('TIME GLITCH', 950);
    });
    at(1560, () => setSplit(false));
    at(1250, () => setReveal((r) => ({ ...r, rule: true })));
    at(1350, () => setReveal((r) => ({ ...r, ledger: true })));
    at(1500, () => setStruck(true));
    at(1620, () => rewind(currentVal, initialVal, 950));
    at(2600, () => setReveal((r) => ({ ...r, note: true })));
    at(2800, () => setReveal((r) => ({ ...r, chip: true })));
    // Pause for ~1.8 seconds after rewind finishes (rewind completes around 2570ms):
    at(4600, () => {
      setPhase('window');
      onAnnounced?.();
    });

    return clearAll;
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [active]);

  /* ── handle active turning false ────────────────────────────────────── */
  useEffect(() => {
    if (prevActive.current && !active) {
      if (phase === 'window' || phase === 'announce') {
        triggerReset();
      } else if (phase !== 'reset') {
        clearAll();
        setPhase('idle');
      }
    }
    prevActive.current = active;
  }, [active, phase, clearAll, triggerReset]);

  /* ── countdown + T−0 trigger ────────────────────────────────────────── */
  useEffect(() => {
    if (!active) return;
    const tick = () => {
      const left = Math.max(0, Math.round((endsAt - Date.now()) / 1000));
      setRemaining(left);
      if (left === 0 && !fired.current && phase === 'window') {
        triggerReset();
      }
    };
    tick();
    const id = window.setInterval(tick, 1000);
    return () => clearInterval(id);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [active, endsAt, phase, triggerReset]);

  if (phase === 'idle') return null;

  const fade = (on: boolean, ms = 300) => ({
    opacity: on ? 1 : 0,
    transition: `opacity ${ms}ms ease`,
  });

  return (
    <>
      <style>{CSS}</style>

      {/* ── 1. TAKEOVER (ANNOUNCE: CURRENT -> INITIAL) ──────────────── */}
      {phase === 'announce' && (
        <div
          className="tg-ov"
          role="alert"
          aria-label="Time glitch active. Node values rewind from current to initial points."
        >
          <div className="tg-veil" />
          <div className="tg-scan" />
          {!reduced && <div className="tg-flash" />}
          {!reduced && <div className="tg-seam" />}
          {!reduced &&
            [0, 1, 2, 3].map((i) => (
              <div
                key={i}
                className="tg-scrub"
                style={{ animationDelay: `${180 + i * 320}ms` }}
              />
            ))}

          <div
            className={`tg-core${jolt ? ' tg-jolt' : ''}`}
            key={jolt}
            style={fade(reveal.core, 180)}
          >
            <svg
              className="tg-rotor"
              width="76"
              height="76"
              viewBox="0 0 76 76"
              aria-hidden="true"
              style={fade(reveal.rotor)}
            >
              <circle cx="38" cy="38" r="35" fill="none" stroke="#2C3550" strokeWidth="1" />
              <circle
                cx="38"
                cy="38"
                r="28"
                fill="none"
                stroke="#6E5424"
                strokeWidth="1"
                strokeDasharray="2 6"
              />
              <g stroke="#5A6379" strokeWidth="1">
                <line x1="38" y1="4" x2="38" y2="12" />
                <line x1="72" y1="38" x2="64" y2="38" />
                <line x1="38" y1="72" x2="38" y2="64" />
                <line x1="4" y1="38" x2="12" y2="38" />
              </g>
              <g className={reduced ? '' : 'tg-hand'}>
                <line
                  x1="38"
                  y1="38"
                  x2="38"
                  y2="14"
                  stroke="#E0A83E"
                  strokeWidth="2"
                  strokeLinecap="round"
                />
              </g>
              <circle cx="38" cy="38" r="2.5" fill="#E0A83E" />
            </svg>

            <div className="tg-eyebrow" style={fade(reveal.eyebrow)}>
              TEMPORAL ANOMALY DETECTED
            </div>

            <h1 className={`tg-title${split ? ' tg-split' : ''}`} data-text={titleText}>
              {titleText || '\u00a0'}
            </h1>

            <div className="tg-rule" style={{ transform: `scaleX(${reveal.rule ? 1 : 0})` }} />

            <div className="tg-ledger" style={fade(reveal.ledger, 250)}>
              <div className="tg-ledger-item">
                <span className="tg-ledger-label tg-label-current">CURRENT</span>
                <span className={`tg-old${struck ? ' tg-struck' : ''}`}>{currentVal}</span>
              </div>
              <div className="tg-ledger-arrow">
                <span className="tg-rew">◀◀ REWIND</span>
              </div>
              <div className="tg-ledger-item">
                <span className="tg-ledger-label tg-label-initial">INITIAL</span>
                <span className="tg-new">{rewound}</span>
              </div>
            </div>

            <div className="tg-note" style={fade(reveal.note, 350)}>
              {slotLabel ? `NODE ${slotLabel} // ` : ''}EVERY NODE RETURNS TO ITS INITIAL VALUE AT T−0
            </div>

            <div className="tg-chip" style={fade(reveal.chip, 350)}>
              RESET IN <b>{fmt(remaining)}</b>
            </div>
          </div>
        </div>
      )}

      {/* ── 2. WINDOW — countdown runs silently until T−0 ────────────── */}
      {phase === 'window' && null}

      {/* ── 3. RESET / RETURN OVERLAY (INITIAL -> CURRENT) ───────────── */}
      {phase === 'reset' && (
        <div
          className="tg-ov tg-reset-ov"
          role="status"
          aria-label="Time glitch concluded. Point values returned to current decayed level."
        >
          <div className="tg-veil" />
          <div className="tg-scan" />
          {!reduced && <div className="tg-wave" />}
          {!reduced && <div className="tg-flash" style={{ background: '#E84D7E' }} />}
          {!reduced && <div className="tg-seam" style={{ background: '#E84D7E' }} />}

          <div className="tg-core">
            <svg
              className="tg-rotor"
              width="76"
              height="76"
              viewBox="0 0 76 76"
              aria-hidden="true"
            >
              <circle cx="38" cy="38" r="35" fill="none" stroke="#2C3550" strokeWidth="1" />
              <circle
                cx="38"
                cy="38"
                r="28"
                fill="none"
                stroke="#6E2435"
                strokeWidth="1"
                strokeDasharray="2 6"
              />
              <g stroke="#5A6379" strokeWidth="1">
                <line x1="38" y1="4" x2="38" y2="12" />
                <line x1="72" y1="38" x2="64" y2="38" />
                <line x1="38" y1="72" x2="38" y2="64" />
                <line x1="4" y1="38" x2="12" y2="38" />
              </g>
              <g className={reduced ? '' : 'tg-hand-forward'}>
                <line
                  x1="38"
                  y1="38"
                  x2="38"
                  y2="14"
                  stroke="#E84D7E"
                  strokeWidth="2"
                  strokeLinecap="round"
                />
              </g>
              <circle cx="38" cy="38" r="2.5" fill="#E84D7E" />
            </svg>

            <div className="tg-eyebrow" style={{ color: '#E84D7E' }}>
              TEMPORAL ANOMALY COLLAPSED // TIME GLITCH ENDED
            </div>

            <h1 className="tg-title" style={{ color: '#F2F5FA' }}>
              DECAY RESTORED
            </h1>

            <div className="tg-rule" style={{ transform: 'scaleX(1)' }} />

            <div className="tg-ledger">
              <div className="tg-ledger-item">
                <span className="tg-ledger-label tg-label-initial">INITIAL</span>
                <span className={`tg-old tg-initial-old${resetStruck ? ' tg-struck' : ''}`}>
                  {initialVal}
                </span>
              </div>
              <div className="tg-ledger-arrow">
                <span className="tg-decay-rew">▶▶ DECAY RETURN</span>
              </div>
              <div className="tg-ledger-item">
                <span className="tg-ledger-label tg-label-current">CURRENT</span>
                <span className="tg-val-decayed">{decayCount}</span>
              </div>
            </div>

            <div className="tg-note">
              {slotLabel ? `NODE ${slotLabel} // ` : ''}EVERY NODE RETURNS TO ITS CURRENT DECAYED VALUE
            </div>

            <div
              className="tg-chip"
              style={{ borderColor: '#6E2435', borderLeftColor: '#E84D7E' }}
            >
              NORMAL SCORING <b>RESUMED</b>
            </div>
          </div>
        </div>
      )}
    </>
  );
};

/* ─────────────────────────────────────────────────────────────────────────
   Styles. Self-contained so the component drops in without touching
   index.css.
   ───────────────────────────────────────────────────────────────────────── */
const CSS = `
.tg-ov{position:fixed;inset:0;z-index:80;display:flex;align-items:center;justify-content:center;pointer-events:none;font-family:'IBM Plex Mono',ui-monospace,monospace}
.tg-reset-ov{position:fixed;inset:0;z-index:80;display:flex;align-items:center;justify-content:center;pointer-events:none;font-family:'IBM Plex Mono',ui-monospace,monospace}
.tg-veil{position:absolute;inset:0;background:rgba(5,7,12,.92)}
.tg-scan{position:absolute;inset:0;opacity:.55;background-image:repeating-linear-gradient(to bottom,transparent 0,transparent 2px,rgba(0,0,0,.42) 2px,rgba(0,0,0,.42) 3px)}
.tg-flash{position:absolute;inset:0;background:#E0A83E;mix-blend-mode:screen;opacity:0;animation:tg-flash .28s steps(5,end) 1}
@keyframes tg-flash{0%{opacity:0}25%{opacity:.85}50%{opacity:0}75%{opacity:.4}100%{opacity:0}}
.tg-seam{position:absolute;left:0;right:0;top:50%;height:1px;background:#E0A83E;transform:scaleX(0);animation:tg-seam .6s cubic-bezier(.2,.9,.2,1) 60ms forwards}
@keyframes tg-seam{0%{transform:scaleX(0);opacity:1}45%{transform:scaleX(1);opacity:1}100%{transform:scaleX(1);opacity:0}}
.tg-scrub{position:absolute;left:0;right:0;height:26px;top:104%;opacity:0;background:linear-gradient(to bottom,transparent,rgba(224,168,62,.16),transparent);border-top:1px solid rgba(224,168,62,.5);border-bottom:1px solid rgba(94,214,227,.35);animation:tg-scrub .52s linear forwards}
@keyframes tg-scrub{0%{top:104%;opacity:0}20%{opacity:1}100%{top:-8%;opacity:0}}

.tg-core{position:relative;text-align:center;padding:0 24px;max-width:100%}
.tg-jolt{animation:tg-jolt .3s steps(3,end)}
@keyframes tg-jolt{
  0%{transform:translate3d(0,0,0);clip-path:inset(0 0 0 0)}
  18%{transform:translate3d(-9px,2px,0);clip-path:inset(18% 0 46% 0)}
  36%{transform:translate3d(7px,-3px,0);clip-path:inset(58% 0 12% 0)}
  54%{transform:translate3d(-4px,0,0);clip-path:inset(4% 0 74% 0)}
  72%{transform:translate3d(5px,1px,0);clip-path:inset(70% 0 6% 0)}
  100%{transform:translate3d(0,0,0);clip-path:inset(0,0,0)}
}
.tg-rotor{margin:0 auto 22px;display:block}
.tg-hand{transform-origin:38px 38px;animation:tg-hand 2s cubic-bezier(.12,.72,.2,1) 250ms forwards}
@keyframes tg-hand{from{transform:rotate(0)}to{transform:rotate(-1080deg)}}
.tg-hand-forward{transform-origin:38px 38px;animation:tg-hand-forward 2s cubic-bezier(.12,.72,.2,1) 250ms forwards}
@keyframes tg-hand-forward{from{transform:rotate(-1080deg)}to{transform:rotate(0)}}

.tg-eyebrow{font-size:10px;letter-spacing:.34em;color:#E0A83E;margin-bottom:14px}
.tg-title{position:relative;font-family:'Oswald',sans-serif;font-weight:700;font-size:clamp(38px,7.4vw,82px);line-height:.94;letter-spacing:.10em;color:#F2F5FA;margin:0;white-space:nowrap}
.tg-title::before,.tg-title::after{content:attr(data-text);position:absolute;inset:0;pointer-events:none;opacity:0}
.tg-title::before{color:#5ED6E3;mix-blend-mode:screen}
.tg-title::after{color:#E84D7E;mix-blend-mode:screen}
.tg-split::before,.tg-split::after{opacity:.75;animation:tg-rgb .22s steps(2,end) infinite}
@keyframes tg-rgb{0%{transform:translate(-3px,1px)}50%{transform:translate(3px,-2px)}100%{transform:translate(-2px,2px)}}

.tg-rule{height:1px;background:linear-gradient(to right,transparent,#2C3550 20%,#2C3550 80%,transparent);margin:20px auto;max-width:520px;transition:transform .4s cubic-bezier(.2,.9,.2,1)}

.tg-ledger{display:flex;align-items:center;justify-content:center;gap:20px;font-family:'Oswald',sans-serif;font-weight:500;margin:12px 0}
.tg-ledger-item{display:flex;flex-direction:column;align-items:center;gap:4px}
.tg-ledger-arrow{display:flex;align-items:center;justify-content:center}
.tg-ledger-label{font-family:'IBM Plex Mono',monospace;font-size:11px;letter-spacing:.22em;font-weight:600}
.tg-label-current{color:#E84D7E}
.tg-label-initial{color:#5ED6E3}

.tg-old{font-size:clamp(28px,4.5vw,38px);color:#E84D7E;position:relative;min-width:3ch;text-align:center}
.tg-initial-old{color:#5ED6E3}
.tg-initial-old::after{background:#5ED6E3!important}
.tg-old::after{content:'';position:absolute;left:-4px;right:-4px;top:52%;height:2px;background:#E84D7E;transform:scaleX(0);transform-origin:left}
.tg-struck::after{transform:scaleX(1);transition:transform .22s steps(4,end)}

.tg-rew{font-size:11px;letter-spacing:.2em;color:#E0A83E;font-family:'IBM Plex Mono',monospace;padding:4px 10px;border:1px solid rgba(224,168,62,.4);background:rgba(224,168,62,.1);border-radius:2px}
.tg-decay-rew{font-size:11px;letter-spacing:.2em;color:#E84D7E;font-family:'IBM Plex Mono',monospace;padding:4px 10px;border:1px solid rgba(232,77,126,.4);background:rgba(232,77,126,.1);border-radius:2px}

.tg-new{font-size:clamp(34px,5.5vw,48px);color:#5ED6E3;min-width:3ch;text-align:center;text-shadow:0 0 16px rgba(94,214,227,.45)}
.tg-val-decayed{font-size:clamp(34px,5.5vw,48px);color:#E84D7E;min-width:3ch;text-align:center;text-shadow:0 0 16px rgba(232,77,126,.45)}

.tg-note{font-size:10px;letter-spacing:.22em;color:#8B93A9;margin-top:16px}
.tg-chip{display:inline-flex;align-items:center;gap:10px;margin-top:22px;padding:8px 16px;border:1px solid #6E5424;border-left:2px solid #E0A83E;background:rgba(14,18,32,.9);font-size:10px;letter-spacing:.2em;color:#8B93A9}
.tg-chip b{font-family:'Oswald',sans-serif;font-size:15px;letter-spacing:.06em;color:#E0A83E;font-weight:500}

.tg-wave{position:absolute;width:40px;height:40px;border:1px solid #5ED6E3;border-radius:50%;animation:tg-wave .85s cubic-bezier(.16,.84,.3,1) forwards}
@keyframes tg-wave{0%{opacity:.9;transform:scale(.2)}100%{opacity:0;transform:scale(34)}}

@media (prefers-reduced-motion: reduce){
  .tg-jolt,.tg-split::before,.tg-split::after,.tg-flash,.tg-seam,.tg-scrub,.tg-hand,.tg-hand-forward,.tg-wave{animation:none!important}
  .tg-title::before,.tg-title::after{opacity:0!important}
}
`;

export default TimeGlitch;
