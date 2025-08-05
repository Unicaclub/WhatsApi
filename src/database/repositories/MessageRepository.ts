/*
 * Message Repository
 * Database operations for messages
 */

import { Op } from 'sequelize';
import { logger } from '../../index';
import { MessageModel, ContactModel, UserModel, AutomationModel } from '../models';
import { Message } from '../../models';

export class MessageRepository {
  async create(messageData: Omit<Message, 'id'>): Promise<Message> {
    try {
      const message = await MessageModel.create(messageData);
      logger.debug(`Created message ${message.id} for contact ${message.contact_id}`);
      return message.toJSON() as Message;
    } catch (error) {
      logger.error('Error creating message:', error);
      throw error;
    }
  }

  async findById(id: number): Promise<Message | null> {
    try {
      const message = await MessageModel.findByPk(id, {
        include: [
          {
            model: ContactModel,
            as: 'contact',
            attributes: ['id', 'name', 'phone']
          },
          {
            model: AutomationModel,
            as: 'automation',
            attributes: ['id', 'name']
          }
        ]
      });
      
      return message ? message.toJSON() as Message : null;
    } catch (error) {
      logger.error(`Error finding message ${id}:`, error);
      throw error;
    }
  }

  async findByContactId(
    contactId: number, 
    filters?: {
      direction?: 'inbound' | 'outbound';
      message_type?: string;
      limit?: number;
      offset?: number;
    }
  ): Promise<{ messages: Message[]; total: number }> {
    try {
      const where: any = { contact_id: contactId };
      
      if (filters?.direction) {
        where.direction = filters.direction;
      }
      
      if (filters?.message_type) {
        where.message_type = filters.message_type;
      }

      const { count, rows } = await MessageModel.findAndCountAll({
        where,
        limit: filters?.limit || 100,
        offset: filters?.offset || 0,
        order: [['timestamp', 'DESC']],
        include: [
          {
            model: ContactModel,
            as: 'contact',
            attributes: ['id', 'name', 'phone']
          }
        ]
      });

      return {
        messages: rows.map(row => row.toJSON() as Message),
        total: count
      };
    } catch (error) {
      logger.error(`Error finding messages for contact ${contactId}:`, error);
      throw error;
    }
  }

  async findByUserId(
    userId: number, 
    filters?: {
      direction?: 'inbound' | 'outbound';
      status?: string;
      channel?: string;
      start_date?: Date;
      end_date?: Date;
      limit?: number;
      offset?: number;
    }
  ): Promise<{ messages: Message[]; total: number }> {
    try {
      const where: any = { user_id: userId };
      
      if (filters?.direction) {
        where.direction = filters.direction;
      }
      
      if (filters?.status) {
        where.status = filters.status;
      }

      if (filters?.channel) {
        where.channel = filters.channel;
      }

      if (filters?.start_date || filters?.end_date) {
        where.timestamp = {};
        if (filters.start_date) {
          where.timestamp[Op.gte] = filters.start_date;
        }
        if (filters.end_date) {
          where.timestamp[Op.lte] = filters.end_date;
        }
      }

      const { count, rows } = await MessageModel.findAndCountAll({
        where,
        limit: filters?.limit || 100,
        offset: filters?.offset || 0,
        order: [['timestamp', 'DESC']],
        include: [
          {
            model: ContactModel,
            as: 'contact',
            attributes: ['id', 'name', 'phone']
          }
        ]
      });

      return {
        messages: rows.map(row => row.toJSON() as Message),
        total: count
      };
    } catch (error) {
      logger.error(`Error finding messages for user ${userId}:`, error);
      throw error;
    }
  }

  async updateStatus(id: number, status: 'pending' | 'sent' | 'delivered' | 'read' | 'failed'): Promise<Message | null> {
    try {
      const [affectedCount] = await MessageModel.update(
        { status },
        { where: { id } }
      );

      if (affectedCount === 0) {
        return null;
      }

      const updatedMessage = await this.findById(id);
      logger.debug(`Updated message ${id} status to ${status}`);
      return updatedMessage;
    } catch (error) {
      logger.error(`Error updating message ${id} status:`, error);
      throw error;
    }
  }

