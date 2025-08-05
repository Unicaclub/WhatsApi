/*
 * Message Model - Sequelize
 */

import { DataTypes, Model, Optional } from 'sequelize';
import { sequelize } from '../connection';
import { Message as MessageInterface } from '../../models';
import { UserModel } from './User';
import { ContactModel } from './Contact';
import { AutomationModel } from './Automation';
import { MessageTemplateModel } from './MessageTemplate';

interface MessageCreationAttributes extends Optional<MessageInterface, 'id'> {}

export class MessageModel extends Model<MessageInterface, MessageCreationAttributes> implements MessageInterface {
  public id!: number;
  public user_id!: number;
  public contact_id!: number;
  public session_id!: string;
  public message_type!: 'text' | 'image' | 'audio' | 'video' | 'document';
  public content!: string;
  public media_url?: string;
  public direction!: 'inbound' | 'outbound';
  public status!: 'pending' | 'sent' | 'delivered' | 'read' | 'failed';
  public automation_id?: number;
  public template_id?: number;
  public timestamp!: Date;
  public channel!: 'whatsapp' | 'telegram' | 'instagram' | 'sms';
  public external_id?: string;
}

MessageModel.init(
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
    contact_id: {
      type: DataTypes.INTEGER,
      allowNull: false,
      references: {
        model: ContactModel,
        key: 'id'
      },
      onDelete: 'CASCADE'
    },
    session_id: {
      type: DataTypes.STRING(255),
      allowNull: false
    },
    message_type: {
      type: DataTypes.ENUM('text', 'image', 'audio', 'video', 'document'),
      allowNull: false
    },
    content: {
      type: DataTypes.TEXT,
      allowNull: false
    },
    media_url: {
      type: DataTypes.TEXT,
      allowNull: true
    },
    direction: {
      type: DataTypes.ENUM('inbound', 'outbound'),
      allowNull: false
    },
    status: {
      type: DataTypes.ENUM('pending', 'sent', 'delivered', 'read', 'failed'),
      allowNull: false,
      defaultValue: 'pending'
    },
    automation_id: {
      type: DataTypes.INTEGER,
      allowNull: true,
      references: {
        model: AutomationModel,
        key: 'id'
      }
    },
    template_id: {
      type: DataTypes.INTEGER,
      allowNull: true,
      references: {
        model: 'message_templates',
        key: 'id'
      }
    },
    timestamp: {
      type: DataTypes.DATE,
      allowNull: false,
      defaultValue: DataTypes.NOW
    },
    channel: {
      type: DataTypes.ENUM('whatsapp', 'telegram', 'instagram', 'sms'),
      allowNull: false,
      defaultValue: 'whatsapp'
    },
    external_id: {
      type: DataTypes.STRING(255),
      allowNull: true
    }
  },
  {
    sequelize,
    modelName: 'Message',
    tableName: 'messages',
    timestamps: false,
    underscored: true,
    indexes: [
      {
        fields: ['user_id', 'contact_id']
      },
      {
        fields: ['timestamp']
      },
      {
        fields: ['direction', 'status']
      },
      {
        fields: ['automation_id']
      }
    ]
  }
);

// Associations
MessageModel.belongsTo(UserModel, { foreignKey: 'user_id', as: 'user' });
MessageModel.belongsTo(ContactModel, { foreignKey: 'contact_id', as: 'contact' });
MessageModel.belongsTo(AutomationModel, { foreignKey: 'automation_id', as: 'automation' });