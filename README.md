# Plainly — boundaries & interest

Static site, served by GitHub Pages at https://browc814-spec.github.io/plainly-boundaries/

- Supabase public config (project URL + publishable key, public by design) lives in `config.json`
  (replaces the old Netlify function `/.netlify/functions/config`).
- Google sign-in uses the PKCE flow and redirects back to `<current site>/#profile`.
