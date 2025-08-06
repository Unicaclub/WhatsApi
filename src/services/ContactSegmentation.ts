/*
 * Advanced Contact Segmentation System
 * Handles contact tagging, custom fields, and behavioral segmentation
 */

import { createLogger } from '../util/logger';
const logger = createLogger({ level: 'info', logger: ['console'] });
import { Contact } from '../models';

export interface SegmentationRule {
  id: string;
  name: string;
  type: 'tag' | 'custom_field' | 'behavior' | 'interaction' | 'demographic';
  operator: 'equals' | 'not_equals' | 'contains' | 'not_contains' | 'greater_than' | 'less_than' | 'in' | 'not_in' | 'exists' | 'not_exists';
  field: string;
  value: any;
  logic?: 'AND' | 'OR';
}

export interface ContactSegment {
  id: number;
  user_id: number;
  name: string;
  description?: string;
  rules: SegmentationRule[];
  auto_update: boolean;
  contact_count: number;
  created_at: Date;
  updated_at: Date;
}

export interface BehaviorMetric {
  contact_id: number;
  metric_name: string;
  metric_value: number;
  last_updated: Date;
}

export class ContactSegmentation {
  private behaviorMetrics: Map<number, Map<string, BehaviorMetric>> = new Map();

  constructor() {
    this.initializeBehaviorTracking();
  }

  private initializeBehaviorTracking(): void {
    // Initialize behavior tracking metrics
    logger.info('Contact segmentation system initialized');
  }

  async segmentContacts(
    userId: number, 
    rules: SegmentationRule[]
  ): Promise<Contact[]> {
    try {
      const allContacts = await this.getAllUserContacts(userId);
      const segmentedContacts: Contact[] = [];

      for (const contact of allContacts) {
        if (await this.contactMatchesRules(contact, rules)) {
          segmentedContacts.push(contact);
        }
      }

      logger.info(`Segmented ${segmentedContacts.length} contacts from ${allContacts.length} total`);
      return segmentedContacts;

    } catch (error) {
      logger.error('Error segmenting contacts:', error);
      throw error;
    }
  }

  private async contactMatchesRules(
    contact: Contact, 
    rules: SegmentationRule[]
  ): Promise<boolean> {
    if (rules.length === 0) return true;

    let result = await this.evaluateRule(contact, rules[0]);

    for (let i = 1; i < rules.length; i++) {
      const rule = rules[i];
      const ruleResult = await this.evaluateRule(contact, rule);
      
      if (rule.logic === 'OR') {
        result = result || ruleResult;
      } else {
        result = result && ruleResult;
      }
    }

    return result;
  }

  private async evaluateRule(
    contact: Contact, 
    rule: SegmentationRule
  ): Promise<boolean> {
    let fieldValue: any;

    // Get field value based on rule type
    switch (rule.type) {
      case 'tag':
        fieldValue = contact.tags;
        break;
      case 'custom_field':
        fieldValue = contact.custom_fields[rule.field];
        break;
      case 'behavior':
        fieldValue = await this.getBehaviorMetric(contact.id, rule.field);
        break;
      case 'interaction':
        fieldValue = await this.getInteractionMetric(contact.id, rule.field);
        break;
      case 'demographic':
        fieldValue = this.getDemographicField(contact, rule.field);
        break;
      default:
        return false;
    }

    // Evaluate based on operator
    return this.evaluateOperator(fieldValue, rule.operator, rule.value);
  }

  private evaluateOperator(fieldValue: any, operator: string, compareValue: any): boolean {
    switch (operator) {
      case 'equals':
        return fieldValue === compareValue;
      
      case 'not_equals':
        return fieldValue !== compareValue;
      
      case 'contains':
        if (Array.isArray(fieldValue)) {
          return fieldValue.includes(compareValue);
        }
        return String(fieldValue).toLowerCase().includes(String(compareValue).toLowerCase());
      
      case 'not_contains':
        if (Array.isArray(fieldValue)) {
          return !fieldValue.includes(compareValue);
        }
        return !String(fieldValue).toLowerCase().includes(String(compareValue).toLowerCase());
      
      case 'greater_than':
        return Number(fieldValue) > Number(compareValue);
      
      case 'less_than':
        return Number(fieldValue) < Number(compareValue);
      
      case 'in':
        return Array.isArray(compareValue) && compareValue.includes(fieldValue);
      
      case 'not_in':
        return Array.isArray(compareValue) && !compareValue.includes(fieldValue);
      
      case 'exists':
        return fieldValue !== null && fieldValue !== undefined && fieldValue !== '';
      
      case 'not_exists':
        return fieldValue === null || fieldValue === undefined || fieldValue === '';
      
      default:
        return false;
    }
  }

