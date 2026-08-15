# Swastha Data Collection Portal
 
A centralized, role-based data collection and form management portal built for **Swastha Hospital** (Helse Medical Sciences Pvt Ltd). It replaces fragmented workflows (Google Forms, WhatsApp) with a single system built around a dynamic form engine, where Admins can add, edit, and reorder form fields without any code changes.
 
> **Proprietary software.** This repository is private and intended solely for internal use by Swastha Hospital / Helse Medical Sciences Pvt Ltd. It is not licensed for external use, redistribution, or modification outside the organization.
 
---
 
## Overview
 
The portal supports three roles:
 
- **Admin** — manages form fields (create, edit, reorder, deactivate), manages user accounts, views analytics, and audits/exports all submissions.
- **Marketing Associate** — fills out and manages their own Marketing form submissions.
- **Community Outreach Associate** — fills out and manages their own Community form submissions.
### Core architectural decision: schema snapshotting
 
Every submission freezes a JSON copy of the active field definitions at the moment it's submitted (`schemaSnapshot`). This means an Admin can later edit or restructure a form's fields, and every historical submission remains fully intact and correctly rendered — because it always displays according to the schema that was active when it was submitted, not the current one.
 
---
 
## Tech Stack
 
**Frontend**
- React + Vite
- Tailwind CSS v4
- React Router
- Recharts (analytics charts)
- @dnd-kit (drag-and-drop field reordering)
- lucide-react (icons)
- jsPDF / xlsx / file-saver (data export)
**Backend**
- Node.js + Express
- Prisma ORM (v5) + MySQL
- JWT-based authentication
- Multer (secure file uploads)
- bcryptjs (password hashing)
- Helmet, CORS, express-rate-limit (security middleware)
**Fonts:** Self-hosted Noto Sans (variable), avoiding external CDN dependencies for production deployment.
 
---
 
## Project Structure
 
```
swastha-data-portal/
├── client/                 # React + Vite frontend
│   ├── public/fonts/        # Self-hosted font files
│   └── src/
│       ├── components/
│       │   ├── admin/       # Admin-only components
│       │   ├── associate/   # Associate-only components
│       │   └── layout/      # Shared layout (sidebar, footer)
│       ├── context/          # AuthContext (JWT session, authFetch wrapper)
│       └── pages/            # Route-level pages
├── server/                 # Express + Prisma backend
│   ├── controllers/          # Route handler logic
│   ├── middleware/            # Auth middleware (JWT verification, role guards)
│   ├── prisma/
│   │   ├── schema.prisma      # Database schema
│   │   ├── migrations/        # Prisma migration history
│   │   └── seed.js            # Initial Admin account seeder
│   ├── routes/                # Express route definitions
│   ├── uploads/                # Uploaded submission files (not version-controlled)
│   └── server.js               # App entry point; also serves the built frontend in production
└── package.json             # npm workspaces root (client + server)
```
 
---
 
## Prerequisites
 
- Node.js (v18, v20, v22, or v24)
- MySQL (local instance or hosted)
- npm
---
 
## Local Setup
 
1. **Clone the repository**
```bash
   git clone <repository-url>
   cd swastha-data-portal
```
 
2. **Install dependencies** (installs both `client` and `server` workspaces)
```bash
   npm install
```
 
3. **Configure environment variables**
   Copy the example file and fill in real values:
```bash
   cp server/.env.example server/.env
```
   See [`server/.env.example`](./server/.env.example) for the full list of required variables and what each one does.
 
4. **Set up the database**
```bash
   cd server
   npx prisma migrate dev
```
   This applies all migrations and generates the Prisma Client.
 
5. **Seed an initial Admin account**
```bash
   node prisma/seed.js
```
   This creates a default Admin account (`ADM-001`). **Change its password immediately** after your first login — see `server/prisma/seed.js` for the seeded default.
 
6. **Run the app in development mode** (from the repo root)
```bash
   npm run dev
```
   This starts the Express API (with nodemon) and the Vite dev server concurrently. The Vite dev server proxies `/api` requests to the backend automatically (see `client/vite.config.js`).
 
---
 
## Available Scripts
 
Run from the **repo root** unless noted otherwise.
 
| Command | Description |
|---|---|
| `npm run dev` | Runs backend (nodemon) and frontend (Vite) concurrently for local development |
| `npm run build` | Builds the frontend, then runs Prisma's `generate` + `migrate deploy`. Used for production builds. |
| `npm start` | Starts the production server (serves the built frontend + API from one Express app) |
| `npm run install:all` | Installs dependencies across all workspaces |
 
Server-specific (`server/package.json`):
 
| Command | Description |
|---|---|
| `npm run dev` | Starts the Express server with nodemon (auto-restart on changes) |
| `npm run build` | Runs `prisma generate` and `prisma migrate deploy` |
| `npm start` | Starts the server with plain `node` (no auto-restart) |
 
---
 
## Production Build & Deployment Notes
 
- Running `npm run build` from the repo root builds the React frontend (`client/dist`) **and** applies any pending Prisma migrations to the configured `DATABASE_URL`.
- In production, `server.js` serves the built frontend as static files and handles client-side routing via a catch-all route to `index.html` — frontend and backend run as a single deployable unit on one origin, so no separate frontend hosting or CORS configuration is required between them.
- `SHADOW_DATABASE_URL` is only used by Prisma's development migration engine (`prisma migrate dev`) and is **not required** in production.
- This project is deployed on Hostinger's managed Node.js application hosting.
---
 
## Security Notes
 
- All passwords are hashed with bcrypt (12 salt rounds) before storage.
- JWT-based authentication with configurable expiry (`JWT_EXPIRES_IN`).
- Disabled user accounts are rejected on every authenticated request, even with a still-valid token.
- File uploads are validated server-side (type and size), and stored with server-generated filenames — never the client's original filename or extension.
- Rate limiting is applied globally and more strictly on the login endpoint.
- `server/uploads/` is excluded from version control; uploaded files are runtime data, not source code.
If you believe you've found a security issue in this codebase, report it directly to the project maintainer rather than filing a public issue, given this is a proprietary, internally-used system handling hospital data.
 
---
 
## License
 
Proprietary — All Rights Reserved. This codebase is the property of Helse Medical Sciences Pvt Ltd / Swastha Hospital and is not licensed for use, copying, or distribution outside the organization.