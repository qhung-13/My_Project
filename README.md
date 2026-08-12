# OmexLive

A full-stack livestreaming platform inspired by Twitch and YouTube Live.

OmexLive combines a traditional web application with realtime communication and a dedicated media pipeline. Creators can stream from OBS, viewers can watch streams in the browser, interact through chat and reactions, authenticate with local accounts or Google OAuth, top up coins with Stripe, and use role-based platform features.

> This project was built as a learning and portfolio project with a focus on livestream lifecycle, realtime communication, media processing, security, and payment consistency.

---

## Overview

The system is split into three main applications:

```text
frontend/
backend/
media-service/
```

Responsibilities are intentionally separated:

- **Frontend** handles UI, playback, authentication state, and realtime events.
- **Backend** handles business logic, REST APIs, authentication, authorization, payments, MongoDB data, and Socket.IO.
- **Media Service** handles RTMP ingest from OBS, publish validation, FFmpeg processing, HLS generation, media cleanup, and stream heartbeat.

An experimental `agent-service` may also exist in the repository, but it is not part of the core livestream flow.

---

## Main Features

### Authentication
- Username/password authentication
- Google OAuth
- OTP/email flows
- Password reset
- Role-based authorization
- Protected frontend routes
- Backend authorization middleware

### Livestreaming
- OBS RTMP ingest
- Creator stream key / publish credential
- Dedicated media service
- FFmpeg transcoding
- HLS playback in the browser
- Hls.js integration
- Creator console
- Stream title/category management
- Public live stream listing
- Stream lifecycle management
- Media cleanup after stream end

### Realtime
- Socket.IO communication
- Realtime viewer count
- Stream rooms
- Live chat
- Reactions / hearts
- Redis adapter support
- In-memory fallback for local single-instance development

### Payments
- Stripe PaymentIntent integration
- Coin top-up
- Server-side payment verification
- MongoDB transactions for atomic balance updates
- Payment idempotency protection

### Administration
- Admin dashboard
- Role-based access
- User management
- Moderation / banning

---

## Architecture

```text
                         ┌───────────────┐
                         │      OBS      │
                         └───────┬───────┘
                                 │ RTMP
                                 ▼
                      ┌─────────────────────┐
                      │    Media Service    │
                      │ NodeMediaServer     │
                      │ FFmpeg              │
                      │ HLS generation      │
                      │ Heartbeat           │
                      └─────────┬───────────┘
                                │ HLS
                                ▼
┌──────────────────┐      ┌──────────────────┐
│     Frontend     │      │     Browser      │
│ React/TypeScript │◄────►│   Hls.js Player  │
└────────┬─────────┘      └──────────────────┘
         │
         │ REST + Socket.IO
         ▼
┌───────────────────────────────┐
│            Backend            │
│ Express                       │
│ Authentication / OAuth        │
│ Authorization                 │
│ Stream metadata               │
│ Socket.IO                     │
│ Payments                      │
│ Stream liveness               │
└───────┬─────────┬─────────────┘
        │         │
        │         ├──────────► Redis
        │
        └────────────────────► MongoDB Replica Set

External services:

Backend ─────────► Google OAuth
Backend ─────────► Stripe
```

---

## Livestream Flow

```text
OBS
 ↓
RTMP
 ↓
Media Service
 ↓
Validate publish credential
 ↓
FFmpeg
 ↓
HLS playlist + segments
 ↓
Hls.js
 ↓
Browser video player
```

### Why RTMP and HLS?

RTMP is used for **ingest** because OBS supports it well.

Browsers do not normally play RTMP directly, so the media service converts the incoming stream to **HLS**, which can be delivered over HTTP and played by the frontend using Hls.js.

---

## Tech Stack

### Frontend
- React
- TypeScript
- Vite
- Redux Toolkit / RTK Query
- Socket.IO Client
- Hls.js
- Plyr
- React Router

### Backend
- Node.js
- Express
- MongoDB
- Mongoose
- Socket.IO
- Redis
- Passport / Google OAuth
- Stripe
- JWT / cookie-based authentication

### Media Service
- Node.js
- NodeMediaServer
- FFmpeg
- MongoDB / Mongoose
- RTMP
- HLS

### Development Tools
- Git / GitHub
- Docker
- MongoDB Compass
- OBS Studio
- VS Code

---

## Project Structure

```text
.
├── frontend/
│   ├── src/
│   │   ├── components/
│   │   ├── pages/
│   │   ├── hooks/
│   │   ├── store/
│   │   └── api/
│   └── package.json
│
├── backend/
│   ├── src/
│   │   ├── controllers/
│   │   ├── models/
│   │   ├── routes/
│   │   ├── middlewares/
│   │   ├── services/
│   │   └── utils/
│   ├── index.js
│   └── package.json
│
├── media-service/
│   ├── src/
│   ├── media/
│   ├── index.js
│   └── package.json
│
└── docker-compose.yml
```

