# Auth + DB Setup

1. Run the SQL in `supabase/schema.sql` inside your Supabase SQL editor.
   - It creates both `projects` and `user_layouts` tables with RLS.

2. Add these values to `.env` (server):
```bash
SUPABASE_URL=https://<project-ref>.supabase.co
SUPABASE_SERVICE_ROLE_KEY=<service-role-key>
```

3. Add these values to `.env` for React (or `.env.development`):
```bash
REACT_APP_SUPABASE_URL=https://<project-ref>.supabase.co
REACT_APP_SUPABASE_ANON_KEY=<anon-key>
REACT_APP_MEDIA_ORIGIN=http://localhost:5050
```

4. Start both apps:
```bash
npm run server
npm start
```

5. Open `/auth`, create account or sign in, then use the app normally.
   - 3D custom mode now saves per `user + project`, including component layout and theme.

Optional local bypass (server only):
```bash
AUTH_BYPASS_USER_ID=<uuid>
```
Use this only for local debugging if Supabase auth token validation is unavailable.
