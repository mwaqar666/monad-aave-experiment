FROM node:22-alpine

WORKDIR /app

# Install pnpm globally
RUN wget -qO- https://get.pnpm.io/install.sh | env ENV="$HOME/.bashrc" SHELL="$(which bash)" bash -

# Copy root workspace config
COPY pnpm-workspace.yaml package.json pnpm-lock.yaml ./

# Copy shared packages manifests (for workspace resolution)
COPY packages/abis/package.json packages/abis/package.json
COPY packages/core/package.json packages/core/package.json

# Copy this service's manifest
COPY watcher/package.json watcher/

# Install dependencies from the root
RUN pnpm install --frozen-lockfile --filter watcher || pnpm install --filter watcher

# Copy shared packages source (watcher depends on abis + core)
COPY packages/abis/ packages/abis/
COPY packages/core/ packages/core/

# Build shared packages
RUN pnpm --filter @packages/abis run build
RUN pnpm --filter @packages/core run build

# Copy this service's source
COPY watcher/ watcher/

# Build the service
RUN pnpm --filter watcher run build

# Start from the watcher directory
WORKDIR /app/watcher
CMD ["pnpm", "start"]