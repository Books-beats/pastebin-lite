# Pastebin Lite

A simple, secure pastebin application built with Next.js and Vercel KV (Redis). Check it out at https://pastebin-lite-s1rm.vercel.app/

## Features
- Create text pastes with optional expiration (TTL) and view limits.
- Secure, URL-friendly unique IDs.
- Deterministic testing support via `TEST_MODE`.
- Mobile-responsive UI.

## Tech Stack
- **Framework**: Next.js 16 (App Router)
- **Language**: TypeScript
- **Persistence**: Vercel KV (Redis)
- **Styling**: CSS Modules

## Persistence Choice: Vercel KV (Redis)
I chose Redis (Vercel KV) for this application because:
1.  **TTL Support**: Redis has native support for key expiration, which aligns perfectly with the time-limited paste requirement.
2.  **Atomic Counters**: The `INCR`/`DECR` operations allow for race-condition-free view counting.
3.  **Performance**: Key-Value lookups are extremely fast (`O(1)`), essential for a high-traffic pastebin.
4.  **Simplicity**: The data model is simple (Key -> Paste Data), avoiding the overhead of a relational schema.

**Optimization**: We store pastes as Redis Hashes (`HSET`) to allow updating the `views_remaining` counter atomically without reading/writing the potentially large `content` string.

## Getting Started

### 1. Prerequisites
- Node.js 18+
- A Vercel KV instance (or local Redis)

### 2. Environment Variables
Create a `.env.local` file:
```bash
KV_REST_API_URL="your_vercel_kv_url"
KV_REST_API_TOKEN="your_vercel_kv_token"
# Optional: Set to '1' to enable time-travel testing headers
TEST_MODE="0"
```

### 3. Run Locally
```bash
npm install
npm run dev
```
Visit `http://localhost:3000`.

## Testing Logic
The application supports a `TEST_MODE=1` environment variable. When enabled:
- The app respects the `x-test-now-ms` header to simulate the current time.
- This allows for deterministic testing of expiration logic.
- **Security Note**: This mode should only be enabled in testing environments.

## API Endpoints
- `POST /api/pastes`: Create a paste.
- `GET /api/pastes/:id`: Fetch paste metadata (decrements view count).
- `GET /api/healthz`: Health check.
