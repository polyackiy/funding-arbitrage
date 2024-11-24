# Build stage
FROM node:18-alpine AS builder

# Install build dependencies
RUN apk add --no-cache bash

# Set working directory
WORKDIR /app

# Copy package files
COPY package*.json ./
COPY tsconfig*.json ./
COPY prisma ./prisma/

# Install dependencies
RUN npm ci

# Copy project files
COPY . .

# Generate Prisma client
RUN npx prisma generate

# Build Next.js application
RUN npm run build

# Build worker
RUN npm run build:worker

# Compile TypeScript files for worker
RUN npx tsc --project tsconfig.worker.json

# Production stage
FROM node:18-alpine AS runner

# Install runtime dependencies
RUN apk add --no-cache bash

# Set working directory
WORKDIR /app

# Copy package files and install production dependencies
COPY package*.json ./
RUN npm install --production

# Copy built application from builder stage
COPY --from=builder /app/.next ./.next
COPY --from=builder /app/public ./public
COPY --from=builder /app/dist ./dist
COPY --from=builder /app/node_modules ./node_modules
COPY --from=builder /app/node_modules/.prisma ./node_modules/.prisma
COPY --from=builder /app/node_modules/@prisma ./node_modules/@prisma
COPY --from=builder /app/prisma ./prisma

# Copy necessary configuration files
COPY next.config.js .
COPY prisma ./prisma

# Set NODE_ENV
ENV NODE_ENV=production

# Expose port
EXPOSE 3000

# Start the application (will be overridden by docker-compose for workers)
CMD ["npm", "start"]

# Worker
FROM node:18-alpine AS worker

# Install runtime dependencies
RUN apk add --no-cache bash

# Set working directory
WORKDIR /app

# Copy package files and install production dependencies
COPY package*.json ./
COPY --from=runner /app/dist ./dist
COPY --from=runner /app/node_modules ./node_modules
COPY --from=runner /app/prisma ./prisma

# Set NODE_ENV
ENV NODE_ENV=production

# Start the worker
CMD ["node", "--experimental-specifier-resolution=node", "dist/scripts/start-worker.js"]
