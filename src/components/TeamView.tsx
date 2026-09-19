import React, { useState, useEffect } from 'react';
import { useGame } from '../context/GameContext';

/**
 * TEAM panel — Displays live team metadata, join code, and full operative roster from the backend.
 */
export const TeamView: React.FC = () => {
  const { currentUser, team, teamName, refreshTeam, navigateTo } = useGame();
  const [copied, setCopied] = useState(false);
  const [refreshing, setRefreshing] = useState(false);

  // Re-fetch latest team state on view mount and poll every 5s while on this screen
  useEffect(() => {
    void refreshTeam();
    const timer = setInterval(() => {
      if (document.visibilityState === 'visible') {
        void refreshTeam();
      }
    }, 5000);
    return () => clearInterval(timer);
  }, [refreshTeam]);

  const handleCopyCode = async () => {
    if (!team?.joinCode) return;
    try {
      await navigator.clipboard.writeText(team.joinCode);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch {
      /* fallback */
    }
  };

  const handleManualRefresh = async () => {
    setRefreshing(true);
    await refreshTeam();
    setRefreshing(false);
  };

  // Resolve members from live backend team state
  const rawMembers = team?.members && team.members.length > 0 ? team.members : null;

  const members = rawMembers
    ? rawMembers.map((m) => ({
        id: m.userId,
        name: m.displayName || m.username || 'Operative',
        isLeader: m.role === 'captain',
        isCurrent: m.userId === currentUser?.id,
      }))
    : [
        {
          id: currentUser?.id ?? 'me',
          name: currentUser?.displayName || currentUser?.username || teamName,
          isLeader: team?.myRole === 'captain' || true,
          isCurrent: true,
        },
      ];

  const leader = members.find((m) => m.isLeader) || members[0];

  return (
    <div className="flex-1 bg-[#07090F] scan-faint">
      <div className="max-w-3xl px-4 sm:px-6 py-8 text-left">
        <div className="flex items-center justify-between">
          <div className="text-[9.5px] tracking-[0.3em] text-[#5ED6E3]">■ TEAM DOSSIER</div>
          <button
            onClick={handleManualRefresh}
            disabled={refreshing}
            className="border border-[#1E2536] bg-[#0A0D15] hover:border-[#5ED6E3] hover:text-[#5ED6E3] px-3 py-1 text-[10px] tracking-[0.2em] text-[#5A6379] transition-colors cursor-pointer"
          >
            {refreshing ? 'SYNCING…' : 'REFRESH ↻'}
          </button>
        </div>

        <h1 className="mt-2 font-display font-medium uppercase tracking-wide text-3xl sm:text-4xl text-[#F2F5FA]">
          {team?.name || teamName}
        </h1>

        {/* Join code sharing card */}
        {team?.joinCode && (
          <div className="mt-6 border border-[#5ED6E3]/30 bg-[#0B1522]/50 p-4 relative">
            <div className="text-[10px] tracking-[0.25em] text-[#5ED6E3]">CELL JOIN CODE</div>
            <div className="mt-2 flex flex-wrap items-center gap-3">
              <div className="font-mono text-2xl font-bold tracking-[0.25em] text-[#F2F5FA] bg-[#07090F] px-4 py-1.5 border border-[#1E2536]">
                {team.joinCode}
              </div>
              <button
                type="button"
                onClick={handleCopyCode}
                className="border border-[#5ED6E3] bg-[#5ED6E3]/10 hover:bg-[#5ED6E3]/20 text-[#5ED6E3] px-4 py-2 text-[11px] tracking-[0.2em] font-medium transition-colors cursor-pointer"
              >
                {copied ? '✓ COPIED' : 'COPY CODE'}
              </button>
            </div>
            <p className="mt-2 text-[11px] text-[#8B93A9] leading-relaxed">
              Share this join code with your teammates. They can enter it under <span className="text-[#D5DBE7]">JOIN CELL</span> to link into this team.
            </p>
          </div>
        )}

        {/* Team Leader */}
        <div className="mt-6 border border-[#1E2536] bg-[#0B0E16]/70 px-4 py-3 flex flex-col items-start gap-1">
          <span className="text-[10px] tracking-[0.25em] text-[#5A6379]">CELL LEADER</span>
          <div className="flex items-center gap-2">
            <span className="text-[14px] tracking-[0.12em] text-[#F2F5FA] font-medium">★ {leader.name}</span>
            {leader.isCurrent && (
              <span className="text-[9px] tracking-[0.2em] bg-[#5ED6E3]/10 text-[#5ED6E3] px-1.5 py-0.5 border border-[#5ED6E3]/30">
                YOU
              </span>
            )}
          </div>
        </div>

        {/* Members Roster */}
        <div className="mt-4 border border-[#1E2536] bg-[#0B0E16]/40">
          <div className="px-4 py-2.5 border-b border-[#1E2536] flex items-center justify-between text-[10px] tracking-[0.25em] text-[#5A6379]">
            <span>ROSTER · {members.length} / 4 OPERATIVES</span>
            <span className="text-[9px] text-[#454C61]">MAX 4 CELL MEMBERS</span>
          </div>

          <div className="divide-y divide-[#1E2536]/60">
            {members.map((m) => (
              <div
                key={m.id}
                className="px-4 py-3 flex items-center justify-between hover:bg-[#0E1320]/50 transition-colors"
              >
                <div className="flex items-center gap-3">
                  <span className="text-[13px] tracking-[0.12em] text-[#D5DBE7] font-mono">{m.name}</span>
                  {m.isCurrent && (
                    <span className="text-[9px] tracking-[0.2em] bg-[#5ED6E3]/10 text-[#5ED6E3] px-1.5 py-0.5 border border-[#5ED6E3]/30">
                      YOU
                    </span>
                  )}
                </div>

                <div>
                  {m.isLeader ? (
                    <span className="text-[10px] tracking-[0.2em] text-[#E0A83E] flex items-center gap-1">
                      ★ CAPTAIN
                    </span>
                  ) : (
                    <span className="text-[10px] tracking-[0.2em] text-[#5A6379]">OPERATIVE</span>
                  )}
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Role guidance */}
        <div className="mt-6 border-l-2 border-[#1E2536] pl-4 py-1 text-[11px] text-[#5A6379] leading-relaxed">
          Points, node unlocks, skips, and convergence fragments are synchronized in real-time across all cell operatives.
        </div>
      </div>
    </div>
  );
};
