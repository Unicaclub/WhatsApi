/*
 * Multi-Channel Communication Service
 * Supports WhatsApp, Telegram, Instagram, SMS, and other messaging platforms
 */

import { EventEmitter } from 'events';
import { logger } from '../index';
import { Channel, Contact, Message } from '../models';

export interface ChannelConfig {
  type: 'whatsapp' | 'telegram' | 'instagram' | 'sms';
  name: string;
  config: {
    api_key?: string;
    api_secret?: string;
    webhook_url?: string;
    phone_number?: string;
    access_token?: string;
    bot_token?: string;
    sender_id?: string;
    endpoint?: string;
    credentials?: Record<string, any>;
  };
}

export interface MessageParams {
  recipient: string;
  content: string;
  message_type: 'text' | 'image' | 'audio' | 'video' | 'document' | 'location' | 'contact';
  media_url?: string;
  buttons?: Array<{
    type: 'quick_reply' | 'url' | 'phone';
    text: string;
    payload?: string;
    url?: string;
    phone?: string;
  }>;
  metadata?: Record<string, any>;
}

export interface SendResult {
  success: boolean;
  message_id?: string;
  external_id?: string;
  error?: string;
  cost?: number;
  channel: string;
}

export interface ChannelCapabilities {
  supports_media: boolean;
  supports_buttons: boolean;
  supports_location: boolean;
  supports_contact: boolean;
  supports_templates: boolean;
  supports_reactions: boolean;
  supports_typing_indicator: boolean;
  max_message_length: number;
  supported_media_types: string[];
}

export abstract class ChannelProvider {
  protected config: ChannelConfig;
  protected capabilities: ChannelCapabilities;

  constructor(config: ChannelConfig) {
    this.config = config;
    this.capabilities = this.getCapabilities();
  }

  abstract getCapabilities(): ChannelCapabilities;
  abstract sendMessage(params: MessageParams): Promise<SendResult>;
  abstract verifyWebhook(data: any): boolean;
  abstract processWebhook(data: any): Promise<{
    type: 'message' | 'status' | 'reaction' | 'typing';
    data: any;
  }>;
  abstract getStatus(): Promise<{
    connected: boolean;
    error?: string;
    info?: Record<string, any>;
  }>;

  validateMessage(params: MessageParams): { valid: boolean; errors: string[] } {
    const errors: string[] = [];

    if (!params.recipient) {
      errors.push('Recipient is required');
    }

    if (!params.content && !params.media_url) {
      errors.push('Either content or media_url is required');
    }

    if (params.content && params.content.length > this.capabilities.max_message_length) {
      errors.push(`Message exceeds maximum length of ${this.capabilities.max_message_length} characters`);
    }

    if (params.message_type !== 'text' && !this.capabilities.supports_media) {
      errors.push(`${this.config.type} doesn't support media messages`);
    }

    if (params.buttons && !this.capabilities.supports_buttons) {
      errors.push(`${this.config.type} doesn't support buttons`);
    }

    return {
      valid: errors.length === 0,
      errors
    };
  }
}

export class WhatsAppProvider extends ChannelProvider {
  getCapabilities(): ChannelCapabilities {
    return {
      supports_media: true,
      supports_buttons: true,
      supports_location: true,
      supports_contact: true,
      supports_templates: true,
      supports_reactions: true,
      supports_typing_indicator: true,
      max_message_length: 4096,
      supported_media_types: ['image', 'audio', 'video', 'document', 'sticker']
    };
  }

  async sendMessage(params: MessageParams): Promise<SendResult> {
    try {
      // Integration with WppConnect or WhatsApp Business API
      const result = await this.sendWhatsAppMessage(params);
      
      return {
        success: true,
        message_id: result.id,
        external_id: result.external_id,
        channel: 'whatsapp',
        cost: this.calculateCost(params)
      };
    } catch (error) {
      logger.error('WhatsApp send error:', error);
      return {
        success: false,
        error: error instanceof Error ? error.message : String(error),
        channel: 'whatsapp'
      };
    }
  }

  verifyWebhook(data: any): boolean {
    // Verify WhatsApp webhook signature
    return true;
  }

