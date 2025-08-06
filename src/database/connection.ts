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
      // Check if it's SQLite URL
      if (databaseUrl.startsWith('sqlite:')) {
        this.sequelize = new Sequelize(databaseUrl, {
          dialect: 'sqlite',
          logging: process.env.NODE_ENV === 'development' ? console.log : false,
          storage: databaseUrl.replace('sqlite:', '')
        });
      } else {
        // PostgreSQL Production: Use DATABASE_URL
        this.sequelize = new Sequelize(databaseUrl, {
          dialect: 'postgres',
          logging: process.env.NODE_ENV === 'development' ? false : false, // Disable logging in production
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
      }
    } else {
      // Development: Default to SQLite for simplicity
      this.sequelize = new Sequelize({
        dialect: 'sqlite',
        storage: './database.sqlite',
        logging: process.env.NODE_ENV === 'development' ? console.log : false
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