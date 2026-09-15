export interface Operative {
  id: string; // stable key, used for per-user save slot
  callsign: string; // login name, case-insensitive
  accessCode: string; // pre-shared code, case-sensitive
  displayName: string;
  role: string;
}

export const OPERATIVES: Operative[] = [
  { id: 'KRONOS', callsign: 'TEAM_KRONOS', accessCode: 'echo-41-lisbon', displayName: 'TEAM_KRONOS', role: 'ECHO_SYNTHESIS' },
  { id: 'CIPHER9', callsign: 'CIPHER_9', accessCode: 'busan-sas-2015', displayName: 'CIPHER_9', role: 'NETWORK_FORENSICS' },
  { id: 'VOID', callsign: 'VOID_RUNNER', accessCode: 'reykjavik-minus-41ms', displayName: 'VOID_RUNNER', role: 'FIELD_RECOVERY' },
  { id: 'NULLPTR', callsign: 'NULL_POINTER', accessCode: 'fulcrum-zurich-402b', displayName: 'NULL_POINTER', role: 'ARCHIVE_CUSTODIAN' },
  { id: 'WREN', callsign: 'WREN_OKAFOR', accessCode: 'meridian-2011-echo', displayName: 'WREN_OKAFOR', role: 'PROTOCOL_INTERPRETER' },
  { id: 'SENA', callsign: 'SENA_PARK', accessCode: 'iteration-two-awake', displayName: 'SENA_PARK', role: 'PROTOCOL_INTERPRETER' },
];

export const findOperative = (callsign: string): Operative | undefined =>
  OPERATIVES.find((o) => o.callsign.toLowerCase() === callsign.trim().toLowerCase());
