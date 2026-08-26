# Setup

## Requirements

- Node.js 22+ (matches the `@types/node` major version pinned in `package.json`)
- A MongoDB instance reachable from `MONGODB_URI` (local `mongod`, Docker, or Atlas)

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

## Test

See [docs/testing.md](./testing.md).

## Promoting a user to admin

There is no HTTP endpoint to become an admin — this is intentional (see [docs/architecture.md](./architecture.md#authorization)). Promote a user directly in MongoDB:

```js
// mongosh
db.users.updateOne({ email: "someone@example.com" }, { $set: { role: "admin" } });
```

The user must log in again (or already hold a token issued after the promotion) since the role is embedded in the JWT payload at login time.
