# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Development Commands

### Build and Development
- `npm run dev` - Start development server with hot reload using tsx
- `npm run build` - Build the project (TypeScript compilation + Babel transpilation)
- `npm run build:types` - TypeScript compilation only
- `npm run build:js` - Babel transpilation only
- `npm run start` - Start production server from dist/server.js

### Testing and Quality
- `npm run lint` - Run ESLint on TypeScript files in src/
- `npm test` - Run Jest tests

### Documentation
- `npm run docs` - Generate Swagger documentation
- `npm run swagger:generate` - Generate complete Swagger UI assets

## Architecture Overview

This is a WhatsApp API server built with Node.js, Express, and TypeScript that provides RESTful endpoints for WhatsApp automation via the WPPConnect library.

### Core Components

**Server Entry Points:**
- `src/server.ts` - Main server entry point with environment loading
- `src/index.ts` - Server initialization and Express app setup
- `src/config.ts` - Central configuration with environment variable overrides

**Request Flow:**
1. Routes defined in `src/routes/index.ts` (950+ lines of comprehensive API endpoints)
2. Authentication via `src/middleware/auth.ts` (token verification)
3. Connection status check via `src/middleware/statusConnection.ts`
4. Controllers handle business logic (12 specialized controllers)
5. Utilities manage sessions, tokens, and WhatsApp connections

**Controllers (Feature-based):**
- `sessionController.ts` - Session management, QR codes, connection handling
- `messageController.ts` - Send/receive messages, files, media, reactions
- `groupController.ts` - Group creation, management, participant handling
- `deviceController.ts` - Contact management, chat operations, device info
- `catalogController.ts` - WhatsApp Business catalog/product management
- `statusController.ts` - WhatsApp Stories functionality
- Other specialized controllers for labels, communities, newsletters, etc.

**Session Management:**
- Multi-session support with isolated browser instances
- Token-based authentication using bcrypt
- File-based token storage with optional MongoDB/Redis support
- Browser session persistence in `userDataDir/` and `tokens/`

**WebSocket & Webhooks:**
- Socket.IO integration for real-time events
- Configurable webhook system for message events
- Support for AWS S3 file uploads
- ChatWoot integration for customer service

### Key Configuration

The server uses `src/config.ts` with environment variable overrides:
- `PORT` (default: 21466)
- `SECRET_KEY` (default: 'Mestre888') 
- `HOST` (default: 'http://localhost')
- Multiple webhook, database, and AWS S3 configuration options

### Token Authentication

API endpoints use Bearer token authentication:
1. Generate token: `POST /api/:session/:secretkey/generate-token`
2. Use token in Authorization header: `Bearer <token>`
3. Tokens are bcrypt-hashed and stored via configurable token store (file/MongoDB/Redis)

### Development Notes

- TypeScript source in `src/`, compiled output in `dist/`
- Comprehensive Swagger documentation available at `/api-docs`
- Multi-environment support via environment variables
- Extensive logging via Winston with configurable levels
- Browser automation uses Puppeteer with custom Chrome flags for stability
- File uploads handled via Multer with configurable storage
- Health check endpoints at `/health` and `/healthz` for monitoring

## Advanced Automation System (Zapi-like Features)

This project has been enhanced with advanced automation capabilities similar to Zapi:

### Core Services
- **AutomationEngine** (`src/services/AutomationEngine.ts`) - Main automation processing engine
- **QueueManager** (`src/services/QueueManager.ts`) - Advanced queue system with delays and scheduling
- **ContactSegmentation** (`src/services/ContactSegmentation.ts`) - Contact tagging and behavioral segmentation
- **TemplateEngine** (`src/services/TemplateEngine.ts`) - Dynamic message templates with variables
- **AnalyticsService** (`src/services/AnalyticsService.ts`) - Performance metrics and reporting
- **MultiChannelService** (`src/services/MultiChannelService.ts`) - WhatsApp, Telegram, Instagram, SMS support

### Database Schema
- Complete automation database schema in `src/database/migrations.sql`
- Models and types defined in `src/models/index.ts`
- Supports PostgreSQL/MySQL with JSON fields for flexible configuration

### API Endpoints
New automation endpoints added to routes:
- `POST /api/:session/automations` - Create automation
- `GET /api/:session/automations` - List user automations
- `PUT /api/:session/automations/:id` - Update automation
- `DELETE /api/:session/automations/:id` - Delete automation
- `POST /api/:session/automations/:id/toggle` - Enable/disable automation
- `POST /api/:session/automations/:id/test` - Test automation
- `GET /api/:session/automations/:id/analytics` - Get automation analytics
- `POST /api/webhook/automation` - Webhook for processing incoming messages

### Key Features
1. **Smart Triggers**: Keywords, schedules, webhooks, button clicks, conditions
2. **Advanced Actions**: Messages, tags, delays, conditions, webhooks, human transfer
3. **Queue System**: Priority-based processing with exponential backoff retry
4. **Contact Segmentation**: Tags, custom fields, behavioral metrics, lifecycle stages
5. **Template Engine**: Dynamic variables, formatting, WhatsApp Business templates
6. **Analytics**: Performance tracking, conversion rates, engagement metrics
7. **Multi-Channel**: Extensible architecture for multiple messaging platforms

### Integration Guide
See `INTEGRATION_GUIDE.md` for complete setup and usage instructions including:
- Database setup and configuration
- API usage examples
- Webhook configuration
- Analytics and monitoring
- Security best practices

### Dependencies Added
```bash
npm install node-fetch@2 node-cron bull ioredis pg sequelize
```

This transforms the basic WhatsApp server into a comprehensive automation platform with enterprise-grade features for marketing, customer service, and sales automation.