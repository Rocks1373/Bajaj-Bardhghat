# 🔑 Bajaj Showroom – API Keys & Configuration Reference

> **Last Updated:** 2026-03-04
> **Project:** Bajaj / Hulhas Auto – Full-Stack Dealership Application

---

## 📋 Overview

This document lists every API key and credential used across the Bajaj project.
All keys are organized by service, with cost analysis and best-pick recommendations.

---

## 1️⃣ InsForge Backend (Database, Auth, Storage, AI)

**Status:** ✅ Active & Configured
**Cost:** 🟢 **FREE** (current usage is well within free tier)

| Key | Value | Used In |
|-----|-------|---------|
| **Base URL** | `https://76w8jrzf.us-east.insforge.app` | Frontend `.env.local` |
| **Anon Key** | `eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...` (JWT) | Frontend `.env.local` |

### What It Powers:
- **Database (PostgreSQL):** Products, Offers, Leads, Settings, Admin Users, Chat Messages
- **Authentication:** GitHub & Google OAuth, Email/Password
- **Storage:** `bajaj-assets` bucket (public, for images)
- **AI Models Available:**
  - `deepseek/deepseek-v3.2` — 🟢 **CHEAPEST & BEST for this project**
  - `minimax/minimax-m2.1`
  - `x-ai/grok-4.1-fast`
  - `anthropic/claude-sonnet-4.5` — Most expensive
  - `openai/gpt-4o-mini` — Good balance
  - `google/gemini-3-pro-image-preview` — Image generation capable

### 📝 Frontend Config (`apps/frontend/.env.local`):
```env
NEXT_PUBLIC_API_URL=http://localhost:4000
NEXT_PUBLIC_INSFORGE_BASE_URL=https://76w8jrzf.us-east.insforge.app
NEXT_PUBLIC_INSFORGE_ANON_KEY=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJzdWIiOiIxMjM0NTY3OC0xMjM0LTU2NzgtOTBhYi1jZGVmMTIzNDU2NzgiLCJlbWFpbCI6ImFub25AaW5zZm9yZ2UuY29tIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NzIxNTEwODJ9.oQYlAV3gikJ3CWaQW08FCHblFjivq1UAVUpeRW7ZFsY
```

---

## 2️⃣ NestJS Backend (Local API Server)

**Status:** ✅ Active & Configured
**Cost:** 🟢 **FREE** (local server)

| Key | Value | Used In |
|-----|-------|---------|
| **DATABASE_URL** | `postgresql://deepaksharma@localhost:5432/hulhas_auto?schema=public` | Backend `.env` |
| **JWT_SECRET** | `hulhas-auto-super-secret-jwt-key-2024` | Backend `.env` |
| **JWT_EXPIRATION** | `7d` | Backend `.env` |
| **PORT** | `4000` | Backend `.env` |
| **UPLOAD_DIR** | `./uploads` | Backend `.env` |
| **CORS_ORIGIN** | `http://localhost:3000` | Backend `.env` |

### 📝 Backend Config (`apps/backend/.env`):
```env
DATABASE_URL="postgresql://deepaksharma@localhost:5432/hulhas_auto?schema=public"
JWT_SECRET="hulhas-auto-super-secret-jwt-key-2024"
JWT_EXPIRATION="7d"
PORT=4000
UPLOAD_DIR="./uploads"
CORS_ORIGIN="http://localhost:3000"
```

---

## 3️⃣ MCP Server (Model Context Protocol)

**Status:** ✅ Active & Configured
**Cost:** 🟢 **FREE** (local server)

| Key | Value | Used In |
|-----|-------|---------|
| **DATABASE_URL** | `postgresql://deepaksharma@localhost:5432/hulhas_auto?schema=public` | MCP `.env` |
| **MCP_SERVER_PORT** | `5100` | MCP `.env` |
| **MCP_API_KEY** | `bajaj-mcp-secure-key-2026` | MCP `.env` |
| **MCP_ADMIN_KEY** | `bajaj-admin-key-2026` | MCP `.env` |

### 📝 MCP Config (`apps/mcp-server/.env`):
```env
DATABASE_URL=postgresql://deepaksharma@localhost:5432/hulhas_auto?schema=public
MCP_SERVER_PORT=5100
MCP_SERVER_HOST=0.0.0.0
MCP_SERVER_NAME=bajaj-showroom-mcp
MCP_SERVER_VERSION=1.0.0
MCP_API_KEY=bajaj-mcp-secure-key-2026
MCP_ADMIN_KEY=bajaj-admin-key-2026
RATE_LIMIT_WINDOW_MS=60000
RATE_LIMIT_MAX_REQUESTS=100
LOG_LEVEL=info
LOG_FILE=logs/mcp-server.log
CORS_ORIGIN=http://localhost:3000
NODE_ENV=development
```

