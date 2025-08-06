/*
 * Advanced Analytics and Metrics System
 * Tracks performance, engagement, and automation effectiveness
 */

import { EventEmitter } from 'events';
import { logger } from '../index';
import { Analytics } from '../models';

export interface MetricData {
  user_id: number;
  metric_type: 'message' | 'automation' | 'campaign' | 'contact' | 'engagement';
  metric_name: string;
  value: number;
  metadata?: Record<string, any>;
  timestamp?: Date;
}

export interface DashboardMetrics {
  total_messages: number;
  messages_sent: number;
  messages_received: number;
  delivery_rate: number;
  read_rate: number;
  response_rate: number;
  active_contacts: number;
  new_contacts: number;
  automations_triggered: number;
  campaigns_sent: number;
  period_comparison: {
    messages_growth: number;
    contacts_growth: number;
    engagement_growth: number;
  };
}

export interface AutomationAnalytics {
  automation_id: number;
  automation_name: string;
  total_triggers: number;
  successful_executions: number;
  failed_executions: number;
  success_rate: number;
  avg_execution_time: number;
  contacts_reached: number;
  conversion_rate: number;
  most_common_trigger: string;
  performance_trend: Array<{
    date: string;
    executions: number;
    success_rate: number;
  }>;
}

export interface CampaignAnalytics {
  campaign_id: number;
  campaign_name: string;
  total_sent: number;
  delivered: number;
  read: number;
  replied: number;
  failed: number;
  delivery_rate: number;
  read_rate: number;
  response_rate: number;
  cost_per_message: number;
  roi: number;
  best_sending_time: string;
  audience_breakdown: Record<string, number>;
}

export interface ContactAnalytics {
  contact_id: number;
  phone: string;
  name?: string;
  total_messages_received: number;
  total_messages_sent: number;
  last_interaction: Date;
  response_rate: number;
  avg_response_time: number; // in minutes
  engagement_score: number; // 0-100
  preferred_time: string;
  message_frequency: number; // messages per week
  automation_triggers: number;
  tags: string[];
  lifecycle_stage: 'new' | 'active' | 'engaged' | 'at_risk' | 'churned';
}

export class AnalyticsService extends EventEmitter {
  private metrics: Map<string, MetricData[]> = new Map();
  private realTimeMetrics: Map<string, number> = new Map();
  private aggregationIntervals: Map<string, NodeJS.Timeout> = new Map();

  constructor() {
    super();
    this.initializeMetrics();
    this.startRealTimeTracking();
    this.setupAggregationJobs();
  }

  private initializeMetrics(): void {
    const metricTypes = [
      'messages_sent',
      'messages_received', 
      'messages_delivered',
      'messages_read',
      'messages_failed',
      'automations_triggered',
      'campaigns_sent',
      'contacts_added',
      'contacts_active',
      'response_time',
      'engagement_score'
    ];

    metricTypes.forEach(type => {
      this.metrics.set(type, []);
      this.realTimeMetrics.set(type, 0);
    });

    logger.info('Analytics service initialized');
  }

  private startRealTimeTracking(): void {
    // Update real-time metrics every 30 seconds
    setInterval(() => {
      this.updateRealTimeMetrics();
    }, 30000);
  }

  private setupAggregationJobs(): void {
    // Aggregate hourly metrics
    this.aggregationIntervals.set('hourly', setInterval(() => {
      this.aggregateMetrics('hour');
    }, 60 * 60 * 1000)); // Every hour

    // Aggregate daily metrics
    this.aggregationIntervals.set('daily', setInterval(() => {
      this.aggregateMetrics('day');
    }, 24 * 60 * 60 * 1000)); // Every day

    // Aggregate weekly metrics
    this.aggregationIntervals.set('weekly', setInterval(() => {
      this.aggregateMetrics('week');
    }, 7 * 24 * 60 * 60 * 1000)); // Every week
  }

  async recordEvent(
    userId: number, 
    eventType: string, 
    metadata: Record<string, any> = {},
    value: number = 1
  ): Promise<void> {
    const metricData: MetricData = {
      user_id: userId,
      metric_type: this.getMetricType(eventType),
      metric_name: eventType,
      value,
      metadata,
      timestamp: new Date()
    };

    // Store metric
    await this.storeMetric(metricData);

    // Update real-time counter
    const currentValue = this.realTimeMetrics.get(eventType) || 0;
    this.realTimeMetrics.set(eventType, currentValue + value);

    // Emit event for real-time updates
    this.emit('metric_recorded', metricData);

    logger.debug(`Recorded metric: ${eventType} = ${value} for user ${userId}`);
  }

