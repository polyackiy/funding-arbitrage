# Build stage
FROM node:18-alpine AS builder

# Install build dependencies with custom DNS
RUN apk add --no-cache --network-timeout=60 bash --repository=http://dl-cdn.alpinelinux.org/alpine/v3.18/main/

# Set working directory
WORKDIR /app

# Copy package files
COPY package*.json ./
COPY tsconfig*.json ./
COPY prisma ./prisma/

# Install dependencies
RUN npm ci

# Create public directory
RUN mkdir -p public

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

# Production stage for Next.js app
FROM node:18-alpine AS runner

# Install runtime dependencies with custom DNS
RUN apk add --no-cache --network-timeout=60 bash --repository=http://dl-cdn.alpinelinux.org/alpine/v3.18/main/

# Set working directory
WORKDIR /app

# Create public directory
RUN mkdir -p public

# Copy package files and install production dependencies
COPY package*.json ./
RUN npm install --production

# Copy built application from builder stage
COPY --from=builder /app/.next ./.next
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

# Start the application
CMD ["npm", "start"]

# Worker stage (without Next.js files)
FROM node:18-alpine AS worker

# Install runtime dependencies with custom DNS
RUN apk add --no-cache --network-timeout=60 bash --repository=http://dl-cdn.alpinelinux.org/alpine/v3.18/main/

# Set working directory
WORKDIR /app

# Copy package files and install production dependencies
COPY package*.json ./
RUN npm install --production

# Copy only worker-related files
COPY --from=builder /app/dist ./dist
COPY --from=builder /app/node_modules ./node_modules
COPY --from=builder /app/node_modules/.prisma ./node_modules/.prisma
COPY --from=builder /app/node_modules/@prisma ./node_modules/@prisma
COPY --from=builder /app/prisma ./prisma

# Set NODE_ENV
ENV NODE_ENV=production

# Start the worker (will be overridden by docker-compose)
CMD ["node", "--experimental-specifier-resolution=node", "dist/scripts/start-worker.js"]
