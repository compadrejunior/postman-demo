# syntax=docker/dockerfile:1

# Debian-based (not Alpine): the test suite's mongodb-memory-server can only download
# a matching MongoDB binary for glibc distros — MongoDB does not publish Alpine/musl
# builds, so the test/dev targets (which reuse the `build` stage) would fail on Alpine.

# ---- deps: install full dependency set once, reused by the build stage ----
FROM node:22-slim AS deps
WORKDIR /app
# mongodb-memory-server's postinstall pre-downloads its MongoDB binary here so the test
# run doesn't hit a cold-cache download race across parallel test files. Debian doesn't
# publish arm64 binaries for every point release; Ubuntu's cover both amd64 and arm64.
# MONGOMS_DOWNLOAD_DIR pins the cache to one explicit path, since the default location
# differs between the postinstall's own download and a test's runtime download.
ENV MONGOMS_DISTRO=ubuntu-22.04
ENV MONGOMS_DOWNLOAD_DIR=/opt/mongodb-binaries
COPY package.json package-lock.json ./
RUN npm ci

# ---- build: compile TypeScript; also doubles as the dev/test runtime target ----
FROM node:22-slim AS build
WORKDIR /app
ENV MONGOMS_DOWNLOAD_DIR=/opt/mongodb-binaries
# libcurl4: the mongod binary mongodb-memory-server runs in tests is linked against it,
# and node:22-slim doesn't include it by default.
RUN apt-get update && apt-get install -y --no-install-recommends libcurl4 \
    && rm -rf /var/lib/apt/lists/*
COPY --from=deps /app/node_modules ./node_modules
# Carry the pre-downloaded MongoDB binary forward so a test run in this stage starts
# warm instead of racing a cold-cache download across parallel test files.
COPY --from=deps /opt/mongodb-binaries /opt/mongodb-binaries
COPY . .
RUN npm run build

# ---- prod-deps: production-only dependencies for the slim runtime image ----
FROM node:22-slim AS prod-deps
WORKDIR /app
COPY package.json package-lock.json ./
RUN npm ci --omit=dev --ignore-scripts

# ---- runtime: minimal final image used in production ----
FROM node:22-slim AS runtime
ENV NODE_ENV=production
WORKDIR /app
RUN groupadd -r nodeuser && useradd -r -g nodeuser nodeuser
COPY --from=prod-deps /app/node_modules ./node_modules
COPY --from=build /app/dist ./dist
COPY package.json ./
USER nodeuser
EXPOSE 3000
CMD ["node", "dist/index.js"]
