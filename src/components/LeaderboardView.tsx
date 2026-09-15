import React, { useState, useEffect } from 'react';
import { useGame } from '../context/GameContext';
// Leaderboard rows resolve via src/services/backend.ts —
// TODO(backend): swap getLeaderboard() for await fetchLeaderboard() (GET /api/leaderboard).
import { getLeaderboard } from '../services/backend';

const LEADERBOARD_DATA = getLeaderboard();

/**
 * Full roster system: standing scorecard, path filters, search,
 * first-three feature, complete ledger table, live wire, resume rail.
 */
export const LeaderboardView: React.FC = () => {
  const { bytesBalance, solvedChallengeIds, pathScores, teamName, setTeamName, navigateTo } = useGame();
  const [q, setQ] = useState('');
  const [editing, setEditing] = useState(false);
  const [draft, setDraft] = useState(teamName);

  const [wire, setWire] = useState([
    { id: '1', team: 'CIPHER_9', challengeId: 'B-08', points: 350, path: 'II · HOW', timeAgo: '2m ago' },
    { id: '2', team: 'TEAM_CHRONOS', challengeId: 'A-09', points: 400, path: 'I · WHO', timeAgo: '4m ago' },
    { id: '3', team: 'VOID_RUNNER', challengeId: 'C-05', points: 250, path: 'III · WHY', timeAgo: '7m ago' },
    { id: '4', team: 'NULL_POINTER', challengeId: 'B-05', points: 250, path: 'II · HOW', timeAgo: '11m ago' },
  ]);

  useEffect(() => {
    const teams = ['NULL_POINTER', 'GHOST_SYNTAX', 'ECHO_SHADOW', 'PARADOX_CORP', 'CIPHER_9'];
    const paths = [
      { prefix: 'A', name: 'I · WHO', pts: 300 },
      { prefix: 'B', name: 'II · HOW', pts: 250 },
      { prefix: 'C', name: 'III · WHY', pts: 350 },
    ];
    const t = setInterval(() => {
      const tm = teams[Math.floor(Math.random() * teams.length)];
      const p = paths[Math.floor(Math.random() * paths.length)];
      const n = Math.floor(Math.random() * 8) + 1;
      setWire((prev) => [
        { id: Date.now().toString(), team: tm, challengeId: `${p.prefix}-0${n}`, points: p.pts, path: p.name, timeAgo: 'just now' },
        ...prev.slice(0, 4),
      ]);
    }, 18000);
    return () => clearInterval(t);
  }, []);

  const aN = solvedChallengeIds.filter((id) => id.startsWith('A-')).length;
  const bN = solvedChallengeIds.filter((id) => id.startsWith('B-')).length;
  const cN = solvedChallengeIds.filter((id) => id.startsWith('C-')).length;

  const teams = LEADERBOARD_DATA.map((t) =>
    t.name === 'TEAM_KRONOS' || t.name === teamName
      ? {
          ...t, name: teamName, points: pathScores.total, bytes: bytesBalance,
          solves: { pathA: aN, pathB: bN, pathC: cN },
          pathPoints: { pathA: pathScores.pathA, pathB: pathScores.pathB, pathC: pathScores.pathC },
        }
      : t
  );
  const sorted = [...teams]
    .sort((x, y) => y.points - x.points)
    .map((t, i) => ({ ...t, rank: i + 1 }));
  const shown = sorted.filter(
    (t) => t.name.toLowerCase().includes(q.toLowerCase())
  );
  const myRank = sorted.find((t) => t.name === teamName)?.rank || 3;
  const medal = ['#E0A83E', '#5ED6E3', '#E84D7E'];

  return (
    <div className="flex-1 bg-[#07090F] scan-faint">
      <div className="max-w-6xl mx-auto px-4 sm:px-6 py-8">
        {/* standing */}
        <div className="flex flex-col lg:flex-row lg:items-end justify-between gap-5 pb-6 border-b border-[#1E2536]">
          <div>
            <div className="text-[9.5px] tracking-[0.3em] text-[#5ED6E3]">■ LIVE</div>
            <h1 className="mt-2 font-display font-medium uppercase tracking-wide text-3xl sm:text-4xl text-[#F2F5FA]">
              Leaderboard
            </h1>
          </div>
          <div className="border border-[#1E2536] bg-[#0B0E16]/70 px-4 py-3 flex flex-wrap items-center gap-x-5 gap-y-2">
            <div className="font-display text-2xl text-[#2C3550]">#{myRank}</div>
            <div>
              {editing ? (
                <form onSubmit={(e) => { e.preventDefault(); if (draft.trim()) setTeamName(draft.trim()); setEditing(false); }} className="flex gap-1.5">
                  <input value={draft} onChange={(e) => setDraft(e.target.value)} autoFocus maxLength={16}
                    className="w-32 bg-transparent border-b border-[#5ED6E3] text-[13px] text-[#F2F5FA] focus:outline-none" />
                  <button className="text-[#5ED6E3] text-[13px]">✓</button>
                </form>
              ) : (
                <button onClick={() => { setDraft(teamName); setEditing(true); }} className="text-[14px] font-semibold tracking-[0.08em] text-[#F2F5FA]">
                  {teamName} <span className="ml-1 text-[9px] border border-[#5ED6E3]/50 text-[#5ED6E3] px-1">YOU</span> <span className="text-[#454C61] text-[11px]">✎</span>
                </button>
              )}
              <div className="text-[10px] tracking-[0.15em] text-[#5A6379]">#{myRank} OF {teams.length} · <span className="text-[#5ED6E3] font-bold">{pathScores.total.toLocaleString()} PTS</span></div>
            </div>
            <div className="text-[11px] text-[#5A6379] border-l border-[#1E2536] pl-4">
              <span className="text-[#E0A83E]">I:{pathScores.pathA}</span> · <span className="text-[#5ED6E3]">II:{pathScores.pathB}</span> · <span className="text-[#E84D7E]">III:{pathScores.pathC}</span>
            </div>
          </div>
        </div>

        {/* controls */}
        <div className="mt-5 flex justify-end">
          <input value={q} onChange={(e) => setQ(e.target.value)} placeholder="Search a name…"
            className="bg-transparent border-b border-[#1E2536] text-[12px] focus:outline-none focus:border-[#5ED6E3]/60 placeholder-[#454C61] py-1.5 w-full sm:w-56" />
        </div>

        {/* first three */}
        <div className="mt-5 grid grid-cols-1 sm:grid-cols-3 gap-3">
          {sorted.slice(0, 3).map((t, i) => {
            const mine = t.name === teamName;
            return (
              <div key={t.name} className="border border-[#1E2536] bg-[#0B0E16]/60 p-5" style={mine ? { boxShadow: `inset 0 2px 0 ${medal[i]}` } : {}}>
                <div className="flex items-center justify-between">
                  <span className="font-display text-[26px]" style={{ color: medal[i] }}>0{i + 1}</span>
                  {mine && <span className="text-[9px] font-bold tracking-[0.2em] px-1.5 py-0.5" style={{ background: medal[i], color: '#07090F' }}>YOU</span>}
                </div>
                <div className="mt-1 text-[14px] font-semibold tracking-[0.06em] text-[#F2F5FA] truncate">{t.name}</div>
                <div className="mt-3 h-[5px] bg-[#07090F] border border-[#1E2536] flex">
                  <div className="h-full bg-[#E0A83E]" style={{ width: `${(t.pathPoints.pathA / Math.max(t.points, 1)) * 100}%` }} />
                  <div className="h-full bg-[#5ED6E3]" style={{ width: `${(t.pathPoints.pathB / Math.max(t.points, 1)) * 100}%` }} />
                  <div className="h-full bg-[#E84D7E]" style={{ width: `${(t.pathPoints.pathC / Math.max(t.points, 1)) * 100}%` }} />
                </div>
                <div className="mt-1.5 text-[10px] text-[#5A6379]">I({t.solves.pathA}) · II({t.solves.pathB}) · III({t.solves.pathC})</div>
                <div className="mt-3 pt-3 border-t border-[#1E2536] flex items-end justify-end">
                  <span className="font-display text-[22px]" style={{ color: medal[i] }}>{t.points.toLocaleString()}</span>
                </div>
              </div>
            );
          })}
        </div>

        <div className="mt-4 grid grid-cols-1 lg:grid-cols-4 gap-4">
          {/* ledger table */}
          <div className="lg:col-span-3 border border-[#1E2536] bg-[#0B0E16]/60 overflow-x-auto">
            <table className="w-full min-w-[660px] text-left text-[12px]">
              <thead>
                <tr className="border-b border-[#1E2536] text-[9.5px] tracking-[0.22em] text-[#5A6379]">
                  <th className="py-3 px-4 font-medium">Nº</th>
                  <th className="py-3 px-4 font-medium">OPERATIVE</th>
                  <th className="py-3 px-4 text-center font-medium text-[#E0A83E]">I</th>
                  <th className="py-3 px-4 text-center font-medium text-[#5ED6E3]">II</th>
                  <th className="py-3 px-4 text-center font-medium text-[#E84D7E]">III</th>
                  <th className="py-3 px-4 text-right font-medium">TOTAL POINTS</th>
                  <th className="py-3 px-4 text-right font-medium hidden md:table-cell">WIRE</th>
                </tr>
              </thead>
              <tbody>
                {shown.map((t) => {
                  const mine = t.name === teamName;
                  return (
                    <tr key={t.name} className={`border-b border-[#141A2B] ${mine ? 'bg-[#5ED6E3]/[0.04]' : ''}`} style={mine ? { boxShadow: 'inset 2px 0 0 #5ED6E3' } : {}}>
                      <td className="py-3 px-4 text-[#454C61]">#{t.rank}</td>
                      <td className="py-3 px-4">
                        <span className={mine ? 'text-[#F2F5FA] font-semibold' : 'text-[#8B93A9]'}>{t.name}</span>
                      </td>
                      <td className="py-3 px-4 text-center"><span className="text-[#E0A83E]">{t.pathPoints.pathA}</span> <span className="text-[#454C61] text-[10px]">({t.solves.pathA}/10)</span></td>
                      <td className="py-3 px-4 text-center"><span className="text-[#5ED6E3]">{t.pathPoints.pathB}</span> <span className="text-[#454C61] text-[10px]">({t.solves.pathB}/10)</span></td>
                      <td className="py-3 px-4 text-center"><span className="text-[#E84D7E]">{t.pathPoints.pathC}</span> <span className="text-[#454C61] text-[10px]">({t.solves.pathC}/10)</span></td>
                      <td className="py-3 px-4 text-right text-[#F2F5FA] font-semibold">{t.points.toLocaleString()}</td>
                      <td className="py-3 px-4 text-right text-[#454C61] text-[11px] hidden md:table-cell">{t.lastSubmission}</td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>

          {/* rail */}
          <div className="space-y-4">
            <div className="border border-[#1E2536] bg-[#0B0E16]/60 p-4">
              <div className="flex items-center justify-between text-[10px] font-semibold tracking-[0.25em] text-[#5ED6E3] border-b border-[#1E2536] pb-2">
                <span>HEARD ON THE WIRE</span><span className="w-1.5 h-1.5 rounded-full bg-[#5ED6E3] animate-pulse" />
              </div>
              <div className="mt-3 space-y-2">
                {wire.map((e) => (
                  <div key={e.id} className="border border-[#1E2536] bg-[#07090F] p-2.5 text-[11px]">
                    <div className="flex justify-between"><span className="text-[#F2F5FA] font-semibold">{e.team}</span><span className="text-[#454C61]">{e.timeAgo}</span></div>
                    <div className="mt-0.5 flex justify-between text-[#5A6379]"><span>{e.challengeId} · {e.path}</span><span className="text-[#5ED6E3]">+{e.points}</span></div>
                  </div>
                ))}
              </div>
            </div>
            <div className="border border-[#1E2536] bg-[#0B0E16]/60 p-4">
              <div className="text-[12px] font-semibold tracking-[0.1em] text-[#F2F5FA]">NOT DONE DIGGING?</div>
              <p className="mt-1 text-[11px] text-[#5A6379]">Unopened seals are still down there.</p>
              <button onClick={() => navigateTo('MAP')} className="mt-3 w-full py-2.5 bg-[#5ED6E3] hover:bg-[#7CE3EE] text-[#06232A] text-[11px] font-bold tracking-[0.2em] transition-colors">
                BACK TO THE CHART →
              </button>
            </div>
          </div>
        </div>

        <div className="mt-6 text-center text-[9.5px] tracking-[0.25em] text-[#454C61]">
          LIGHT SEALS 150–200 · MID 250–300 · DEEP 350–500 · THE MOUTH +1,000
        </div>
      </div>
    </div>
  );
};