---

## 💰 AI Model Cost Analysis & Recommendation

| Model | Speed | Quality | Cost | Best For |
|-------|-------|---------|------|----------|
| **`deepseek/deepseek-v3.2`** | ⚡ Fast | ✅ Great | 🟢 **Cheapest** | ⭐ Daily chat, product Q&A |
| `openai/gpt-4o-mini` | ⚡ Fast | ✅ Good | 🟡 Low | Quick responses |
| `minimax/minimax-m2.1` | ⚡ Fast | ✅ Good | 🟡 Low-Mid | Alternative |
| `x-ai/grok-4.1-fast` | ⚡ Fast | ✅ Good | 🟡 Mid | Real-time info |
| `google/gemini-3-pro-image-preview` | 🐢 Medium | ✅ Great | 🟠 Mid | Image generation |
| `anthropic/claude-sonnet-4.5` | 🐢 Medium | ⭐ Best | 🔴 **Most Expensive** | Complex reasoning only |

### ⭐ RECOMMENDED: `deepseek/deepseek-v3.2`
- **Why:** Cheapest option with excellent quality for a dealership chatbot
- **Use for:** Customer Q&A, product recommendations, lead qualification
- **Fallback:** `openai/gpt-4o-mini` if DeepSeek is down

---

## 🏗️ Architecture Map

```
┌─────────────────────────────────────────────────────┐
│                   FRONTEND (Next.js)                 │
│                  localhost:3000                       │
│                                                      │
│  ┌─────────────────┐    ┌─────────────────────────┐  │
│  │  Public Pages    │    │   Admin Dashboard       │  │
│  │  (InsForge SDK)  │    │   (InsForge + NestJS)   │  │
│  └────────┬─────────┘    └──────────┬──────────────┘  │
│           │                         │                 │
└───────────┼─────────────────────────┼─────────────────┘
            │                         │
    ┌───────▼───────┐        ┌────────▼────────┐
    │  InsForge     │        │  NestJS Backend  │
    │  Cloud DB     │        │  localhost:4000  │
    │  (FREE tier)  │        │  (Auth/Upload)   │
    │               │        │                  │
    │  • Products   │        │  • JWT Auth      │
    │  • Offers     │        │  • File Uploads  │
    │  • Leads      │        │  • Web Scraper   │
    │  • Settings   │        │                  │
    │  • AI Models  │        └─────────┬────────┘
    └───────────────┘                  │
                               ┌───────▼───────┐
                               │  PostgreSQL   │
                               │  localhost    │
                               │  :5432        │
                               └───────────────┘
```

---

## ⚠️ Security Notes

1. **JWT Secret** – Change `hulhas-auto-super-secret-jwt-key-2024` in production
2. **MCP Keys** – Change `bajaj-mcp-secure-key-2026` and `bajaj-admin-key-2026` in production
3. **InsForge Anon Key** – Safe for client-side (it's a public anonymous key)
4. **Database URL** – Never expose in frontend code (backend only)
5. **`.env` files** – Already in `.gitignore` (verify this!)

---

## 🚀 Quick Start

```bash
# 1. Backend
cd apps/backend
cp .env.example .env   # Edit DB credentials if needed
npm install
npm run start:dev       # → http://localhost:4000

# 2. Frontend
cd apps/frontend
cp .env.example .env.local
npm install
npm run dev             # → http://localhost:3000

# 3. MCP Server (optional)
cd apps/mcp-server
npm install
npm start               # → http://localhost:5100
```

```

---

## 4️⃣ ElevenLabs (Text-to-Speech)

**Status:** ✅ Active & Configured
**Cost:** 🟡 Depends on usage

| Key | Value | Used In |
|-----|-------|---------|
| **API Key** | `sk_d7036bc891816f0604ca2127ae3251ae807323e2c7da38de` | Frontend `.env.local` |

### What It Powers:
- **Voice Agent:** Provides realistic text-to-speech for the chatbot.
- **Cheapest Female Voice:** Rachel (`21m00Tcm4TlvDq8ikWAM`) using `eleven_turbo_v2_5` model.