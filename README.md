# Praxion Assignment - Role-Based Authentication Microservices

Production-oriented NestJS microservices architecture with JWT authentication, refresh tokens, RBAC authorization, Swagger docs, unit tests, and Dockerized local runtime.

## 1. Architecture Overview

### Services
- **Auth Service** (`services/auth-service`):
  - Register, login, refresh flow
  - Issues JWT access/refresh tokens
  - Calls User Service via internal REST endpoints
  - Does not own or persist user records
- **User Service** (`services/user-service`):
  - Owns user persistence in PostgreSQL
  - Stores `email`, `passwordHash`, `role`, timestamps
  - Provides public profile/admin endpoints and internal auth endpoints
  - Enforces RBAC (`user`, `admin`) via guards

### Data Ownership and Service Boundaries
- User data is stored only in User Service.
- Auth Service is stateless except token generation and validation.
- Auth Service depends on User Service for:
  - user creation during registration
  - user lookup during credential validation

### Communication
- **Mandatory REST** implemented:
  - Auth -> User via HTTP client (`@nestjs/axios`)
- Optional gRPC/RabbitMQ not added to keep scope focused and runnable.

## 2. Project Structure

```text
.
├── docker-compose.yml
├── package.json
├── tsconfig.base.json
├── postman/
│   └── praxion-auth-rbac.postman_collection.json
├── services/
│   ├── auth-service/
│   │   ├── Dockerfile
│   │   ├── .env.example
│   │   ├── src/
│   │   └── test/
│   └── user-service/
│       ├── Dockerfile
│       ├── .env.example
│       └── src/
└── README.md
```

## 3. Local Run (Without Docker)

### Prerequisites
- Node.js 20+
- npm 10+
- PostgreSQL 16+

### Install
```bash
npm ci
```

### Environment
Create environment files:
```bash
cp services/user-service/.env.example services/user-service/.env
cp services/auth-service/.env.example services/auth-service/.env
```

Update values if needed (especially JWT secrets and DB credentials).

### Start services
Terminal 1:
```bash
npm run dev:user
```

Terminal 2:
```bash
npm run dev:auth
```

### Swagger
- Auth Service docs: `http://localhost:3001/docs`
- User Service docs: `http://localhost:3002/docs`

## 4. Docker Run

```bash
docker compose up --build
```

This starts:
- PostgreSQL on `5432`
- User Service on `3002`
- Auth Service on `3001`

## 5. API Endpoints

### Auth Service (`http://localhost:3001/api/auth`)
- `POST /register`
  - body: `{ "email": "user@example.com", "password": "StrongPass123!" }`
  - response: created user + `accessToken` + `refreshToken`
- `POST /login`
  - body: `{ "email": "user@example.com", "password": "StrongPass123!" }`
  - response: safe user + `accessToken` + `refreshToken`
- `POST /refresh`
  - body: `{ "refreshToken": "..." }`
  - response: new `accessToken` + `refreshToken`

### User Service (`http://localhost:3002/api`)
Requires access token bearer auth except internal endpoints.

- `GET /users/me` (user/admin)
- `PATCH /users/me` (user/admin)
- `GET /users` (admin only)
- `PATCH /users/:id/role` (admin only)

Internal endpoints (used by Auth Service):
- `POST /internal/users`
- `POST /internal/users/by-email`

## 6. Security Practices Applied

- Password hashing with salted `bcrypt`
- JWT access + refresh token split with separate secrets and expirations
- DTO input validation with `class-validator`
- Global validation pipe (`whitelist`, `forbidNonWhitelisted`, `transform`)
- Guards for authentication and role checks
- Centralized HTTP exception filters
- Secrets and runtime options via environment variables

## 7. Testing

Auth unit tests are in:
- `services/auth-service/src/auth/auth.service.spec.ts`

Covered cases:
- login success path
- token generation with separate access/refresh payloads and secrets
- invalid password rejection (`UnauthorizedException`)

Run tests:
```bash
npm run test:auth
```

## 8. Postman Collection

Import:
- `postman/praxion-auth-rbac.postman_collection.json`

Collection variables:
- `authBaseUrl`
- `userBaseUrl`
- `accessToken`
- `refreshToken`
- `userId`

`Login` and `Refresh Tokens` requests auto-store tokens into collection variables.

## 9. Design Decisions and Tradeoffs

- **Kept two services only**: satisfies required scope with clear bounded contexts and lower operational complexity.
- **REST internal communication**: easier local debug/observability than introducing message brokers for this assignment.
- **TypeORM `synchronize=true` default in examples**: optimized for local setup speed; should be `false` in production with migrations.
- **No refresh token persistence/blacklist**: acceptable baseline for assignment; production systems should support rotation tracking/revocation store.
- **Monorepo npm workspaces**: reduces duplicated tooling and keeps cross-service development consistent.
