FROM node:22-alpine

WORKDIR /app

# Install pnpm globally
RUN npm install -g pnpm

# Copy root workspace config
COPY pnpm-workspace.yaml package.json pnpm-lock.yaml ./

# Copy this service's manifest (simulator has no @packages dependency)
COPY simulator/package.json simulator/

# Install dependencies
RUN pnpm install --frozen-lockfile --filter simulator || pnpm install --filter simulator

# Copy this service's source
COPY simulator/ simulator/

# Build the service
RUN pnpm --filter simulator run build

# Start from the simulator directory
WORKDIR /app/simulator
CMD ["pnpm", "start"]