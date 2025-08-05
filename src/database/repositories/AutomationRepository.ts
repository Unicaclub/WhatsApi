/*
 * Automation Repository
 * Database operations for automations
 */

import { Op } from 'sequelize';
import { logger } from '../../index';
import { AutomationModel, UserModel } from '../models';
import { Automation } from '../../models';

export class AutomationRepository {
  async create(automationData: Omit<Automation, 'id' | 'created_at' | 'updated_at'>): Promise<Automation> {
    try {
      const automation = await AutomationModel.create(automationData);
      logger.debug(`Created automation ${automation.id} for user ${automation.user_id}`);
      return automation.toJSON() as Automation;
    } catch (error) {
      logger.error('Error creating automation:', error);
      throw error;
    }
  }

  async findById(id: number): Promise<Automation | null> {
    try {
      const automation = await AutomationModel.findByPk(id, {
        include: [
          {
            model: UserModel,
            as: 'user',
            attributes: ['id', 'name', 'email']
          }
        ]
      });
      
      return automation ? automation.toJSON() as Automation : null;
    } catch (error) {
      logger.error(`Error finding automation ${id}:`, error);
      throw error;
    }
  }

  async findByUserId(userId: number, filters?: {
    status?: 'active' | 'inactive';
    trigger_type?: string;
    limit?: number;
    offset?: number;
  }): Promise<{ automations: Automation[]; total: number }> {
    try {
      const where: any = { user_id: userId };
      
      if (filters?.status) {
        where.is_active = filters.status === 'active';
      }
      
      if (filters?.trigger_type) {
        where.trigger_type = filters.trigger_type;
      }

      const { count, rows } = await AutomationModel.findAndCountAll({
        where,
        limit: filters?.limit || 50,
        offset: filters?.offset || 0,
        order: [['created_at', 'DESC']],
        include: [
          {
            model: UserModel,
            as: 'user',
            attributes: ['id', 'name', 'email']
          }
        ]
      });

      return {
        automations: rows.map(row => row.toJSON() as Automation),
        total: count
      };
    } catch (error) {
      logger.error(`Error finding automations for user ${userId}:`, error);
      throw error;
    }
  }

  async findActiveByTriggerType(triggerType: string): Promise<Automation[]> {
    try {
      const automations = await AutomationModel.findAll({
        where: {
          trigger_type: triggerType,
          is_active: true
        },
        include: [
          {
            model: UserModel,
            as: 'user',
            attributes: ['id', 'name', 'email']
          }
        ]
      });

      return automations.map(automation => automation.toJSON() as Automation);
    } catch (error) {
      logger.error(`Error finding active automations by trigger type ${triggerType}:`, error);
      throw error;
    }
  }

  async findActiveByUserId(userId: number): Promise<Automation[]> {
    try {
      const automations = await AutomationModel.findAll({
        where: {
          user_id: userId,
          is_active: true
        },
        order: [['created_at', 'DESC']]
      });

      return automations.map(automation => automation.toJSON() as Automation);
    } catch (error) {
      logger.error(`Error finding active automations for user ${userId}:`, error);
      throw error;
    }
  }

  async update(id: number, updates: Partial<Automation>): Promise<Automation | null> {
    try {
      const [affectedCount] = await AutomationModel.update(updates, {
        where: { id }
      });

      if (affectedCount === 0) {
        return null;
      }

      const updatedAutomation = await this.findById(id);
      logger.debug(`Updated automation ${id}`);
      return updatedAutomation;
    } catch (error) {
      logger.error(`Error updating automation ${id}:`, error);
      throw error;
    }
  }

  async delete(id: number): Promise<boolean> {
    try {
      const affectedCount = await AutomationModel.destroy({
        where: { id }
      });

      const deleted = affectedCount > 0;
      if (deleted) {
        logger.debug(`Deleted automation ${id}`);
      }
      return deleted;
    } catch (error) {
      logger.error(`Error deleting automation ${id}:`, error);
      throw error;
    }
  }

