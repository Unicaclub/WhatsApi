FROM node:22.17.1-alpine AS base
WORKDIR /usr/src/whatsapi-server
ENV NODE_ENV=production PUPPETEER_SKIP_CHROMIUM_DOWNLOAD=true

# Install system dependencies
RUN apk update && \
    apk add --no-cache \
    chromium \
    nss \
    freetype \
    harfbuzz \
    ca-certificates \
    ttf-freefont \
    python3 \
    make \
    g++ \
    && rm -rf /var/cache/apk/*

# Copy package files
COPY package.json ./

# Install dependencies using npm instead of yarn
RUN npm ci --only=production --no-audit --no-fund && \
    npm cache clean --force

FROM base AS build
WORKDIR /usr/src/whatsapi-server
ENV PUPPETEER_SKIP_CHROMIUM_DOWNLOAD=true

# Copy package files for build
COPY package.json ./
RUN npm ci --no-audit --no-fund
RUN npm cache clean --force

# Copy source code and build
COPY . .
RUN npm run build

FROM base AS production
WORKDIR /usr/src/whatsapi-server/

# Copy built application from build stage
COPY --from=build /usr/src/whatsapi-server/dist ./dist
COPY --from=build /usr/src/whatsapi-server/src ./src
COPY --from=build /usr/src/whatsapi-server/package.json ./package.json

# Set Puppeteer to use system Chromium
ENV PUPPETEER_EXECUTABLE_PATH=/usr/bin/chromium-browser

# Expose port (updated to match config)
EXPOSE 21466

# Start the application
ENTRYPOINT ["node", "dist/server.js"]
