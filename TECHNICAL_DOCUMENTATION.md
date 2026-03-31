# BiteBot Technical Documentation

## Overview
BiteBot is an interactive, AI-driven food ordering platform that merges traditional cart-based e-commerce with advanced natural language processing. The application is designed to be highly scalable, completely type-safe from the database to the browser, and natively capable of deploying to serverless edge platforms.

## System Architecture

### 1. Technology Stack
The stack fundamentally follows the **T3 Standard**:
- **Application Framework**: [Next.js 14](https://nextjs.org/) (Using the modern App Router)
- **Language**: TypeScript (Strict typing enabled)
- **CSS Framework**: Tailwind CSS
- **API Transport layer**: [tRPC](https://trpc.io/) + React Query
- **ORM (Object Relational Mapper)**: [Prisma](https://prisma.io/)
- **Database**: [Neon Tech PostgreSQL](https://neon.tech/)
- **Artificial Intelligence**: [Groq SDK](https://console.groq.com/) utilizing `llama-3.1-8b-instant`
- **Validation**: Zod (Input parsing & runtime environment variables)
- **Authentication**: Custom implementation using `bcryptjs` for password hashing and Base64 JWT generation.

---

### 2. Backend Infrastructure

#### **2.1 Database Schema (Prisma)**
The database is structured to securely tie user state to historical orders and chat interactions.
- **User**: The primary identity node. Contains `email`, hashed `password`, and timestamps.
- **Category & Dish**: Highly relational tables mapping Menu structures. `Dish` items house custom `tags` (e.g., veg, spicy, popular) used by the AI engine.
- **Order & OrderItem**: A many-to-many relationship establishing the cart checkout state. Orders transition through status life-cycles (`CONFIRMED` -> `PREPARING` -> `DELIVERED`).
- **ChatMessage**: Persists the session dialogue between the user (`role: user`) and the AI (`role: bot`).

#### **2.2 The tRPC Layer**
Unlike typical REST architectures, the backend relies strictly on remote procedure calls (`src/server/api/routers/`).
- **Endpoint Safety**: Inputs map directly to Zod schemas. If the frontend submits invalid data, tRPC rejects the payload dynamically before it hits the functional layer.
- **Caching**: React Query perfectly caches backend reads, immediately invalidating them when the user places an order or sends a chat message.

---

### 3. Artificial Intelligence Module (`chat.ts`)

BiteBot implements a robust **Hybrid Intent Matching Engine** to minimize generation times and token usage over standard LLM wrappers.

- **Layer 1: Deterministic Regex Pathing**
  Incoming messages are parsed against regular expressions representing immediate actions (e.g., `/spicy|veg|cheap|menu/`). If matched, the system bypasses the LLM and instantly queries Prisma for menu items matching those exact tags, generating sub-100ms responses.
  
- **Layer 2: LLM Fallback (Groq)**
  If the user asks an expansive question (e.g., "What are the nutritional sizes of this dish?" or "I need a gluten-free lunch"), the intent falls back to the Groq API. The `llama-3.1` model processes the text through a predefined system prompt that forces it to act as an energetic food expert, dynamically answering the prompt while pivoting back toward menu options.

---

### 4. Deployment Constraints (Vercel)

The application relies on serverless compute architectures via Vercel deployments, requiring rigorous constraints.

#### **Environment Validation**
The `@t3-oss/env-nextjs` library strictly binds environment constraints exactly at build time. The build will intentionally fail if specific secrets are omitted.
- `DATABASE_URL`: Required for Prisma generation.
- `GROQ_API_KEY`: Required for AI functionality.

#### **PostgreSQL Connection Pooling**
Because serverless functions (Vercel) spin up inherently ephemeral compute nodes, traditional TCP configurations to PostgreSQL databases frequently hit connection ceilings. To mitigate this, the `DATABASE_URL` mapped to Neon PostgreSQL strictly requires `pgbouncer=true`. This directs connections to Neon's internal load balancers rather than the raw database thread, enabling massive horizontal scaling.

---

### 5. Project Directory Structure

Understanding the layout is critical for mapping features to physical code layers:

```text
bitebot/
├── prisma/               # Database integration layer
│   ├── schema.prisma     # The single source-of-truth for DB tables & relationships
│   └── seed.ts           # Script to initialize standard menu items onto an empty database
├── src/                  # Main application container
│   ├── app/              # Next.js 14 server and client routing system
│   │   ├── _components/  # Highly reusable React UI components (Cart, Chat, Auth forms)
│   │   ├── api/auth/     # Core standard API paths bypassing tRPC (Bcrypt sign-in)
│   │   └── api/trpc/     # Universal catch-all endpoint fielding tRPC mutations
│   ├── server/           # Secure backend node logic
│   │   ├── api/routers/  # The distinct tRPC controllers outlining allowed procedures (chat.ts)
│   │   └── db.ts         # Initialized Prisma client singleton
│   ├── styles/           # Global Tailwind definitions mapped to CSS variables
│   └── env.ts            # Zod-enforced validator analyzing .env inputs during build
├── public/               # Static web assets (Favicons, direct images)
├── .env                  # Git-ignored local secrets file (Not synchronized with Vercel)
└── tailwind.config.ts    # Extensible design system configuration
```
