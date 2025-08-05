/*
 * Automation Model - Sequelize
 */

import { DataTypes, Model, Optional } from 'sequelize';
import { sequelize } from '../connection';
import { Automation as AutomationInterface, AutomationAction } from '../../models';
import { UserModel } from './User';

interface AutomationCreationAttributes extends Optional<AutomationInterface, 'id' | 'created_at' | 'updated_at'> {}

export class AutomationModel extends Model<AutomationInterface, AutomationCreationAttributes> implements AutomationInterface {
  public id!: number;
  public user_id!: number;
  public name!: string;
  public description?: string;
  public trigger_type!: 'keyword' | 'schedule' | 'webhook' | 'button_click' | 'flow_start';
  public trigger_config!: {
    keywords?: string[];
    schedule?: {
      type: 'once' | 'daily' | 'weekly' | 'monthly';
      datetime?: string;
      days_of_week?: number[];
      time?: string;
    };
    webhook?: {
      url: string;
      method: 'GET' | 'POST';
      headers?: Record<string, string>;
    };
    conditions?: {
      tags?: string[];
      custom_fields?: Record<string, any>;
    };
  };
  public actions!: AutomationAction[];
  public is_active!: boolean;
  public created_at!: Date;
  public updated_at!: Date;
}

AutomationModel.init(
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
    name: {
      type: DataTypes.STRING(255),
      allowNull: false
    },
    description: {
      type: DataTypes.TEXT,
      allowNull: true
    },
    trigger_type: {
      type: DataTypes.ENUM('keyword', 'schedule', 'webhook', 'button_click', 'flow_start'),
      allowNull: false
    },
    trigger_config: {
      type: DataTypes.JSON,
      allowNull: false,
      defaultValue: {}
    },
    actions: {
      type: DataTypes.JSON,
      allowNull: false,
      defaultValue: []
    },
    is_active: {
      type: DataTypes.BOOLEAN,
      allowNull: false,
      defaultValue: true
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
    modelName: 'Automation',
    tableName: 'automations',
    timestamps: true,
    underscored: true,
    createdAt: 'created_at',
    updatedAt: 'updated_at',
    indexes: [
      {
        fields: ['user_id']
      },
      {
        fields: ['trigger_type']
      },
      {
        fields: ['is_active']
      }
    ]
  }
);

// Associations
AutomationModel.belongsTo(UserModel, { foreignKey: 'user_id', as: 'user' });