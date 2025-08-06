/*
 * Advanced Queue Management System
 * Handles message delays, scheduling, and priority processing
 */

import { EventEmitter } from 'events';
import { logger } from '../index';
import { QueueJob } from '../models';

export interface QueueOptions {
  maxConcurrent: number;
  retryDelay: number;
  maxRetries: number;
}

export class QueueManager extends EventEmitter {
  private queues: Map<string, QueueJob[]> = new Map();
  private processing: Map<string, boolean> = new Map();
  private workers: Map<string, NodeJS.Timeout> = new Map();
  private options: QueueOptions;

  constructor(options: Partial<QueueOptions> = {}) {
    super();
    this.options = {
      maxConcurrent: 5,
      retryDelay: 60000, // 1 minute
      maxRetries: 3,
      ...options
    };

    this.initializeQueues();
    this.startQueueProcessors();
  }

  private initializeQueues(): void {
    // Initialize different queue types
    const queueTypes = [
      'send_message',
      'automation_action', 
      'campaign_message',
      'delayed_action'
    ];

    queueTypes.forEach(type => {
      this.queues.set(type, []);
      this.processing.set(type, false);
    });
  }

  private startQueueProcessors(): void {
    // Start processors for each queue type
    this.queues.forEach((_, queueType) => {
      this.startProcessor(queueType);
    });

    // Process scheduled jobs every minute
    setInterval(() => {
      this.processScheduledJobs();
    }, 60000);
  }

  private startProcessor(queueType: string): void {
    const processor = setInterval(async () => {
      if (this.processing.get(queueType)) {
        return;
      }

      const queue = this.queues.get(queueType);
      if (!queue || queue.length === 0) {
        return;
      }

      this.processing.set(queueType, true);

      try {
        // Process up to maxConcurrent jobs
        const jobsToProcess = queue.splice(0, this.options.maxConcurrent);
        
        await Promise.all(
          jobsToProcess.map(job => this.processJob(job))
        );
      } catch (error) {
        logger.error(`Error processing queue ${queueType}:`, error);
      } finally {
        this.processing.set(queueType, false);
      }
    }, 1000); // Check every second

    this.workers.set(queueType, processor);
  }

  async addJob(job: Partial<QueueJob>): Promise<void> {
    const fullJob: QueueJob = {
      id: this.generateJobId(),
      user_id: job.user_id!,
      job_type: job.job_type!,
      priority: job.priority || 0,
      payload: job.payload!,
      scheduled_at: job.scheduled_at || new Date(),
      attempts: 0,
      max_attempts: job.max_attempts || this.options.maxRetries,
      status: 'pending',
      created_at: new Date(),
      updated_at: new Date()
    };

    // If job is scheduled for future, store it separately
    if (fullJob.scheduled_at > new Date()) {
      await this.storeScheduledJob(fullJob);
      return;
    }

    // Add to appropriate queue based on priority
    const queue = this.queues.get(fullJob.job_type);
    if (queue) {
      this.insertJobByPriority(queue, fullJob);
      logger.debug(`Job added to ${fullJob.job_type} queue`);
    } else {
      logger.error(`Unknown job type: ${fullJob.job_type}`);
    }
  }

  private insertJobByPriority(queue: QueueJob[], job: QueueJob): void {
    // Insert job based on priority (higher priority first)
    let inserted = false;
    for (let i = 0; i < queue.length; i++) {
      if (job.priority > queue[i].priority) {
        queue.splice(i, 0, job);
        inserted = true;
        break;
      }
    }
    
    if (!inserted) {
      queue.push(job);
    }
  }

  private async processJob(job: QueueJob): Promise<void> {
    try {
      job.status = 'processing';
      job.attempts++;
      job.updated_at = new Date();

      logger.debug(`Processing job ${job.id} (attempt ${job.attempts})`);

      // Process based on job type
      switch (job.job_type) {
        case 'send_message':
          await this.processSendMessageJob(job);
          break;
        case 'automation_action':
          await this.processAutomationActionJob(job);
          break;
        case 'campaign_message':
          await this.processCampaignMessageJob(job);
          break;
        // 'webhook_call' removido pois não é permitido pelo modelo
        default:
          throw new Error(`Unknown job type: ${job.job_type}`);
      }

      job.status = 'completed';
      logger.debug(`Job ${job.id} completed successfully`);

      // Emit completion event
      this.emit('job_completed', job);

    } catch (error) {
      logger.error(`Job ${job.id} failed (attempt ${job.attempts}):`, error);
      
      job.error_message = error instanceof Error ? error.message : String(error);
      
      if (job.attempts < job.max_attempts) {
        // Retry job with exponential backoff
        job.status = 'pending';
        const delay = this.calculateRetryDelay(job.attempts);
        
        setTimeout(() => {
          const queue = this.queues.get(job.job_type);
          if (queue) {
            this.insertJobByPriority(queue, job);
          }
        }, delay);
        
        logger.info(`Job ${job.id} scheduled for retry in ${delay}ms`);
      } else {
        job.status = 'failed';
        logger.error(`Job ${job.id} failed permanently after ${job.attempts} attempts`);
        
        // Emit failure event
        this.emit('job_failed', job);
      }
    }

    // Update job in database
    await this.updateJob(job);
  }

