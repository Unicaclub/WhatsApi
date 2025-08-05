/*
 * QueueJob Model - Sequelize
 */

import { DataTypes, Model, Optional } from 'sequelize';
import { sequelize } from '../connection';
import { QueueJob as QueueJobInterface } from '../../models';
import { UserModel } from './User';

interface QueueJobCreationAttributes extends Optional<QueueJobInterface, 'id' | 'created_at' | 'updated_at'> {}

export class QueueJobModel extends Model<QueueJobInterface, QueueJobCreationAttributes> implements QueueJobInterface {
  public id!: number;
  public user_id!: number;
  public job_type!: 'send_message' | 'automation_action' | 'campaign_message';
  public priority!: number;
  public payload!: Record<string, any>;
  public scheduled_at!: Date;
  public attempts!: number;
  public max_attempts!: number;
  public status!: 'pending' | 'processing' | 'completed' | 'failed';
  public error_message?: string;
  public created_at!: Date;
  public updated_at!: Date;
}

QueueJobModel.init(
  {
    id: {
      type: DataTypes.INTEGER,
      primaryKey: true,
      autoIncrement: true
    },
    user_id: {
      type: DataTypes.INTEGER,
      allowNull: false,
      references: {
        model: UserModel,
        key: 'id'
      },
      onDelete: 'CASCADE'
    },
    job_type: {
      type: DataTypes.ENUM('send_message', 'automation_action', 'campaign_message'),
      allowNull: false
    },
    priority: {
      type: DataTypes.INTEGER,
      allowNull: false,
      defaultValue: 0
    },
    payload: {
      type: DataTypes.JSON,
      allowNull: false,
      defaultValue: {}
    },
    scheduled_at: {
      type: DataTypes.DATE,
      allowNull: false,
      defaultValue: DataTypes.NOW
    },
    attempts: {
      type: DataTypes.INTEGER,
      allowNull: false,
      defaultValue: 0
    },
    max_attempts: {
      type: DataTypes.INTEGER,
      allowNull: false,
      defaultValue: 3
    },
    status: {
      type: DataTypes.ENUM('pending', 'processing', 'completed', 'failed'),
      allowNull: false,
      defaultValue: 'pending'
    },
    error_message: {
      type: DataTypes.TEXT,
      allowNull: true
    },
    created_at: {
      type: DataTypes.DATE,
      allowNull: false,
      defaultValue: DataTypes.NOW
    },
    updated_at: {
      type: DataTypes.DATE,
      allowNull: false,
      defaultValue: DataTypes.NOW
    }
  },
  {
    sequelize,
    modelName: 'QueueJob',
    tableName: 'queue_jobs',
    timestamps: true,
    underscored: true,
    createdAt: 'created_at',
    updatedAt: 'updated_at',
    indexes: [
      {
        fields: ['status', 'scheduled_at']
      },
      {
        fields: ['user_id']
      },
      {
        fields: ['job_type']
      }
    ]
  }
);

// Associations
QueueJobModel.belongsTo(UserModel, { foreignKey: 'user_id', as: 'user' });