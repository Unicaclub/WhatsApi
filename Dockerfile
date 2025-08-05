# Ultra-simple Railway Dockerfile
FROM node:18-alpine

# Install Chrome dependencies
RUN apk add --no-cache \
    chromium \
    nss \
    freetype \
    freetype-dev \
    harfbuzz \
    ca-certificates \
    ttf-freefont \
    && rm -rf /var/cache/apk/*

# Set working directory
WORKDIR /app

# Set environment variables
ENV PUPPETEER_SKIP_CHROMIUM_DOWNLOAD=true
ENV PUPPETEER_EXECUTABLE_PATH=/usr/bin/chromium
ENV NODE_ENV=production


# Corrige o executável chromium-browser para chromium
RUN ln -sf /usr/bin/chromium /usr/bin/chromium-browser

# Copy only package.json first
COPY package.json ./

# Install dependencies with npm install (not npm ci)
RUN npm install --production --legacy-peer-deps --no-audit --no-fund && \
    npm cache clean --force

# Copy source code
COPY . .

# Build application
RUN npm run build

# Expose port (Railway will set this)
EXPOSE 21466

# Start application
CMD ["node", "dist/server.js"]