  private getDemographicField(contact: Contact, field: string): any {
    switch (field) {
      case 'name':
        return contact.name;
      case 'phone':
        return contact.phone;
      case 'email':
        return contact.email;
      case 'channel':
        return contact.channel;
      case 'status':
        return contact.status;
      case 'created_at':
        return contact.created_at;
      case 'last_interaction':
        return contact.last_interaction;
      default:
        return contact.custom_fields[field];
    }
  }

  private async getBehaviorMetric(contactId: number, metricName: string): Promise<number> {
    const contactMetrics = this.behaviorMetrics.get(contactId);
    if (!contactMetrics) return 0;
    
    const metric = contactMetrics.get(metricName);
    return metric ? metric.metric_value : 0;
  }

  private async getInteractionMetric(contactId: number, metricName: string): Promise<any> {
    switch (metricName) {
      case 'days_since_last_message':
        return await this.calculateDaysSinceLastMessage(contactId);
      case 'total_messages_received':
        return await this.getTotalMessagesReceived(contactId);
      case 'total_messages_sent':
        return await this.getTotalMessagesSent(contactId);
      case 'response_rate':
        return await this.calculateResponseRate(contactId);
      case 'avg_response_time':
        return await this.calculateAverageResponseTime(contactId);
      default:
        return 0;
    }
  }

  async updateBehaviorMetric(
    contactId: number, 
    metricName: string, 
    value: number
  ): Promise<void> {
    if (!this.behaviorMetrics.has(contactId)) {
      this.behaviorMetrics.set(contactId, new Map());
    }

    const contactMetrics = this.behaviorMetrics.get(contactId)!;
    contactMetrics.set(metricName, {
      contact_id: contactId,
      metric_name: metricName,
      metric_value: value,
      last_updated: new Date()
    });

    // Persist to database
    await this.saveBehaviorMetric(contactId, metricName, value);
  }

  async addTagToContacts(contactIds: number[], tag: string): Promise<void> {
    for (const contactId of contactIds) {
      await this.addTagToContact(contactId, tag);
    }
    logger.info(`Added tag "${tag}" to ${contactIds.length} contacts`);
  }

  async removeTagFromContacts(contactIds: number[], tag: string): Promise<void> {
    for (const contactId of contactIds) {
      await this.removeTagFromContact(contactId, tag);
    }
    logger.info(`Removed tag "${tag}" from ${contactIds.length} contacts`);
  }

  async updateCustomFieldForContacts(
    contactIds: number[], 
    fieldName: string, 
    fieldValue: any
  ): Promise<void> {
    for (const contactId of contactIds) {
      await this.updateContactCustomField(contactId, fieldName, fieldValue);
    }
    logger.info(`Updated custom field "${fieldName}" for ${contactIds.length} contacts`);
  }

  async createSegment(
    userId: number,
    name: string,
    description: string,
    rules: SegmentationRule[],
    autoUpdate: boolean = true
  ): Promise<ContactSegment> {
    // Create segment
    const segment: ContactSegment = {
      id: this.generateSegmentId(),
      user_id: userId,
      name,
      description,
      rules,
      auto_update: autoUpdate,
      contact_count: 0,
      created_at: new Date(),
      updated_at: new Date()
    };

    // Calculate initial contact count
    const contacts = await this.segmentContacts(userId, rules);
    segment.contact_count = contacts.length;

    // Save segment
    await this.saveSegment(segment);

    logger.info(`Created segment "${name}" with ${segment.contact_count} contacts`);
    return segment;
  }

  async updateSegment(segmentId: number, updates: Partial<ContactSegment>): Promise<void> {
    const segment = await this.getSegment(segmentId);
    if (!segment) {
      throw new Error('Segment not found');
    }

    // Update segment
    Object.assign(segment, updates, { updated_at: new Date() });

    // Recalculate contact count if rules changed
    if (updates.rules) {
      const contacts = await this.segmentContacts(segment.user_id, updates.rules);
      segment.contact_count = contacts.length;
    }

    await this.saveSegment(segment);
    logger.info(`Updated segment ${segmentId}`);
  }

  async getContactsBySegment(segmentId: number): Promise<Contact[]> {
    const segment = await this.getSegment(segmentId);
    if (!segment) {
      throw new Error('Segment not found');
    }

    return await this.segmentContacts(segment.user_id, segment.rules);
  }

