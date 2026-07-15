# LiangOS

LiangOS is a quiet personal standby space built with React and Vite. The public
home keeps time, date, weather, and a short Moment in view. Notes and saved
Moments are private Supabase data protected by authentication and row-level
security.

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
npm.cmd run lint
npm.cmd run build
```

The production build is written to `dist/`. Netlify uses the build and publish
settings in `netlify.toml`.

## Data model

- `moments`: public read-only seed phrases.
- `moment_traces`: Moments saved by the authenticated owner.
- `daily_notes`: one private note per owner and local calendar date.
- `daily_note_versions`: automatic private snapshots before content updates.
- `notes` and `note_versions`: legacy data retained during the daily-note
  transition.

Database changes are versioned in `supabase/migrations`. Apply pending files
through the Supabase migration workflow before deploying frontend code that
depends on them. New public-schema tables must receive explicit grants and have
RLS enabled; LiangOS migrations do both.

## Privacy

Private queries always include the authenticated `user_id` in addition to RLS.
The frontend does not store Notes or Moments in `localStorage`. Export creates a
local JSON file containing the private chronological timeline.
