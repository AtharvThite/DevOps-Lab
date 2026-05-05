# ==========================================
# Stage 1: Build the Vite/React Frontend
# ==========================================
FROM node:20-alpine AS frontend-builder

WORKDIR /app/frontend

# Copy frontend dependency files and install
COPY frontend/package*.json ./
RUN npm install

# Copy the rest of the frontend code and build it
COPY frontend/ ./
RUN npm run build

# ==========================================
# Stage 2: Set up the Node.js Backend
# ==========================================
FROM node:20-alpine

WORKDIR /app/backend

# Copy backend dependency files and install
COPY backend/package*.json ./
RUN npm install

# Copy the rest of the backend code
COPY backend/ ./

# Copy the built frontend static files from Stage 1 into the backend's public folder
COPY --from=frontend-builder /app/frontend/dist ./public

# Expose the backend port (adjust if your backend uses a different port)
EXPOSE 5000

# Start the unified server
CMD ["npm", "start"]