---

## Getting Started

### Prerequisites

Install:

- Node.js
- npm
- MongoDB
- MongoDB Shell (`mongosh`)
- Redis or Docker
- FFmpeg
- OBS Studio

Clone the repository:

```bash
git clone <your-repository-url>
cd <project-folder>
```

Install dependencies:

```bash
cd backend
npm install

cd ../frontend
npm install

cd ../media-service
npm install
```

---

## Environment Variables

Never commit real secrets to Git. Keep local `.env` files in `.gitignore`.

### Backend

```env
PORT=5000

MONGO_URI=mongodb://127.0.0.1:27017/omexlive?replicaSet=rs0

FRONTEND_URL=http://localhost:5173
BACKEND_PUBLIC_URL=http://localhost:5000

REDIS_URL=redis://127.0.0.1:6379

GOOGLE_CLIENT_ID=your_google_client_id
GOOGLE_CLIENT_SECRET=your_google_client_secret

STRIPE_SECRET_KEY=your_stripe_test_secret_key

MEDIA_SERVICE_SECRET=your_internal_service_secret
MEDIA_PUBLISH_AUTH_SECRET=your_publish_auth_secret

LIVE_HEARTBEAT_TIMEOUT_MS=20000
LIVE_STALE_SWEEP_INTERVAL_MS=10000
```

### Frontend

```env
VITE_API_URL=http://localhost:5000/api/v1
VITE_STRIPE_PUBLISHABLE_KEY=your_stripe_test_publishable_key
```

### Media Service

When running directly on Windows:

```env
MONGO_URI=mongodb://127.0.0.1:27017/omexlive?replicaSet=rs0

MEDIA_SERVICE_SECRET=use_the_same_internal_secret_as_backend
MEDIA_PUBLISH_AUTH_SECRET=use_the_same_publish_auth_secret_as_backend

MEDIA_HEARTBEAT_INTERVAL_MS=5000
```

If a service runs inside Docker Compose, its hostname may differ. A Docker service may use another Compose service name such as `mongodb`, while a process running directly on Windows should normally use `127.0.0.1`.

---

## MongoDB Replica Set

MongoDB transactions are used for operations such as payment records and coin balance updates.

Transactions require MongoDB to run as a replica set.

For local development, this project can use a **single-node replica set**.

Example MongoDB configuration:

```yaml
replication:
  replSetName: rs0
```

After restarting MongoDB, initialize it once:

```javascript
rs.initiate()
```

Verify:

```javascript
rs.status().ok
```

Expected:

```text
1
```

Check that the node is PRIMARY:

```javascript
rs.status().myState
```

Expected:

```text
1
```

Use:

```env
MONGO_URI=mongodb://127.0.0.1:27017/omexlive?replicaSet=rs0
```

---

## Redis

Redis is used for realtime functionality and Socket.IO scaling.

Start Redis with Docker:

```bash
docker compose up -d redis
```

Check status:

```bash
docker compose ps
```

When healthy, the backend should log something similar to:

```text
Socket.IO: Redis adapter enabled
```

For local single-instance development, the backend may fall back to an in-memory adapter if Redis is unavailable.

For multi-instance deployment, Redis should be available because memory is not shared between backend processes.

---

## Run the Application

Recommended local startup order:

### 1. MongoDB

Make sure the local MongoDB replica set is running.

### 2. Redis

```bash
docker compose up -d redis
```

### 3. Backend

```bash
cd backend
npm run dev
```

### 4. Media Service

```bash
cd media-service
npm run dev
```

### 5. Frontend

```bash
cd frontend
npm run dev
```

### 6. OBS

Open OBS after all services are ready.

---

## OBS Setup

In the creator console, obtain the OBS publishing information.

Configure OBS with:

```text
Server: <RTMP server URL>
Stream Key: <creator publish credential>
```

Then click **Start Streaming**.

The media service will:

1. Receive the RTMP publish request.
2. Validate the publishing credential.
3. Start FFmpeg.
4. Generate HLS output.
5. Update the backend.
6. Send stream heartbeat while the session is alive.

The frontend can then play the stream through HLS.

---

## Google OAuth

For local development, configure the Google OAuth client with:

### Authorized JavaScript Origin

```text
http://localhost:5173
```

### Authorized Redirect URI

```text
http://localhost:5000/api/v1/users/auth/google/callback
```

The backend callback URL should match exactly:

```env
BACKEND_PUBLIC_URL=http://localhost:5000
```

Do not expose `GOOGLE_CLIENT_SECRET` to the frontend.

---

## Stripe Test Payment

