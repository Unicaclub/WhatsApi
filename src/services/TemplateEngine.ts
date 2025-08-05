/*
 * Advanced Template Engine for Dynamic Message Processing
 * Handles WhatsApp Business templates, variable substitution, and personalization
 */

import { logger } from '../index';
import { Contact, MessageTemplate } from '../models';

export interface TemplateVariable {
  name: string;
  type: 'text' | 'number' | 'date' | 'currency' | 'url';
  format?: string;
  default_value?: any;
  required: boolean;
}

export interface TemplateButton {
  type: 'quick_reply' | 'url' | 'phone' | 'copy_code';
  text: string;
  payload?: string;
  url?: string;
  phone?: string;
  copy_code?: string;
}

export interface ProcessedTemplate {
  type: 'text' | 'media' | 'interactive';
  content: string;
  media_url?: string;
  buttons?: TemplateButton[];
  variables_used: string[];
  personalization_score: number;
}

export class TemplateEngine {
  private templates: Map<number, MessageTemplate> = new Map();
  private variableProcessors: Map<string, (value: any, format?: string) => string> = new Map();

  constructor() {
    this.initializeVariableProcessors();
    this.loadTemplates();
  }

  private initializeVariableProcessors(): void {
    // Text processor
    this.variableProcessors.set('text', (value: any) => {
      return String(value || '');
    });

    // Number processor
    this.variableProcessors.set('number', (value: any, format?: string) => {
      const num = Number(value) || 0;
      if (format === 'integer') {
        return Math.floor(num).toString();
      }
      if (format?.startsWith('decimal:')) {
        const decimals = parseInt(format.split(':')[1]) || 2;
        return num.toFixed(decimals);
      }
      return num.toString();
    });

    // Date processor
    this.variableProcessors.set('date', (value: any, format?: string) => {
      const date = new Date(value);
      if (isNaN(date.getTime())) {
        return '';
      }

      switch (format) {
        case 'short':
          return date.toLocaleDateString('pt-BR');
        case 'long':
          return date.toLocaleDateString('pt-BR', { 
            year: 'numeric', 
            month: 'long', 
            day: 'numeric' 
          });
        case 'time':
          return date.toLocaleTimeString('pt-BR', { 
            hour: '2-digit', 
            minute: '2-digit' 
          });
        case 'datetime':
          return date.toLocaleString('pt-BR');
        default:
          return date.toLocaleDateString('pt-BR');
      }
    });

    // Currency processor
    this.variableProcessors.set('currency', (value: any, format?: string) => {
      const num = Number(value) || 0;
      const currency = format || 'BRL';
      
      return new Intl.NumberFormat('pt-BR', {
        style: 'currency',
        currency: currency
      }).format(num);
    });

    // URL processor
    this.variableProcessors.set('url', (value: any) => {
      const url = String(value || '');
      if (!url.startsWith('http://') && !url.startsWith('https://')) {
        return `https://${url}`;
      }
      return url;
    });
  }

  async processTemplate(
    templateId: number, 
    contact: Contact, 
    variables: Record<string, any> = {}
  ): Promise<string> {
    try {
      const template = await this.getTemplate(templateId);
      if (!template) {
        throw new Error(`Template ${templateId} not found`);
      }

      // Merge contact data with provided variables
      const allVariables = this.mergeVariables(contact, variables);

      // Process template content
      let processedContent = template.content.text || '';

      // Replace template variables
      if (template.content.variables) {
        for (const variable of template.content.variables) {
          const value = allVariables[variable.name];
          const processedValue = this.processVariable(
            value, 
            variable.type, 
            variable.format,
            variable.default_value
          );
          
          // Replace {{variable_name}} with processed value
          const regex = new RegExp(`\\{\\{${variable.name}\\}\\}`, 'g');
          processedContent = processedContent.replace(regex, processedValue);
        }
      }

      // Process inline variables
      processedContent = this.processInlineVariables(processedContent, contact);

      logger.debug(`Processed template ${templateId} for contact ${contact.phone}`);
      return processedContent;

    } catch (error) {
      logger.error(`Error processing template ${templateId}:`, error);
      throw error;
    }
  }

