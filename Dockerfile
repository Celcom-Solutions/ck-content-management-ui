# Build stage
FROM node:20 AS build

WORKDIR /app

COPY . .

ENV COREPACK_ENABLE_DOWNLOAD_FALLBACK=0

# Build monorepo packages first
RUN node .yarn/releases/yarn-4.12.0.cjs build

# Build Strapi admin
WORKDIR /app/examples/getstarted
RUN NODE_ENV=production node /app/.yarn/releases/yarn-4.12.0.cjs build

# Production stage
FROM node:20-slim

WORKDIR /app

COPY --from=build /app ./

WORKDIR /app/examples/getstarted

EXPOSE 1337

CMD ["node", "/app/.yarn/releases/yarn-4.12.0.cjs", "start"]