  async processWebhook(data: any): Promise<{ type: any; data: any }> {
    // Process WhatsApp webhook data
    return {
      type: 'message',
      data: {
        from: data.from,
        message: data.text?.body || '',
        message_type: data.type || 'text',
        timestamp: new Date(data.timestamp * 1000)
      }
    };
  }

  async getStatus(): Promise<{ connected: boolean; error?: string; info?: Record<string, any> }> {
    try {
      // Check WhatsApp connection status
      return {
        connected: true,
        info: {
          phone: this.config.config.phone_number,
          session_active: true
        }
      };
    } catch (error) {
      return {
        connected: false,
        error: error instanceof Error ? error.message : String(error)
      };
    }
  }

  private async sendWhatsAppMessage(params: MessageParams): Promise<any> {
    // Implementation would integrate with WppConnect or WhatsApp Business API
    return {
      id: `wa_${Date.now()}`,
      external_id: `ext_${Date.now()}`
    };
  }

  private calculateCost(params: MessageParams): number {
    // Calculate cost based on message type and destination
    return 0.05; // Example cost
  }
}

export class TelegramProvider extends ChannelProvider {
  getCapabilities(): ChannelCapabilities {
    return {
      supports_media: true,
      supports_buttons: true,
      supports_location: true,
      supports_contact: true,
      supports_templates: false,
      supports_reactions: true,
      supports_typing_indicator: true,
      max_message_length: 4096,
      supported_media_types: ['image', 'audio', 'video', 'document', 'animation', 'voice']
    };
  }

  async sendMessage(params: MessageParams): Promise<SendResult> {
    try {
      const result = await this.sendTelegramMessage(params);
      
      return {
        success: true,
        message_id: result.message_id.toString(),
        external_id: result.message_id.toString(),
        channel: 'telegram',
        cost: 0 // Telegram is free
      };
    } catch (error) {
      logger.error('Telegram send error:', error);
      return {
        success: false,
        error: error instanceof Error ? error.message : String(error),
        channel: 'telegram'
      };
    }
  }

  verifyWebhook(data: any): boolean {
    // Verify Telegram webhook
    return true;
  }

  async processWebhook(data: any): Promise<{ type: any; data: any }> {
    const message = data.message || data.edited_message;
    
    return {
      type: 'message',
      data: {
        from: message.from.id.toString(),
        message: message.text || message.caption || '',
        message_type: this.getTelegramMessageType(message),
        timestamp: new Date(message.date * 1000)
      }
    };
  }

  async getStatus(): Promise<{ connected: boolean; error?: string; info?: Record<string, any> }> {
    try {
      const botInfo = await this.getBotInfo();
      return {
        connected: true,
        info: {
          bot_username: botInfo.username,
          bot_name: botInfo.first_name
        }
      };
    } catch (error) {
      return {
        connected: false,
        error: error instanceof Error ? error.message : String(error)
      };
    }
  }

  private async sendTelegramMessage(params: MessageParams): Promise<any> {
    const botToken = this.config.config.bot_token;
    const chatId = params.recipient;
    
    const fetch = (await import('node-fetch')).default;
    
    let url = `https://api.telegram.org/bot${botToken}/sendMessage`;
    let body: any = {
      chat_id: chatId,
      text: params.content
    };

    // Handle different message types
    if (params.message_type === 'image' && params.media_url) {
      url = `https://api.telegram.org/bot${botToken}/sendPhoto`;
      body = {
        chat_id: chatId,
        photo: params.media_url,
        caption: params.content
      };
    }

    // Add buttons if provided
    if (params.buttons) {
      body.reply_markup = {
        inline_keyboard: [
          params.buttons.map(button => ({
            text: button.text,
            callback_data: button.payload,
            url: button.url
          }))
        ]
      };
    }

    const response = await fetch(url, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(body)
    });

    const result = await response.json();
    
    if (!result.ok) {
      throw new Error(result.description);
    }

    return result.result;
  }

  private getTelegramMessageType(message: any): string {
    if (message.photo) return 'image';
    if (message.audio) return 'audio';
    if (message.video) return 'video';
    if (message.document) return 'document';
    if (message.voice) return 'voice';
    if (message.location) return 'location';
    if (message.contact) return 'contact';
    return 'text';
  }

  private async getBotInfo(): Promise<any> {
    const botToken = this.config.config.bot_token;
    const fetch = (await import('node-fetch')).default;
    
    const response = await fetch(`https://api.telegram.org/bot${botToken}/getMe`);
    const result = await response.json();
    
    if (!result.ok) {
      throw new Error(result.description);
    }

    return result.result;
  }
}

