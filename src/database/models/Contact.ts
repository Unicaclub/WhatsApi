/*
 * Contact Model - Sequelize
 */

import { DataTypes, Model, Optional } from 'sequelize';
import { sequelize } from '../connection';
import { Contact as ContactInterface } from '../../models';
import { UserModel } from './User';

interface ContactCreationAttributes extends Optional<ContactInterface, 'id' | 'created_at' | 'updated_at'> {}

export class ContactModel extends Model<ContactInterface, ContactCreationAttributes> implements ContactInterface {
  public id!: number;
  public user_id!: number;
  public phone!: string;
  public name?: string;
  public email?: string;
  public tags!: string[];
  public custom_fields!: Record<string, any>;
  public last_interaction!: Date;
  public channel!: 'whatsapp' | 'telegram' | 'instagram' | 'sms';
  public status!: 'active' | 'blocked' | 'inactive';
  public created_at!: Date;
  public updated_at!: Date;
}

ContactModel.init(
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
    phone: {
      type: DataTypes.STRING(20),
      allowNull: false
    },
    name: {
      type: DataTypes.STRING(255),
      allowNull: true
    },
    email: {
      type: DataTypes.STRING(255),
      allowNull: true,
      validate: {
        isEmail: true
      }
    },
    tags: {
      type: DataTypes.JSON,
      allowNull: false,
      defaultValue: []
    },
    custom_fields: {
      type: DataTypes.JSON,
      allowNull: false,
      defaultValue: {}
    },
    last_interaction: {
      type: DataTypes.DATE,
      allowNull: true
    },
    channel: {
      type: DataTypes.ENUM('whatsapp', 'telegram', 'instagram', 'sms'),
      allowNull: false,
      defaultValue: 'whatsapp'
    },
    status: {
      type: DataTypes.ENUM('active', 'blocked', 'inactive'),
      allowNull: false,
      defaultValue: 'active'
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
    modelName: 'Contact',
    tableName: 'contacts',
    timestamps: true,
    underscored: true,
    createdAt: 'created_at',
    updatedAt: 'updated_at',
    indexes: [
      {
        unique: true,
        fields: ['user_id', 'phone', 'channel']
      },
      {
        fields: ['user_id', 'phone']
      },
      {
        fields: ['tags'],
        using: 'gin'
      }
    ]
  }
);

// Associations
ContactModel.belongsTo(UserModel, { foreignKey: 'user_id', as: 'user' });