# Phase 1 – Admin panel (Next.js; code written, NOT yet built or run)
cd admin && cp .env.example .env.local && npm i && npm run dev   → http://localhost:3001 (backend on :3000)
Admin: classrooms, children, parents, teachers, assignments, results. Teacher: classrooms, children, assignments (own classrooms), results.
Token is kept in localStorage (acceptable for Phase 1; move to httpOnly cookie before public deployment).
Backend change in this step: added GET /assignments (admin = all, teacher = own classrooms) + e2e assertion.
