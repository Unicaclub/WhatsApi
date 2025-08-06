/*
 * User Model - Sequelize
 */

import { DataTypes, Model, Optional } from 'sequelize';
import { sequelize } from '../connection';
import { User as UserInterface } from '../../models';

interface UserCreationAttributes extends Optional<UserInterface, 'id' | 'created_at' | 'updated_at'> {}

export class UserModel extends Model<UserInterface, UserCreationAttributes> implements UserInterface {
  public id!: number;
  public email!: string;
  public name!: string;
  public password!: string;
  public plan_type!: string;
  public api_key!: string;
  public created_at!: Date;
  public updated_at!: Date;
} 

UserModel.init(
  {
    id: {
      type: DataTypes.INTEGER,
      primaryKey: true,
      autoIncrement: true
    },
    email: {
      type: DataTypes.STRING(255),
      allowNull: false,
      unique: true,
      validate: {
        isEmail: true
      }
    },
    name: {
      type: DataTypes.STRING(255),
      allowNull: false
    },
    password: {
      type: DataTypes.STRING(255),
      allowNull: false
    },
    plan_type: {
      type: DataTypes.STRING(50),
      allowNull: false,
      defaultValue: 'free'
    },
    api_key: {
      type: DataTypes.STRING(255),
      allowNull: false,
      unique: true
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
    modelName: 'User',
    tableName: 'users',
    timestamps: true,
    underscored: true,
    createdAt: 'created_at',
    updatedAt: 'updated_at'
  }
);