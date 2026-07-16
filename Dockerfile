FROM node:24-alpine AS deps
WORKDIR /app
RUN corepack enable
COPY package.json pnpm-lock.yaml pnpm-workspace.yaml ./
COPY prisma ./prisma
RUN pnpm install --frozen-lockfile

FROM node:24-alpine AS builder
WORKDIR /app
RUN corepack enable
COPY --from=deps /app/node_modules ./node_modules
COPY . .
RUN pnpm exec prisma generate
RUN pnpm build

# Standalone Prisma CLI install (flat npm layout) so `migrate deploy` works at
# runtime without hand-copying every transitive dependency. Version is read
# from package.json to stay in sync with the app.
FROM node:24-alpine AS prisma-cli
WORKDIR /cli
COPY package.json /tmp/app-package.json
RUN npm install --no-package-lock $(node -p "'prisma@'+require('/tmp/app-package.json').devDependencies.prisma")

FROM node:24-alpine AS runner
WORKDIR /app
ENV NODE_ENV=production
ENV PORT=3002

RUN addgroup --system --gid 1001 nodejs && \
    adduser --system --uid 1001 nextjs

# Copy standalone build
COPY --from=builder /app/public ./public
COPY --from=builder /app/.next/standalone ./
COPY --from=builder /app/.next/static ./.next/static

# Prisma schema + CLI for migrate deploy (kept in its own directory so it
# never collides with the standalone build's node_modules)
COPY --from=builder /app/prisma ./prisma
COPY --from=prisma-cli /cli/node_modules ./prisma-cli/node_modules

# Copy entrypoint
COPY docker-entrypoint.sh /usr/local/bin/
RUN chmod +x /usr/local/bin/docker-entrypoint.sh

# Create data directory for SQLite
RUN mkdir -p /app/data && chown nextjs:nodejs /app/data

USER nextjs
EXPOSE 3002

ENTRYPOINT ["docker-entrypoint.sh"]
CMD ["node", "server.js"]
