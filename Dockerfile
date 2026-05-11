# =========================================
# Stage 1: Install Dependencies
# =========================================
FROM oven/bun:1 AS base
WORKDIR /app

COPY package.json bun.lock ./ 
# Note: Bun uses bun.lockb (binary) or bun.lock (v1.2+). Ensure the extension is correct.
RUN bun install --frozen-lockfile

# =========================================
# Stage 2: Build Application
# =========================================
FROM base AS build
WORKDIR /app

# Copy the rest of the source code
COPY . .

# CRITICAL FIX: Generate Prisma Client BEFORE building
RUN bunx prisma generate

# Now the bundler will find @generated/prisma
RUN bun run build

# =========================================
# Stage 3: Production Runner
# =========================================
FROM oven/bun:1-slim AS release
WORKDIR /app

ENV NODE_ENV=production

# Copy only the bundled output
COPY --from=build /app/dist ./dist
# Copy the generated prisma client (needed at runtime)
COPY --from=build /app/node_modules/@generated ./node_modules/@generated
# Copy the engine binaries and schema
COPY --from=build /app/node_modules/.prisma ./node_modules/.prisma
COPY --from=build /app/prisma ./prisma
COPY --from=build /app/package.json ./package.json

COPY entrypoint.sh ./entrypoint.sh
RUN chmod +x ./entrypoint.sh

EXPOSE 3000

ENTRYPOINT ["./entrypoint.sh"]
