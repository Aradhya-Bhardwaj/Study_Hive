# ==========================================
# Stage 1: Build Phase (NodeJS Environment)
# ==========================================
FROM node:22-alpine AS builder

WORKDIR /app

# Copy dependency specifications
COPY package.json package-lock.json ./

# Installation of dependencies
RUN npm install

# Copy all application files
COPY . .

# Compile optimized static files to /app/dist
RUN npm run build

# ==========================================
# Stage 2: Run Phase (Nginx Web Server)
# ==========================================
FROM nginx:alpine

# Clean up Nginx default HTML files
RUN rm -rf /usr/share/nginx/html/*

# Copy built files from Builder Stage
COPY --from=builder /app/dist /usr/share/nginx/html

# Copy custom Nginx configuration exposing stub_status
COPY nginx.conf /etc/nginx/conf.d/default.conf

# Expose port 80 (Internal container port)
EXPOSE 80

# Run Nginx in foreground mode
CMD ["nginx", "-g", "daemon off;"]
