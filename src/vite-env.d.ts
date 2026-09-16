/// <reference types="vite/client" />

/**
 * Build-time configuration, read from `.env` files by Vite.
 *
 * Both are optional: the defaults in `services/api.ts` point at a backend
 * running locally on its default port with the seeded Round 1 slug, which is
 * what `bun run db:seed && bun run db:publish` produces.
 */
interface ImportMetaEnv {
  /** Base URL of the BreachPoint API, e.g. http://localhost:8080 */
  readonly VITE_API_BASE_URL?: string;
  /** Slug of the event this build plays, e.g. breachpoint-2026-r1 */
  readonly VITE_EVENT_SLUG?: string;
}

interface ImportMeta {
  readonly env: ImportMetaEnv;
}
