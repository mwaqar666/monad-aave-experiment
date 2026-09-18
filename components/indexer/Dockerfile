# use the official Bun image
# see all versions at https://hub.docker.com/r/oven/bun/tags
FROM oven/bun:latest AS base
WORKDIR /home/bun/app

# copy required packages
# install dependencies and build the code
FROM base AS builder

# copy workspace package.json, tsconfig and bun.lock
COPY package.json tsconfig.json bun.lock ./

# copy the component
COPY components/indexer ./components/indexer

# copy component dependencies
COPY packages/abis ./packages/abis
COPY packages/core ./packages/core

# install dependencies
RUN bun install --frozen-lockfile

# build packages
RUN bun build:package:abis
RUN bun build:package:core

# copy production dependencies and compiled code into final image
FROM oven/bun:slim as runtime
WORKDIR /home/bun/app

COPY --from=builder /home/bun/app/node_modules ./node_modules
COPY --from=builder /home/bun/app/package.json /home/bun/app/bun.lock ./

COPY --from=builder /home/bun/app/packages/abis/node_modules ./packages/abis/node_modules
COPY --from=builder /home/bun/app/packages/abis/package.json ./packages/abis/package.json
COPY --from=builder /home/bun/app/packages/abis/dist/index.js ./packages/abis/dist/index.js

COPY --from=builder /home/bun/app/packages/core/node_modules ./packages/core/node_modules
COPY --from=builder /home/bun/app/packages/core/package.json ./packages/core/package.json
COPY --from=builder /home/bun/app/packages/core/dist/index.js ./packages/core/dist/index.js

COPY --from=builder /home/bun/app/components/indexer/node_modules ./components/indexer/node_modules
COPY --from=builder /home/bun/app/components/indexer/src ./components/indexer/src
COPY --from=builder /home/bun/app/components/indexer/package.json ./components/indexer/package.json
COPY --from=builder /home/bun/app/components/indexer/ponder-env.d.ts ./components/indexer/ponder-env.d.ts
COPY --from=builder /home/bun/app/components/indexer/ponder.config.ts ./components/indexer/ponder.config.ts
COPY --from=builder /home/bun/app/components/indexer/ponder.schema.ts ./components/indexer/ponder.schema.ts
COPY --from=builder /home/bun/app/components/indexer/tsconfig.json ./components/indexer/tsconfig.json

# run the app
CMD ["bun", "start:indexer"]