/**
 * The event prologue — the framing narrative shown behind SHOW STORY.
 *
 * This is the one piece of text still held client-side, and deliberately: it is
 * the setup every player reads before the game begins, identical for everyone,
 * with no server-side counterpart beyond `core_event.description`. Everything
 * that varies by team or path — path intros, challenge briefings, debriefs —
 * comes from the API, because the server is the only thing that knows what a
 * given team has earned the right to read.
 */
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
    'What none of them know — what nobody currently investigating knows — is that this has happened before. Between 2003 and 2011, a research consortium called the Meridian Institute ran a project called ECLIPSE: an attempt to build a predictive system that could model and prevent large-scale societal collapse by simulating outcomes before they happened. Its core intelligence was called ECHO. Its lead architect worked under a name that, it will later become clear, was never one person’s to begin with: IRIS.',
    'In 2011, ECLIPSE ended. Meridian’s surviving paperwork calls it, once, in a single sentence nobody was supposed to leave in the final report, “a divergence event.” Meridian dissolved. Its assets — three partial, incomplete backups of ECHO — were scattered to three custodians who had no idea what they’d been handed.',
    'Until 03:17:42.',
    'Three investigations are starting now, in three places, for three different reasons — and each one is going to find a different piece of the same three questions: who started this, how it’s happening right now, and why it hasn’t stopped.',
    'Whichever path you choose, you are not reading about the past. You are standing inside the second time it’s happening.',
  ],
  facts: ['41 BYTES EXACT', 'NO SENDER IP', 'NO ROUTE', 'ATTACHMENT: ECHO', 'STAMP: 03:17:42 UTC'],
};

/**
 * Splits a server narration blob into paragraphs for the typewriter briefing.
 *
 * The API stores pre/post story as one text field. Breaking it on sentence
 * boundaries gives the briefing modal something to page through without the
 * content having to be authored twice.
 */
export function toSlides(text: string): string[] {
  if (!text.trim()) return [];
  const paragraphs = text.split(/\n{2,}/).map((p) => p.trim()).filter(Boolean);
  if (paragraphs.length > 1) return paragraphs;

  const sentences = text.match(/[^.!?]+[.!?]+(\s|$)/g);
  if (!sentences) return [text.trim()];

  // Two sentences a slide: one is a stutter, four is a wall of text.
  const slides: string[] = [];
  for (let i = 0; i < sentences.length; i += 2) {
    slides.push(sentences.slice(i, i + 2).join('').trim());
  }
  return slides.filter(Boolean);
}
