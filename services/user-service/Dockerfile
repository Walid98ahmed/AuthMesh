FROM node:20-alpine AS builder
WORKDIR /app

COPY package*.json ./
COPY services/user-service/package*.json ./services/user-service/
COPY services/auth-service/package*.json ./services/auth-service/
COPY tsconfig.base.json ./
RUN npm ci

COPY services/user-service ./services/user-service
RUN npm run build --workspace @praxion/user-service

FROM node:20-alpine AS runner
WORKDIR /app
ENV NODE_ENV=production

COPY package*.json ./
COPY services/user-service/package*.json ./services/user-service/
COPY services/auth-service/package*.json ./services/auth-service/
RUN npm ci --omit=dev

COPY --from=builder /app/services/user-service/dist ./services/user-service/dist
WORKDIR /app/services/user-service
EXPOSE 3002
CMD ["node", "dist/main.js"]
