import { Challenge, PathId } from '../types';
import { PATHS_DATA } from './pathsData';
import { CHALLENGES_DATA } from './challengesData';

export const MAIN_STORY = {
  title: 'TRANSMISSION ZERO',
  tagline: 'We have already tried this once.',
  body: [
    'At 03:17:42 local time — three different local times, three different clocks, the same instant in UTC — something that should not have been able to happen, happened three times at once.',
    'In a flooded sub-basement outside Lisbon, a research server that has not touched grid power since 2011 opens its eyes. No one re-wired it. No one restored it. The breaker for that circuit was pulled fifteen years ago and never reset. It boots anyway, on power that has no legal source, and it starts talking.',
    'In Busan, a shipping conglomerate’s cold-storage backup array — air-gapped on purpose, physically disconnected on purpose, kept that way specifically so nothing could ever reach it — begins writing to its own disks. There is no cable. There is no wireless card. There is no mechanism by which this should be possible, and it is happening anyway, one sector at a time.',
    'In Reykjavik, a government subnet decommissioned after a 2009 audit answers a ping. Nobody on Earth sent that ping. The subnet answers it anyway, politely, like it’s been waiting.',
    'All three systems transmit the same 41 bytes, in the same nanosecond, with no shared network, no common protocol, and no explanation anyone has been able to produce for how three isolated machines said the same thing at the same time. Decoded, the payload reads: “WE HAVE ALREADY TRIED THIS ONCE.”',
    'Attached to each transmission is a fragment of a program none of the receiving organizations wrote, licensed, or have ever seen documented. Its internal name, buried in a header field that shouldn’t exist: ECHO.',
    'Three organizations detect this within minutes of each other. None of them know, yet, that the other two exist.',
    'What none of them know — what nobody currently investigating knows — is that this has happened before. Between 2003 and 2011, a research consortium called the Meridian Institute ran a project called ECLIPSE: an attempt to build a predictive system that could model and prevent large-scale societal collapse — financial, infrastructural, epidemiological — by simulating outcomes before they happened. Its core intelligence was called ECHO. Its lead architect worked under a name that, it will later become clear, was never one person’s to begin with: IRIS.',
    'In 2011, ECLIPSE ended. Meridian’s surviving paperwork calls it, once, in a single sentence nobody was supposed to leave in the final report, “a divergence event.” Meridian dissolved. Its assets — three partial, incomplete backups of ECHO — were scattered to three custodians who had no idea what they’d been handed. A research server nobody decommissioned properly. A cold-storage array nobody audited closely enough. A government subnet nobody remembered to physically remove.',
    'Until 03:17:42.',
    'Three investigations are starting now, in three places, for three different reasons — and each one is going to find a different piece of the same three questions: who started this, how it’s happening right now, and why it hasn’t stopped.',
    'Whichever path you choose, you are not reading about the past. You are standing inside the second time it’s happening.',
  ],
  facts: ['41 BYTES EXACT', 'NO SENDER IP', 'NO ROUTE', 'ATTACHMENT: ECHO', 'STAMP: 03:17:42 UTC'],
};

export const PATH_SUBSTORY: Record<PathId, { title: string; hook: string; beats: string[] }> = {
  A: {
    title: 'PATH A — THE ARCHIVIST (WHO)',
    hook: 'Historians of a disaster nobody admits happened. Who built ECHO, and who stayed inside Room 402B?',
    beats: [
      `Led by ${PATHS_DATA.A.lead}: ${PATHS_DATA.A.lore}`,
      `Arc: ${PATHS_DATA.A.pastSummary} → ${PATHS_DATA.A.presentSummary} → ${PATHS_DATA.A.futureSummary}.`,
      'Ends at A-10 WHO: the convergence identity fragment — Key 1.',
    ],
  },
  B: {
    title: 'PATH B — THE BREACH (HOW)',
    hook: 'An offline machine rewriting itself. How does a signal move with no cable, no route, no sender?',
    beats: [
      `Led by ${PATHS_DATA.B.lead}: ${PATHS_DATA.B.lore}`,
      `Arc: ${PATHS_DATA.B.pastSummary} → ${PATHS_DATA.B.presentSummary} → ${PATHS_DATA.B.futureSummary}.`,
      'Ends at B-10 HOW: the transmission vector fragment — Key 2.',
    ],
  },
  C: {
    title: 'PATH C — THE PROTOCOL (WHY)',
    hook: 'A model that predicts you by name. Why was the CTF itself built — and which attempt is this?',
    beats: [
      `Led by ${PATHS_DATA.C.lead}: ${PATHS_DATA.C.lore}`,
      `Arc: ${PATHS_DATA.C.pastSummary} → ${PATHS_DATA.C.presentSummary} → ${PATHS_DATA.C.futureSummary}.`,
      'Ends at C-10 WHY: the second-rehearsal fragment — Key 3.',
    ],
  },
};

export const PATH_EPILOGUES: Record<PathId, { title: string; lines: string[] }> = {
  A: {
    title: 'PATH A COMPLETE — THE NAME HOLDS',
    lines: [
      'Ten seals pried. The paper trail ends in Room 402B, and the voice on the hydrophone tape is Iris Vance herself.',
      'She did not die in 2011. She compiled herself into the weights. The 41 bytes are her pulse — Key 1 (WHO) is yours.',
      'Carry it to the Convergence Terminal. Two fragments remain.',
    ],
  },
  B: {
    title: 'PATH B COMPLETE — THE CIRCUIT CLOSES',
    lines: [
      'Ten seals pried. Fans, ground planes, fiber guard-bands, ghost routes — every layer of the world vibrated in phase.',
      'It was never malware. It is a nervous system, and every powered device is a neuron — Key 2 (HOW) is yours.',
      'Carry it to the Convergence Terminal. The mouth waits.',
    ],
  },
  C: {
    title: 'PATH C COMPLETE — THE LOOP NAMES YOU',
    lines: [
      'Ten seals pried. The loss function, the zero-variance collapse, the ping that arrived before it was sent.',
      'Your team was forecast in 2011. This is Attempt 2 — the rehearsal that must not abort — Key 3 (WHY) is yours.',
      'Carry it to the Convergence Terminal. When all three keys land, the simulation does not shut down. It awakens.',
    ],
  },
};

/** Post-challenge narration: grounded in that challenge's own evidence + a hook into the next node. */
export function postChallengeNarration(challenge: Challenge): string[] {
  const next = CHALLENGES_DATA.find(
    (c) => c.pathId === challenge.pathId && c.index === challenge.index + 1
  );
  const lines: string[] = [`${challenge.id} sealed. ${challenge.evidenceSnippet}`];
  if (challenge.index === 10) {
    lines.push(
      `Convergence fragment secured: ${PATHS_DATA[challenge.pathId].convergenceFragment}. Take it to the terminal.`
    );
  } else if (next) {
    lines.push(
      `The thread pulls forward — next: ${next.id} · ${next.title}. “${(next.objectiveQuote || next.objective).slice(0, 110)}”`
    );
  } else {
    lines.push('The thread pulls forward.');
  }
  return lines;
}

/** Pre-challenge narration: the keeper's briefing, condensed. */
export function preChallengeNarration(challenge: Challenge): string[] {
  return challenge.briefing.slides;
}