  processInlineVariables(content: string, contact: Contact): string {
    // Built-in variables
    const builtInVariables: Record<string, any> = {
      name: contact.name || 'Cliente',
      first_name: this.getFirstName(contact.name),
      phone: contact.phone,
      email: contact.email || '',
      ...contact.custom_fields
    };

    // Replace {{variable}} patterns
    return content.replace(/\{\{([^}]+)\}\}/g, (match, variableName) => {
      const trimmedName = variableName.trim();
      
      // Check for formatting: {{variable|format}}
      const parts = trimmedName.split('|');
      const name = parts[0].trim();
      const format = parts[1]?.trim();

      let value = builtInVariables[name];
      
      // Handle nested properties: {{custom_fields.field_name}}
      if (name.includes('.')) {
        value = this.getNestedValue(builtInVariables, name);
      }

      // Apply formatting if specified
      if (format && value !== undefined) {
        value = this.applyFormat(value, format);
      }

      return value !== undefined ? String(value) : match;
    });
  }

  private processVariable(
    value: any, 
    type: string, 
    format?: string, 
    defaultValue?: any
  ): string {
    // Use default value if current value is empty
    if (value === undefined || value === null || value === '') {
      value = defaultValue || '';
    }

    const processor = this.variableProcessors.get(type);
    if (processor) {
      return processor(value, format);
    }

    return String(value);
  }

  private mergeVariables(
    contact: Contact, 
    customVariables: Record<string, any>
  ): Record<string, any> {
    return {
      // Contact basic info
      name: contact.name,
      first_name: this.getFirstName(contact.name),
      phone: contact.phone,
      email: contact.email,
      
      // Contact custom fields
      ...contact.custom_fields,
      
      // System variables
      current_date: new Date(),
      current_time: new Date(),
      
      // Custom provided variables (highest priority)
      ...customVariables
    };
  }

  private getFirstName(fullName?: string): string {
    if (!fullName) return 'Cliente';
    return fullName.split(' ')[0];
  }

  private getNestedValue(obj: any, path: string): any {
    return path.split('.').reduce((current, prop) => {
      return current && current[prop] !== undefined ? current[prop] : undefined;
    }, obj);
  }

  private applyFormat(value: any, format: string): string {
    switch (format.toLowerCase()) {
      case 'upper':
        return String(value).toUpperCase();
      case 'lower':
        return String(value).toLowerCase();
      case 'title':
        return String(value).replace(/\w\S*/g, (txt) => 
          txt.charAt(0).toUpperCase() + txt.substr(1).toLowerCase()
        );
      case 'truncate':
        return String(value).substring(0, 50) + '...';
      default:
        return String(value);
    }
  }

  async createTemplate(
    userId: number,
    name: string,
    category: 'marketing' | 'utility' | 'authentication',
    templateType: 'text' | 'media' | 'interactive',
    content: any,
    language: string = 'pt_BR'
  ): Promise<MessageTemplate> {
    const template: MessageTemplate = {
      id: this.generateTemplateId(),
      user_id: userId,
      name,
      category,
      language,
      status: 'pending',
      template_type: templateType,
      content,
      created_at: new Date(),
      updated_at: new Date()
    };

    await this.saveTemplate(template);
    this.templates.set(template.id, template);

    logger.info(`Created template "${name}" for user ${userId}`);
    return template;
  }

  async updateTemplate(
    templateId: number, 
    updates: Partial<MessageTemplate>
  ): Promise<void> {
    const template = await this.getTemplate(templateId);
    if (!template) {
      throw new Error('Template not found');
    }

    Object.assign(template, updates, { updated_at: new Date() });
    await this.saveTemplate(template);
    this.templates.set(templateId, template);

    logger.info(`Updated template ${templateId}`);
  }

  async deleteTemplate(templateId: number): Promise<void> {
    await this.removeTemplate(templateId);
    this.templates.delete(templateId);
    logger.info(`Deleted template ${templateId}`);
  }

  async getUserTemplates(userId: number): Promise<MessageTemplate[]> {
    const userTemplates: MessageTemplate[] = [];
    
    for (const template of this.templates.values()) {
      if (template.user_id === userId) {
        userTemplates.push(template);
      }
    }

    return userTemplates;
  }

  async validateTemplate(template: MessageTemplate): Promise<{
    valid: boolean;
    errors: string[];
    warnings: string[];
  }> {
    const errors: string[] = [];
    const warnings: string[] = [];

    // Check required fields
    if (!template.name || template.name.trim().length === 0) {
      errors.push('Template name is required');
    }

    if (!template.content || !template.content.text) {
      errors.push('Template content is required');
    }

    // Check variable syntax
    if (template.content.text) {
      const variableMatches = template.content.text.match(/\{\{[^}]+\}\}/g);
      if (variableMatches) {
        for (const match of variableMatches) {
          const variableName = match.replace(/[{}]/g, '');
          if (variableName.trim().length === 0) {
            errors.push(`Empty variable found: ${match}`);
          }
        }
      }
    }

    // Check buttons for interactive templates
    if (template.template_type === 'interactive' && template.content.buttons) {
      if (template.content.buttons.length > 3) {
        errors.push('Interactive templates can have maximum 3 buttons');
      }

      for (const button of template.content.buttons) {
        if (!button.text || button.text.trim().length === 0) {
          errors.push('Button text is required');
        }
        if (button.text.length > 20) {
          warnings.push(`Button text "${button.text}" is longer than 20 characters`);
        }
      }
    }

    // Check media URL for media templates
    if (template.template_type === 'media' && !template.content.media_url) {
      errors.push('Media URL is required for media templates');
    }

    return {
      valid: errors.length === 0,
      errors,
      warnings
    };
  }

  getPredefinedTemplates(): Array<{
    name: string;
    category: string;
    type: string;
    content: any;
  }> {
    return [
      {
        name: 'Boas-vindas',
        category: 'utility',
        type: 'text',
        content: {
          text: 'Olá {{name}}! 👋\n\nSeja bem-vindo(a)! Estamos muito felizes em ter você conosco.\n\nSe precisar de alguma coisa, é só chamar!',
          variables: [
            { name: 'name', type: 'text', required: true, default_value: 'Cliente' }
          ]
        }
      },
      {
        name: 'Confirmação de Pedido',
        category: 'utility',
        type: 'text',
        content: {
          text: 'Olá {{name}}! 📦\n\nSeu pedido #{{order_id}} foi confirmado!\n\nValor: {{total_amount|currency}}\nPrevisão de entrega: {{delivery_date|date:short}}\n\nObrigado pela preferência!',
          variables: [
            { name: 'name', type: 'text', required: true },
            { name: 'order_id', type: 'text', required: true },
            { name: 'total_amount', type: 'currency', required: true },
            { name: 'delivery_date', type: 'date', required: true }
          ]
        }
      },
      {
        name: 'Lembrete de Agendamento',
        category: 'utility',
        type: 'text',
        content: {
          text: '⏰ Lembrete de Agendamento\n\nOlá {{name}}!\n\nLembramos que você tem um agendamento marcado para:\n\n📅 {{appointment_date|date:long}}\n🕐 {{appointment_time|time}}\n📍 {{location}}\n\nNos vemos lá!',
          variables: [
            { name: 'name', type: 'text', required: true },
            { name: 'appointment_date', type: 'date', required: true },
            { name: 'appointment_time', type: 'date', required: true },
            { name: 'location', type: 'text', required: true }
          ]
        }
      },
      {
        name: 'Promoção Especial',
        category: 'marketing',
        type: 'interactive',
        content: {
          text: '🎉 OFERTA ESPECIAL para você, {{name}}!\n\n{{discount_percentage}}% OFF em toda a loja!\n\nVálido até {{expiry_date|date:short}}',
          buttons: [
            { type: 'url', text: 'Ver Ofertas', url: '{{store_url}}' },
            { type: 'quick_reply', text: 'Quero saber mais', payload: 'WANT_MORE_INFO' }
          ],
          variables: [
            { name: 'name', type: 'text', required: true },
            { name: 'discount_percentage', type: 'number', required: true },
            { name: 'expiry_date', type: 'date', required: true },
            { name: 'store_url', type: 'url', required: true }
          ]
        }
      }
    ];
  }

  // Private database methods
  private generateTemplateId(): number {
    return Date.now() + Math.floor(Math.random() * 1000);
  }

  private async loadTemplates(): Promise<void> {
    // Load templates from database
    // Implementation needed
    logger.info('Templates loaded from database');
  }

  private async getTemplate(templateId: number): Promise<MessageTemplate | null> {
    // Try cache first
    if (this.templates.has(templateId)) {
      return this.templates.get(templateId)!;
    }

    // Load from database
    // Implementation needed
    return null;
  }

  private async saveTemplate(template: MessageTemplate): Promise<void> {
    // Save to database
    // Implementation needed
    logger.debug(`Saved template ${template.id} to database`);
  }

  private async removeTemplate(templateId: number): Promise<void> {
    // Remove from database
    // Implementation needed
    logger.debug(`Removed template ${templateId} from database`);
  }
}