  async getMessageStats(userId: number, period: 'day' | 'week' | 'month' = 'week'): Promise<{
    total_sent: number;
    total_received: number;
    delivered: number;
    read: number;
    failed: number;
    by_channel: Record<string, { sent: number; received: number }>;
    by_day: Array<{ date: string; sent: number; received: number }>;
  }> {
    try {
      const startDate = this.getStartDate(period);
      const endDate = new Date();

      const messages = await MessageModel.findAll({
        where: {
          user_id: userId,
          timestamp: {
            [Op.between]: [startDate, endDate]
          }
        },
        attributes: ['direction', 'status', 'channel', 'timestamp']
      });

      const stats = {
        total_sent: 0,
        total_received: 0,
        delivered: 0,
        read: 0,
        failed: 0,
        by_channel: {} as Record<string, { sent: number; received: number }>,
        by_day: [] as Array<{ date: string; sent: number; received: number }>
      };

      // Initialize channel stats
      const channels = ['whatsapp', 'telegram', 'instagram', 'sms'];
      channels.forEach(channel => {
        stats.by_channel[channel] = { sent: 0, received: 0 };
      });

      // Process messages
      const dailyStats = new Map<string, { sent: number; received: number }>();

      messages.forEach(message => {
        const dateKey = message.timestamp.toISOString().split('T')[0];
        
        if (!dailyStats.has(dateKey)) {
          dailyStats.set(dateKey, { sent: 0, received: 0 });
        }

        const dayStats = dailyStats.get(dateKey)!;
        const channelStats = stats.by_channel[message.channel];

        if (message.direction === 'outbound') {
          stats.total_sent++;
          dayStats.sent++;
          if (channelStats) channelStats.sent++;
        } else {
          stats.total_received++;
          dayStats.received++;
          if (channelStats) channelStats.received++;
        }

        // Count status
        if (message.status === 'delivered') stats.delivered++;
        else if (message.status === 'read') stats.read++;
        else if (message.status === 'failed') stats.failed++;
      });

      // Convert daily stats to array
      stats.by_day = Array.from(dailyStats.entries())
        .map(([date, data]) => ({ date, ...data }))
        .sort((a, b) => a.date.localeCompare(b.date));

      return stats;
    } catch (error) {
      logger.error(`Error getting message stats for user ${userId}:`, error);
      throw error;
    }
  }

  async getConversationHistory(
    userId: number, 
    contactId: number, 
    limit: number = 50
  ): Promise<Message[]> {
    try {
      const messages = await MessageModel.findAll({
        where: {
          user_id: userId,
          contact_id: contactId
        },
        limit,
        order: [['timestamp', 'DESC']],
        include: [
          {
            model: ContactModel,
            as: 'contact',
            attributes: ['id', 'name', 'phone']
          }
        ]
      });

      return messages.map(message => message.toJSON() as Message).reverse();
    } catch (error) {
      logger.error(`Error getting conversation history for contact ${contactId}:`, error);
      throw error;
    }
  }

  async findLastMessageByContact(contactId: number): Promise<Message | null> {
    try {
      const message = await MessageModel.findOne({
        where: { contact_id: contactId },
        order: [['timestamp', 'DESC']]
      });

      return message ? message.toJSON() as Message : null;
    } catch (error) {
      logger.error(`Error finding last message for contact ${contactId}:`, error);
      throw error;
    }
  }

  async countUnreadMessages(userId: number): Promise<number> {
    try {
      const count = await MessageModel.count({
        where: {
          user_id: userId,
          direction: 'inbound',
          status: {
            [Op.in]: ['sent', 'delivered']
          }
        }
      });

      return count;
    } catch (error) {
      logger.error(`Error counting unread messages for user ${userId}:`, error);
      throw error;
    }
  }

  async findByAutomationId(automationId: number, limit: number = 100): Promise<Message[]> {
    try {
      const messages = await MessageModel.findAll({
        where: { automation_id: automationId },
        limit,
        order: [['timestamp', 'DESC']],
        include: [
          {
            model: ContactModel,
            as: 'contact',
            attributes: ['id', 'name', 'phone']
          }
        ]
      });

      return messages.map(message => message.toJSON() as Message);
    } catch (error) {
      logger.error(`Error finding messages for automation ${automationId}:`, error);
      throw error;
    }
  }

  async getResponseRate(userId: number, period: 'day' | 'week' | 'month' = 'week'): Promise<number> {
    try {
      const startDate = this.getStartDate(period);
      const endDate = new Date();

      const sentMessages = await MessageModel.count({
        where: {
          user_id: userId,
          direction: 'outbound',
          timestamp: {
            [Op.between]: [startDate, endDate]
          }
        }
      });

      const receivedMessages = await MessageModel.count({
        where: {
          user_id: userId,
          direction: 'inbound',
          timestamp: {
            [Op.between]: [startDate, endDate]
          }
        }
      });

      return sentMessages > 0 ? (receivedMessages / sentMessages) * 100 : 0;
    } catch (error) {
      logger.error(`Error calculating response rate for user ${userId}:`, error);
      throw error;
    }
  }

  async deleteOldMessages(olderThanDays: number = 90): Promise<number> {
    try {
      const cutoffDate = new Date();
      cutoffDate.setDate(cutoffDate.getDate() - olderThanDays);

      const deletedCount = await MessageModel.destroy({
        where: {
          timestamp: {
            [Op.lt]: cutoffDate
          }
        }
      });

      logger.info(`Deleted ${deletedCount} old messages (older than ${olderThanDays} days)`);
      return deletedCount;
    } catch (error) {
      logger.error('Error deleting old messages:', error);
      throw error;
    }
  }

  private getStartDate(period: 'day' | 'week' | 'month'): Date {
    const now = new Date();
    switch (period) {
      case 'day':
        return new Date(now.getFullYear(), now.getMonth(), now.getDate());
      case 'week':
        const weekStart = new Date(now);
        weekStart.setDate(now.getDate() - now.getDay());
        return weekStart;
      case 'month':
        return new Date(now.getFullYear(), now.getMonth(), 1);
      default:
        return new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);
    }
  }
}