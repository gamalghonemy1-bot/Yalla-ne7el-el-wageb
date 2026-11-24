# Phase 1 – Backend (code written; NOT yet executed or tested)
Run:  docker compose up -d db → cp .env.example backend/.env (fill secrets) → cd backend → npm i
      → npx prisma migrate dev --name init → npm run seed → npm run start:dev
Test: create DB `yalla_test`, set TEST_DATABASE_URL, run `npm run test:e2e` (the scenario WIPES that DB).
Login = email + password. 10 points per correct answer. Duplicate answers blocked by unique (childAssignmentId, questionId).
Remaining in Phase 1: admin/ (Next.js), mobile/ (Flutter).
