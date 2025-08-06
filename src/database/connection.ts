/*
 * Database Connection Service
 * PostgreSQL connection using Sequelize ORM
 */

import { Sequelize } from 'sequelize';
import { logger } from '../index';

class DatabaseConnection {
  private static instance: DatabaseConnection;
  public sequelize: Sequelize;

  private constructor() {
    const databaseUrl = process.env.DATABASE_URL;
    
    if (databaseUrl) {
      // Production: Use DATABASE_URL
      this.sequelize = new Sequelize(databaseUrl, {
        dialect: 'postgres',
        logging: (msg) => logger.debug(msg),
        pool: {
          max: 20,
          min: 0,
          acquire: 30000,
          idle: 10000
        },
        dialectOptions: {
          ssl: process.env.NODE_ENV === 'production' ? {
            require: true,
            rejectUnauthorized: false
          } : false
        }
      });
    } else {
      // Development: Use individual environment variables
      this.sequelize = new Sequelize({
        dialect: 'postgres',
        host: process.env.DB_HOST || 'localhost',
        port: parseInt(process.env.DB_PORT || '5432'),
        database: process.env.DB_NAME || 'wppconnect_automation',
        username: process.env.DB_USER || 'postgres',
        password: process.env.DB_PASSWORD || '',
        logging: process.env.NODE_ENV === 'development' ? (msg) => logger.debug(msg) : false,
        pool: {
          max: 20,
          min: 0,
          acquire: 30000,
          idle: 10000
        },
        dialectOptions: {
          ssl: false
        }
      });
    }
  }

  public static getInstance(): DatabaseConnection {
    if (!DatabaseConnection.instance) {
      DatabaseConnection.instance = new DatabaseConnection();
    }
    return DatabaseConnection.instance;
  }

  public async connect(): Promise<void> {
    try {
      await this.sequelize.authenticate();
      logger.info('✅ Database connection established successfully');
      
      // Sync models em todos os ambientes (inclusive produção)
      await this.sequelize.sync({ alter: true });
      logger.info('📊 Database models synchronized');
    } catch (error) {
      logger.error('❌ Unable to connect to database:', error);
      throw error;
    }
  }

  public async disconnect(): Promise<void> {
    try {
      await this.sequelize.close();
      logger.info('🔌 Database connection closed');
    } catch (error) {
      logger.error('❌ Error closing database connection:', error);
      throw error;
    }
  }

  public async testConnection(): Promise<boolean> {
    try {
      await this.sequelize.authenticate();
      return true;
    } catch (error) {
      logger.error('Database connection test failed:', error);
      return false;
    }
  }
}

export const dbConnection = DatabaseConnection.getInstance();
export const sequelize = dbConnection.sequelize;