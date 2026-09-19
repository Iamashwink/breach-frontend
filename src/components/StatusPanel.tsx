import React from 'react';
import { useGame } from '../context/GameContext';

export const StatusPanel: React.FC = () => {
  const {
    teamName, formattedTimer, score, rank, solvedSlots, skips,
    rewardMultiplier, setStoryOpen, logout, board,
  } = useGame();

  const solvedTotal = board?.solveCount ?? solvedSlots.length;

  return (
    <div className="sticky top-0 z-30 border-b border-[#1E2536] bg-[#0A0D15] px-5 sm:px-8 py-3 w-full m-0 rounded-none">
      <div className="w-full flex flex-wrap items-center justify-between gap-x-6 gap-y-2 text-[10px] tracking-[0.16em]">
        <div className="flex flex-wrap items-center gap-x-5 gap-y-1">
          <span className="text-[#5A6379]">TEAM <b className="text-[#F2F5FA]">{teamName}</b></span>
          <span className="text-[#5A6379]">CLOSES <b className="text-[#5ED6E3]">{formattedTimer}</b></span>
          <span className="text-[#5A6379]">SCORE <b className="text-[#5ED6E3]">{score.toLocaleString()}</b></span>
          {rank !== null && <span className="text-[#5A6379]">RANK <b className="text-[#F2F5FA]">#{rank}</b></span>}
          <span className="text-[#5A6379]">SOLVED <b className="text-[#F2F5FA]">{solvedTotal}</b></span>
          {skips.quota > 0 && (
            <span className="text-[#5A6379]">SKIPS <b className="text-[#F2F5FA]">{skips.remaining}/{skips.quota}</b></span>
          )}
          {rewardMultiplier < 1 && (
            <span className="text-[#E84D7E]">×{rewardMultiplier.toFixed(2)} PATH PENALTY</span>
          )}
        </div>
        <div className="flex flex-wrap items-center gap-x-3 gap-y-1">
          <button onClick={() => setStoryOpen(true)} className="text-[#5ED6E3] hover:text-[#7CE3EE] cursor-pointer">[ SHOW STORY ]</button>
          <button onClick={logout} className="text-[#5A6379] hover:text-[#E84D7E] cursor-pointer">[ LOGOUT ]</button>
        </div>
      </div>
    </div>
  );
};
