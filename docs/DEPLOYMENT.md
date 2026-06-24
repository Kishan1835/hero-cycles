# Deploy online (Neon + Render + Vercel)

This guide deploys the Hero Cycles Pricing Engine as:

| Layer | Platform |
|---|---|
| Database | [Neon](https://neon.tech) (PostgreSQL) |
| Backend API | [Render](https://render.com) |
| Frontend UI | [Vercel](https://vercel.com) |

Deploy in this order: **Neon → Render → Vercel** (Vercel needs the Render URL; Render needs the Neon URL and later the Vercel URL for CORS).

---

## 0. Push code to GitHub

Render and Vercel deploy from Git. Push this repo to GitHub if you have not already.

---

## 1. Neon — PostgreSQL

1. Sign up at [neon.tech](https://neon.tech) and create a project.
2. Open **Dashboard → Connection details** and copy the **pooled** connection string.
3. Ensure the URL ends with `?sslmode=require` (Neon usually includes this).

Example:

```text
postgresql://user:password@ep-xxx.ap-southeast-1.aws.neon.tech/neondb?sslmode=require
```

Keep this for Render’s `DATABASE_URL`.

---

## 2. Render — Backend API

### Option A: Blueprint (recommended)

1. Go to [render.com](https://render.com) → **New → Blueprint**.
2. Connect your GitHub repo.
3. Render reads `render.yaml` at the repo root.
4. When prompted, set:
   - **`DATABASE_URL`** — your Neon connection string
   - **`CORS_ORIGIN`** — leave blank for now; you will update it after Vercel deploys
5. Click **Apply** and wait for the first deploy to finish.
6. Copy your service URL, e.g. `https://hero-cycles-api.onrender.com`.

### Option B: Manual web service

1. **New → Web Service** → connect the repo.
2. Settings:
   - **Root directory:** `backend`
   - **Build command:** `npm install && npm run build`
   - **Start command:** `npx prisma migrate deploy && npm run prisma:seed && npm start`
   - **Health check path:** `/health`
3. Environment variables:

| Key | Value |
|---|---|
| `NODE_ENV` | `production` |
| `PORT` | `4000` |
| `JWT_SECRET` | long random string (16+ chars) |
| `JWT_EXPIRES_IN` | `8h` |
| `DATABASE_URL` | Neon connection string |
| `CORS_ORIGIN` | your Vercel URL (update after step 3) |

### Verify the API

- Health: `https://YOUR-RENDER-URL.onrender.com/health`
- Swagger: `https://YOUR-RENDER-URL.onrender.com/api/docs`

> **Free tier note:** Render may spin down after ~15 minutes of inactivity. The first request after sleep can take 30–60 seconds.

---

## 3. Vercel — Frontend

1. Go to [vercel.com](https://vercel.com) → **Add New → Project**.
2. Import the same GitHub repo.
3. Settings:
   - **Root directory:** `frontend`
   - **Framework preset:** Vite (auto-detected)
   - **Build command:** `npm run build`
   - **Output directory:** `dist`
4. Add environment variable:

| Key | Value |
|---|---|
| `VITE_API_BASE_URL` | `https://YOUR-RENDER-URL.onrender.com/api` |

Replace `YOUR-RENDER-URL` with your actual Render hostname. Include the `/api` suffix.

5. Deploy and copy your Vercel URL, e.g. `https://hero-cycles-pricing.vercel.app`.

---

## 4. Finish CORS on Render

Go back to Render → your web service → **Environment**:

- Set **`CORS_ORIGIN`** to your Vercel URL exactly (no trailing slash), e.g. `https://hero-cycles-pricing.vercel.app`
- Save — Render will redeploy automatically.

---

## 5. Log in

Open your Vercel URL and sign in with a seeded demo account (password for all: `Password123!`):

| Role | Email |
|---|---|
| Admin | `admin@herocycles.com` |
| Pricing Manager | `manager@herocycles.com` |
| Salesperson | `sales@herocycles.com` |

---

## Troubleshooting

| Symptom | Fix |
|---|---|
| Login fails / network error | Check `VITE_API_BASE_URL` on Vercel includes `/api` and matches Render URL |
| CORS error in browser console | Set `CORS_ORIGIN` on Render to your exact Vercel URL |
| API 503 / very slow first load | Render free tier waking from sleep — wait and retry |
| Database connection failed | Confirm Neon `DATABASE_URL` uses `sslmode=require` |
| Empty app / no data | Re-run seed on Render shell: `npm run prisma:seed` |

---

## Redeploying after code changes

- **Backend:** push to GitHub — Render auto-redeploys.
- **Frontend:** push to GitHub — Vercel auto-redeploys.
- If you change the Render URL, update `VITE_API_BASE_URL` on Vercel and redeploy.
