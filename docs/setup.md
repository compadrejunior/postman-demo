# Setup

## Requirements

- Node.js 22+ (matches the `@types/node` major version pinned in `package.json`)
- Docker and Docker Compose, if running via the containerized workflow below (recommended)
- Otherwise: a MongoDB instance reachable from `MONGODB_URI` (local `mongod` or Atlas), for running the API directly on the host

## Install

```bash
npm install
```

This also runs `husky` (via the `prepare` script) to install the git hooks in `.husky/`.

## Environment variables

Copy `.env.example` to `.env` and fill in real values:

```bash
cp .env.example .env
```

| Variable            | Required | Default       | Notes                                                            |
|---------------------|----------|---------------|-------------------------------------------------------------------|
| `NODE_ENV`          | no       | `development` | `development` \| `test` \| `production`                          |
| `PORT`              | no       | `3000`        | HTTP port                                                        |
| `MONGODB_URI`       | **yes**  | —             | MongoDB connection string, including the database name           |
| `JWT_SECRET`        | **yes**  | —             | Secret used to sign/verify JWTs — use a long random value in production |
| `JWT_EXPIRES_IN`    | no       | `1h`          | Any value accepted by `jsonwebtoken`'s `expiresIn` option         |
| `BCRYPT_SALT_ROUNDS`| no       | `10`          | Cost factor for password hashing                                  |

`src/infrastructure/config/env.ts` validates these with Zod at startup and the process exits immediately if anything required is missing or malformed — this is deliberate fail-fast behavior, not something to work around.

**Note:** `MONGODB_URI` was renamed from the historical `MONGDB_URI` typo. If you have an old `.env` using the typo'd name, rename the key — nothing else changes.

## Run

```bash
npm run dev     # tsx watch mode, restarts on file changes
npm run build   # tsc compile to dist/
npm run start   # run the compiled dist/index.js (run build first)
```

This requires a MongoDB instance reachable at `MONGODB_URI` running separately (see
Requirements above). To run both the API and MongoDB together, use Docker instead.

## Running with Docker

Both the API and MongoDB run as containers in every environment (dev/test/prod), each
with its own isolated named volume for Mongo data. All three use a shared base
`docker-compose.yml` plus an environment-specific override file.

**Dev** — hot reload, bind-mounted source:

```bash
docker compose -f docker-compose.yml -f docker-compose.dev.yml up
```

The API is reachable at `http://localhost:3000` (or `$PORT`); editing files under `src/`
or `tests/` restarts the process automatically.

**Test** — a clean-room, CI-parity run of the full test suite inside a container:

```bash
docker compose -f docker-compose.yml -f docker-compose.test.yml run --rm api
```

This runs `npm run test:coverage` against the exact image contents, with no bind mounts.
Note that the existing test suite uses `mongodb-memory-server` and does not itself
require the containerized `mongo` service — it's present for environment parity and for
anyone who wants to point manual checks at a real MongoDB instance.

**Prod** — the production-shaped deployment:

```bash
docker compose -f docker-compose.yml -f docker-compose.prod.yml up -d
```

Runs the compiled `runtime` image as a non-root user with `restart: unless-stopped`.

In every Docker environment, `MONGODB_URI` is overridden by the base compose file to
point at the `mongo` service (`mongodb://mongo:27017/task-management`) rather than
`localhost` — the value in your `.env` file only takes effect when running the API
directly on the host, outside Compose.

## Test

See [docs/testing.md](./testing.md).

## Promoting a user to admin

There is no HTTP endpoint to become an admin — this is intentional (see [docs/architecture.md](./architecture.md#authorization)). Promote a user directly in MongoDB:

```js
// mongosh
db.users.updateOne({ email: "someone@example.com" }, { $set: { role: "admin" } });
```

The user must log in again (or already hold a token issued after the promotion) since the role is embedded in the JWT payload at login time.
