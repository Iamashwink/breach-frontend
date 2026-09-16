import React from 'react';
import { useGame } from '../context/GameContext';

/** Roster is fixed per team slot (2–4 members). The login operative's slot decides the list. */
const ROSTERS: Record<string, { name: string; leader?: boolean }[]> = {
  KRONOS: [
    { name: 'TEAM_KRONOS', leader: true },
    { name: 'VEX_HARROW' },
    { name: 'MINA_REYES' },
    { name: 'JULES_OKONKWO' },
  ],
  CIPHER9: [
    { name: 'CIPHER_9', leader: true },
    { name: 'SABLE_NYX' },
    { name: 'DORIAN_VOSS' },
  ],
  VOID: [
    { name: 'VOID_RUNNER', leader: true },
    { name: 'ASH_KOVAC' },
  ],
  NULLPTR: [
    { name: 'NULL_POINTER', leader: true },
    { name: 'GRETA_LINDQVIST' },
    { name: 'OTTO_FENN' },
  ],
  WREN: [
    { name: 'WREN_OKAFOR', leader: true },
    { name: 'TOMIWA_ADE' },
  ],
  SENA: [
    { name: 'SENA_PARK', leader: true },
    { name: 'JIHO_HAN' },
    { name: 'MIN_JUN' },
  ],
};

/**
 * TEAM panel — only: team name, member names, team leader. Nothing else.
 */
export const TeamView: React.FC = () => {
  const { currentUser, teamName } = useGame();

  const members = (currentUser && ROSTERS[currentUser.id]) || [
    { name: currentUser?.displayName || teamName, leader: true },
  ];
  const leader = members.find((m) => m.leader) || members[0];

  return (
    <div className="flex-1 bg-[#07090F] scan-faint">
      <div className="max-w-3xl px-4 sm:px-6 py-8 text-left">
        <div className="text-[9.5px] tracking-[0.3em] text-[#5ED6E3] text-left">■ TEAM FILE</div>
        <h1 className="mt-2 font-display font-medium uppercase tracking-wide text-3xl sm:text-4xl text-[#F2F5FA] text-left">
          {teamName}
        </h1>

        {/* team leader */}
        <div className="mt-6 border border-[#1E2536] bg-[#0B0E16]/70 px-4 py-3 flex flex-col items-start gap-1 text-left">
          <span className="text-[10px] tracking-[0.25em] text-[#5A6379]">TEAM LEADER</span>
          <span className="text-[13px] tracking-[0.12em] text-[#F2F5FA]">★ {leader.name}</span>
        </div>

        {/* members */}
        <div className="mt-4 border border-[#1E2536] bg-[#0B0E16]/40 text-left">
          <div className="px-4 py-2.5 border-b border-[#1E2536] text-[10px] tracking-[0.25em] text-[#5A6379]">
            MEMBERS · {members.length}
          </div>
          {members.map((m) => (
            <div
              key={m.name}
              className="px-4 py-2.5 flex items-center justify-start gap-3 border-b border-[#1E2536]/60 last:border-b-0"
            >
              <span className="text-[12px] tracking-[0.12em] text-[#D5DBE7]">{m.name}</span>
              {m.leader && (
                <span className="text-[10px] tracking-[0.2em] text-[#E0A83E]">★ LEADER</span>
              )}
            </div>
          ))}
        </div>
      </div>
    </div>
  );
};
