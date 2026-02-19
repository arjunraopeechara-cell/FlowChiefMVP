# FlowChief MVP

Minimal full-stack prototype for a Personal Ops Manager that sends a daily briefing email.

## Stack
- Backend: Node.js + Express + Prisma
- DB: Postgres
- Frontend: React (Vite)
- Scheduler: node-cron

## Environment variables
Create `.env` in `/backend`:
```
DATABASE_URL=postgresql://user:pass@localhost:5432/flowchief
JWT_SECRET=your_secret
OPENAI_API_KEY=your_openai_key
OPENAI_BASE_URL=https://api.openai.com/v1
OPENAI_MODEL=gpt-4o-mini
GOOGLE_CLIENT_ID=your_google_client_id
GOOGLE_CLIENT_SECRET=your_google_client_secret
GOOGLE_REDIRECT_URI=http://localhost:4000/api/integrations/google/callback
FRONTEND_URL=http://localhost:5173
SMTP_HOST=
SMTP_PORT=587
SMTP_USER=
SMTP_PASS=
SMTP_FROM=
```

## Install and run (dev)
From `/flowchief`:
```
cd backend
npm install
npx prisma migrate dev --name init
npm run dev
```
In another terminal:
```
cd frontend
npm install
npm run dev
```

## Scheduler
The scheduler runs inside the backend process every 5 minutes. No separate process needed.

## Test briefing
Use the dashboard button “Send test briefing now”, or call:
```
POST http://localhost:4000/api/briefing/test
```

## Production notes
- Use a single Postgres database.
- Run backend as a single Node process (Render/Heroku). Scheduler runs in-process.
- Frontend can be deployed separately (Vercel) or built and served via any static host.

## Deployment (Render + Vercel)
### 1) Backend on Render
1. Push this repo to GitHub.
2. In Render, create a new **Blueprint** and select the repo.
3. Render will read `render.yaml` and create:
   - `flowchief-backend` web service
   - `flowchief-db` Postgres
4. Set required env vars in Render service:
   - `JWT_SECRET`
   - `OPENAI_API_KEY`
   - `GOOGLE_CLIENT_ID`
   - `GOOGLE_CLIENT_SECRET`
   - Optional SMTP vars if you’re not using Gmail send:
     - `SMTP_HOST`, `SMTP_PORT`, `SMTP_USER`, `SMTP_PASS`, `SMTP_FROM`

### 2) Frontend on Vercel
1. Import the repo in Vercel.
2. Set build settings:
   - Build command: `cd frontend && npm install && npm run build`
   - Output directory: `frontend/dist`
3. Add env var:
   - `VITE_API_BASE` = `https://YOUR-RENDER-APP.onrender.com`

### 3) Google OAuth setup
Add these Authorized redirect URIs in Google Cloud Console:
- `https://YOUR-RENDER-APP.onrender.com/api/integrations/google/callback`

Also add your Vercel URL as an authorized JavaScript origin:
- `https://YOUR-VERCEL-APP.vercel.app`
