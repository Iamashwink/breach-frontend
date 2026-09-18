import React, { useEffect, useState } from 'react';
import { useGame } from '../../context/GameContext';
import { api, AdminChallenge, AdminTimeGlitch } from '../../services/api';
import { AdminNav } from './AdminNav';

export const AdminDashboard: React.FC = () => {
  const { event, navigateTo, notify } = useGame();
  const [challenges, setChallenges] = useState<AdminChallenge[]>([]);
  const [glitches, setGlitches] = useState<AdminTimeGlitch[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!event) return;
    setLoading(true);
    Promise.all([
      api.adminListChallenges(event.id).catch(() => []),
      api.adminListGlitches(event.id).catch(() => []),
    ]).then(([c, g]) => {
      setChallenges(c);
      setGlitches(g);
    }).finally(() => setLoading(false));
  }, [event]);

  const visible = challenges.filter((c) => c.state === 'visible').length;
  const hidden = challenges.filter((c) => c.state === 'hidden').length;
  const locked = challenges.filter((c) => c.state === 'locked').length;
  const totalChallenges = challenges.length;

  const now = Date.now();
  const activeGlitch = glitches.find((g) => new Date(g.startsAt).getTime() <= now && new Date(g.endsAt).getTime() > now);
  const nextGlitch = glitches
    .filter((g) => new Date(g.startsAt).getTime() > now)
    .sort((a, b) => new Date(a.startsAt).getTime() - new Date(b.startsAt).getTime())[0];

  const togglePublish = async () => {
    if (!event) return;
    try {
      await api.adminPatchEvent(event.id, { isPublished: !event.isPublished });
      notify('success', 'EVENT UPDATED', event.isPublished ? 'Event unpublished.' : 'Event published.');
      window.location.reload();
    } catch (e: unknown) {
      notify('error', 'FAILED', e instanceof Error ? e.message : 'Unknown error');
    }
  };

  const toggleFreeze = async () => {
    if (!event) return;
    try {
      await api.adminPatchEvent(event.id, { isFrozen: !event.isFrozen });
      notify('success', 'EVENT UPDATED', event.isFrozen ? 'Board unfrozen.' : 'Board frozen.');
      window.location.reload();
    } catch (e: unknown) {
      notify('error', 'FAILED', e instanceof Error ? e.message : 'Unknown error');
    }
  };

  const fmtDate = (d: string | null) => d ? new Date(d).toLocaleString() : '—';

  return (
    <>
      <AdminNav />
      <div className="max-w-5xl mx-auto px-6 py-8">
        {loading ? (
          <div className="text-[11px] tracking-[0.3em] text-[#5A6379]">LOADING…</div>
        ) : !event ? (
          <div className="text-[11px] tracking-[0.3em] text-[#E84D7E]">NO EVENT LOADED</div>
        ) : (
          <>
            <div className="text-[9px] tracking-[0.3em] text-[#E0A83E]">■ EVENT STATUS</div>
            <h1 className="mt-1 font-display text-2xl tracking-wide text-[#F2F5FA]">{event.name}</h1>
            <div className="mt-1 text-[11px] tracking-[0.12em] text-[#5A6379]">SLUG: {event.slug}</div>

            <div className="mt-6 grid grid-cols-2 md:grid-cols-4 gap-3">
              <StatCard label="STATUS" value={event.isPublished ? 'LIVE' : 'DRAFT'} color={event.isPublished ? '#5ED6E3' : '#5A6379'} />
              <StatCard label="BOARD" value={event.isFrozen ? 'FROZEN' : 'LIVE'} color={event.isFrozen ? '#E84D7E' : '#5ED6E3'} />
              <StatCard label="CHALLENGES" value={`${visible}V / ${hidden}H / ${locked}L`} color="#D5DBE7" />
              <StatCard label="TOTAL" value={String(totalChallenges)} color="#5ED6E3" />
            </div>

            <div className="mt-4 grid grid-cols-1 md:grid-cols-2 gap-3">
              <div className="border border-[#1E2536] bg-[#0B0E16]/50 px-5 py-4">
                <div className="text-[10px] tracking-[0.25em] text-[#5A6379]">TIME WINDOW</div>
                <div className="mt-2 text-[12px] text-[#D5DBE7]">
                  <div>STARTS: <span className="text-[#8B93A9]">{fmtDate(event.startsAt)}</span></div>
                  <div>ENDS: <span className="text-[#8B93A9]">{fmtDate(event.endsAt)}</span></div>
                </div>
              </div>
              <div className="border border-[#1E2536] bg-[#0B0E16]/50 px-5 py-4">
                <div className="text-[10px] tracking-[0.25em] text-[#5A6379]">TIME GLITCH</div>
                <div className="mt-2 text-[12px] text-[#D5DBE7]">
                  {activeGlitch ? (
                    <div className="text-[#5ED6E3]">ACTIVE — ends {fmtDate(activeGlitch.endsAt)}</div>
                  ) : nextGlitch ? (
                    <div>NEXT: <span className="text-[#8B93A9]">{fmtDate(nextGlitch.startsAt)}</span></div>
                  ) : (
                    <div className="text-[#5A6379]">NO GLITCHES SCHEDULED</div>
                  )}
                  <div className="text-[#5A6379] mt-1">{glitches.length} total scheduled</div>
                </div>
              </div>
            </div>

            <div className="mt-6 text-[9px] tracking-[0.3em] text-[#E0A83E]">■ QUICK ACTIONS</div>
            <div className="mt-3 flex flex-wrap gap-3">
              <ActionBtn label={event.isPublished ? 'UNPUBLISH EVENT' : 'PUBLISH EVENT'} onClick={togglePublish} danger={event.isPublished} />
              <ActionBtn label={event.isFrozen ? 'UNFREEZE BOARD' : 'FREEZE BOARD'} onClick={toggleFreeze} danger={!event.isFrozen} />
              <ActionBtn label="MANAGE EVENTS →" onClick={() => navigateTo('ADMIN_EVENTS')} />
              <ActionBtn label="MANAGE CHALLENGES →" onClick={() => navigateTo('ADMIN_CHALLENGES')} />
              <ActionBtn label="MANAGE GLITCHES →" onClick={() => navigateTo('ADMIN_GLITCHES')} />
            </div>
          </>
        )}
      </div>
    </>
  );
};

const StatCard: React.FC<{ label: string; value: string; color: string }> = ({ label, value, color }) => (
  <div className="border border-[#1E2536] bg-[#0B0E16]/50 px-4 py-3">
    <div className="text-[9px] tracking-[0.25em] text-[#5A6379]">{label}</div>
    <div className="mt-1 text-[16px] font-bold tracking-[0.1em]" style={{ color }}>{value}</div>
  </div>
);

const ActionBtn: React.FC<{ label: string; onClick: () => void; danger?: boolean }> = ({ label, onClick, danger }) => (
  <button
    onClick={onClick}
    className={`px-5 py-2.5 text-[11px] font-bold tracking-[0.2em] cursor-pointer border ${
      danger
        ? 'border-[#E84D7E]/50 text-[#E84D7E] hover:bg-[#E84D7E]/[0.08]'
        : 'border-[#1E2536] text-[#5ED6E3] hover:bg-[#5ED6E3]/[0.06]'
    }`}
  >
    {label}
  </button>
);
