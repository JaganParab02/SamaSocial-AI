# Multi-stage Dockerfile for React/Vite Frontend
FROM node:20-slim AS builder

WORKDIR /app

# Copy dependency files
COPY package.json package-lock.json* ./

# Install dependencies
RUN npm ci

# Copy application code
COPY . .

# Build the Vite application for production
RUN npm run build

# Production server using serve
FROM node:20-slim AS runner

WORKDIR /app

# Install simple HTTP server
RUN npm install -g serve

# Copy compiled build from builder stage
COPY --from=builder /app/dist ./dist

EXPOSE 5173

# Serve the static files
CMD ["serve", "-s", "dist", "-l", "5173"]
