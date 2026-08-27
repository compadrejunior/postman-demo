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

There are three separate env files, one per environment — they are never merged or
layered on top of each other:

| File        | Environment | Copy from            |
|-------------|-------------|------------------------|
| `.env`      | Development | `.env.example`         |
| `.env.test` | Test        | `.env.test.example`    |
| `.env.prod` | Production  | `.env.prod.example`    |

```bash
cp .env.example .env
cp .env.test.example .env.test
cp .env.prod.example .env.prod   # then replace JWT_SECRET with a real generated secret
```

All three share the same variable set:

| Variable            | Required | Default       | Notes                                                            |
|---------------------|----------|---------------|-------------------------------------------------------------------|
| `NODE_ENV`          | no       | `development` | `development` \| `test` \| `production`                          |
| `PORT`              | no       | `3000`        | HTTP port                                                        |
| `MONGODB_URI`       | **yes**  | —             | MongoDB connection string, including the database name           |
| `JWT_SECRET`        | **yes**  | —             | Secret used to sign/verify JWTs — use a long random value in production |
| `JWT_EXPIRES_IN`    | no       | `1h`          | Any value accepted by `jsonwebtoken`'s `expiresIn` option         |
| `BCRYPT_SALT_ROUNDS`| no       | `10`          | Cost factor for password hashing                                  |

`src/infrastructure/config/env.ts` validates these with Zod at startup and the process exits immediately if anything required is missing or malformed — this is deliberate fail-fast behavior, not something to work around.

**Note:** `MONGODB_URI` was renamed from the historical `MONGDB_URI` typo. If you have an old env file using the typo'd name, rename the key — nothing else changes.

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
`docker-compose.yml` plus an environment-specific override file — `docker-compose.dev.yml`
/ `.test.yml` / `.prod.yml` have no `image`/`build` of their own for `mongo` and **will
fail if run without the base file** (`service "mongo" has neither an image nor a build
context specified`). Use the `npm run docker:*` scripts below, which always pass both
files correctly, rather than invoking `docker compose` directly against one override file.

Each environment reads its own env file — `.env` for dev, `.env.test` for test, `.env.prod`
for prod (see Environment variables above) — and the `docker:*` scripts fail loudly if the
matching file doesn't exist yet, so create it first.

**Dev** — hot reload, bind-mounted source:

```bash
npm run docker:dev
# equivalent to: docker compose -f docker-compose.yml -f docker-compose.dev.yml up
```

The API is reachable at `http://localhost:3000` (or `$PORT`); editing files under `src/`
or `tests/` restarts the process automatically. Stop it with `npm run docker:dev:down`.

**Test** — a clean-room, CI-parity run of the full test suite inside a container:

```bash
npm run docker:test
# equivalent to: docker compose -f docker-compose.yml -f docker-compose.test.yml run --rm api
```

This runs `npm run test:coverage` against the exact image contents, with no bind mounts.
Note that the existing test suite uses `mongodb-memory-server` and does not itself
require the containerized `mongo` service — it's present for environment parity and for
anyone who wants to point manual checks at a real MongoDB instance.

**Prod** — the production-shaped deployment:

```bash
npm run docker:prod
# equivalent to: docker compose -f docker-compose.yml -f docker-compose.prod.yml up -d
```

Runs the compiled `runtime` image as a non-root user with `restart: unless-stopped`.
Stop it with `npm run docker:prod:down`.

In every Docker environment, `MONGODB_URI` is overridden by the base compose file to
point at the `mongo` service (`mongodb://mongo:27017/task-management`) rather than
`localhost` — the value in your `.env`/`.env.test`/`.env.prod` file only takes effect
when running the API directly on the host, outside Compose.

## Seeding data for manual Postman testing

`npm run seed:dev` / `seed:test` / `seed:prod` wipe the `users`/`tasks` collections in the target database and insert a fixed dataset: three users (`ada@example.com` / `password123`, `grace@example.com` / `password123`, and an admin `admin@example.com` / `adminpass123`) and six tasks across a range of statuses, priorities, and due dates — including tasks owned by Grace so Ada's token can be used to exercise the `403` ownership-check paths on Get/Update/Delete Task. `ada@example.com` / `password123` matches the sample body already committed in the Login/Register requests in `postman/collections/task-management-api/`, so the collection works against seeded data with no edits.

Run these against an API reachable directly on the host (`MONGODB_URI` resolves to `localhost`, as in `.env`/`.env.test`/`.env.prod`). When the API and MongoDB run in Docker instead, `MONGODB_URI` is overridden to point at the `mongo` service (see above) — from the host, seed those containers by copying `scripts/seed.ts` (or, for the slim `runtime`/prod image, `scripts/seed.prod.mjs` plus `scripts/seed-data.mjs`) into the running api container and running it there, e.g.:

```bash
docker cp scripts/seed.ts postman-demo-dev-api-1:/app/scripts/seed.ts
docker cp scripts/seed-data.mjs postman-demo-dev-api-1:/app/scripts/seed-data.mjs
docker exec postman-demo-dev-api-1 npx tsx scripts/seed.ts
```

## Test

See [docs/testing.md](./testing.md).

## Promoting a user to admin

There is no HTTP endpoint to become an admin — this is intentional (see [docs/architecture.md](./architecture.md#authorization)). Promote a user directly in MongoDB:

```js
// mongosh
db.users.updateOne({ email: "someone@example.com" }, { $set: { role: "admin" } });
```

The user must log in again (or already hold a token issued after the promotion) since the role is embedded in the JWT payload at login time.
