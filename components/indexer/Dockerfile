# use the official Bun image
# see all versions at https://hub.docker.com/r/oven/bun/tags
FROM oven/bun:1 AS base
WORKDIR /usr/src/app

# Install pnpm globally
RUN wget -qO- https://get.pnpm.io/install.sh | env ENV="$HOME/.bashrc" SHELL="$(which bash)" bash -

# Copy root workspace config + pnpm lock
COPY pnpm-workspace.yaml package.json pnpm-lock.yaml ./

# Copy @packages/core manifest (indexer's only shared-package dependency)
COPY packages/core/package.json packages/core/package.json

# Copy this service's manifest
COPY indexer/package.json indexer/

# Install dependencies from the root
RUN pnpm install --frozen-lockfile --filter indexer || pnpm install --filter indexer

# Copy @packages/core source and build it
COPY packages/core/ packages/core/
RUN pnpm --filter @packages/core run build

# Copy this service's source
COPY indexer/ indexer/

# Start from the indexer directory
WORKDIR /app/indexer
CMD ["pnpm", "run", "start"]