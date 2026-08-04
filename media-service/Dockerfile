# Using Node.js version 22
FROM node:22-alpine

# BUG FIX (inherited from the old backend/Dockerfile): mediaServer.config.js
# spawns the `ffmpeg` binary to transcode RTMP -> HLS, but the original
# Dockerfile never installed it, so this only ever worked on developer
# machines that happened to have ffmpeg on PATH — production would fail at
# runtime the first time a stream started. Alpine's `ffmpeg` package covers
# it here.
RUN apk add --no-cache ffmpeg

WORKDIR /app

COPY package*.json ./
RUN npm install --omit=dev

COPY . .

# RTMP ingest, HLS HTTP (local fallback), health/API port
EXPOSE 1935 8000 8080

CMD ["node", "index.js"]