The application supports coin top-up with Stripe.

In Stripe test mode, a common test card is:

```text
Card:   4242 4242 4242 4242
Expiry: any valid future date
CVC:    any valid 3 digits
```

Conceptual flow:

```text
Frontend
 ↓
Create / confirm Stripe payment
 ↓
Backend verifies PaymentIntent
 ↓
MongoDB transaction
 ├── store payment transaction
 └── update coin balance
 ↓
Commit
```

MongoDB transactions ensure related writes either commit together or roll back together.

---

## Realtime and Stream Liveness

### Viewer Presence

Viewer presence is handled with Socket.IO.

A viewer joins a stream room and the backend broadcasts updated viewer counts to connected clients.

Redis can be used to share realtime state across multiple backend instances.

### Stale Stream Problem

A simple database field such as:

```text
isLive = true
```

is not enough to prove that the media process is still alive.

Example failure case:

```text
Media service crashes
        ↓
Backend misses unpublish event
        ↓
MongoDB still contains isLive=true
        ↓
Frontend incorrectly shows a dead stream as LIVE
```

OmexLive uses heartbeat-based liveness:

```text
Media Service
     │
     │ heartbeat
     ▼
Backend
     │
     ├── lastMediaHeartbeatAt
     │
     └── timeout / stale sweep
              │
              ▼
          mark offline
```

A stream is considered live only when both stored state and the media heartbeat are valid.

---

## Security Notes

### Publishing Credential

The OBS stream key is treated as a **publishing credential**.

It must not be exposed through public stream APIs.

Public playback uses separate playback information instead of giving viewers the creator's publishing credential.

### Backend Authorization

Frontend route guards improve UX but are not a security boundary.

Authorization is enforced again on backend routes and realtime operations.

### Secrets

Never commit:

```text
GOOGLE_CLIENT_SECRET
STRIPE_SECRET_KEY
JWT secrets
SMTP passwords
internal service secrets
stream publishing secrets
```

---

## Demo Flow

Recommended interview demo order:

```text
1. Introduce the project
2. Explain the architecture
3. Login / Google OAuth
4. Open Creator Console
5. Start OBS stream
6. Show HLS playback
7. Open a second browser as viewer
8. Show realtime viewer count
9. Show chat and reactions
10. Stop OBS
11. Explain heartbeat / stale stream handling
12. Show Stripe coin top-up
13. Show admin authorization
14. Show source-code structure
15. Q&A
```

The most important end-to-end flow is:

```text
OBS
→ RTMP
→ Media Service
→ FFmpeg
→ HLS
→ Hls.js
→ Viewer
```

---

## Key Engineering Decisions

### Why a separate media service?

Media processing and web business logic have different responsibilities and workloads. Separating them makes the architecture easier to reason about and allows each part to evolve independently.

### Why Socket.IO?

Viewer count, chat, and reactions require the server to push updates to clients in realtime.

### Why Redis?

Redis allows realtime state and Socket.IO events to work across multiple backend instances.

### Why MongoDB transactions?

Payment records and coin balance updates must stay consistent. A transaction ensures related writes either commit together or roll back together.

### Why heartbeat?

Persistent database state can become stale after crashes or network failures. Heartbeat provides a better signal of actual media-service liveness than a boolean alone.

---

## Known Development Notes

- MongoDB must run as a replica set for transaction-based payment flows.
- Redis should be running for the intended realtime setup.
- When running services directly on Windows, use host addresses such as `127.0.0.1` instead of Docker-only service names such as `mongodb`.
- OAuth callback URLs must exactly match the Google Cloud OAuth client configuration.
- FFmpeg must be installed and accessible to the media service.

---

## Future Improvements

- Production CDN / object-storage integration for HLS
- Adaptive bitrate streaming improvements
- Horizontal scaling of media workers
- Stronger observability and metrics
- Automated end-to-end tests for the OBS-to-viewer flow
- Improved moderation tooling
- Notification system
- Stream analytics
- Better deployment automation
- Further development of experimental AI/agent features

---

## Interview Summary

> OmexLive is a full-stack livestreaming platform built with React, TypeScript, Express, MongoDB, Socket.IO, Redis, RTMP, FFmpeg, and HLS. It supports OBS ingest, browser playback, realtime viewer interaction, authentication, Google OAuth, Stripe-based coin top-up, role-based administration, and stream-liveness handling through heartbeat and timeout mechanisms.

Core engineering concepts demonstrated:

```text
RTMP ingest
HLS browser playback
FFmpeg transcoding
Realtime Socket.IO communication
Redis-backed scaling
Authentication and authorization
Payment consistency
MongoDB transactions
Stream lifecycle management
Failure recovery
Service separation
```

---

## License

This project is currently intended for educational and portfolio purposes.
