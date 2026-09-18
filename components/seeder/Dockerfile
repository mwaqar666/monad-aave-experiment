# use the official Bun image
# see all versions at https://hub.docker.com/r/oven/bun/tags
FROM oven/bun:latest AS base
WORKDIR /home/bun/app

# copy component and required packages
# install dependencies and build the code
FROM base AS builder

# copy workspace package.json, tsconfig and bun.lock
COPY package.json tsconfig.json bun.lock ./

# copy the component
COPY components/seeder ./components/seeder

# copy component dependencies
COPY packages/abis ./packages/abis
COPY packages/core ./packages/core
COPY packages/db ./packages/db

# install dependencies
RUN bun install --frozen-lockfile

# build packages
RUN bun build:package:abis
RUN bun build:package:core
RUN bun build:package:db

RUN bun build:component:seeder

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

COPY --from=builder /home/bun/app/packages/db/node_modules ./packages/db/node_modules
COPY --from=builder /home/bun/app/packages/db/package.json ./packages/db/package.json
COPY --from=builder /home/bun/app/packages/db/dist/index.js ./packages/db/dist/index.js
COPY --from=builder /home/bun/app/packages/db/migrations ./packages/db/migrations

COPY --from=builder /home/bun/app/components/seeder/node_modules ./components/seeder/node_modules
COPY --from=builder /home/bun/app/components/seeder/package.json ./components/seeder/package.json
COPY --from=builder /home/bun/app/components/seeder/dist/index.js ./components/seeder/dist/index.js

# run the app
CMD ["bun", "start:seeder"]