  async toggleActive(id: number, isActive: boolean): Promise<Automation | null> {
    try {
      return await this.update(id, { is_active: isActive });
    } catch (error) {
      logger.error(`Error toggling automation ${id}:`, error);
      throw error;
    }
  }

  async findByKeywords(userId: number, keywords: string[]): Promise<Automation[]> {
    try {
      const automations = await AutomationModel.findAll({
        where: {
          user_id: userId,
          is_active: true,
          trigger_type: 'keyword'
        }
      });

      // Filter by keywords in trigger_config
      return automations
        .filter(automation => {
          const config = automation.trigger_config as any;
          const automationKeywords = config.keywords || [];
          return keywords.some(keyword => 
            automationKeywords.some((autoKeyword: string) => 
              keyword.toLowerCase().includes(autoKeyword.toLowerCase()) ||
              autoKeyword.toLowerCase().includes(keyword.toLowerCase())
            )
          );
        })
        .map(automation => automation.toJSON() as Automation);
    } catch (error) {
      logger.error(`Error finding automations by keywords for user ${userId}:`, error);
      throw error;
    }
  }

  async getStats(userId: number): Promise<{
    total: number;
    active: number;
    inactive: number;
    by_trigger_type: Record<string, number>;
  }> {
    try {
      const automations = await AutomationModel.findAll({
        where: { user_id: userId },
        attributes: ['trigger_type', 'is_active']
      });

      const stats = {
        total: automations.length,
        active: 0,
        inactive: 0,
        by_trigger_type: {} as Record<string, number>
      };

      automations.forEach(automation => {
        if (automation.is_active) {
          stats.active++;
        } else {
          stats.inactive++;
        }

        const triggerType = automation.trigger_type;
        stats.by_trigger_type[triggerType] = (stats.by_trigger_type[triggerType] || 0) + 1;
      });

      return stats;
    } catch (error) {
      logger.error(`Error getting automation stats for user ${userId}:`, error);
      throw error;
    }
  }

  async findScheduledAutomations(): Promise<Automation[]> {
    try {
      const now = new Date();
      const automations = await AutomationModel.findAll({
        where: {
          trigger_type: 'schedule',
          is_active: true
        }
      });

      // Filter automations that should be triggered now
      return automations
        .filter(automation => {
          const config = automation.trigger_config as any;
          const schedule = config.schedule;
          
          if (!schedule) return false;

          // Simple time-based scheduling logic
          if (schedule.type === 'daily' && schedule.time) {
            const [hours, minutes] = schedule.time.split(':').map(Number);
            const scheduleTime = new Date();
            scheduleTime.setHours(hours, minutes, 0, 0);
            
            // Check if we're within 1 minute of the scheduled time
            const diff = Math.abs(now.getTime() - scheduleTime.getTime());
            return diff <= 60000; // 1 minute tolerance
          }

          return false;
        })
        .map(automation => automation.toJSON() as Automation);
    } catch (error) {
      logger.error('Error finding scheduled automations:', error);
      throw error;
    }
  }

  async recordExecution(automationId: number, success: boolean, errorMessage?: string): Promise<void> {
    try {
      // This could be expanded to store execution history in a separate table
      logger.info(`Automation ${automationId} execution: ${success ? 'SUCCESS' : 'FAILED'}${errorMessage ? ` - ${errorMessage}` : ''}`);
    } catch (error) {
      logger.error(`Error recording automation execution:`, error);
    }
  }

  async searchByName(userId: number, searchTerm: string): Promise<Automation[]> {
    try {
      const automations = await AutomationModel.findAll({
        where: {
          user_id: userId,
          [Op.or]: [
            { name: { [Op.iLike]: `%${searchTerm}%` } },
            { description: { [Op.iLike]: `%${searchTerm}%` } }
          ]
        },
        order: [['created_at', 'DESC']]
      });

      return automations.map(automation => automation.toJSON() as Automation);
    } catch (error) {
      logger.error(`Error searching automations for user ${userId}:`, error);
      throw error;
    }
  }
}