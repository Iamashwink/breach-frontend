import React, { useEffect, useState } from 'react';
import { useGame } from '../../context/GameContext';
import { api, AdminTimeGlitch } from '../../services/api';
import { AdminNav } from './AdminNav';

export const AdminGlitches: React.FC = () => {
  const { adminEvent, notify } = useGame();
  const [glitches, setGlitches] = useState<AdminTimeGlitch[]>([]);
  const [loading, setLoading] = useState(true);
  const [showCreate, setShowCreate] = useState(false);
  const [genCount, setGenCount] = useState('30');
  const [genBusy, setGenBusy] = useState(false);

  const load = async () => {
    if (!adminEvent) return;
    setLoading(true);
    try {
      setGlitches(await api.adminListGlitches(adminEvent.id));
    } catch {
      notify('error', 'LOAD FAILED', 'Could not fetch time glitches.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { void load(); }, [adminEvent]);

  const remove = async (id: string) => {
    if (!adminEvent) return;
    try {
      await api.adminDeleteGlitch(adminEvent.id, id);
      notify('success', 'DELETED', 'Time glitch removed.');
      void load();
    } catch (err: unknown) {
      notify('error', 'DELETE FAILED', err instanceof Error ? err.message : 'Unknown error');
    }
  };

  const triggerGlitchNow = async (minutes: number, multiplier = 2) => {
    if (!adminEvent) return;
    setGenBusy(true);
    try {
      const now = new Date();
      const end = new Date(now.getTime() + minutes * 60 * 1000);
      await api.adminCreateGlitch(adminEvent.id, {
        label: `Command Boost (${multiplier}×)`,
        startsAt: now.toISOString(),
        endsAt: end.toISOString(),
        multiplier,
      });
      notify('success', 'GLITCH TRIGGERED', `Active glitch window started for ${minutes} minutes.`);
      void load();
    } catch (err: unknown) {
      notify('error', 'TRIGGER FAILED', err instanceof Error ? err.message : 'Unknown error');
    } finally {
      setGenBusy(false);
    }
  };

  const generate = async () => {
    if (!adminEvent) return;
    setGenBusy(true);
    try {
      await api.adminGenerateGlitches(adminEvent.id, { everyMinutes: Number(genCount) || 30 });
      notify('success', 'GENERATED', 'Time glitch windows generated.');
      void load();
    } catch (err: unknown) {
      notify('error', 'GENERATE FAILED', err instanceof Error ? err.message : 'Unknown error');
    } finally {
      setGenBusy(false);
    }
  };

  const now = Date.now();
  const active = glitches.filter((g) => new Date(g.startsAt).getTime() <= now && new Date(g.endsAt).getTime() > now);
  const upcoming = glitches.filter((g) => new Date(g.startsAt).getTime() > now).sort((a, b) => new Date(a.startsAt).getTime() - new Date(b.startsAt).getTime());
  const past = glitches.filter((g) => new Date(g.endsAt).getTime() <= now).sort((a, b) => new Date(b.endsAt).getTime() - new Date(a.endsAt).getTime());

  const fmtDate = (d: string) => new Date(d).toLocaleString();
  const duration = (g: AdminTimeGlitch) => {
    const ms = new Date(g.endsAt).getTime() - new Date(g.startsAt).getTime();
    const m = Math.round(ms / 60000);
    return m >= 60 ? `${Math.floor(m / 60)}h ${m % 60}m` : `${m}m`;
  };

  return (
    <>
      <AdminNav />
      <div className="max-w-5xl mx-auto px-6 py-8">
        <div className="flex items-center justify-between flex-wrap gap-3">
          <div>
            <div className="text-[9px] tracking-[0.3em] text-[#E0A83E]">■ GLITCH MANAGER</div>
            <h1 className="mt-1 font-display text-xl tracking-wide text-[#F2F5FA]">TIME GLITCHES</h1>
            <div className="mt-1 text-[10px] text-[#5A6379]">
              {glitches.length} total · {active.length} active · {upcoming.length} upcoming
            </div>
          </div>
          <div className="flex gap-2 items-end flex-wrap">
            <button
              onClick={() => void triggerGlitchNow(15, 2)}
              disabled={genBusy}
              className="px-3 py-2 border border-[#5ED6E3]/40 text-[10px] tracking-[0.15em] text-[#5ED6E3] hover:bg-[#5ED6E3]/10 cursor-pointer disabled:opacity-40"
            >
              TRIGGER 15m GLITCH (2×)
            </button>
            <button
              onClick={() => void triggerGlitchNow(30, 2)}
              disabled={genBusy}
              className="px-3 py-2 border border-[#5ED6E3]/40 text-[10px] tracking-[0.15em] text-[#5ED6E3] hover:bg-[#5ED6E3]/10 cursor-pointer disabled:opacity-40"
            >
              TRIGGER 30m GLITCH (2×)
            </button>
            <div className="flex items-end gap-1">
              <label className="block">
                <span className="text-[9px] tracking-[0.25em] text-[#5A6379]">EVERY (min)</span>
                <input type="number" min="1" max="120" value={genCount} onChange={(e) => setGenCount(e.target.value)}
                  className="mt-1 w-16 bg-[#0E1220] border border-[#1E2536] px-2 py-2 text-[12px] text-[#D5DBE7] outline-none" />
              </label>
              <button onClick={generate} disabled={genBusy}
                className="px-4 py-2 border border-[#1E2536] text-[11px] tracking-[0.18em] text-[#8B93A9] hover:text-[#D5DBE7] cursor-pointer disabled:opacity-40">
                {genBusy ? 'GENERATING…' : 'AUTO-GENERATE'}
              </button>
            </div>
            <button onClick={() => setShowCreate(true)}
              className="px-5 py-2 bg-[#5ED6E3] text-[#06232A] text-[11px] font-bold tracking-[0.2em] cursor-pointer hover:brightness-110">
              + CUSTOM GLITCH
            </button>
          </div>
        </div>

        {showCreate && adminEvent && (
          <CreateGlitchForm eventId={adminEvent.id} onDone={() => { setShowCreate(false); void load(); }} onCancel={() => setShowCreate(false)} />
        )}

        {loading ? (
          <div className="mt-6 text-[11px] tracking-[0.3em] text-[#5A6379]">LOADING…</div>
        ) : (
          <>
            {active.length > 0 && (
              <GlitchSection title="ACTIVE NOW" color="#5ED6E3" glitches={active} fmtDate={fmtDate} duration={duration} onDelete={remove} />
            )}
            {upcoming.length > 0 && (
              <GlitchSection title="UPCOMING" color="#E0A83E" glitches={upcoming} fmtDate={fmtDate} duration={duration} onDelete={remove} />
            )}
            {past.length > 0 && (
              <GlitchSection title="PAST" color="#5A6379" glitches={past} fmtDate={fmtDate} duration={duration} onDelete={remove} />
            )}
            {glitches.length === 0 && (
              <div className="mt-6 text-center text-[11px] text-[#5A6379] py-8">No time glitches scheduled.</div>
            )}
          </>
        )}
      </div>
    </>
  );
};

const GlitchSection: React.FC<{
  title: string; color: string; glitches: AdminTimeGlitch[];
  fmtDate: (d: string) => string; duration: (g: AdminTimeGlitch) => string;
  onDelete: (id: string) => void;
}> = ({ title, color, glitches, fmtDate, duration, onDelete }) => (
  <div className="mt-6">
    <div className="text-[9px] tracking-[0.25em] mb-2" style={{ color }}>{title}</div>
    <div className="border border-[#1E2536]">
      {glitches.map((g) => (
        <div key={g.id} className="flex items-center justify-between px-4 py-3 border-b border-[#1E2536]/40">
          <div className="flex-1 min-w-0">
            <div className="text-[12px] text-[#D5DBE7] truncate">{g.label ?? 'Unnamed glitch'}</div>
            <div className="text-[10px] text-[#5A6379] mt-0.5">
              {fmtDate(g.startsAt)} → {fmtDate(g.endsAt)} · {duration(g)}
            </div>
            <div className="text-[10px] text-[#5A6379] mt-0.5">
              Multiplier: <span className="text-[#5ED6E3]">{g.multiplier}×</span>
            </div>
          </div>
          <button onClick={() => onDelete(g.id)} className="text-[10px] text-[#E84D7E] hover:text-[#F2F5FA] cursor-pointer ml-3 shrink-0">
            DELETE
          </button>
        </div>
      ))}
    </div>
  </div>
);

const CreateGlitchForm: React.FC<{ eventId: string; onDone: () => void; onCancel: () => void }> = ({ eventId, onDone, onCancel }) => {
  const { notify } = useGame();
  const [label, setLabel] = useState('');
  const [startsAt, setStartsAt] = useState('');
  const [endsAt, setEndsAt] = useState('');
  const [multiplier, setMultiplier] = useState('1');
  const [busy, setBusy] = useState(false);

  const submit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!startsAt || !endsAt) return;
    setBusy(true);
    try {
      await api.adminCreateGlitch(eventId, {
        label: label.trim() || undefined,
        startsAt: new Date(startsAt).toISOString(),
        endsAt: new Date(endsAt).toISOString(),
        multiplier: Number(multiplier) || 1,
      });
      notify('success', 'GLITCH CREATED', 'Time glitch scheduled.');
      onDone();
    } catch (err: unknown) {
      notify('error', 'CREATE FAILED', err instanceof Error ? err.message : 'Unknown error');
    } finally {
      setBusy(false);
    }
  };

  return (
    <div className="mt-6 border border-[#E0A83E]/40 bg-[#0B0E16]/70 px-5 py-5">
      <div className="text-[10px] tracking-[0.25em] text-[#E0A83E]">CREATE TIME GLITCH</div>
      <form onSubmit={submit} className="mt-3 grid grid-cols-1 md:grid-cols-2 gap-3">
        <label className="block md:col-span-2">
          <span className="text-[9px] tracking-[0.25em] text-[#5A6379]">LABEL (optional)</span>
          <input type="text" value={label} onChange={(e) => setLabel(e.target.value)}
            className="mt-1 w-full bg-[#0E1220] border border-[#1E2536] px-3 py-2 text-[12px] text-[#D5DBE7] focus:border-[#5ED6E3] outline-none" />
        </label>
        <label className="block">
          <span className="text-[9px] tracking-[0.25em] text-[#5A6379]">STARTS AT</span>
          <input type="datetime-local" value={startsAt} onChange={(e) => setStartsAt(e.target.value)} required
            className="mt-1 w-full bg-[#0E1220] border border-[#1E2536] px-3 py-2 text-[12px] text-[#D5DBE7] focus:border-[#5ED6E3] outline-none" />
        </label>
        <label className="block">
          <span className="text-[9px] tracking-[0.25em] text-[#5A6379]">ENDS AT</span>
          <input type="datetime-local" value={endsAt} onChange={(e) => setEndsAt(e.target.value)} required
            className="mt-1 w-full bg-[#0E1220] border border-[#1E2536] px-3 py-2 text-[12px] text-[#D5DBE7] focus:border-[#5ED6E3] outline-none" />
        </label>
        <label className="block">
          <span className="text-[9px] tracking-[0.25em] text-[#5A6379]">MULTIPLIER</span>
          <input type="number" step="0.1" min="0.1" value={multiplier} onChange={(e) => setMultiplier(e.target.value)}
            className="mt-1 w-full bg-[#0E1220] border border-[#1E2536] px-3 py-2 text-[12px] text-[#D5DBE7] focus:border-[#5ED6E3] outline-none" />
        </label>
        <div className="md:col-span-2 flex gap-3 mt-2">
          <button type="submit" disabled={busy} className="px-5 py-2.5 bg-[#5ED6E3] text-[#06232A] text-[11px] font-bold tracking-[0.2em] cursor-pointer disabled:opacity-40">
            {busy ? 'CREATING…' : 'CREATE →'}
          </button>
          <button type="button" onClick={onCancel} className="px-5 py-2.5 text-[11px] tracking-[0.2em] text-[#5A6379] cursor-pointer">CANCEL</button>
        </div>
      </form>
    </div>
  );
};