  async getDashboardMetrics(
    userId: number, 
    period: 'day' | 'week' | 'month' | 'year' = 'week'
  ): Promise<DashboardMetrics> {
    const startDate = this.getStartDate(period);
    const endDate = new Date();

    // Get current period metrics
    const currentMetrics = await this.getMetricsForPeriod(userId, startDate, endDate);
    
    // Get previous period for comparison
    const previousStartDate = this.getPreviousStartDate(startDate, period);
    const previousMetrics = await this.getMetricsForPeriod(userId, previousStartDate, startDate);

    // Calculate rates
    const messagesSent = this.getMetricValue(currentMetrics, 'messages_sent');
    const messagesDelivered = this.getMetricValue(currentMetrics, 'messages_delivered');
    const messagesRead = this.getMetricValue(currentMetrics, 'messages_read');
    const messagesReceived = this.getMetricValue(currentMetrics, 'messages_received');

    const deliveryRate = messagesSent > 0 ? (messagesDelivered / messagesSent) * 100 : 0;
    const readRate = messagesDelivered > 0 ? (messagesRead / messagesDelivered) * 100 : 0;
    const responseRate = messagesSent > 0 ? (messagesReceived / messagesSent) * 100 : 0;

    // Calculate growth rates
    const previousMessagesSent = this.getMetricValue(previousMetrics, 'messages_sent');
    const previousContactsActive = this.getMetricValue(previousMetrics, 'contacts_active');
    const previousEngagement = this.getMetricValue(previousMetrics, 'engagement_score');

    const messagesGrowth = this.calculateGrowthRate(messagesSent, previousMessagesSent);
    const contactsGrowth = this.calculateGrowthRate(
      this.getMetricValue(currentMetrics, 'contacts_active'),
      previousContactsActive
    );
    const engagementGrowth = this.calculateGrowthRate(
      this.getMetricValue(currentMetrics, 'engagement_score'),
      previousEngagement
    );

    return {
      total_messages: messagesSent + messagesReceived,
      messages_sent: messagesSent,
      messages_received: messagesReceived,
      delivery_rate: Math.round(deliveryRate * 100) / 100,
      read_rate: Math.round(readRate * 100) / 100,
      response_rate: Math.round(responseRate * 100) / 100,
      active_contacts: this.getMetricValue(currentMetrics, 'contacts_active'),
      new_contacts: this.getMetricValue(currentMetrics, 'contacts_added'),
      automations_triggered: this.getMetricValue(currentMetrics, 'automations_triggered'),
      campaigns_sent: this.getMetricValue(currentMetrics, 'campaigns_sent'),
      period_comparison: {
        messages_growth: messagesGrowth,
        contacts_growth: contactsGrowth,
        engagement_growth: engagementGrowth
      }
    };
  }

  async getAutomationAnalytics(
    userId: number, 
    automationId: number,
    period: 'day' | 'week' | 'month' = 'month'
  ): Promise<AutomationAnalytics> {
    const startDate = this.getStartDate(period);
    const endDate = new Date();

    const metrics = await this.getAutomationMetrics(userId, automationId, startDate, endDate);
    const performanceTrend = await this.getAutomationPerformanceTrend(automationId, startDate, endDate);

    const totalTriggers = this.getMetricValue(metrics, 'automation_triggered');
    const successfulExecutions = this.getMetricValue(metrics, 'automation_completed');
    const failedExecutions = this.getMetricValue(metrics, 'automation_failed');
    const successRate = totalTriggers > 0 ? (successfulExecutions / totalTriggers) * 100 : 0;

    return {
      automation_id: automationId,
      automation_name: await this.getAutomationName(automationId),
      total_triggers: totalTriggers,
      successful_executions: successfulExecutions,
      failed_executions: failedExecutions,
      success_rate: Math.round(successRate * 100) / 100,
      avg_execution_time: this.getMetricValue(metrics, 'automation_execution_time'),
      contacts_reached: this.getMetricValue(metrics, 'automation_contacts_reached'),
      conversion_rate: await this.calculateAutomationConversionRate(automationId, startDate, endDate),
      most_common_trigger: await this.getMostCommonTrigger(automationId, startDate, endDate),
      performance_trend: performanceTrend
    };
  }

