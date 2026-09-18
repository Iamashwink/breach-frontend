import React, { useEffect, useState } from 'react';
import { useGame } from '../../context/GameContext';
import { api, ApiEvent } from '../../services/api';
import { AdminNav } from './AdminNav';

export const AdminEvents: React.FC = () => {
  const { notify } = useGame();
  const [events, setEvents] = useState<ApiEvent[]>([]);
  const [loading, setLoading] = useState(true);
  const [showCreate, setShowCreate] = useState(false);
  const [editId, setEditId] = useState<string | null>(null);

  const load = async () => {
    setLoading(true);
    try {
      setEvents(await api.listEvents());
    } catch {
      notify('error', 'LOAD FAILED', 'Could not fetch events.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { void load(); }, []);

  const fmtDate = (d: string | null) => d ? new Date(d).toLocaleString() : '—';

  return (
    <>
      <AdminNav />
      <div className="max-w-5xl mx-auto px-6 py-8">
        <div className="flex items-center justify-between">
          <div>
            <div className="text-[9px] tracking-[0.3em] text-[#E0A83E]">■ EVENT MANAGER</div>
            <h1 className="mt-1 font-display text-xl tracking-wide text-[#F2F5FA]">EVENTS</h1>
          </div>
          <button
            onClick={() => { setShowCreate(true); setEditId(null); }}
            className="px-5 py-2.5 bg-[#5ED6E3] text-[#06232A] text-[11px] font-bold tracking-[0.2em] cursor-pointer hover:brightness-110"
          >
            + CREATE EVENT
          </button>
        </div>

        {loading ? (
          <div className="mt-6 text-[11px] tracking-[0.3em] text-[#5A6379]">LOADING…</div>
        ) : (
          <div className="mt-6 border border-[#1E2536]">
            <div className="grid grid-cols-[1fr_auto_auto_auto_auto] gap-4 px-4 py-2.5 border-b border-[#1E2536] text-[9px] tracking-[0.25em] text-[#5A6379]">
              <span>NAME</span><span>SLUG</span><span>STATUS</span><span>WINDOW</span><span>ACTIONS</span>
            </div>
            {events.length === 0 && (
              <div className="px-4 py-6 text-[12px] text-[#5A6379] text-center">No events found.</div>
            )}
            {events.map((ev) => (
              <div key={ev.id} className="grid grid-cols-[1fr_auto_auto_auto_auto] gap-4 px-4 py-3 border-b border-[#1E2536]/60 items-center text-[12px]">
                <span className="text-[#D5DBE7] truncate">{ev.name}</span>
                <span className="text-[#8B93A9] text-[11px]">{ev.slug}</span>
                <span className={ev.isPublished ? 'text-[#5ED6E3]' : 'text-[#5A6379]'}>
                  {ev.isPublished ? 'LIVE' : 'DRAFT'}
                  {ev.isFrozen && <span className="ml-1 text-[#E84D7E]">■ FROZEN</span>}
                </span>
                <span className="text-[#5A6379] text-[10px]">
                  {ev.startsAt ? fmtDate(ev.startsAt) : '—'}
                </span>
                <button
                  onClick={() => { setEditId(ev.id); setShowCreate(false); }}
                  className="text-[10px] tracking-[0.2em] text-[#5ED6E3] hover:text-[#F2F5FA] cursor-pointer"
                >
                  EDIT
                </button>
              </div>
            ))}
          </div>
        )}

        {showCreate && <CreateEventForm onDone={() => { setShowCreate(false); void load(); }} onCancel={() => setShowCreate(false)} />}
        {editId && <EditEventForm eventId={editId} events={events} onDone={() => { setEditId(null); void load(); }} onCancel={() => setEditId(null)} />}
      </div>
    </>
  );
};

const CreateEventForm: React.FC<{ onDone: () => void; onCancel: () => void }> = ({ onDone, onCancel }) => {
  const { notify } = useGame();
  const [name, setName] = useState('');
  const [slug, setSlug] = useState('');
  const [description, setDescription] = useState('');
  const [busy, setBusy] = useState(false);

  const submit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!name.trim()) return;
    setBusy(true);
    try {
      await api.adminCreateEvent({ name: name.trim(), slug: slug.trim() || undefined, description: description.trim() || undefined });
      notify('success', 'EVENT CREATED', `"${name}" created.`);
      onDone();
    } catch (err: unknown) {
      notify('error', 'CREATE FAILED', err instanceof Error ? err.message : 'Unknown error');
    } finally {
      setBusy(false);
    }
  };

  return (
    <div className="mt-6 border border-[#E0A83E]/40 bg-[#0B0E16]/70 px-5 py-5">
      <div className="text-[10px] tracking-[0.25em] text-[#E0A83E]">CREATE EVENT</div>
      <form onSubmit={submit} className="mt-3 grid grid-cols-1 md:grid-cols-2 gap-3">
        <Field label="NAME" value={name} onChange={setName} required />
        <Field label="SLUG (auto if blank)" value={slug} onChange={setSlug} />
        <div className="md:col-span-2">
          <Field label="DESCRIPTION" value={description} onChange={setDescription} textarea />
        </div>
        <div className="md:col-span-2 flex gap-3">
          <button type="submit" disabled={busy} className="px-5 py-2.5 bg-[#5ED6E3] text-[#06232A] text-[11px] font-bold tracking-[0.2em] cursor-pointer disabled:opacity-40">
            {busy ? 'CREATING…' : 'CREATE →'}
          </button>
          <button type="button" onClick={onCancel} className="px-5 py-2.5 text-[11px] tracking-[0.2em] text-[#5A6379] hover:text-[#D5DBE7] cursor-pointer">
            CANCEL
          </button>
        </div>
      </form>
    </div>
  );
};

const EditEventForm: React.FC<{ eventId: string; events: ApiEvent[]; onDone: () => void; onCancel: () => void }> = ({ eventId, events, onDone, onCancel }) => {
  const { notify } = useGame();
  const ev = events.find((e) => e.id === eventId);
  const [name, setName] = useState(ev?.name ?? '');
  const [description, setDescription] = useState(ev?.description ?? '');
  const [startsAt, setStartsAt] = useState(ev?.startsAt ? toLocalInput(ev.startsAt) : '');
  const [endsAt, setEndsAt] = useState(ev?.endsAt ? toLocalInput(ev.endsAt) : '');
  const [busy, setBusy] = useState(false);

  if (!ev) return null;

  const submit = async (e: React.FormEvent) => {
    e.preventDefault();
    setBusy(true);
    try {
      await api.adminPatchEvent(eventId, {
        name: name.trim() || undefined,
        description: description.trim() || undefined,
        startsAt: startsAt ? new Date(startsAt).toISOString() : null,
        endsAt: endsAt ? new Date(endsAt).toISOString() : null,
      });
      notify('success', 'EVENT UPDATED', `"${name}" saved.`);
      onDone();
    } catch (err: unknown) {
      notify('error', 'UPDATE FAILED', err instanceof Error ? err.message : 'Unknown error');
    } finally {
      setBusy(false);
    }
  };

  const toggle = async (field: 'isPublished' | 'isFrozen') => {
    setBusy(true);
    try {
      await api.adminPatchEvent(eventId, { [field]: !ev[field] });
      notify('success', 'EVENT UPDATED', `${field} toggled.`);
      onDone();
    } catch (err: unknown) {
      notify('error', 'TOGGLE FAILED', err instanceof Error ? err.message : 'Unknown error');
    } finally {
      setBusy(false);
    }
  };

  return (
    <div className="mt-6 border border-[#E0A83E]/40 bg-[#0B0E16]/70 px-5 py-5">
      <div className="text-[10px] tracking-[0.25em] text-[#E0A83E]">EDIT: {ev.name}</div>
      <form onSubmit={submit} className="mt-3 grid grid-cols-1 md:grid-cols-2 gap-3">
        <Field label="NAME" value={name} onChange={setName} />
        <div />
        <Field label="STARTS AT" value={startsAt} onChange={setStartsAt} type="datetime-local" />
        <Field label="ENDS AT" value={endsAt} onChange={setEndsAt} type="datetime-local" />
        <div className="md:col-span-2">
          <Field label="DESCRIPTION" value={description} onChange={setDescription} textarea />
        </div>
        <div className="md:col-span-2 flex flex-wrap gap-3">
          <button type="submit" disabled={busy} className="px-5 py-2.5 bg-[#5ED6E3] text-[#06232A] text-[11px] font-bold tracking-[0.2em] cursor-pointer disabled:opacity-40">
            {busy ? 'SAVING…' : 'SAVE →'}
          </button>
          <button type="button" disabled={busy} onClick={() => toggle('isPublished')}
            className={`px-5 py-2.5 border text-[11px] font-bold tracking-[0.2em] cursor-pointer disabled:opacity-40 ${ev.isPublished ? 'border-[#E84D7E]/50 text-[#E84D7E]' : 'border-[#5ED6E3]/50 text-[#5ED6E3]'}`}>
            {ev.isPublished ? 'UNPUBLISH' : 'PUBLISH'}
          </button>
          <button type="button" disabled={busy} onClick={() => toggle('isFrozen')}
            className={`px-5 py-2.5 border text-[11px] font-bold tracking-[0.2em] cursor-pointer disabled:opacity-40 ${ev.isFrozen ? 'border-[#5ED6E3]/50 text-[#5ED6E3]' : 'border-[#E84D7E]/50 text-[#E84D7E]'}`}>
            {ev.isFrozen ? 'UNFREEZE' : 'FREEZE'}
          </button>
          <button type="button" onClick={onCancel} className="px-5 py-2.5 text-[11px] tracking-[0.2em] text-[#5A6379] hover:text-[#D5DBE7] cursor-pointer">
            CANCEL
          </button>
        </div>
      </form>
    </div>
  );
};

function toLocalInput(iso: string): string {
  const d = new Date(iso);
  const pad = (n: number) => String(n).padStart(2, '0');
  return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}T${pad(d.getHours())}:${pad(d.getMinutes())}`;
}

const Field: React.FC<{
  label: string; value: string; onChange: (v: string) => void;
  type?: string; required?: boolean; textarea?: boolean;
}> = ({ label, value, onChange, type = 'text', required, textarea }) => (
  <label className="block">
    <span className="text-[9px] tracking-[0.25em] text-[#5A6379]">{label}</span>
    {textarea ? (
      <textarea value={value} onChange={(e) => onChange(e.target.value)} required={required}
        className="mt-1 w-full bg-[#0E1220] border border-[#1E2536] px-3 py-2 text-[12px] text-[#D5DBE7] focus:border-[#5ED6E3] outline-none resize-y min-h-[60px]" />
    ) : (
      <input type={type} value={value} onChange={(e) => onChange(e.target.value)} required={required}
        className="mt-1 w-full bg-[#0E1220] border border-[#1E2536] px-3 py-2 text-[12px] text-[#D5DBE7] focus:border-[#5ED6E3] outline-none" />
    )}
  </label>
);
