# ========================================
# Frontend Dockerfile (Next.js 16)
# ========================================

FROM node:22-alpine AS base

# ========================================
# Dependencies Stage
# ========================================
FROM base AS deps
WORKDIR /app

# Copy package files
COPY package*.json ./

# Install dependencies
RUN npm ci --only=production && \
    npm cache clean --force

# ========================================
# Builder Stage
# ========================================
FROM base AS builder
WORKDIR /app

# Copy package files
COPY package*.json ./

# Install all dependencies (including dev)
RUN npm ci

# Copy source code
COPY . .

# Build arguments for environment variables (client-side only)
ARG NEXT_PUBLIC_AWS_REGION
ARG NEXT_PUBLIC_COGNITO_DOMAIN
ARG NEXT_PUBLIC_COGNITO_CLIENT_ID
ARG NEXT_PUBLIC_COGNITO_REDIRECT_SIGNIN
ARG NEXT_PUBLIC_COGNITO_REDIRECT_SIGNOUT
ARG NEXT_PUBLIC_COGNITO_SCOPES
ARG NEXT_PUBLIC_BACKEND_BASE_URL

# Set environment variables for build (client-side only)
ENV NEXT_PUBLIC_AWS_REGION=$NEXT_PUBLIC_AWS_REGION
ENV NEXT_PUBLIC_COGNITO_DOMAIN=$NEXT_PUBLIC_COGNITO_DOMAIN
ENV NEXT_PUBLIC_COGNITO_CLIENT_ID=$NEXT_PUBLIC_COGNITO_CLIENT_ID
ENV NEXT_PUBLIC_COGNITO_REDIRECT_SIGNIN=$NEXT_PUBLIC_COGNITO_REDIRECT_SIGNIN
ENV NEXT_PUBLIC_COGNITO_REDIRECT_SIGNOUT=$NEXT_PUBLIC_COGNITO_REDIRECT_SIGNOUT
ENV NEXT_PUBLIC_COGNITO_SCOPES=$NEXT_PUBLIC_COGNITO_SCOPES
ENV NEXT_PUBLIC_BACKEND_BASE_URL=$NEXT_PUBLIC_BACKEND_BASE_URL

# Build Next.js application
RUN npm run build

# ========================================
# Production Stage
# ========================================
FROM base AS runner
WORKDIR /app

# Set production environment
ENV NODE_ENV=production

# Create non-root user
RUN addgroup --system --gid 1001 nodejs && \
    adduser --system --uid 1001 nextjs

# Copy necessary files from builder
COPY --from=builder --chown=nextjs:nodejs /app/public ./public
COPY --from=builder --chown=nextjs:nodejs /app/.next/standalone ./
COPY --from=builder --chown=nextjs:nodejs /app/.next/static ./.next/static

# Switch to non-root user
USER nextjs

# Expose port
EXPOSE 3000

# Health check
HEALTHCHECK --interval=30s --timeout=3s --start-period=40s --retries=3 \
  CMD node -e "require('http').get('http://localhost:3000', (r) => {process.exit(r.statusCode === 200 ? 0 : 1)})"

# Start application
CMD ["node", "server.js"]
