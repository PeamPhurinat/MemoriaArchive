# Memoria Memory Hall Archive

This is a focused Three.js prototype for the 3D memory hall archive.

## Run

1. Install dependencies with `npm install`
2. (Optional) Enable Supabase cloud save:
   - Create a Supabase project
   - Run `supabase/schema.sql` in SQL Editor
   - Copy `.env.example` to `.env` and add your project URL + anon key
   - Current SQL is a demo policy set (open anon read/write). Switch to secure auth-based policies before production.
3. Start the local dev server with `npm run dev`
4. Open the local Vite URL shown in the terminal

## Included

- Walkable first-person memory hall
- Archive bays with glowing memory capsules and framed story cards
- Atmospheric lighting, particles, and animated hall elements
- View mode and custom mode switch
- Custom mode tools to move, resize, delete memory stations
- Per-user layout save/load/reset using Supabase (with local storage backup/fallback)
- Optional WebXR button for browser VR testing
