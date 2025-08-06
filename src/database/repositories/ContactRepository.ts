/*
 * Contact Repository
 * Database operations for contacts
 */

import { Op } from 'sequelize';
import { logger } from '../../index';
import { ContactModel, UserModel, MessageModel } from '../models';
import { Contact } from '../../models';

export class ContactRepository {
  async create(contactData: Omit<Contact, 'id' | 'created_at' | 'updated_at'>): Promise<Contact> {
    try {
      const contact = await ContactModel.create(contactData);
      logger.debug(`Created contact ${contact.id} for user ${contact.user_id}`);
      return contact.toJSON() as Contact;
    } catch (error) {
      logger.error('Error creating contact:', error);
      throw error;
    }
  }

  async findById(id: number): Promise<Contact | null> {
    try {
      const contact = await ContactModel.findByPk(id, {
        include: [
          {
            model: UserModel,
            as: 'user',
            attributes: ['id', 'name', 'email']
          }
        ]
      });
      
      return contact ? contact.toJSON() as Contact : null;
    } catch (error) {
      logger.error(`Error finding contact ${id}:`, error);
      throw error;
    }
  }

  async findByPhone(userId: number, phone: string, channel: string = 'whatsapp'): Promise<Contact | null> {
    try {
      const contact = await ContactModel.findOne({
        where: {
          user_id: userId,
          phone,
          channel
        }
      });
      
      return contact ? contact.toJSON() as Contact : null;
    } catch (error) {
      logger.error(`Error finding contact by phone ${phone}:`, error);
      throw error;
    }
  }

  async findOrCreate(
    userId: number, 
    phone: string, 
    channel: string = 'whatsapp',
    additionalData?: Partial<Contact>
  ): Promise<{ contact: Contact; created: boolean }> {
    try {
      const [contact, created] = await ContactModel.findOrCreate({
        where: {
          user_id: userId,
          phone,
          channel: channel as 'whatsapp' | 'telegram' | 'instagram' | 'sms'
        },
        defaults: {
          user_id: userId,
          phone,
          channel: channel as 'whatsapp' | 'telegram' | 'instagram' | 'sms',
          tags: additionalData?.tags || [],
          custom_fields: additionalData?.custom_fields || {},
          status: (additionalData?.status as 'active' | 'blocked' | 'inactive') || 'active',
          name: additionalData?.name,
          last_interaction: additionalData?.last_interaction || new Date(),
          created_at: additionalData?.created_at || new Date(),
          updated_at: additionalData?.updated_at || new Date()
        }
      });

      logger.debug(`${created ? 'Created' : 'Found'} contact ${contact.id} for phone ${phone}`);
      
      return {
        contact: contact.toJSON() as Contact,
        created
      };
    } catch (error) {
      logger.error(`Error finding or creating contact for phone ${phone}:`, error);
      throw error;
    }
  }

  async findByUserId(userId: number, filters?: {
    status?: 'active' | 'blocked' | 'inactive';
    channel?: string;
    tags?: string[];
    search?: string;
    limit?: number;
    offset?: number;
  }): Promise<{ contacts: Contact[]; total: number }> {
    try {
      const where: any = { user_id: userId };
      
      if (filters?.status) {
        where.status = filters.status;
      }
      
      if (filters?.channel) {
        where.channel = filters.channel;
      }

      if (filters?.tags && filters.tags.length > 0) {
        where.tags = {
          [Op.overlap]: filters.tags
        };
      }

      if (filters?.search) {
        where[Op.or] = [
          { name: { [Op.iLike]: `%${filters.search}%` } },
          { phone: { [Op.iLike]: `%${filters.search}%` } },
          { email: { [Op.iLike]: `%${filters.search}%` } }
        ];
      }

      const { count, rows } = await ContactModel.findAndCountAll({
        where,
        limit: filters?.limit || 50,
        offset: filters?.offset || 0,
        order: [['last_interaction', 'DESC'], ['created_at', 'DESC']]
      });

      return {
        contacts: rows.map(row => row.toJSON() as Contact),
        total: count
      };
    } catch (error) {
      logger.error(`Error finding contacts for user ${userId}:`, error);
      throw error;
    }
  }

  async update(id: number, updates: Partial<Contact>): Promise<Contact | null> {
    try {
      const [affectedCount] = await ContactModel.update(updates, {
        where: { id }
      });

      if (affectedCount === 0) {
        return null;
      }

      const updatedContact = await this.findById(id);
      logger.debug(`Updated contact ${id}`);
      return updatedContact;
    } catch (error) {
      logger.error(`Error updating contact ${id}:`, error);
      throw error;
    }
  }

  async updateLastInteraction(id: number): Promise<void> {
    try {
      await ContactModel.update(
        { last_interaction: new Date() },
        { where: { id } }
      );
      logger.debug(`Updated last interaction for contact ${id}`);
    } catch (error) {
      logger.error(`Error updating last interaction for contact ${id}:`, error);
      throw error;
    }
  }

  async addTag(id: number, tag: string): Promise<Contact | null> {
    try {
      const contact = await ContactModel.findByPk(id);
      if (!contact) return null;

      const tags = contact.tags || [];
      if (!tags.includes(tag)) {
        tags.push(tag);
        await contact.update({ tags });
        logger.debug(`Added tag "${tag}" to contact ${id}`);
      }

      return contact.toJSON() as Contact;
    } catch (error) {
      logger.error(`Error adding tag to contact ${id}:`, error);
      throw error;
    }
  }  