  async getSegmentsByContact(contactId: number): Promise<ContactSegment[]> {
    const contact = await this.getContact(contactId);
    if (!contact) {
      throw new Error('Contact not found');
    }

    const userSegments = await this.getUserSegments(contact.user_id);
    const matchingSegments: ContactSegment[] = [];

    for (const segment of userSegments) {
      if (await this.contactMatchesRules(contact, segment.rules)) {
        matchingSegments.push(segment);
      }
    }

    return matchingSegments;
  }

  async refreshSegments(userId?: number): Promise<void> {
    const segments = userId 
      ? await this.getUserSegments(userId)
      : await this.getAllSegments();

    for (const segment of segments) {
      if (segment.auto_update) {
        const contacts = await this.segmentContacts(segment.user_id, segment.rules);
        segment.contact_count = contacts.length;
        segment.updated_at = new Date();
        await this.saveSegment(segment);
      }
    }

    logger.info(`Refreshed ${segments.length} segments`);
  }

  // Predefined segment templates
  getPredefinedSegments(): Array<{
    name: string;
    description: string;
    rules: SegmentationRule[];
  }> {
    return [
      {
        name: 'Clientes Ativos',
        description: 'Contatos que interagiram nos últimos 30 dias',
        rules: [{
          id: '1',
          name: 'Last interaction within 30 days',
          type: 'interaction',
          operator: 'less_than',
          field: 'days_since_last_message',
          value: 30
        }]
      },
      {
        name: 'Clientes VIP',
        description: 'Contatos com alta taxa de resposta',
        rules: [{
          id: '1',
          name: 'High response rate',
          type: 'interaction',
          operator: 'greater_than',
          field: 'response_rate',
          value: 0.8
        }]
      },
      {
        name: 'Leads Frios',
        description: 'Contatos sem interação há mais de 90 dias',
        rules: [{
          id: '1',
          name: 'No interaction in 90 days',
          type: 'interaction',
          operator: 'greater_than',
          field: 'days_since_last_message',
          value: 90
        }]
      },
      {
        name: 'Novos Contatos',
        description: 'Contatos criados nos últimos 7 dias',
        rules: [{
          id: '1',
          name: 'Created within 7 days',
          type: 'demographic',
          operator: 'greater_than',
          field: 'created_at',
          value: new Date(Date.now() - 7 * 24 * 60 * 60 * 1000)
        }]
      }
    ];
  }

  // Private helper methods (database interactions)
  private generateSegmentId(): number {
    return Date.now() + Math.floor(Math.random() * 1000);
  }

  private async getAllUserContacts(userId: number): Promise<Contact[]> {
    // Implementation needed - fetch from database
    return [];
  }

  private async calculateDaysSinceLastMessage(contactId: number): Promise<number> {
    // Implementation needed - calculate from messages table
    return 0;
  }

  private async getTotalMessagesReceived(contactId: number): Promise<number> {
    // Implementation needed - count from messages table
    return 0;
  }

  private async getTotalMessagesSent(contactId: number): Promise<number> {
    // Implementation needed - count from messages table
    return 0;
  }

  private async calculateResponseRate(contactId: number): Promise<number> {
    // Implementation needed - calculate response rate
    return 0;
  }

  private async calculateAverageResponseTime(contactId: number): Promise<number> {
    // Implementation needed - calculate average response time
    return 0;
  }

  private async saveBehaviorMetric(contactId: number, metricName: string, value: number): Promise<void> {
    // Implementation needed - save to database
  }

  private async addTagToContact(contactId: number, tag: string): Promise<void> {
    // Implementation needed - update contact tags
  }

  private async removeTagFromContact(contactId: number, tag: string): Promise<void> {
    // Implementation needed - update contact tags
  }

  private async updateContactCustomField(contactId: number, fieldName: string, fieldValue: any): Promise<void> {
    // Implementation needed - update contact custom fields
  }

  private async saveSegment(segment: ContactSegment): Promise<void> {
    // Implementation needed - save to database
  }

  private async getSegment(segmentId: number): Promise<ContactSegment | null> {
    // Implementation needed - fetch from database
    return null;
  }

  private async getContact(contactId: number): Promise<Contact | null> {
    // Implementation needed - fetch from database
    return null;
  }

  private async getUserSegments(userId: number): Promise<ContactSegment[]> {
    // Implementation needed - fetch from database
    return [];
  }

  private async getAllSegments(): Promise<ContactSegment[]> {
    // Implementation needed - fetch from database
    return [];
  }
}