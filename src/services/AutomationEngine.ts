/*
 * Advanced Automation Engine for Zapi-like functionality
 * Handles triggers, actions, queues, and multi-channel messaging
 */

import { EventEmitter } from 'events';
import { logger } from '../index';
import { QueueManager } from './QueueManager';
import { TemplateEngine } from './TemplateEngine';
import { AnalyticsService } from './AnalyticsService';
import { ContactSegmentation } from './ContactSegmentation';
import { 
  Automation, 
  Contact, 
  Message, 
  AutomationAction, 
  QueueJob 
} from '../models';

export class AutomationEngine extends EventEmitter {
  private queueManager: QueueManager;
  private templateEngine: TemplateEngine;
  private analyticsService: AnalyticsService;
  private contactSegmentation: ContactSegmentation;
  private activeAutomations: Map<number, Automation> = new Map();

  constructor() {
    super();
    this.queueManager = new QueueManager();
    this.templateEngine = new TemplateEngine();
    this.analyticsService = new AnalyticsService();
    this.contactSegmentation = new ContactSegmentation();
    
    this.initializeTriggers();
    this.loadActiveAutomations();
  }

  private initializeTriggers(): void {
    // Webhook trigger handler
    this.on('webhook_received', this.handleWebhookTrigger.bind(this));
    
    // Message trigger handler
    this.on('message_received', this.handleMessageTrigger.bind(this));
    
    // Schedule trigger handler
    this.setupScheduleTriggers();
  }

  async processIncomingMessage(
    userId: number, 
    phone: string, 
    messageContent: string, 
    messageType: string = 'text',
    channel: string = 'whatsapp',
    sessionId: string = ''
  ): Promise<void> {
    try {
      // Find or create contact
      let contact = await this.findOrCreateContact(userId, phone, channel);
      
      // Save incoming message
      const message = await this.saveMessage({
        user_id: userId,
        contact_id: contact.id,
        session_id: sessionId,
        message_type: messageType as any,
        content: messageContent,
        direction: 'inbound',
        channel: channel as any,
        timestamp: new Date()
      });

      // Update contact last interaction
      await this.updateContactLastInteraction(contact.id);

      // Trigger automations
      await this.triggerAutomations(userId, contact, message);

      // Analytics
      await this.analyticsService.recordEvent(userId, 'message_received', {
        channel,
        contact_id: contact.id,
        message_type: messageType
      });

    } catch (error) {
      logger.error('Error processing incoming message:', error);
      throw error;
    }
  }

  private async triggerAutomations(
    userId: number, 
    contact: Contact, 
    message: Message
  ): Promise<void> {
    const userAutomations = Array.from(this.activeAutomations.values())
      .filter(automation => automation.user_id === userId);

    for (const automation of userAutomations) {
      if (await this.shouldTriggerAutomation(automation, contact, message)) {
        await this.executeAutomation(automation, contact, message);
      }
    }
  }

  private async shouldTriggerAutomation(
    automation: Automation, 
    contact: Contact, 
    message: Message
  ): Promise<boolean> {
    const { trigger_type, trigger_config } = automation;

    switch (trigger_type) {
      case 'keyword':
        return this.checkKeywordTrigger(trigger_config, message.content);
      
      case 'webhook':
        // Webhook triggers are handled separately
        return false;
      
      case 'schedule':
        // Schedule triggers are handled by cron jobs
        return false;
      
      case 'button_click':
        return this.checkButtonClickTrigger(trigger_config, message);
      
      case 'flow_start':
        return this.checkFlowStartTrigger(trigger_config, contact);
      
      default:
        return false;
    }
  }

  private checkKeywordTrigger(triggerConfig: any, messageContent: string): boolean {
    const keywords = triggerConfig.keywords || [];
    const content = messageContent.toLowerCase();
    
    return keywords.some((keyword: string) => 
      content.includes(keyword.toLowerCase())
    );
  }

  private checkButtonClickTrigger(triggerConfig: any, message: Message): boolean {
    // Check if message contains button payload
    return message.content.startsWith('BUTTON_PAYLOAD:');
  }

  private checkFlowStartTrigger(triggerConfig: any, contact: Contact): boolean {
    const conditions = triggerConfig.conditions || {};
    
    // Check tags
    if (conditions.tags) {
      const hasRequiredTags = conditions.tags.every((tag: string) => 
        contact.tags.includes(tag)
      );
      if (!hasRequiredTags) return false;
    }

    // Check custom fields
    if (conditions.custom_fields) {
      for (const [field, value] of Object.entries(conditions.custom_fields)) {
        if (contact.custom_fields[field] !== value) {
          return false;
        }
      }
    }

    return true;
  }

