# Multi-stage Dockerfile for Drone Management System

# Stage 1: Frontend Build
FROM node:20-alpine AS frontend-builder
WORKDIR /app

# Accept build arguments
ARG NEXT_PUBLIC_SUPABASE_URL
ARG NEXT_PUBLIC_SUPABASE_ANON_KEY
ARG NEXT_PUBLIC_API_BASE_URL
ARG NEXT_PUBLIC_ARCGIS_API_KEY

# Set as environment variables for the build
ENV NEXT_PUBLIC_SUPABASE_URL=$NEXT_PUBLIC_SUPABASE_URL
ENV NEXT_PUBLIC_SUPABASE_ANON_KEY=$NEXT_PUBLIC_SUPABASE_ANON_KEY
ENV NEXT_PUBLIC_API_BASE_URL=$NEXT_PUBLIC_API_BASE_URL
ENV NEXT_PUBLIC_ARCGIS_API_KEY=$NEXT_PUBLIC_ARCGIS_API_KEY

COPY package*.json ./
RUN npm ci
COPY . .
RUN npm run build

# Stage 2: Frontend Production
FROM node:20-alpine AS frontend
WORKDIR /app
ENV NODE_ENV=production
COPY --from=frontend-builder /app/.next ./.next
COPY --from=frontend-builder /app/package*.json ./
RUN npm ci --only=production
# Create public directory if it doesn't exist
RUN mkdir -p ./public || true
EXPOSE 3000
CMD ["npm", "start"]

# Stage 3: Backend
FROM python:3.11-slim AS backend
WORKDIR /app
COPY backend/requirements.txt .
RUN pip install --no-cache-dir -r requirements.txt
COPY backend/ .
EXPOSE 5000
CMD ["uvicorn", "app:app", "--host", "0.0.0.0", "--port", "5000"]