  private async processSendMessageJob(job: QueueJob): Promise<void> {
    const { contact_id, phone, message_type, content, media_url, channel, automation_id } = job.payload;

    // Get message service for the channel
    const messageService = this.getMessageService(channel);
    
    // Send message
    const result = await messageService.sendMessage({
      phone,
      type: message_type,
      content,
      media_url
    });

    // Save message to database
    await this.saveOutboundMessage({
      user_id: job.user_id,
      contact_id,
      message_type,
      content,
      media_url,
      direction: 'outbound',
      status: result.success ? 'sent' : 'failed',
      automation_id,
      channel,
      external_id: result.message_id,
      timestamp: new Date()
    });

    if (!result.success) {
      throw new Error(result.error || 'Failed to send message');
    }
  }

  private async processAutomationActionJob(job: QueueJob): Promise<void> {
    const { automation_id, action_id, contact_id } = job.payload;

    // This would integrate with AutomationEngine
    // For now, just log the action
    logger.info(`Processing delayed automation action: ${action_id} for contact: ${contact_id}`);
    
    // Here you would:
    // 1. Load the automation and action
    // 2. Load the contact
    // 3. Execute the specific action
    // 4. Continue with the automation flow
  }

  private async processCampaignMessageJob(job: QueueJob): Promise<void> {
    const { campaign_id, contact_id, template_id, variables } = job.payload;

    // This would integrate with CampaignManager
    logger.info(`Processing campaign message: ${campaign_id} for contact: ${contact_id}`);
    
    // Here you would:
    // 1. Load campaign and template
    // 2. Load contact
    // 3. Process template with variables
    // 4. Send message
    // 5. Update campaign metrics
  }

  private async processWebhookJob(job: QueueJob): Promise<void> {
    const { url, method, headers, body } = job.payload;

    const fetch = (await import('node-fetch')).default;
    const response = await fetch(url, {
      method: method || 'POST',
      headers: {
        'Content-Type': 'application/json',
        ...headers
      },
      body: JSON.stringify(body)
    });

    if (!response.ok) {
      throw new Error(`Webhook failed with status: ${response.status}`);
    }
  }

  private calculateRetryDelay(attempt: number): number {
    // Exponential backoff: base_delay * (2 ^ attempt)
    return Math.min(this.options.retryDelay * Math.pow(2, attempt - 1), 300000); // Max 5 minutes
  }

  private async processScheduledJobs(): Promise<void> {
    const now = new Date();
    const scheduledJobs = await this.getScheduledJobs(now);

    for (const job of scheduledJobs) {
      await this.addJob(job);
      await this.removeScheduledJob(job.id);
    }
  }

  private generateJobId(): number {
    return Date.now() + Math.floor(Math.random() * 1000);
  }

  private getMessageService(channel: string): any {
    // This would return the appropriate message service based on channel
    // For now, return a mock service
    return {
      sendMessage: async (params: any) => {
        logger.info(`Sending ${params.type} message to ${params.phone} via ${channel}`);
        return { success: true, message_id: `msg_${Date.now()}` };
      }
    };
  }

  // Database methods (to be implemented with your DB layer)
  private async storeScheduledJob(job: QueueJob): Promise<void> {
    // Store job in database with scheduled_at timestamp
    logger.debug(`Scheduled job ${job.id} for ${job.scheduled_at}`);
  }

  private async getScheduledJobs(before: Date): Promise<QueueJob[]> {
    // Get jobs scheduled before the given date
    return [];
  }

  private async removeScheduledJob(jobId: number): Promise<void> {
    // Remove scheduled job from database
    logger.debug(`Removed scheduled job ${jobId}`);
  }

  private async updateJob(job: QueueJob): Promise<void> {
    // Update job status in database
    logger.debug(`Updated job ${job.id} status to ${job.status}`);
  }

  private async saveOutboundMessage(message: any): Promise<void> {
    // Save outbound message to database
    logger.debug(`Saved outbound message for contact ${message.contact_id}`);
  }

  // Public methods for queue management
  async pauseQueue(queueType: string): Promise<void> {
    const worker = this.workers.get(queueType);
    if (worker) {
      clearInterval(worker);
      this.workers.delete(queueType);
      logger.info(`Queue ${queueType} paused`);
    }
  }

  async resumeQueue(queueType: string): Promise<void> {
    if (!this.workers.has(queueType)) {
      this.startProcessor(queueType);
      logger.info(`Queue ${queueType} resumed`);
    }
  }

  getQueueStats(): Record<string, any> {
    const stats: Record<string, any> = {};
    
    this.queues.forEach((queue, type) => {
      stats[type] = {
        pending: queue.length,
        processing: this.processing.get(type) || false
      };
    });

    return stats;
  }

  async clearQueue(queueType: string): Promise<void> {
    const queue = this.queues.get(queueType);
    if (queue) {
      queue.length = 0;
      logger.info(`Queue ${queueType} cleared`);
    }
  }

  destroy(): void {
    // Clean up all workers
    this.workers.forEach((worker, type) => {
      clearInterval(worker);
      logger.info(`Queue processor ${type} stopped`);
    });
    
    this.workers.clear();
    this.queues.clear();
    this.processing.clear();
  }
}