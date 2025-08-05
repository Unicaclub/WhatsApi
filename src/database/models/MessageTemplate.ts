/*
 * MessageTemplate Model - Sequelize
 */

import { DataTypes, Model, Optional } from 'sequelize';
import { sequelize } from '../connection';
import { MessageTemplate as MessageTemplateInterface } from '../../models';
import { UserModel } from './User';

interface MessageTemplateCreationAttributes extends Optional<MessageTemplateInterface, 'id' | 'created_at' | 'updated_at'> {}

export class MessageTemplateModel extends Model<MessageTemplateInterface, MessageTemplateCreationAttributes> implements MessageTemplateInterface {
  public id!: number;
  public user_id!: number;
  public name!: string;
  public category!: 'marketing' | 'utility' | 'authentication';
  public language!: string;
  public status!: 'pending' | 'approved' | 'rejected';
  public template_type!: 'text' | 'media' | 'interactive';
  public content!: {
    text?: string;
    media_url?: string;
    buttons?: Array<{
      type: 'quick_reply' | 'url' | 'phone';
      text: string;
      payload?: string;
      url?: string;
      phone?: string;
    }>;
    variables?: Array<{
      name: string;
      example: string;
    }>;
  };
  public created_at!: Date;
  public updated_at!: Date;
}

MessageTemplateModel.init(
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
    category: {
      type: DataTypes.ENUM('marketing', 'utility', 'authentication'),
      allowNull: false,
      defaultValue: 'utility'
    },
    language: {
      type: DataTypes.STRING(10),
      allowNull: false,
      defaultValue: 'pt_BR'
    },
    status: {
      type: DataTypes.ENUM('pending', 'approved', 'rejected'),
      allowNull: false,
      defaultValue: 'pending'
    },
    template_type: {
      type: DataTypes.ENUM('text', 'media', 'interactive'),
      allowNull: false,
      defaultValue: 'text'
    },
    content: {
      type: DataTypes.JSON,
      allowNull: false,
      defaultValue: {}
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
    modelName: 'MessageTemplate',
    tableName: 'message_templates',
    timestamps: true,
    underscored: true,
    createdAt: 'created_at',
    updatedAt: 'updated_at',
    indexes: [
      {
        fields: ['user_id']
      },
      {
        fields: ['category']
      },
      {
        fields: ['status']
      }
    ]
  }
);

// Associations
MessageTemplateModel.belongsTo(UserModel, { foreignKey: 'user_id', as: 'user' });