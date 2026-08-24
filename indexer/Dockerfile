FROM node:22-alpine

WORKDIR /app

# Install pnpm globally
RUN npm install -g pnpm

# Copy package manifests
COPY package.json pnpm-workspace.yaml ./

# Install dependencies with pnpm
# --frozen-lockfile ensures reproducible builds if lockfile exists
RUN pnpm install --frozen-lockfile || pnpm install

# Copy source
COPY . .

# Expose Ponder dev port (optional)
EXPOSE 42069

# Start Ponder in dev mode
CMD ["pnpm", "run", "dev"]