# syntax=docker/dockerfile:1.4
# Build stage
FROM node:18-alpine AS builder

# Add multiple Alpine mirrors for redundancy and speed
RUN sed -i 's/dl-cdn.alpinelinux.org/mirrors.tuna.tsinghua.edu.cn/g' /etc/apk/repositories && \
    echo "https://mirrors.cloud.tencent.com/alpine/v3.18/main" >> /etc/apk/repositories && \
    echo "https://mirrors.cloud.tencent.com/alpine/v3.18/community" >> /etc/apk/repositories && \
    echo "https://mirrors.aliyun.com/alpine/v3.18/main" >> /etc/apk/repositories && \
    echo "https://mirrors.aliyun.com/alpine/v3.18/community" >> /etc/apk/repositories && \
    apk update && \
    apk add --no-cache bash

# Set working directory
WORKDIR /app

# Copy package files first to leverage Docker cache
COPY package*.json ./
COPY tsconfig*.json ./

# Install dependencies
RUN npm ci --no-audit --no-fund

# Copy prisma schema (needed for generation)
COPY prisma ./prisma/

# Generate Prisma client
RUN npx prisma generate

# Copy rest of the project files
COPY . .

# Build Next.js application and worker
RUN npm run build && \
    npm run build:worker && \
    npx tsc --project tsconfig.worker.json

# Production stage
FROM node:18-alpine AS runner

# Add multiple Alpine mirrors for redundancy and speed
RUN sed -i 's/dl-cdn.alpinelinux.org/mirrors.tuna.tsinghua.edu.cn/g' /etc/apk/repositories && \
    echo "https://mirrors.cloud.tencent.com/alpine/v3.18/main" >> /etc/apk/repositories && \
    echo "https://mirrors.cloud.tencent.com/alpine/v3.18/community" >> /etc/apk/repositories && \
    echo "https://mirrors.aliyun.com/alpine/v3.18/main" >> /etc/apk/repositories && \
    echo "https://mirrors.aliyun.com/alpine/v3.18/community" >> /etc/apk/repositories && \
    apk update && \
    apk add --no-cache bash

WORKDIR /app

# Copy package files and install production dependencies
COPY package*.json ./
RUN npm ci --only=production --no-audit --no-fund

# Copy built application from builder stage
COPY --from=builder /app/.next ./.next
COPY --from=builder /app/public ./public
COPY --from=builder /app/dist ./dist
COPY --from=builder /app/node_modules/.prisma ./node_modules/.prisma
COPY --from=builder /app/node_modules/@prisma ./node_modules/@prisma
COPY --from=builder /app/prisma ./prisma
COPY next.config.js .

# Set NODE_ENV
ENV NODE_ENV=production

# Expose port
EXPOSE 3000

# Start the application (will be overridden by docker-compose for workers)
CMD ["npm", "start"]

# Worker stage
FROM node:18-alpine AS worker

# Add multiple Alpine mirrors for redundancy and speed
RUN sed -i 's/dl-cdn.alpinelinux.org/mirrors.tuna.tsinghua.edu.cn/g' /etc/apk/repositories && \
    echo "https://mirrors.cloud.tencent.com/alpine/v3.18/main" >> /etc/apk/repositories && \
    echo "https://mirrors.cloud.tencent.com/alpine/v3.18/community" >> /etc/apk/repositories && \
    echo "https://mirrors.aliyun.com/alpine/v3.18/main" >> /etc/apk/repositories && \
    echo "https://mirrors.aliyun.com/alpine/v3.18/community" >> /etc/apk/repositories && \
    apk update && \
    apk add --no-cache bash

WORKDIR /app

# Copy package files and install production dependencies
COPY package*.json ./
RUN npm ci --only=production --no-audit --no-fund

# Copy necessary files from runner
COPY --from=runner /app/dist ./dist
COPY --from=runner /app/node_modules/.prisma ./node_modules/.prisma
COPY --from=runner /app/node_modules/@prisma ./node_modules/@prisma
COPY --from=runner /app/prisma ./prisma

# Set NODE_ENV
ENV NODE_ENV=production

# Start the worker
CMD ["node", "--experimental-specifier-resolution=node", "dist/scripts/start-worker.js"]