export class InstagramProvider extends ChannelProvider {
  getCapabilities(): ChannelCapabilities {
    return {
      supports_media: true,
      supports_buttons: true,
      supports_location: false,
      supports_contact: false,
      supports_templates: true,
      supports_reactions: false,
      supports_typing_indicator: true,
      max_message_length: 1000,
      supported_media_types: ['image', 'video']
    };
  }

  async sendMessage(params: MessageParams): Promise<SendResult> {
    try {
      // Integration with Instagram Basic Display API or Instagram Graph API
      const result = await this.sendInstagramMessage(params);
      
      return {
        success: true,
        message_id: result.id,
        external_id: result.id,
        channel: 'instagram',
        cost: this.calculateCost(params)
      };
    } catch (error) {
      logger.error('Instagram send error:', error);
      return {
        success: false,
        error: error instanceof Error ? error.message : String(error),
        channel: 'instagram'
      };
    }
  }

  verifyWebhook(data: any): boolean {
    // Verify Instagram webhook
    return true;
  }

  async processWebhook(data: any): Promise<{ type: any; data: any }> {
    // Process Instagram webhook data
    return {
      type: 'message',
      data: {
        from: data.sender?.id,
        message: data.message?.text || '',
        message_type: 'text',
        timestamp: new Date(data.timestamp)
      }
    };
  }

  async getStatus(): Promise<{ connected: boolean; error?: string; info?: Record<string, any> }> {
    return {
      connected: true,
      info: {
        account_id: this.config.config.credentials?.account_id
      }
    };
  }

  private async sendInstagramMessage(params: MessageParams): Promise<any> {
    // Implementation would integrate with Instagram Graph API
    return {
      id: `ig_${Date.now()}`
    };
  }

  private calculateCost(params: MessageParams): number {
    return 0.02; // Example cost
  }
}

export class SMSProvider extends ChannelProvider {
  getCapabilities(): ChannelCapabilities {
    return {
      supports_media: false,
      supports_buttons: false,
      supports_location: false,
      supports_contact: false,
      supports_templates: false,
      supports_reactions: false,
      supports_typing_indicator: false,
      max_message_length: 160,
      supported_media_types: []
    };
  }

  async sendMessage(params: MessageParams): Promise<SendResult> {
    try {
      const result = await this.sendSMSMessage(params);
      
      return {
        success: true,
        message_id: result.id,
        external_id: result.id,
        channel: 'sms',
        cost: this.calculateSMSCost(params)
      };
    } catch (error) {
      logger.error('SMS send error:', error);
      return {
        success: false,
        error: error instanceof Error ? error.message : String(error),
        channel: 'sms'
      };
    }
  }

  verifyWebhook(data: any): boolean {
    return true;
  }

  async processWebhook(data: any): Promise<{ type: any; data: any }> {
    return {
      type: 'message',
      data: {
        from: data.from,
        message: data.body,
        message_type: 'text',
        timestamp: new Date()
      }
    };
  }

  async getStatus(): Promise<{ connected: boolean; error?: string; info?: Record<string, any> }> {
    return {
      connected: true,
      info: {
        sender_id: this.config.config.sender_id
      }
    };
  }

  private async sendSMSMessage(params: MessageParams): Promise<any> {
    // Integration with SMS provider (Twilio, AWS SNS, etc.)
    return {
      id: `sms_${Date.now()}`
    };
  }

  private calculateSMSCost(params: MessageParams): number {
    const segments = Math.ceil(params.content.length / 160);
    return segments * 0.05; // Example cost per segment
  }
}

export class MultiChannelService extends EventEmitter {
  private providers: Map<string, ChannelProvider> = new Map();
  private channels: Map<number, Channel> = new Map();

  constructor() {
    super();
    this.initializeService();
  }

  private initializeService(): void {
    logger.info('Multi-channel service initialized');
  }

