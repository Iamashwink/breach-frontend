import React, { useEffect, useState } from 'react';
import { useGame } from '../../context/GameContext';
import { api, AdminChallenge, AdminHint, CreateChallengeBody, PatchChallengeBody } from '../../services/api';
import { AdminNav } from './AdminNav';

const DIFFICULTIES = ['easy', 'medium', 'hard', 'expert'] as const;
const STATES = ['hidden', 'visible', 'locked'] as const;
const DIFF_COLOR: Record<string, string> = { easy: '#5ED6E3', medium: '#E0A83E', hard: '#E84D7E', expert: '#F2F5FA' };
const STATE_COLOR: Record<string, string> = { visible: '#5ED6E3', hidden: '#5A6379', locked: '#E84D7E' };

export const AdminChallenges: React.FC = () => {
  const { event, notify } = useGame();
  const [challenges, setChallenges] = useState<AdminChallenge[]>([]);
  const [categories, setCategories] = useState<{ id: number; name: string }[]>([]);
  const [loading, setLoading] = useState(true);
  const [showCreate, setShowCreate] = useState(false);
  const [editId, setEditId] = useState<string | null>(null);
  const [hintsFor, setHintsFor] = useState<string | null>(null);
  const [showCats, setShowCats] = useState(false);
  const [filter, setFilter] = useState<string>('all');

  const load = async () => {
    if (!event) return;
    setLoading(true);
    try {
      const [c, cats] = await Promise.all([
        api.adminListChallenges(event.id),
        api.listCategories(),
      ]);
      setChallenges(c);
      setCategories(cats);
    } catch {
      notify('error', 'LOAD FAILED', 'Could not fetch challenges.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { void load(); }, [event]);

  const filtered = filter === 'all' ? challenges : challenges.filter((c) => c.state === filter);
  const catName = (id: number) => categories.find((c) => c.id === id)?.name ?? `#${id}`;

  const quickState = async (id: string, state: AdminChallenge['state']) => {
    if (!event) return;
    try {
      await api.adminPatchChallenge(event.id, id, { state });
      notify('success', 'UPDATED', `State set to ${state}.`);
      void load();
    } catch (err: unknown) {
      notify('error', 'FAILED', err instanceof Error ? err.message : 'Unknown error');
    }
  };

  return (
    <>
      <AdminNav />
      <div className="max-w-6xl mx-auto px-6 py-8">
        <div className="flex items-center justify-between flex-wrap gap-3">
          <div>
            <div className="text-[9px] tracking-[0.3em] text-[#E0A83E]">■ CHALLENGE MANAGER</div>
            <h1 className="mt-1 font-display text-xl tracking-wide text-[#F2F5FA]">CHALLENGES</h1>
          </div>
          <div className="flex gap-2">
            <button onClick={() => setShowCats(!showCats)}
              className="px-4 py-2 border border-[#1E2536] text-[11px] tracking-[0.18em] text-[#8B93A9] hover:text-[#D5DBE7] cursor-pointer">
              CATEGORIES
            </button>
            <button onClick={() => { setShowCreate(true); setEditId(null); setHintsFor(null); }}
              className="px-5 py-2 bg-[#5ED6E3] text-[#06232A] text-[11px] font-bold tracking-[0.2em] cursor-pointer hover:brightness-110">
              + CREATE
            </button>
          </div>
        </div>

        {showCats && <CategoryManager categories={categories} onDone={() => { setShowCats(false); void load(); }} />}

        <div className="mt-4 flex gap-2">
          {['all', ...STATES].map((s) => (
            <button key={s} onClick={() => setFilter(s)}
              className={`px-3 py-1.5 text-[10px] tracking-[0.18em] cursor-pointer ${filter === s ? 'text-[#E0A83E] border-b border-[#E0A83E]' : 'text-[#5A6379]'}`}>
              {s.toUpperCase()} {s === 'all' ? `(${challenges.length})` : `(${challenges.filter((c) => c.state === s).length})`}
            </button>
          ))}
        </div>

        {loading ? (
          <div className="mt-6 text-[11px] tracking-[0.3em] text-[#5A6379]">LOADING…</div>
        ) : (
          <div className="mt-4 border border-[#1E2536] overflow-x-auto">
            <table className="w-full text-[11px]">
              <thead>
                <tr className="border-b border-[#1E2536] text-[9px] tracking-[0.2em] text-[#5A6379]">
                  <th className="px-3 py-2 text-left">TITLE</th>
                  <th className="px-3 py-2 text-left">CATEGORY</th>
                  <th className="px-3 py-2 text-left">DIFF</th>
                  <th className="px-3 py-2 text-right">PTS</th>
                  <th className="px-3 py-2 text-left">STATE</th>
                  <th className="px-3 py-2 text-left">ACTIONS</th>
                </tr>
              </thead>
              <tbody>
                {filtered.map((c) => (
                  <tr key={c.id} className="border-b border-[#1E2536]/40 hover:bg-[#5ED6E3]/[0.02]">
                    <td className="px-3 py-2 text-[#D5DBE7] max-w-[240px] truncate">{c.title}</td>
                    <td className="px-3 py-2 text-[#8B93A9]">{catName(c.categoryId)}</td>
                    <td className="px-3 py-2" style={{ color: DIFF_COLOR[c.difficulty] }}>{c.difficulty.toUpperCase()}</td>
                    <td className="px-3 py-2 text-right text-[#D5DBE7]">{c.initialPoints}</td>
                    <td className="px-3 py-2">
                      <select value={c.state} onChange={(e) => quickState(c.id, e.target.value as AdminChallenge['state'])}
                        className="bg-[#0E1220] border border-[#1E2536] px-2 py-1 text-[10px] cursor-pointer outline-none"
                        style={{ color: STATE_COLOR[c.state] }}>
                        {STATES.map((s) => <option key={s} value={s}>{s.toUpperCase()}</option>)}
                      </select>
                    </td>
                    <td className="px-3 py-2 flex gap-2">
                      <button onClick={() => { setEditId(c.id); setShowCreate(false); setHintsFor(null); }}
                        className="text-[10px] text-[#5ED6E3] hover:text-[#F2F5FA] cursor-pointer">EDIT</button>
                      <button onClick={() => { setHintsFor(c.id); setEditId(null); setShowCreate(false); }}
                        className="text-[10px] text-[#E0A83E] hover:text-[#F2F5FA] cursor-pointer">HINTS</button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
            {filtered.length === 0 && <div className="px-4 py-6 text-center text-[#5A6379]">No challenges.</div>}
          </div>
        )}

        {showCreate && event && <CreateChallengeForm eventId={event.id} categories={categories} onDone={() => { setShowCreate(false); void load(); }} onCancel={() => setShowCreate(false)} />}
        {editId && event && <EditChallengeForm eventId={event.id} challenge={challenges.find((c) => c.id === editId)!} categories={categories} onDone={() => { setEditId(null); void load(); }} onCancel={() => setEditId(null)} />}
        {hintsFor && event && <HintManager eventId={event.id} challengeId={hintsFor} challengeTitle={challenges.find((c) => c.id === hintsFor)?.title ?? '—'} onClose={() => setHintsFor(null)} />}
      </div>
    </>
  );
};

const Field: React.FC<{
  label: string; value: string; onChange: (v: string) => void;
  type?: string; required?: boolean; textarea?: boolean; className?: string;
}> = ({ label, value, onChange, type = 'text', required, textarea, className }) => (
  <label className={`block ${className ?? ''}`}>
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

const Select: React.FC<{ label: string; value: string; onChange: (v: string) => void; options: { value: string; label: string }[] }> = ({ label, value, onChange, options }) => (
  <label className="block">
    <span className="text-[9px] tracking-[0.25em] text-[#5A6379]">{label}</span>
    <select value={value} onChange={(e) => onChange(e.target.value)}
      className="mt-1 w-full bg-[#0E1220] border border-[#1E2536] px-3 py-2 text-[12px] text-[#D5DBE7] focus:border-[#5ED6E3] outline-none cursor-pointer">
      {options.map((o) => <option key={o.value} value={o.value}>{o.label}</option>)}
    </select>
  </label>
);

const CreateChallengeForm: React.FC<{ eventId: string; categories: { id: number; name: string }[]; onDone: () => void; onCancel: () => void }> = ({ eventId, categories, onDone, onCancel }) => {
  const { notify } = useGame();
  const [form, setForm] = useState<CreateChallengeBody>({
    title: '', description: '', categoryId: categories[0]?.id ?? 0,
    difficulty: 'easy', initialPoints: 500, minPoints: 100, flag: '',
  });
  const [busy, setBusy] = useState(false);
  const set = <K extends keyof CreateChallengeBody>(k: K, v: CreateChallengeBody[K]) => setForm((f) => ({ ...f, [k]: v }));

  const submit = async (e: React.FormEvent) => {
    e.preventDefault();
    setBusy(true);
    try {
      await api.adminCreateChallenge(eventId, form);
      notify('success', 'CHALLENGE CREATED', `"${form.title}" created.`);
      onDone();
    } catch (err: unknown) {
      notify('error', 'CREATE FAILED', err instanceof Error ? err.message : 'Unknown error');
    } finally {
      setBusy(false);
    }
  };

  return (
    <div className="mt-6 border border-[#E0A83E]/40 bg-[#0B0E16]/70 px-5 py-5">
      <div className="text-[10px] tracking-[0.25em] text-[#E0A83E]">CREATE CHALLENGE</div>
      <form onSubmit={submit} className="mt-3 grid grid-cols-1 md:grid-cols-3 gap-3">
        <Field label="TITLE" value={form.title} onChange={(v) => set('title', v)} required className="md:col-span-2" />
        <Select label="CATEGORY" value={String(form.categoryId)} onChange={(v) => set('categoryId', Number(v))}
          options={categories.map((c) => ({ value: String(c.id), label: c.name }))} />
        <Field label="DESCRIPTION" value={form.description} onChange={(v) => set('description', v)} textarea className="md:col-span-3" />
        <Select label="DIFFICULTY" value={form.difficulty} onChange={(v) => set('difficulty', v as CreateChallengeBody['difficulty'])}
          options={DIFFICULTIES.map((d) => ({ value: d, label: d.toUpperCase() }))} />
        <Field label="INITIAL POINTS" value={String(form.initialPoints)} onChange={(v) => set('initialPoints', Number(v))} type="number" />
        <Field label="MIN POINTS" value={String(form.minPoints)} onChange={(v) => set('minPoints', Number(v))} type="number" />
        <Field label="FLAG" value={form.flag} onChange={(v) => set('flag', v)} required className="md:col-span-2" />
        <Field label="MAX ATTEMPTS (blank = unlimited)" value={form.maxAttempts != null ? String(form.maxAttempts) : ''} onChange={(v) => set('maxAttempts', v ? Number(v) : undefined)} type="number" />
        <div className="md:col-span-3 flex gap-3 mt-2">
          <button type="submit" disabled={busy} className="px-5 py-2.5 bg-[#5ED6E3] text-[#06232A] text-[11px] font-bold tracking-[0.2em] cursor-pointer disabled:opacity-40">
            {busy ? 'CREATING…' : 'CREATE →'}
          </button>
          <button type="button" onClick={onCancel} className="px-5 py-2.5 text-[11px] tracking-[0.2em] text-[#5A6379] cursor-pointer">CANCEL</button>
        </div>
      </form>
    </div>
  );
};

const EditChallengeForm: React.FC<{ eventId: string; challenge: AdminChallenge; categories: { id: number; name: string }[]; onDone: () => void; onCancel: () => void }> = ({ eventId, challenge: c, categories, onDone, onCancel }) => {
  const { notify } = useGame();
  const [form, setForm] = useState<PatchChallengeBody>({
    title: c.title, description: c.description, categoryId: c.categoryId,
    difficulty: c.difficulty, initialPoints: c.initialPoints, minPoints: c.minPoints,
    state: c.state, maxAttempts: c.maxAttempts, author: c.author ?? '',
  });
  const [newFlag, setNewFlag] = useState('');
  const [busy, setBusy] = useState(false);
  const set = <K extends keyof PatchChallengeBody>(k: K, v: PatchChallengeBody[K]) => setForm((f) => ({ ...f, [k]: v }));

  const submit = async (e: React.FormEvent) => {
    e.preventDefault();
    setBusy(true);
    try {
      const body: PatchChallengeBody = { ...form };
      if (newFlag.trim()) body.flag = newFlag.trim();
      await api.adminPatchChallenge(eventId, c.id, body);
      notify('success', 'UPDATED', `"${form.title}" saved.`);
      onDone();
    } catch (err: unknown) {
      notify('error', 'UPDATE FAILED', err instanceof Error ? err.message : 'Unknown error');
    } finally {
      setBusy(false);
    }
  };

  return (
    <div className="mt-6 border border-[#E0A83E]/40 bg-[#0B0E16]/70 px-5 py-5">
      <div className="text-[10px] tracking-[0.25em] text-[#E0A83E]">EDIT: {c.title}</div>
      <form onSubmit={submit} className="mt-3 grid grid-cols-1 md:grid-cols-3 gap-3">
        <Field label="TITLE" value={form.title ?? ''} onChange={(v) => set('title', v)} className="md:col-span-2" />
        <Select label="CATEGORY" value={String(form.categoryId)} onChange={(v) => set('categoryId', Number(v))}
          options={categories.map((cat) => ({ value: String(cat.id), label: cat.name }))} />
        <Field label="DESCRIPTION" value={form.description ?? ''} onChange={(v) => set('description', v)} textarea className="md:col-span-3" />
        <Select label="DIFFICULTY" value={form.difficulty ?? c.difficulty} onChange={(v) => set('difficulty', v as PatchChallengeBody['difficulty'])}
          options={DIFFICULTIES.map((d) => ({ value: d, label: d.toUpperCase() }))} />
        <Field label="INITIAL POINTS" value={String(form.initialPoints ?? '')} onChange={(v) => set('initialPoints', Number(v))} type="number" />
        <Field label="MIN POINTS" value={String(form.minPoints ?? '')} onChange={(v) => set('minPoints', Number(v))} type="number" />
        <Select label="STATE" value={form.state ?? c.state} onChange={(v) => set('state', v as PatchChallengeBody['state'])}
          options={STATES.map((s) => ({ value: s, label: s.toUpperCase() }))} />
        <Field label="NEW FLAG (blank = keep)" value={newFlag} onChange={setNewFlag} />
        <Field label="MAX ATTEMPTS" value={form.maxAttempts != null ? String(form.maxAttempts) : ''} onChange={(v) => set('maxAttempts', v ? Number(v) : null)} type="number" />
        <div className="md:col-span-3 flex gap-3 mt-2">
          <button type="submit" disabled={busy} className="px-5 py-2.5 bg-[#5ED6E3] text-[#06232A] text-[11px] font-bold tracking-[0.2em] cursor-pointer disabled:opacity-40">
            {busy ? 'SAVING…' : 'SAVE →'}
          </button>
          <button type="button" onClick={onCancel} className="px-5 py-2.5 text-[11px] tracking-[0.2em] text-[#5A6379] cursor-pointer">CANCEL</button>
        </div>
      </form>
    </div>
  );
};

const HintManager: React.FC<{ eventId: string; challengeId: string; challengeTitle: string; onClose: () => void }> = ({ eventId, challengeId, challengeTitle, onClose }) => {
  const { notify } = useGame();
  const [hints, setHints] = useState<AdminHint[]>([]);
  const [loading, setLoading] = useState(true);
  const [body, setBody] = useState('');
  const [cost, setCost] = useState('0');
  const [busy, setBusy] = useState(false);

  const load = async () => {
    setLoading(true);
    try {
      setHints(await api.adminListHints(eventId, challengeId));
    } catch {
      notify('error', 'LOAD FAILED', 'Could not fetch hints.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { void load(); }, [eventId, challengeId]);

  const create = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!body.trim()) return;
    setBusy(true);
    try {
      await api.adminCreateHint(eventId, challengeId, { body: body.trim(), cost: Number(cost) || 0 });
      notify('success', 'HINT CREATED', 'Hint added.');
      setBody('');
      setCost('0');
      void load();
    } catch (err: unknown) {
      notify('error', 'CREATE FAILED', err instanceof Error ? err.message : 'Unknown error');
    } finally {
      setBusy(false);
    }
  };

  const remove = async (hintId: string) => {
    try {
      await api.adminDeleteHint(eventId, challengeId, hintId);
      notify('success', 'HINT DELETED', 'Hint removed.');
      void load();
    } catch (err: unknown) {
      notify('error', 'DELETE FAILED', err instanceof Error ? err.message : 'Unknown error');
    }
  };

  return (
    <div className="mt-6 border border-[#E0A83E]/40 bg-[#0B0E16]/70 px-5 py-5">
      <div className="flex items-center justify-between">
        <div className="text-[10px] tracking-[0.25em] text-[#E0A83E]">HINTS: {challengeTitle}</div>
        <button onClick={onClose} className="text-[10px] text-[#5A6379] hover:text-[#D5DBE7] cursor-pointer">CLOSE ×</button>
      </div>
      {loading ? (
        <div className="mt-3 text-[11px] text-[#5A6379]">LOADING…</div>
      ) : (
        <div className="mt-3">
          {hints.length === 0 && <div className="text-[11px] text-[#5A6379]">No hints yet.</div>}
          {hints.map((h) => (
            <div key={h.id} className="flex items-start justify-between border-b border-[#1E2536]/40 py-2">
              <div>
                <div className="text-[12px] text-[#D5DBE7]">{h.body}</div>
                <div className="text-[10px] text-[#5A6379]">COST: {h.cost} · ORDER: {h.sortOrder}</div>
              </div>
              <button onClick={() => remove(h.id)} className="text-[10px] text-[#E84D7E] hover:text-[#F2F5FA] cursor-pointer ml-3 shrink-0">DELETE</button>
            </div>
          ))}
          <form onSubmit={create} className="mt-3 flex gap-2 items-end">
            <Field label="HINT BODY" value={body} onChange={setBody} required className="flex-1" />
            <Field label="COST" value={cost} onChange={setCost} type="number" className="w-20" />
            <button type="submit" disabled={busy} className="px-4 py-2 bg-[#5ED6E3] text-[#06232A] text-[10px] font-bold tracking-[0.2em] cursor-pointer disabled:opacity-40 self-end mb-0">
              ADD
            </button>
          </form>
        </div>
      )}
    </div>
  );
};

const CategoryManager: React.FC<{ categories: { id: number; name: string }[]; onDone: () => void }> = ({ categories, onDone }) => {
  const { notify } = useGame();
  const [name, setName] = useState('');
  const [busy, setBusy] = useState(false);

  const create = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!name.trim()) return;
    setBusy(true);
    try {
      await api.adminCreateCategory(name.trim());
      notify('success', 'CATEGORY CREATED', `"${name}" created.`);
      setName('');
      onDone();
    } catch (err: unknown) {
      notify('error', 'CREATE FAILED', err instanceof Error ? err.message : 'Unknown error');
    } finally {
      setBusy(false);
    }
  };

  const remove = async (id: number) => {
    try {
      await api.adminDeleteCategory(id);
      notify('success', 'DELETED', 'Category removed.');
      onDone();
    } catch (err: unknown) {
      notify('error', 'DELETE FAILED', err instanceof Error ? err.message : 'Unknown error');
    }
  };

  return (
    <div className="mt-4 border border-[#1E2536] bg-[#0B0E16]/50 px-5 py-4">
      <div className="text-[10px] tracking-[0.25em] text-[#5A6379]">CATEGORIES</div>
      <div className="mt-2 flex flex-wrap gap-2">
        {categories.map((c) => (
          <span key={c.id} className="flex items-center gap-2 border border-[#1E2536] px-3 py-1.5 text-[11px] text-[#D5DBE7]">
            {c.name}
            <button onClick={() => remove(c.id)} className="text-[#E84D7E] hover:text-[#F2F5FA] cursor-pointer">×</button>
          </span>
        ))}
      </div>
      <form onSubmit={create} className="mt-3 flex gap-2 items-end">
        <Field label="NEW CATEGORY" value={name} onChange={setName} required className="flex-1" />
        <button type="submit" disabled={busy} className="px-4 py-2 bg-[#5ED6E3] text-[#06232A] text-[10px] font-bold tracking-[0.2em] cursor-pointer disabled:opacity-40">
          ADD
        </button>
      </form>
    </div>
  );
};