  async getCampaignAnalytics(
    userId: number, 
    campaignId: number
  ): Promise<CampaignAnalytics> {
    const metrics = await this.getCampaignMetrics(userId, campaignId);
    
    const totalSent = this.getMetricValue(metrics, 'campaign_sent');
    const delivered = this.getMetricValue(metrics, 'campaign_delivered');
    const read = this.getMetricValue(metrics, 'campaign_read');
    const replied = this.getMetricValue(metrics, 'campaign_replied');
    const failed = this.getMetricValue(metrics, 'campaign_failed');

    const deliveryRate = totalSent > 0 ? (delivered / totalSent) * 100 : 0;
    const readRate = delivered > 0 ? (read / delivered) * 100 : 0;
    const responseRate = totalSent > 0 ? (replied / totalSent) * 100 : 0;

    return {
      campaign_id: campaignId,
      campaign_name: await this.getCampaignName(campaignId),
      total_sent: totalSent,
      delivered,
      read,
      replied,
      failed,
      delivery_rate: Math.round(deliveryRate * 100) / 100,
      read_rate: Math.round(readRate * 100) / 100,
      response_rate: Math.round(responseRate * 100) / 100,
      cost_per_message: await this.calculateCostPerMessage(campaignId),
      roi: await this.calculateCampaignROI(campaignId),
      best_sending_time: await this.getBestSendingTime(campaignId),
      audience_breakdown: await this.getAudienceBreakdown(campaignId)
    };
  }

  async getContactAnalytics(contactId: number): Promise<ContactAnalytics> {
    const contact = await this.getContactDetails(contactId);
    const messageStats = await this.getContactMessageStats(contactId);
    const engagementScore = await this.calculateEngagementScore(contactId);
    const lifecycleStage = await this.determineLifecycleStage(contactId);

    return {
      contact_id: contactId,
      phone: contact.phone,
      name: contact.name,
      total_messages_received: messageStats.received,
      total_messages_sent: messageStats.sent,
      last_interaction: messageStats.last_interaction,
      response_rate: messageStats.response_rate,
      avg_response_time: messageStats.avg_response_time,
      engagement_score: engagementScore,
      preferred_time: await this.getPreferredTimeSlot(contactId),
      message_frequency: await this.getMessageFrequency(contactId),
      automation_triggers: await this.getAutomationTriggerCount(contactId),
      tags: contact.tags,
      lifecycle_stage: (lifecycleStage as 'new' | 'active' | 'engaged' | 'at_risk' | 'churned')
    };
  }

  async getEngagementMetrics(
    userId: number, 
    period: 'day' | 'week' | 'month' = 'week'
  ): Promise<{
    engagement_rate: number;
    top_performing_content: Array<{
      content: string;
      engagement_rate: number;
      reach: number;
    }>;
    engagement_by_time: Array<{
      hour: number;
      engagement_rate: number;
    }>;
    channel_performance: Record<string, {
      messages: number;
      engagement_rate: number;
    }>;
  }> {
    const startDate = this.getStartDate(period);
    const endDate = new Date();

    const engagementRate = await this.calculateOverallEngagementRate(userId, startDate, endDate);
    const topContent = await this.getTopPerformingContent(userId, startDate, endDate);
    const engagementByTime = await this.getEngagementByTimeOfDay(userId, startDate, endDate);
    const channelPerformance = await this.getChannelPerformance(userId, startDate, endDate);

    return {
      engagement_rate: engagementRate,
      top_performing_content: topContent,
      engagement_by_time: engagementByTime,
      channel_performance: channelPerformance
    };
  }

  async generateReport(
    userId: number, 
    reportType: 'summary' | 'detailed' | 'automation' | 'campaign',
    period: 'day' | 'week' | 'month' | 'year' = 'month',
    format: 'json' | 'csv' | 'pdf' = 'json'
  ): Promise<any> {
    const startDate = this.getStartDate(period);
    const endDate = new Date();

    let reportData: any;

    switch (reportType) {
      case 'summary':
        reportData = await this.generateSummaryReport(userId, startDate, endDate);
        break;
      case 'detailed':
        reportData = await this.generateDetailedReport(userId, startDate, endDate);
        break;
      case 'automation':
        reportData = await this.generateAutomationReport(userId, startDate, endDate);
        break;
      case 'campaign':
        reportData = await this.generateCampaignReport(userId, startDate, endDate);
        break;
      default:
        throw new Error('Invalid report type');
    }

    // Format the report
    switch (format) {
      case 'csv':
        return this.formatAsCSV(reportData);
      case 'pdf':
        return this.formatAsPDF(reportData);
      default:
        return reportData;
    }
  }

  // Private helper methods
  private getMetricType(eventType: string): 'message' | 'automation' | 'campaign' | 'contact' | 'engagement' {
    if (eventType.includes('message')) return 'message';
    if (eventType.includes('automation')) return 'automation';
    if (eventType.includes('campaign')) return 'campaign';
    if (eventType.includes('contact')) return 'contact';
    return 'engagement';
  }

