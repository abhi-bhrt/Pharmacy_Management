# Pharmacy Management API

Standalone Node.js REST API built with Express, TypeScript, Prisma, and PostgreSQL. It contains the pharmacy management services, controllers, routes, authentication utilities, and Prisma schema, independent of the Next.js application.

## Requirements

- Node.js 20 or newer
- npm
- PostgreSQL

## Setup

Run commands from this `server/` directory:

```bash
npm install
```

Create a `.env` or `.env.local` file in this directory. The server loads `.env.local` first, then `.env`.

| Variable | Required | Purpose |
| --- | --- | --- |
| `DATABASE_URL` | Yes | PostgreSQL connection string used by Prisma |
| `JWT_SECRET` | Yes | Secret used to sign and verify session JWTs |
| `PORT` | No | HTTP port; defaults to `4000` |
| `CLIENT_ORIGINS` | No | Comma-separated browser origins allowed by CORS; defaults to `http://localhost:3000` |
| `NODE_ENV` | No | Runtime mode; defaults to `development` |

Keep actual credentials in your local environment file or deployment secret store. Do not commit them.

Generate Prisma Client and synchronize the schema:

```bash
npm run db:generate
npm run db:push
```

Start the API:

```bash
npm run dev
# or
npm start
```

The default health check is `GET http://localhost:4000/api/health`.

## Architecture

```text
server.ts                 Environment loading, server startup, graceful shutdown
app.ts                    Express middleware, health endpoint, API and error handling
routes/                   Express routers and HTTP method/path registration
controllers/              Request validation, orchestration, response formatting
services/                 Business rules and Prisma-backed data operations
lib/
  api/                    AppError and standardized success/error responses
  auth/                   JWT, cookie, password, and authentication middleware
  db/                     Prisma client, transactions, and database mappers
config/                   Environment variables and application constants
types/                    Shared API and domain TypeScript contracts
prisma/schema.prisma      PostgreSQL data model
```

Requests flow from Express middleware to a route, then a controller, then a service. Services own business and database operations; controllers handle HTTP-specific concerns. The global error handler maps application and PostgreSQL errors to a consistent JSON response.

## API areas

- `/api/auth`: sign up, sign in, and sign out
- `/api/medicines`, `/api/shops`, `/api/invoices`: public catalogue/search and invoice lookup
- `/api/users/profile`: authenticated user profile
- `/api/protected/medicines`, `/api/protected/shops`, `/api/protected/invoices`, `/api/protected/users`: authenticated shop management, inventory, billing, and user lookup
- `/api/health`: liveness check

Successful and failed API responses use the `{ "success": true, "data": ... }` and `{ "success": false, "error": ... }` envelope. Protected endpoints accept the HTTP-only `auth_token` cookie or an `Authorization: Bearer <token>` header.

## Development checks

```bash
npm run typecheck
```

The Next.js frontend is a separate project. When running it independently, configure its API base URL or a proxy to point to this server.
