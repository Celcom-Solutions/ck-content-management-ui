# Build stage
FROM node:20-alpine AS build

RUN corepack enable && corepack prepare yarn@4.12.0 --activate

WORKDIR /app

# Copy monorepo root files
COPY package.json yarn.lock .yarnrc.yml ./
COPY packages/ ./packages/
COPY examples/getstarted/ ./examples/getstarted/

RUN yarn install --frozen-lockfile

# Build monorepo packages first
RUN yarn build

# Build Strapi admin
WORKDIR /app/examples/getstarted
RUN NODE_ENV=production yarn build

# Production stage
FROM node:20-alpine

RUN corepack enable && corepack prepare yarn@4.12.0 --activate

WORKDIR /app

COPY --from=build /app ./

WORKDIR /app/examples/getstarted

EXPOSE 1337

CMD ["yarn", "start"]