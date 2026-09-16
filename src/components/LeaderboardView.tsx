import React, { useEffect, useState } from 'react';
import { useGame } from '../context/GameContext';
import { TONE } from '../data/pathsData';

const relativeTime = (iso: string | null): string => {
  if (!iso) return '—';
  const delta = Date.now() - new Date(iso).getTime();
  if (delta < 60_000) return 'just now';
  const mins = Math.floor(delta / 60_000);
  if (mins < 60) return `${mins}m ago`;
  const hours = Math.floor(mins / 60);
  if (hours < 24) return `${hours}h ago`;
  return `${Math.floor(hours / 24)}d ago`;
};

/**
 * The scoreboard, read from `/events/:id/scoreboard`.
 *
 * It shows what the server publishes and nothing else: rank, team, score,
 * solve count, last solve. The per-path breakdown is only rendered for the
 * viewer's own team, because that is the only team whose path split the API
 * exposes — inventing the other columns is what the old mock did.
 */
export const LeaderboardView: React.FC = () => {
  const {
    scoreboard, scoreboardFrozen, loadScoreboard, teamName,
    pathScores, score, rank, paths, navigateTo,
  } = useGame();
  const [q, setQ] = useState('');

  useEffect(() => {
    void loadScoreboard();
    const timer = setInterval(() => void loadScoreboard(), 30_000);
    return () => clearInterval(timer);
  }, [loadScoreboard]);

  const shown = scoreboard.filter((t) => t.name.toLowerCase().includes(q.toLowerCase()));
  const medal = ['#E0A83E', '#5ED6E3', '#E84D7E'];

  return (
    <div className="flex-1 bg-[#07090F] scan-faint">
      <div className="max-w-6xl mx-auto px-4 sm:px-6 py-8">
        {scoreboardFrozen && (
          <div className="mb-4 border border-[#E0A83E]/40 bg-[#E0A83E]/[0.05] px-5 py-3 text-[11px] tracking-[0.15em] text-[#E0A83E]">
            ■ BOARD FROZEN — STANDINGS AS OF THE FREEZE. YOUR SOLVES STILL COUNT.
          </div>
        )}

        {/* your standing */}
        <div className="border border-[#1E2536] bg-[#0B0E16]/60 px-5 py-4">
          <div className="flex flex-wrap items-end justify-between gap-4">
            <div>
              <div className="text-[10px] tracking-[0.25em] text-[#5A6379]">YOUR STANDING</div>
              <div className="mt-1 font-display text-2xl text-[#F2F5FA]">{teamName}</div>
            </div>
            <div className="text-right">
              <div className="font-display text-[34px] leading-none text-[#5ED6E3]">
                {score.toLocaleString()}
              </div>
              <div className="mt-1 text-[10px] tracking-[0.2em] text-[#5A6379]">
                {rank !== null ? `RANK #${rank}` : 'UNRANKED'}
              </div>
            </div>
          </div>
          <div className="mt-3 flex flex-wrap gap-x-4 gap-y-1 text-[11px]">
            {(['A', 'B', 'C'] as const).map((code) => {
              const path = paths.find((p) => p.code === code);
              const pts = code === 'A' ? pathScores.pathA : code === 'B' ? pathScores.pathB : pathScores.pathC;
              return (
                <span key={code} style={{ color: TONE[code] }}>
                  {code}:{pts.toLocaleString()}
                  <span className="text-[#454C61]"> ({path?.solved ?? 0}/{path?.total ?? 10})</span>
                </span>
              );
            })}
          </div>
        </div>

        <div className="mt-5 flex justify-end">
          <input
            value={q}
            onChange={(e) => setQ(e.target.value)}
            placeholder="Search a name…"
            className="bg-transparent border-b border-[#1E2536] text-[12px] focus:outline-none focus:border-[#5ED6E3]/60 placeholder-[#454C61] py-1.5 w-full sm:w-56"
          />
        </div>

        {/* top three */}
        <div className="mt-5 grid grid-cols-1 sm:grid-cols-3 gap-3">
          {scoreboard.slice(0, 3).map((t, i) => (
            <div
              key={t.teamId}
              className="border border-[#1E2536] bg-[#0B0E16]/60 p-5"
              style={t.isMe ? { boxShadow: `inset 0 2px 0 ${medal[i]}` } : {}}
            >
              <div className="flex items-center justify-between">
                <span className="font-display text-[26px]" style={{ color: medal[i] }}>
                  {String(i + 1).padStart(2, '0')}
                </span>
                {t.isMe && (
                  <span
                    className="text-[9px] font-bold tracking-[0.2em] px-1.5 py-0.5"
                    style={{ background: medal[i], color: '#07090F' }}
                  >
                    YOU
                  </span>
                )}
              </div>
              <div className="mt-1 text-[14px] font-semibold tracking-[0.06em] text-[#F2F5FA] truncate">{t.name}</div>
              <div className="mt-1.5 text-[10px] text-[#5A6379]">{t.solves} SOLVES</div>
              <div className="mt-3 pt-3 border-t border-[#1E2536] flex items-end justify-end">
                <span className="font-display text-[22px]" style={{ color: medal[i] }}>
                  {t.points.toLocaleString()}
                </span>
              </div>
            </div>
          ))}
        </div>

        <div className="mt-4 grid grid-cols-1 lg:grid-cols-4 gap-4">
          <div className="lg:col-span-3 border border-[#1E2536] bg-[#0B0E16]/60 overflow-x-auto">
            <table className="w-full min-w-[560px] text-left text-[12px]">
              <thead>
                <tr className="border-b border-[#1E2536] text-[9.5px] tracking-[0.22em] text-[#5A6379]">
                  <th className="py-3 px-4 font-medium">Nº</th>
                  <th className="py-3 px-4 font-medium">TEAM</th>
                  <th className="py-3 px-4 text-center font-medium">SOLVES</th>
                  <th className="py-3 px-4 text-right font-medium">POINTS</th>
                  <th className="py-3 px-4 text-right font-medium hidden md:table-cell">LAST SOLVE</th>
                </tr>
              </thead>
              <tbody>
                {shown.map((t) => (
                  <tr
                    key={t.teamId}
                    className={`border-b border-[#141A2B] ${t.isMe ? 'bg-[#5ED6E3]/[0.04]' : ''}`}
                    style={t.isMe ? { boxShadow: 'inset 2px 0 0 #5ED6E3' } : {}}
                  >
                    <td className="py-3 px-4 text-[#454C61]">#{t.rank}</td>
                    <td className="py-3 px-4">
                      <span className={t.isMe ? 'text-[#F2F5FA] font-semibold' : 'text-[#8B93A9]'}>{t.name}</span>
                    </td>
                    <td className="py-3 px-4 text-center text-[#8B93A9]">{t.solves}</td>
                    <td className="py-3 px-4 text-right text-[#F2F5FA] font-semibold">
                      {t.points.toLocaleString()}
                    </td>
                    <td className="py-3 px-4 text-right text-[#454C61] text-[11px] hidden md:table-cell">
                      {relativeTime(t.lastSubmission)}
                    </td>
                  </tr>
                ))}
                {shown.length === 0 && (
                  <tr>
                    <td colSpan={5} className="py-8 px-4 text-center text-[#454C61]">
                      {scoreboard.length === 0 ? 'No teams have scored yet.' : 'No team matches that name.'}
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>

          <div className="space-y-4">
            <div className="border border-[#1E2536] bg-[#0B0E16]/60 p-4">
              <div className="text-[12px] font-semibold tracking-[0.1em] text-[#F2F5FA]">NOT DONE DIGGING?</div>
              <p className="mt-1 text-[11px] text-[#5A6379]">Unopened seals are still down there.</p>
              <button
                onClick={() => navigateTo('MAP')}
                className="mt-3 w-full py-2.5 bg-[#5ED6E3] hover:bg-[#7CE3EE] text-[#06232A] text-[11px] font-bold tracking-[0.2em] transition-colors cursor-pointer"
              >
                BACK TO THE CHART →
              </button>
            </div>
            <div className="border border-[#1E2536] bg-[#0B0E16]/60 p-4 text-[10px] leading-relaxed tracking-[0.12em] text-[#5A6379]">
              Scores decay as more teams solve a challenge. Hints are paid for out of your total.
              Skipping scores zero and drops the rest of that path to 80%.
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
