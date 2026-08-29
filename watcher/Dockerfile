FROM node:22-alpine AS builder

WORKDIR /app

# Install pnpm globally
RUN npm install -g pnpm

# Copy package manifests
COPY package.json pnpm-lock.yaml pnpm-workspace.yaml ./

# Install dependencies with pnpm
# --frozen-lockfile ensures reproducible builds if lockfile exists
RUN pnpm install --frozen-lockfile || pnpm install

# Copy source
COPY . .

# Build the TypeScript code
RUN pnpm run build

# Start
CMD ["pnpm", "start"]