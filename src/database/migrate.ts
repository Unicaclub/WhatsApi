/*
 * Database Migration Script
 * Initializes PostgreSQL database with all required tables
 */

import { dbConnection } from './connection';
import { logger } from '../index';

// Import all models to ensure they are registered
import './models';

async function runMigrations(): Promise<void> {
  try {
    logger.info('🚀 Starting database migration...');

    // Connect to database
    await dbConnection.connect();

    // Sync all models (creates tables if they don't exist)
    await dbConnection.sequelize.sync({ 
      force: process.env.FORCE_SYNC === 'true', // Only use in development
      alter: process.env.NODE_ENV === 'development'
    });

    logger.info('✅ Database migration completed successfully!');

    // Verify tables were created
    const tableNames = await dbConnection.sequelize.getQueryInterface().showAllTables();
    logger.info('📊 Created tables:', tableNames);

  } catch (error) {
    logger.error('❌ Migration failed:', error);
    throw error;
  } finally {
    await dbConnection.disconnect();
  }
}

// Run migrations if this file is executed directly
if (require.main === module) {
  runMigrations()
    .then(() => {
      console.log('Migration completed successfully!');
      process.exit(0);
    })
    .catch((error) => {
      console.error('Migration failed:', error);
      process.exit(1);
    });
}

export { runMigrations };