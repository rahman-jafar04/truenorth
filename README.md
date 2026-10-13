# TrueNorth

> AI-powered to-do and self-discipline mobile application for Android and iOS.

## Architecture

TrueNorth is architected as a TypeScript monorepo:
- **`packages/shared`**: Domain types, Zod validation schemas, AI theological guardrails, and the `IFocusLockNativeBridge` cross-platform interface.
- **`apps/api`**: Express REST API with Supabase token verification, Prisma ORM (PostgreSQL), privacy-preserving logging, and server-side LLM guidance services.
- **`apps/mobile`**: React Native application powered by Expo and Expo Router, consuming the Express API and TanStack Query.

## Quick Start

### 1. Install Dependencies
```bash
npm install
```

### 2. Configure Environment
Copy `.env.example` to `.env` and fill in your Supabase and LLM provider credentials.

### 3. Generate Database Client & Run Tests
```bash
# Generate Prisma Client
npm --workspace=@truenorth/api run prisma:generate

# Run Automated Test Suite
npm run test

# Typecheck All Packages
npm run typecheck
```

### 4. Start Development Servers
```bash
# Start Backend API (Port 4000)
npm run api:dev

# Start Mobile Expo Bundler
npm run mobile:start
```
