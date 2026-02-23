# Backend (Node.js + Express)

Contact pipeline service for portfolio leads.

## Endpoints

- `POST /api/v1/auth/register`
- `POST /api/v1/auth/login`
- `GET /api/v1/auth/me`
- `GET /api/v1/content`
- `GET /api/v1/admin/content`
- `PUT /api/v1/admin/content/:key`
- `POST /api/v1/contact`
- `POST /api/internal/contact-outbox/run`
- `GET /health`
- `GET /metrics`

## Environment

Copy `.env.example` to `.env`.

## Commands

- `npm run dev`
- `npm run db:generate`
- `npm run db:migrate`
- `npm run seed:admin`
- `npm run worker:run`
- `npm test`
