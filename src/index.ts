/*
 * Copyright 2021 WPPConnect Team
 *
 * Licensed under the Apache License, Version 2.0 (the "License");
 * you may not use this file except in compliance with the License.
 * You may obtain a copy of the License at
 *
 *     http://www.apache.org/licenses/LICENSE-2.0
 *
 * Unless required by applicable law or agreed to in writing, software
 * distributed under the License is distributed on an "AS IS" BASIS,
 * WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
 * See the License for the specific language governing permissions and
 * limitations under the License.
 */

// Load environment variables
require('dotenv').config();

import { defaultLogger } from '@wppconnect-team/wppconnect';
import cors from 'cors';
import express, { Express, NextFunction, Router } from 'express';
import boolParser from 'express-query-boolean';
import { createServer } from 'http';
import mergeDeep from 'merge-deep';
import process from 'process';
import { Server as Socket } from 'socket.io';
import { Logger } from 'winston';

import { version } from '../package.json';
import config from './config';
import { convert } from './mapper/index';
import routes from './routes';
import { ServerOptions } from './types/ServerOptions';
import {
  createFolders,
  setMaxListners,
  startAllSessions,
} from './util/functions';
import { createLogger } from './util/logger';

//require('dotenv').config();

export const logger = createLogger(config.log);

// Initialize database connection on startup
import { dbConnection } from './database/connection';

// Initialize database when server starts
async function initializeDatabase(): Promise<void> {
  try {
    await dbConnection.connect();
    logger.info('🗄️ Database initialized successfully');
  } catch (error) {
    logger.error('❌ Failed to initialize database:', error);
    // Don't crash the server, but log the error
  }
}

// Call database initialization
initializeDatabase();

export function initServer(serverOptions: Partial<ServerOptions>): {
  app: Express;
  routes: Router;
  logger: Logger;
} {
  console.log('🎯 initServer called');
  console.log('⚙️ serverOptions received:', serverOptions ? 'yes' : 'no');
  
  if (typeof serverOptions !== 'object') {
    serverOptions = {};
  }

  serverOptions = mergeDeep({}, config, serverOptions);
  console.log('🔧 Final serverOptions port:', serverOptions.port);
  console.log('🔑 Final serverOptions secretKey:', serverOptions.secretKey ? 'configured' : 'not configured');
  
  defaultLogger.level = serverOptions?.log?.level
    ? serverOptions.log.level
    : 'silly';

  setMaxListners(serverOptions as ServerOptions);

  const app = express();
  const PORT = parseInt(String(process.env.PORT || serverOptions.port || '21466'));

  app.use(cors());
  app.use(express.json({ limit: '50mb' }));
  app.use(express.urlencoded({ limit: '50mb', extended: true }));
  app.use('/files', express.static('WhatsAppImages'));
  app.use(boolParser());

  if (config?.aws_s3?.access_key_id && config?.aws_s3?.secret_key) {
    process.env['AWS_ACCESS_KEY_ID'] = config.aws_s3.access_key_id;
    process.env['AWS_SECRET_ACCESS_KEY'] = config.aws_s3.secret_key;
  }

  // Add request options
  app.use((req: any, res: any, next: NextFunction) => {
    req.serverOptions = serverOptions;
    req.logger = logger;
    req.io = io as any;

    const oldSend = res.send;

    res.send = async function (data: any) {
      const content = req.headers['content-type'];
      if (content == 'application/json') {
        data = JSON.parse(data);
        if (!data.session) data.session = req.client ? req.client.session : '';
        if (data.mapper && req.serverOptions.mapper.enable) {
          data.response = await convert(
            req.serverOptions.mapper.prefix,
            data.response,
            data.mapper
          );
          delete data.mapper;
        }
      }
      res.send = oldSend;
      return res.send(data);
    };
    next();
  });

  // Add health check routes
  app.get('/', (req, res) => {
    console.log('📍 Root route accessed');
    res.json({
      status: 'ok',
      message: 'UnicaClub WhatsAPI Server is running',
      version: version,
      timestamp: new Date().toISOString(),
      routes: [
        '/',
        '/health',
        '/api',
        '/api-docs'
      ]
    });
  });

  app.get('/health', (req, res) => {
    console.log('🏥 Health check accessed');
    res.json({
      status: 'healthy',
      uptime: process.uptime(),
      timestamp: new Date().toISOString(),
      memory: process.memoryUsage(),
      environment: process.env.NODE_ENV
    });
  });

  // Add a catch-all route for debugging
  app.get('/test', (req, res) => {
    console.log('🧪 Test route accessed');
    res.json({
      message: 'Test route is working!',
      port: PORT,
      env: process.env.NODE_ENV,
      secretKey: serverOptions.secretKey ? 'configured' : 'not configured'
    });
  });

  // Debug route to check environment variables
  app.get('/debug', (req, res) => {
    console.log('🐛 Debug route accessed');
    res.json({
      environment: process.env.NODE_ENV,
      port: PORT,
      processPort: process.env.PORT,
      secretKey: process.env.SECRET_KEY ? 'configured' : 'not configured',
      host: process.env.HOST || 'not set',
      puppeteerSkip: process.env.PUPPETEER_SKIP_CHROMIUM_DOWNLOAD,
      configPort: serverOptions.port,
      configSecretKey: serverOptions.secretKey ? 'configured' : 'not configured'
    });
  });

  app.use(routes);

  createFolders();
  const http = createServer(app);
  const io = new Socket(http, {
    cors: {
      origin: '*',
    },
  });

  io.on('connection', (sock) => {
    logger.info(`ID: ${sock.id} entrou`);

    sock.on('disconnect', () => {
      logger.info(`ID: ${sock.id} saiu`);
    });
  });

  http.listen(PORT, '0.0.0.0', () => {
    console.log(`🚀 Server is running on port: ${PORT}`);
    console.log(`🌐 Server is listening on 0.0.0.0:${PORT}`);
    console.log(`📚 Visit http://localhost:${PORT}/api-docs for Swagger docs`);
    console.log(`🔧 Environment: ${process.env.NODE_ENV}`);
    console.log(`🔑 Secret Key configured: ${serverOptions.secretKey ? 'Yes' : 'No'}`);
    
    logger.info(`Server is running on port: ${PORT}`);
    logger.info(`Server is listening on 0.0.0.0:${PORT}`);
    logger.info(
      `\x1b[31m Visit ${serverOptions.host}:${PORT}/api-docs for Swagger docs`
    );
    logger.info(`WPPConnect-Server version: ${version}`);

    if (serverOptions.startAllSession) startAllSessions(serverOptions, logger);
  }).on('error', (err) => {
    console.error('❌ Server failed to start:', err);
    logger.error('Server failed to start:', err);
  });

  if (config.log.level === 'error' || config.log.level === 'warn') {
    console.log(`\x1b[33m ======================================================
Attention:
Your configuration is configured to show only a few logs, before opening an issue, 
please set the log to 'silly', copy the log that shows the error and open your issue.
======================================================
`);
  }

  return {
    app,
    routes,
    logger,
  };
}