  async executeAutomation(
    automation: Automation, 
    contact: Contact, 
    triggerMessage?: Message
  ): Promise<void> {
    try {
      logger.info(`Executing automation ${automation.name} for contact ${contact.phone}`);
      
      // Execute actions sequentially
      for (const action of automation.actions) {
        await this.executeAction(action, contact, automation, triggerMessage);
      }

      // Record automation execution
      await this.analyticsService.recordEvent(automation.user_id, 'automation_executed', {
        automation_id: automation.id,
        automation_name: automation.name,
        contact_id: contact.id
      });

    } catch (error) {
      logger.error(`Error executing automation ${automation.id}:`, error);
      throw error;
    }
  }

  private async executeAction(
    action: AutomationAction, 
    contact: Contact, 
    automation: Automation,
    triggerMessage?: Message
  ): Promise<void> {
    const { type, config } = action;

    switch (type) {
      case 'send_message':
        await this.executeSendMessageAction(config, contact, automation);
        break;
      
      case 'add_tag':
        await this.executeAddTagAction(config, contact);
        break;
      
      case 'remove_tag':
        await this.executeRemoveTagAction(config, contact);
        break;
      
      case 'update_field':
        await this.executeUpdateFieldAction(config, contact);
        break;
      
      case 'delay':
        await this.executeDelayAction(config, action, contact, automation);
        break;
      
      case 'condition':
        await this.executeConditionAction(config, contact, automation);
        break;
      
      case 'webhook':
        await this.executeWebhookAction(config, contact, automation, triggerMessage);
        break;
      
      case 'transfer_human':
        await this.executeTransferHumanAction(config, contact);
        break;
      
      default:
        logger.warn(`Unknown action type: ${type}`);
    }
  }

  private async executeSendMessageAction(
    config: any, 
    contact: Contact, 
    automation: Automation
  ): Promise<void> {
    const messageConfig = config.message;
    let content = messageConfig.content;

    // Process template variables
    if (messageConfig.template_id) {
      content = await this.templateEngine.processTemplate(
        messageConfig.template_id, 
        contact, 
        messageConfig.variables
      );
    } else {
      // Process inline variables
      content = this.templateEngine.processInlineVariables(content, contact);
    }

    // Queue message for sending
    const job: Partial<QueueJob> = {
      user_id: automation.user_id,
      job_type: 'send_message',
      priority: 1,
      payload: {
        contact_id: contact.id,
        phone: contact.phone,
        message_type: messageConfig.type,
        content,
        media_url: messageConfig.media_url,
        channel: contact.channel,
        automation_id: automation.id
      },
      scheduled_at: new Date()
    };

    await this.queueManager.addJob(job);
  }

  private async executeAddTagAction(config: any, contact: Contact): Promise<void> {
    const tag = config.tag;
    if (!contact.tags.includes(tag)) {
      contact.tags.push(tag);
      await this.updateContact(contact);
    }
  }

  private async executeRemoveTagAction(config: any, contact: Contact): Promise<void> {
    const tag = config.tag;
    const tagIndex = contact.tags.indexOf(tag);
    if (tagIndex > -1) {
      contact.tags.splice(tagIndex, 1);
      await this.updateContact(contact);
    }
  }

  private async executeUpdateFieldAction(config: any, contact: Contact): Promise<void> {
    const { field } = config;
    contact.custom_fields[field.name] = field.value;
    await this.updateContact(contact);
  }

  private async executeDelayAction(
    config: any, 
    action: AutomationAction,
    contact: Contact, 
    automation: Automation
  ): Promise<void> {
    const delay = config.delay;
    const delayMs = this.convertDelayToMs(delay.duration, delay.unit);
    
    // Schedule next action
    if (action.next_action_id) {
      const nextAction = automation.actions.find(a => a.id === action.next_action_id);
      if (nextAction) {
        const job: Partial<QueueJob> = {
          user_id: automation.user_id,
          job_type: 'automation_action',
          priority: 0,
          payload: {
            automation_id: automation.id,
            action_id: nextAction.id,
            contact_id: contact.id
          },
          scheduled_at: new Date(Date.now() + delayMs)
        };

        await this.queueManager.addJob(job);
      }
    }
  }

  private async executeConditionAction(
    config: any, 
    contact: Contact, 
    automation: Automation
  ): Promise<void> {
    const condition = config.condition;
    const fieldValue = this.getContactFieldValue(contact, condition.field);
    const conditionMet = this.evaluateCondition(fieldValue, condition.operator, condition.value);
    
    const actionsToExecute = conditionMet ? condition.true_actions : condition.false_actions;
    
    for (const actionId of actionsToExecute) {
      const action = automation.actions.find(a => a.id === actionId);
      if (action) {
        await this.executeAction(action, contact, automation);
      }
    }
  }

