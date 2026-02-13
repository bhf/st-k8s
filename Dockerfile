# Multi-stage Dockerfile for Next.js (App Router)
# Base image: Node 18 LTS (alpine for small size)

# 1) Builder stage: install deps and build
FROM node:25-alpine AS builder

# Set working directory
WORKDIR /app

# Install OS dependencies if needed (uncomment if your build requires libc6-compat)
# RUN apk add --no-cache libc6-compat

# Copy package manifests first for better caching
COPY package.json package-lock.json* ./

# Install dependencies in clean environment
RUN npm ci

# Copy rest of the source
COPY . .

# Ensure Next can produce standalone server output
ENV NODE_ENV=production

# Build the app
RUN npm run build

# 2) Runner stage: minimal runtime
FROM node:25-alpine AS runner
WORKDIR /app

ENV NODE_ENV=production

# Add non-root user for security
RUN addgroup -S app && adduser -S app -G app

# Copy only what we need for running the standalone server
# .next/standalone contains server code + node_modules
# .next/static contains static assets
COPY --from=builder /app/.next/standalone ./
COPY --from=builder /app/.next/static ./.next/static
COPY --from=builder /app/public ./public

# Expose Next.js default port
EXPOSE 3000

# Use non-root user
USER app

# Default command launches the Next.js server
CMD ["node", "server.js"]
