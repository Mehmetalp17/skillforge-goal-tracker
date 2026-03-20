# SkillForge Goal Tracker — Claude Code Configuration

## Project Overview

Full-stack MERN app (MongoDB + Express + React 19 + Node 22 + Vite + TypeScript).
Frontend is deployed to Vercel. Backend is deployed to Render.com.

```
Root/              ← React/TypeScript frontend (Vite)
Root/api/          ← Node.js/Express backend (ES Modules)
Root/components/   ← React components
Root/pages/        ← Page-level React components
Root/context/      ← React Context (auth state)
Root/services/     ← API client functions
Root/api/models/   ← Mongoose schemas
Root/api/controllers/ ← Express route handlers
Root/api/middleware/  ← Auth, rate-limit, error middleware
Root/api/routes/   ← Express route definitions
```

## Worktree Bootstrap (Run This On Every New Agent Launch)

When you start in a worktree directory, run the appropriate install commands before doing anything else.

### If you are in the ROOT directory (frontend):
```bash
npm install
```

### If you are in the ROOT/api/ directory (backend):
```bash
cd api && npm install
```

### If you are in a WORKTREE (../skillforge-auth, ../skillforge-backend, ../skillforge-frontend, ../skillforge-infra):
```bash
# Install both frontend and backend deps from the worktree root
npm install && cd api && npm install && cd ..
```

## Parallel Agent Workflow (5-Tab Setup)

This project uses a manager-led parallel workflow. Each agent has a strict scope.

| Tab | Agent | Branch | Scope |
|-----|-------|--------|-------|
| 1 | Manager | `main` | Orchestrate, review diffs, merge worktrees |
| 2 | Backend Perf | `feat/backend-perf` | N+1 fixes, Mongoose indexes, `.lean()` |
| 3 | Frontend Perf | `feat/frontend-perf` | `React.memo`, `useMemo`, re-render fixes |
| 4 | Auth & Roles | `feat/auth-roles` | Role field, `authorize()` middleware, strict logout |
| 5 | Infra | `feat/infra` | Tests, CI/CD, `.env.example`, env var cleanup |

**Each worker agent must stay strictly within its scope. Do not touch files outside your assigned area.**

## Merge Order (Manager Must Follow This)

```
feat/auth-roles       → main  (first — others depend on User.role)
feat/backend-perf     → main  (second — no frontend deps)
feat/frontend-perf    → main  (third — depends on stable backend contracts)
feat/infra            → main  (last — tests verify the merged result)
```

## Known Issues To Fix (Do Not Work Around — Fix Root Causes)

### Backend (feat/backend-perf scope)
- `forceDeleteGoal` in `api/controllers/goalController.js`: recursive N+1 delete. Replace with BFS/DFS that collects all descendant IDs first, then runs a single `deleteMany({ _id: { $in: ids } })`.
- `batchDeleteGoals` in `api/controllers/goalController.js`: N+1 loop (findById + countDocuments per item). Replace with `bulkWrite`.
- Missing Mongoose indexes on `LearningGoal.owner` and `LearningGoal.parentGoal`.
- `User.findById` on every request in `authMiddleware.js`. For non-sensitive routes, use JWT payload claims directly.
- No `.lean()` on read-only Mongoose queries. Add it everywhere a plain JS object suffices.

### Frontend (feat/frontend-perf scope)
- `GoalItem`, `GoalHierarchy`, and list children have no `React.memo`. Wrap them.
- `DashboardPage`: `filteredGoals` is derived state being stored in `useState` and recomputed in two separate `useEffect`s. Replace with `useMemo`.
- Stabilize callback props in `GoalList` with `useCallback` to prevent child re-renders.

### Auth (feat/auth-roles scope)
- No `role` field exists on User model. Add `role: { type: String, enum: ['learner', 'manager'], default: 'learner' }`.
- No `authorize()` middleware exists. Create it in `api/middleware/authMiddleware.js`.
- `AuthContext` allows in-place state mutations that could let role switching without logout. Enforce: role is set once at login from JWT response and cleared entirely on logout.
- `ProtectedRoute` does not check role. Add `requiredRole` prop.

### Infra (feat/infra scope)
- `config.ts` hardcodes `https://skillforge-api-7x61.onrender.com/api`. Replace with `import.meta.env.VITE_API_URL`.
- No `.env.example` exists. Create one documenting all required vars for both services.
- No tests. Add Vitest to backend, cover delete endpoints at minimum.
- No CI. Add `.github/workflows/ci.yml` running install + test on push.

## Environment Variables

### Frontend (root `.env`)
```
VITE_API_URL=http://localhost:5000/api
VITE_GEMINI_API_KEY=your_key_here
```

### Backend (`api/.env`)
```
NODE_ENV=development
PORT=5000
MONGO_URI=mongodb://...
JWT_SECRET=your_secret
JWT_EXPIRE=30d
SENDGRID_API_KEY=your_key
FROM_EMAIL=noreply@yourdomain.com
FROM_NAME=SkillForge
```

## Running Locally

```bash
# Terminal A — backend
cd api && npm run dev

# Terminal B — frontend
npm run dev
```

Frontend runs at `http://localhost:5173`. Backend runs at `http://localhost:5000`.

## Code Style Rules

- Backend uses ES Modules (`type: "module"` in package.json). Always use `import/export`, never `require()`.
- Frontend is strict TypeScript. All new props must be typed. No `any`.
- Tailwind only for styling — no inline `style` props unless absolutely necessary.
- Use `asyncHandler` wrapper for all Express route handlers — never catch errors manually in controllers.
- Custom errors go through `ErrorResponse` class and global `errorHandler` middleware.
- Never store sensitive data in frontend localStorage beyond the JWT token.

## Constraints

- Do NOT change the Vercel or Render deployment config unless explicitly asked.
- Do NOT add new npm packages without confirming with the user — the dep tree is intentionally minimal.
- Do NOT merge worktrees out of order (see Merge Order above).
- Do NOT create files unless strictly necessary. Edit existing files.
- Do NOT add comments explaining what code does — only add comments where the logic is genuinely non-obvious.
