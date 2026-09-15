import { Challenge, PathId } from '../types';

export const getPointsForChallenge = (challenge: { index: number; difficulty: string }): number => {
  if (challenge.index === 10) return 500; // Apex node (Convergence key unlock)
  if (challenge.index === 9) return 400;
  if (challenge.index === 8) return 350;
  if (challenge.index >= 6) return 300;
  if (challenge.index >= 4) return 250;
  if (challenge.index === 3) return 200;
  return 150; // Nodes 1 & 2
};

export const calculateUserPoints = (
  solvedChallengeIds: string[],
  challenges: Challenge[]
): {
  pathA: number;
  pathB: number;
  pathC: number;
  total: number;
} => {
  let pathA = 0;
  let pathB = 0;
  let pathC = 0;

  solvedChallengeIds.forEach((id) => {
    const challenge = challenges.find((c) => c.id === id);
    const pts = challenge ? challenge.points || getPointsForChallenge(challenge) : 200;
    if (id.startsWith('A-')) pathA += pts;
    else if (id.startsWith('B-')) pathB += pts;
    else if (id.startsWith('C-')) pathC += pts;
  });

  return {
    pathA,
    pathB,
    pathC,
    total: pathA + pathB + pathC,
  };
};
