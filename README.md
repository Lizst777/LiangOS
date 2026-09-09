# LiangOS

LiangOS is a React and Vite homepage with time, date, live weather, and a daily
literary quote. Saved Moments remain private Supabase data protected by
authentication and row-level security.

Notes has been removed, including its navigation, editor, timeline, and export UI.
Old `#notes` bookmarks open Home. Historical database tables, data, accounts, and
migrations are retained; removing the frontend does not delete cloud data.
The existing Moment session and archive code remains, but the retired Notes
password form is no longer available as a sign-in entry point.

## Local development

Requirements: Node.js 22+ and npm.

```powershell
npm.cmd install
npm.cmd run dev
```

Create `.env.local` from `.env.example` and provide the project-specific values.
Vite exposes every `VITE_` variable to the browser, so only use a Supabase
publishable key here. Never use a secret or `service_role` key in the frontend.

## Verification

```powershell
npm.cmd run format:check
npm.cmd run lint
npm.cmd test
npm.cmd run build
npm.cmd audit
```

The production build is written to `dist/`. Netlify uses the build and publish
settings in `netlify.toml`.

Production JavaScript and CSS intentionally retain indentation and line breaks
(`build.minify: false` and `build.cssMinify: false`). Open the asset URLs linked
from the current homepage to inspect readable output; old hashed asset URLs still
refer to earlier builds. Bundling and lazy loading remain enabled.
JSON imports expand into readable objects. Vite emits formatted bundles and
calculates their content hashes as part of the same build.

## Source structure

- `src/pages`: page-level composition only.
- `src/features`: domain UI, lifecycle hooks, and data repositories grouped by
  capability.
- `src/components/layout`: page shell, appearance controls, and private dialog.
- `src/ui`: small reusable presentation components and icons.
- `src/hooks`: application-wide hooks such as session, theme, and focus.
- `src/styles`: styles split by responsibility while preserving one explicit
  import order in `src/styles/index.css`.
- `src/data`: generated quote corpus and its deterministic daily selector.

Run `npm.cmd run format` after changing JavaScript, JSX, CSS, JSON, Markdown, or
HTML. Generated quote data and immutable database migrations are intentionally
excluded from automatic formatting.

## Data model

- `moments`: public read-only seed phrases.
- `moment_traces`: Moments saved by the authenticated owner.
- `daily_notes`, `daily_note_versions`, `notes`, and `note_versions`: historical
  Notes tables retained for data recovery, no longer queried by the frontend.

Database changes are versioned in `supabase/migrations`. Apply pending files
through the Supabase migration workflow before deploying frontend code that
depends on them. New public-schema tables must receive explicit grants and have
RLS enabled; LiangOS migrations do both.

## Privacy

Private queries always include the authenticated `user_id` in addition to RLS.
The frontend does not store Moment content in `localStorage`.
