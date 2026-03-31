# BiteBot - AI Food Ordering Platform

BiteBot is a full-stack, serverless web application that seamlessly blends traditional e-commerce functionality with an intelligent conversational AI chatbot. Users can explore a dynamic food menu, place orders, track delivery status, and converse with a highly knowledgeable food expert AI.

## 1. Technology Stack

BiteBot is built aggressively on the **T3 Stack** pattern, focusing strictly on End-to-End type safety.

*   **Framework:** [Next.js 14](https://nextjs.org/) (App Router)
*   **Language:** [TypeScript](https://www.typescriptlang.org/)
*   **Styling:** [Tailwind CSS](https://tailwindcss.com/)
*   **API & State:** [tRPC](https://trpc.io/) + [React Query](https://tanstack.com/query/latest)
*   **Database ORM:** [Prisma](https://www.prisma.io/)
*   **Database Hosting:** [Neon Postgres](https://neon.tech/) (Serverless Postgres)
*   **LLM Provider:** [Groq API](https://groq.com/) (`llama-3.1-8b-instant`)
*   **Schema Validation:** [Zod](https://zod.dev/)

---

## 2. Core Architecture

### **Frontend Layer (UI & State)**
The frontend resides entirely in `src/app/`. Because the application utilizes the App Router, it relies on React Server Components (RSC) where possible. 
Interactive components (such as `SignInForm.tsx` and the Chat UI) utilize client-side hooks provided by **tRPC React Query** (`api.chat.send.useMutation()`). This perfectly hydrates the UI automatically when server data mutates.

### **Backend Layer (tRPC)**
Conventional REST APIs are replaced entirely by **tRPC**. 
All backend logic exists in `src/server/api/routers/`. Procedures are rigorously validated by **Zod** schemas (e.g., verifying a chat message length prior to processing).
When the frontend makes a request, tRPC guarantees the input and output types match the database model—eliminating silent type casting errors.

### **Authentication Layer**
A **Custom JWT** implementation is handled internally via `src/app/api/auth/sign-in`. 
User passwords are encrypted and checked using `bcryptjs`. Access tokens are uniquely built using the `User.id` appended with a timestamp, then encoded in Base64 logic. There is no reliance on NextAuth, ensuring full granular control.

---

## 3. Database Architecture & Schema

The application employs **Prisma ORM** connecting to a highly scalable **Neon Serverless PostgreSQL** database.

### **Entity Relational Models**
*   **User:** Core identity holding hashed passwords. Maps one-to-many with Orders and ChatMessages.
*   **Category:** Represents menu groupings (e.g., Mains, Desserts, Starters).
*   **Dish:** The individual food items. Linked to Categories via `categoryId`. Contains metadata fields like `tags` (veg, popular, spicy) and `emoji`.
*   **Order:** Customer purchases tracking current `status` (CONFIRMED -> DELIVERED) and `total`.
*   **OrderItem:** The linkage joining an Order to multiple Dishes.
*   **ChatMessage:** Persisted historical records of User<->Bot interactions linked via `role`.

---

## 4. Artificial Intelligence Implementation

BiteBot utilizes a **Hybrid Intent-Matching Engine** inside the `chat.ts` tRPC router rather than defaulting every input to the LLM. This drastically reduces token costs while generating instantaneous UI responses.

1.  **Regex Fast-Pathing:** When a user sends a message, the server checks the input against hard-coded RegExp arrays (e.g., `/spicy|veg|seafood/`). If a match is found, the server bypasses the AI completely! It directly queries the database via Prisma and returns the appropriate subset of Dishes (e.g., filtering for the `veg` tag). Order tracking (`track order #...`) is also regex-driven.
2.  **LLM Fallback (Groq Llama-3.1):** If the user asks a complex food, recipes, or nutrition question, the application forwards the prompt to the Groq API. The LLM's system prompt strictly acts as a "food expert and ordering assistant", keeping answers concise (max 3 sentences) while pivoting back to the platform's purchasing funnel.

---

## 5. Deployment & Environment Parameters

BiteBot is natively deployed onto **Vercel** serverless environments. 
Due to the ephemeral nature of Vercel Edge compute, maintaining persistent database connections is complex.

### **Environment Variables**
Validation is rigorously enforced at build-time using `@t3-oss/env-nextjs`.
*   `DATABASE_URL`: Required. Must point to the compiled connection string. Due to Next.js serverless polling, **`?pgbouncer=true` MUST BE APPENDED** to the connection string to allow Neon's PgBouncer protocol to pool database requests safely.
*   `GROQ_API_KEY`: Required LLM integration key.

*Note: All server-side environment variables remain isolated from the client bundle intentionally. DO NOT append `NEXT_PUBLIC_` to these keys.*
