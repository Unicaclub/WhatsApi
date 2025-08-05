/*
 * Analytics Model - Sequelize
 */

import { DataTypes, Model, Optional } from 'sequelize';
import { sequelize } from '../connection';
import { Analytics as AnalyticsInterface } from '../../models';
import { UserModel } from './User';

interface AnalyticsCreationAttributes extends Optional<AnalyticsInterface, 'id'> {}

export class AnalyticsModel extends Model<AnalyticsInterface, AnalyticsCreationAttributes> implements AnalyticsInterface {
  public id!: number;
  public user_id!: number;
  public metric_type!: 'message' | 'automation' | 'campaign' | 'contact';
  public metric_name!: string;
  public value!: number;
  public metadata!: Record<string, any>;
  public period_start!: Date;
  public period_end!: Date;
  public created_at!: Date;
}

AnalyticsModel.init(
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
    metric_type: {
      type: DataTypes.ENUM('message', 'automation', 'campaign', 'contact'),
      allowNull: false
    },
    metric_name: {
      type: DataTypes.STRING(100),
      allowNull: false
    },
    value: {
      type: DataTypes.DECIMAL(15, 2),
      allowNull: false
    },
    metadata: {
      type: DataTypes.JSON,
      allowNull: false,
      defaultValue: {}
    },
    period_start: {
      type: DataTypes.DATE,
      allowNull: false
    },
    period_end: {
      type: DataTypes.DATE,
      allowNull: false
    },
    created_at: {
      type: DataTypes.DATE,
      allowNull: false,
      defaultValue: DataTypes.NOW
    }
  },
  {
    sequelize,
    modelName: 'Analytics',
    tableName: 'analytics',
    timestamps: false,
    underscored: true,
    indexes: [
      {
        fields: ['user_id', 'metric_type', 'period_start', 'period_end']
      },
      {
        fields: ['metric_name']
      },
      {
        fields: ['period_start', 'period_end']
      }
    ]
  }
);

// Associations
AnalyticsModel.belongsTo(UserModel, { foreignKey: 'user_id', as: 'user' });