  private getStartDate(period: string): Date {
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
      case 'year':
        return new Date(now.getFullYear(), 0, 1);
      default:
        return new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);
    }
  }

  private getPreviousStartDate(startDate: Date, period: string): Date {
    const previous = new Date(startDate);
    switch (period) {
      case 'day':
        previous.setDate(previous.getDate() - 1);
        break;
      case 'week':
        previous.setDate(previous.getDate() - 7);
        break;
      case 'month':
        previous.setMonth(previous.getMonth() - 1);
        break;
      case 'year':
        previous.setFullYear(previous.getFullYear() - 1);
        break;
    }
    return previous;
  }

  private getMetricValue(metrics: Analytics[], metricName: string): number {
    const metric = metrics.find(m => m.metric_name === metricName);
    return metric ? metric.value : 0;
  }

  private calculateGrowthRate(current: number, previous: number): number {
    if (previous === 0) return current > 0 ? 100 : 0;
    return Math.round(((current - previous) / previous) * 100 * 100) / 100;
  }

  private async updateRealTimeMetrics(): Promise<void> {
    // Update real-time metrics from database
    // Implementation would fetch recent metrics and update the real-time counters
  }

  private async aggregateMetrics(period: 'hour' | 'day' | 'week'): Promise<void> {
    // Aggregate metrics for the specified period
    // This would group raw metrics and create summary records
    logger.info(`Aggregating metrics for period: ${period}`);
  }

  // Database interaction methods (to be implemented)
  private async storeMetric(metricData: MetricData): Promise<void> {
    // Store metric in database
  }

  private async getMetricsForPeriod(userId: number, startDate: Date, endDate: Date): Promise<Analytics[]> {
    // Fetch metrics from database for the specified period
    return [];
  }

  private async getAutomationMetrics(userId: number, automationId: number, startDate: Date, endDate: Date): Promise<Analytics[]> {
    return [];
  }

  private async getCampaignMetrics(userId: number, campaignId: number): Promise<Analytics[]> {
    return [];
  }

  private async getContactDetails(contactId: number): Promise<any> {
    return {};
  }

  private async getContactMessageStats(contactId: number): Promise<any> {
    return {};
  }

  private async calculateEngagementScore(contactId: number): Promise<number> {
    return 0;
  }

  private async determineLifecycleStage(contactId: number): Promise<string> {
    return 'active';
  }

  // Additional helper methods would be implemented here...
  private async getAutomationName(automationId: number): Promise<string> { return ''; }
  private async getCampaignName(campaignId: number): Promise<string> { return ''; }
  private async getAutomationPerformanceTrend(automationId: number, startDate: Date, endDate: Date): Promise<any[]> { return []; }
  private async calculateAutomationConversionRate(automationId: number, startDate: Date, endDate: Date): Promise<number> { return 0; }
  private async getMostCommonTrigger(automationId: number, startDate: Date, endDate: Date): Promise<string> { return ''; }
  private async calculateCostPerMessage(campaignId: number): Promise<number> { return 0; }
  private async calculateCampaignROI(campaignId: number): Promise<number> { return 0; }
  private async getBestSendingTime(campaignId: number): Promise<string> { return ''; }
  private async getAudienceBreakdown(campaignId: number): Promise<Record<string, number>> { return {}; }
  private async getPreferredTimeSlot(contactId: number): Promise<string> { return ''; }
  private async getMessageFrequency(contactId: number): Promise<number> { return 0; }
  private async getAutomationTriggerCount(contactId: number): Promise<number> { return 0; }
  private async calculateOverallEngagementRate(userId: number, startDate: Date, endDate: Date): Promise<number> { return 0; }
  private async getTopPerformingContent(userId: number, startDate: Date, endDate: Date): Promise<any[]> { return []; }
  private async getEngagementByTimeOfDay(userId: number, startDate: Date, endDate: Date): Promise<any[]> { return []; }
  private async getChannelPerformance(userId: number, startDate: Date, endDate: Date): Promise<Record<string, any>> { return {}; }
  private async generateSummaryReport(userId: number, startDate: Date, endDate: Date): Promise<any> { return {}; }
  private async generateDetailedReport(userId: number, startDate: Date, endDate: Date): Promise<any> { return {}; }
  private async generateAutomationReport(userId: number, startDate: Date, endDate: Date): Promise<any> { return {}; }
  private async generateCampaignReport(userId: number, startDate: Date, endDate: Date): Promise<any> { return {}; }
  private formatAsCSV(data: any): string { return ''; }
  private formatAsPDF(data: any): Buffer { return Buffer.from(''); }
}