  async addChannel(userId: number, config: ChannelConfig): Promise<Channel> {
    const channel: Channel = {
      id: this.generateChannelId(),
      user_id: userId,
      type: config.type,
      name: config.name,
      config: config.config,
      status: 'disconnected',
      is_active: true,
      created_at: new Date(),
      updated_at: new Date()
    };

    // Create provider instance
    const provider = this.createProvider(config);
    
    // Test connection
    const status = await provider.getStatus();
    channel.status = status.connected ? 'connected' : 'error';

    // Store channel and provider
    await this.saveChannel(channel);
    this.channels.set(channel.id, channel);
    this.providers.set(`${userId}_${config.type}`, provider);

    logger.info(`Added ${config.type} channel for user ${userId}`);
    return channel;
  }

  async sendMessage(
    userId: number, 
    channelType: string, 
    params: MessageParams
  ): Promise<SendResult> {
    const provider = this.providers.get(`${userId}_${channelType}`);
    
    if (!provider) {
      return {
        success: false,
        error: `No ${channelType} provider found for user ${userId}`,
        channel: channelType
      };
    }

    // Validate message
    const validation = provider.validateMessage(params);
    if (!validation.valid) {
      return {
        success: false,
        error: validation.errors.join(', '),
        channel: channelType
      };
    }

    // Send message
    const result = await provider.sendMessage(params);
    
    // Emit event
    this.emit('message_sent', {
      user_id: userId,
      channel: channelType,
      result,
      params
    });

    return result;
  }

  async processWebhook(
    userId: number, 
    channelType: string, 
    webhookData: any
  ): Promise<void> {
    const provider = this.providers.get(`${userId}_${channelType}`);
    
    if (!provider) {
      logger.warn(`No provider found for webhook: ${userId}_${channelType}`);
      return;
    }

    // Verify webhook
    if (!provider.verifyWebhook(webhookData)) {
      logger.warn('Webhook verification failed');
      return;
    }

    // Process webhook
    const processed = await provider.processWebhook(webhookData);
    
    // Emit event
    this.emit('webhook_processed', {
      user_id: userId,
      channel: channelType,
      type: processed.type,
      data: processed.data
    });
  }

  async getChannelStatus(userId: number, channelType: string): Promise<{
    connected: boolean;
    error?: string;
    info?: Record<string, any>;
  }> {
    const provider = this.providers.get(`${userId}_${channelType}`);
    
    if (!provider) {
      return {
        connected: false,
        error: 'Provider not found'
      };
    }

    return await provider.getStatus();
  }

  async getUserChannels(userId: number): Promise<Channel[]> {
    const userChannels: Channel[] = [];
    
    for (const channel of this.channels.values()) {
      if (channel.user_id === userId) {
        userChannels.push(channel);
      }
    }

    return userChannels;
  }

  async updateChannel(channelId: number, updates: Partial<Channel>): Promise<void> {
    const channel = this.channels.get(channelId);
    if (!channel) {
      throw new Error('Channel not found');
    }

    Object.assign(channel, updates, { updated_at: new Date() });
    await this.saveChannel(channel);
    this.channels.set(channelId, channel);

    logger.info(`Updated channel ${channelId}`);
  }

  async removeChannel(channelId: number): Promise<void> {
    const channel = this.channels.get(channelId);
    if (!channel) {
      throw new Error('Channel not found');
    }

    // Remove provider
    const providerKey = `${channel.user_id}_${channel.type}`;
    this.providers.delete(providerKey);

    // Remove channel
    this.channels.delete(channelId);
    await this.deleteChannel(channelId);

    logger.info(`Removed channel ${channelId}`);
  }

  private createProvider(config: ChannelConfig): ChannelProvider {
    switch (config.type) {
      case 'whatsapp':
        return new WhatsAppProvider(config);
      case 'telegram':
        return new TelegramProvider(config);
      case 'instagram':
        return new InstagramProvider(config);
      case 'sms':
        return new SMSProvider(config);
      default:
        throw new Error(`Unsupported channel type: ${config.type}`);
    }
  }

  private generateChannelId(): number {
    return Date.now() + Math.floor(Math.random() * 1000);
  }

  // Database methods (to be implemented)
  private async saveChannel(channel: Channel): Promise<void> {
    // Save channel to database
  }

  private async deleteChannel(channelId: number): Promise<void> {
    // Delete channel from database
  }
}