  private async executeWebhookAction(
    config: any, 
    contact: Contact, 
    automation: Automation,
    triggerMessage?: Message
  ): Promise<void> {
    const webhook = config.webhook;
    const payload = {
      contact,
      automation: {
        id: automation.id,
        name: automation.name
      },
      trigger_message: triggerMessage,
      timestamp: new Date().toISOString()
    };

    try {
      const fetch = (await import('node-fetch')).default;
      const response = await fetch(webhook.url, {
        method: webhook.method || 'POST',
        headers: {
          'Content-Type': 'application/json',
          ...webhook.headers
        },
        body: JSON.stringify(webhook.body || payload)
      });

      if (!response.ok) {
        throw new Error(`Webhook failed with status: ${response.status}`);
      }

      logger.info(`Webhook executed successfully for automation ${automation.id}`);
    } catch (error) {
      logger.error(`Webhook execution failed for automation ${automation.id}:`, error);
    }
  }

  private async executeTransferHumanAction(config: any, contact: Contact): Promise<void> {
    // Add tag to indicate human transfer needed
    if (!contact.tags.includes('needs_human')) {
      contact.tags.push('needs_human');
      await this.updateContact(contact);
    }

    // Emit event for human transfer
    this.emit('human_transfer_requested', {
      contact_id: contact.id,
      phone: contact.phone,
      reason: config.reason || 'Automation transfer'
    });
  }

  private convertDelayToMs(duration: number, unit: string): number {
    const multipliers = {
      seconds: 1000,
      minutes: 60 * 1000,
      hours: 60 * 60 * 1000,
      days: 24 * 60 * 60 * 1000
    };
    return duration * (multipliers[unit as keyof typeof multipliers] || 1000);
  }

  private getContactFieldValue(contact: Contact, fieldName: string): any {
    if (fieldName === 'name') return contact.name;
    if (fieldName === 'phone') return contact.phone;
    if (fieldName === 'email') return contact.email;
    return contact.custom_fields[fieldName];
  }

  private evaluateCondition(value: any, operator: string, compareValue: any): boolean {
    switch (operator) {
      case 'equals':
        return value === compareValue;
      case 'contains':
        return String(value).toLowerCase().includes(String(compareValue).toLowerCase());
      case 'greater_than':
        return Number(value) > Number(compareValue);
      case 'less_than':
        return Number(value) < Number(compareValue);
      default:
        return false;
    }
  }

  private async handleWebhookTrigger(data: any): Promise<void> {
    // Implementation for webhook triggers
    logger.info('Processing webhook trigger:', data);
  }

  private async handleMessageTrigger(data: any): Promise<void> {
    // Implementation for message triggers
    logger.info('Processing message trigger:', data);
  }

  private setupScheduleTriggers(): void {
    // Setup cron jobs for scheduled automations
    // This would integrate with a job scheduler like node-cron
    logger.info('Schedule triggers initialized');
  }

  private async loadActiveAutomations(): Promise<void> {
    try {
      const { automationRepository } = await import('../database/repositories');
      
      // Load all active automations for all users
      const keywordAutomations = await automationRepository.findActiveByTriggerType('keyword');
      const webhookAutomations = await automationRepository.findActiveByTriggerType('webhook');
      const scheduleAutomations = await automationRepository.findActiveByTriggerType('schedule');
      
      // Store in memory for fast access
      [...keywordAutomations, ...webhookAutomations, ...scheduleAutomations].forEach(automation => {
        this.activeAutomations.set(automation.id, automation);
      });
      
      logger.info(`Loaded ${this.activeAutomations.size} active automations`);
    } catch (error) {
      logger.error('Error loading active automations:', error);
    }
  }

  // Database interaction methods with real implementation
  private async findOrCreateContact(userId: number, phone: string, channel: string): Promise<Contact> {
    const { contactRepository } = await import('../database/repositories');
    const result = await contactRepository.findOrCreate(userId, phone, channel);
    return result.contact;
  }

  private async saveMessage(message: Partial<Message>): Promise<Message> {
    const { messageRepository } = await import('../database/repositories');
    return await messageRepository.create(message as Omit<Message, 'id'>);
  }

  private async updateContactLastInteraction(contactId: number): Promise<void> {
    const { contactRepository } = await import('../database/repositories');
    await contactRepository.updateLastInteraction(contactId);
  }

  private async updateContact(contact: Contact): Promise<void> {
    const { contactRepository } = await import('../database/repositories');
    await contactRepository.update(contact.id, contact);
  }
}