FROM node:22-alpine

WORKDIR /app

# Install pnpm globally
RUN npm install -g pnpm

# Copy root workspace config
COPY pnpm-workspace.yaml package.json pnpm-lock.yaml ./

# Copy shared packages manifests (for workspace resolution)
COPY packages/abis/package.json packages/abis/package.json
COPY packages/core/package.json packages/core/package.json
COPY packages/db/package.json packages/db/package.json

# Copy this service's manifest
COPY seeder/package.json seeder/

# Install dependencies from the root
RUN pnpm install --frozen-lockfile --filter seeder || pnpm install --filter seeder

# Copy all shared packages source (seeder depends on abis + core + db)
COPY packages/ packages/

# Build shared packages (ordered: abis has no deps, core depends on nothing in monorepo, db depends on nothing)
RUN pnpm --filter @packages/abis run build
RUN pnpm --filter @packages/core run build
RUN pnpm --filter @packages/db run build

# Copy this service's source
COPY seeder/ seeder/

# Build the service
RUN pnpm --filter seeder run build

# Start from the seeder directory
WORKDIR /app/seeder
CMD ["pnpm", "start"]