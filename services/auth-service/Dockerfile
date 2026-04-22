FROM node:20-alpine AS builder
WORKDIR /app

COPY package*.json ./
COPY services/user-service/package*.json ./services/user-service/
COPY services/auth-service/package*.json ./services/auth-service/
COPY tsconfig.base.json ./
RUN npm ci

COPY services/auth-service ./services/auth-service
RUN rm -rf services/auth-service/dist services/auth-service/tsconfig.tsbuildinfo
RUN npm run build --workspace @praxion/auth-service

FROM node:20-alpine AS runner
WORKDIR /app
ENV NODE_ENV=production

COPY package*.json ./
COPY services/user-service/package*.json ./services/user-service/
COPY services/auth-service/package*.json ./services/auth-service/
RUN npm ci --omit=dev

COPY --from=builder /app/services/auth-service/dist ./services/auth-service/dist
WORKDIR /app/services/auth-service
EXPOSE 3001
CMD ["node", "dist/src/main.js"]