  async removeTag(id: number, tag: string): Promise<Contact | null> {
    try {
      const contact = await ContactModel.findByPk(id);
      if (!contact) return null;

      const tags = contact.tags || [];
      const tagIndex = tags.indexOf(tag);
      if (tagIndex > -1) {
        tags.splice(tagIndex, 1);
        await contact.update({ tags });
        logger.debug(`Removed tag "${tag}" from contact ${id}`);
      }

      return contact.toJSON() as Contact;
    } catch (error) {
      logger.error(`Error removing tag from contact ${id}:`, error);
      throw error;
    }
  }

  async updateCustomField(id: number, fieldName: string, fieldValue: any): Promise<Contact | null> {
    try {
      const contact = await ContactModel.findByPk(id);
      if (!contact) return null;

      const customFields = { ...contact.custom_fields };
      customFields[fieldName] = fieldValue;
      
      await contact.update({ custom_fields: customFields });
      logger.debug(`Updated custom field "${fieldName}" for contact ${id}`);

      return contact.toJSON() as Contact;
    } catch (error) {
      logger.error(`Error updating custom field for contact ${id}:`, error);
      throw error;
    }
  }

  async findByTags(userId: number, tags: string[]): Promise<Contact[]> {
    try {
      const contacts = await ContactModel.findAll({
        where: {
          user_id: userId,
          tags: {
            [Op.overlap]: tags
          }
        },
        order: [['last_interaction', 'DESC']]
      });

      return contacts.map(contact => contact.toJSON() as Contact);
    } catch (error) {
      logger.error(`Error finding contacts by tags for user ${userId}:`, error);
      throw error;
    }
  }

  async findByCustomField(userId: number, fieldName: string, fieldValue: any): Promise<Contact[]> {
    try {
      const contacts = await ContactModel.findAll({
        where: {
          user_id: userId,
          custom_fields: {
            [fieldName]: fieldValue
          }
        },
        order: [['last_interaction', 'DESC']]
      });

      return contacts.map(contact => contact.toJSON() as Contact);
    } catch (error) {
      logger.error(`Error finding contacts by custom field for user ${userId}:`, error);
      throw error;
    }
  }

  async getStats(userId: number): Promise<{
    total: number;
    active: number;
    blocked: number;
    inactive: number;
    by_channel: Record<string, number>;
    recent_interactions: number;
  }> {
    try {
      const contacts = await ContactModel.findAll({
        where: { user_id: userId },
        attributes: ['status', 'channel', 'last_interaction']
      });

      const stats = {
        total: contacts.length,
        active: 0,
        blocked: 0,
        inactive: 0,
        by_channel: {} as Record<string, number>,
        recent_interactions: 0
      };

      const sevenDaysAgo = new Date();
      sevenDaysAgo.setDate(sevenDaysAgo.getDate() - 7);

      contacts.forEach(contact => {
        // Count by status
        if (contact.status === 'active') stats.active++;
        else if (contact.status === 'blocked') stats.blocked++;
        else stats.inactive++;

        // Count by channel
        const channel = contact.channel;
        stats.by_channel[channel] = (stats.by_channel[channel] || 0) + 1;

        // Count recent interactions
        if (contact.last_interaction && contact.last_interaction >= sevenDaysAgo) {
          stats.recent_interactions++;
        }
      });

      return stats;
    } catch (error) {
      logger.error(`Error getting contact stats for user ${userId}:`, error);
      throw error;
    }
  }

  async delete(id: number): Promise<boolean> {
    try {
      const affectedCount = await ContactModel.destroy({
        where: { id }
      });

      const deleted = affectedCount > 0;
      if (deleted) {
        logger.debug(`Deleted contact ${id}`);
      }
      return deleted;
    } catch (error) {
      logger.error(`Error deleting contact ${id}:`, error);
      throw error;
    }
  }

  async bulkUpdateTags(contactIds: number[], tag: string, action: 'add' | 'remove'): Promise<number> {
    try {
      const contacts = await ContactModel.findAll({
        where: {
          id: {
            [Op.in]: contactIds
          }
        }
      });

      let updatedCount = 0;
      for (const contact of contacts) {
        const tags = contact.tags || [];
        let updated = false;

        if (action === 'add' && !tags.includes(tag)) {
          tags.push(tag);
          updated = true;
        } else if (action === 'remove') {
          const tagIndex = tags.indexOf(tag);
          if (tagIndex > -1) {
            tags.splice(tagIndex, 1);
            updated = true;
          }
        }

        if (updated) {
          await contact.update({ tags });
          updatedCount++;
        }
      }

      logger.debug(`Bulk ${action} tag "${tag}" for ${updatedCount} contacts`);
      return updatedCount;
    } catch (error) {
      logger.error(`Error bulk updating tags:`, error);
      throw error;
    }
  }

  async findInactiveContacts(userId: number, daysSinceLastInteraction: number = 30): Promise<Contact[]> {
    try {
      const cutoffDate = new Date();
      cutoffDate.setDate(cutoffDate.getDate() - daysSinceLastInteraction);

      const contacts = await ContactModel.findAll({
        where: {
          user_id: userId,
          [Op.or]: [
            { last_interaction: { [Op.lt]: cutoffDate } },
            // @ts-ignore: Sequelize aceita null para [Op.is]
            { last_interaction: { [Op.is]: null as any } }
          ]
        },
        order: [['last_interaction', 'ASC']]
      });

      return contacts.map(contact => contact.toJSON() as Contact);
    } catch (error) {
      logger.error(`Error finding inactive contacts for user ${userId}:`, error);
      throw error;
    }
  }
}