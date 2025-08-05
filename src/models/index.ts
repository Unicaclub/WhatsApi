/*
 * Database Models for Advanced Automation System
 * Transforming WppConnect Server into Zapi-like service
 */

export interface DatabaseConnection {
  query(sql: string, params?: any[]): Promise<any>;
  execute(sql: string, params?: any[]): Promise<any>;
}

export interface User {
  id: number;
  email: string;
  name: string;
  plan_type: string;
  api_key: string;
  created_at: Date;
  updated_at: Date;
}

export interface Automation {
  id: number;
  user_id: number;
  name: string;
  description?: string;
  trigger_type: 'keyword' | 'schedule' | 'webhook' | 'button_click' | 'flow_start';
  trigger_config: {
    keywords?: string[];
    schedule?: {
      type: 'once' | 'daily' | 'weekly' | 'monthly';
      datetime?: string;
      days_of_week?: number[];
      time?: string;
    };
    webhook?: {
      url: string;
      method: 'GET' | 'POST';
      headers?: Record<string, string>;
    };
    conditions?: {
      tags?: string[];
      custom_fields?: Record<string, any>;
    };
  };
  actions: AutomationAction[];
  is_active: boolean;
  created_at: Date;
  updated_at: Date;
}

export interface AutomationAction {
  id: string;
  type: 'send_message' | 'add_tag' | 'remove_tag' | 'update_field' | 'delay' | 'condition' | 'webhook' | 'transfer_human';
  config: {
    message?: {
      type: 'text' | 'image' | 'audio' | 'video' | 'document' | 'template';
      content: string;
      media_url?: string;
      template_id?: number;
      variables?: Record<string, string>;
    };
    tag?: string;
    field?: {
      name: string;
      value: any;
    };
    delay?: {
      duration: number;
      unit: 'seconds' | 'minutes' | 'hours' | 'days';
    };
    condition?: {
      field: string;
      operator: 'equals' | 'contains' | 'greater_than' | 'less_than';
      value: any;
      true_actions: string[];
      false_actions: string[];
    };
    webhook?: {
      url: string;
      method: 'GET' | 'POST';
      headers?: Record<string, string>;
      body?: any;
    };
  };
  next_action_id?: string;
}

export interface Contact {
  id: number;
  user_id: number;
  phone: string;
  name?: string;
  email?: string;
  tags: string[];
  custom_fields: Record<string, any>;
  last_interaction: Date;
  channel: 'whatsapp' | 'telegram' | 'instagram' | 'sms';
  status: 'active' | 'blocked' | 'inactive';
  created_at: Date;
  updated_at: Date;
}

export interface Message {
  id: number;
  user_id: number;
  contact_id: number;
  session_id: string;
  message_type: 'text' | 'image' | 'audio' | 'video' | 'document';
  content: string;
  media_url?: string;
  direction: 'inbound' | 'outbound';
  status: 'pending' | 'sent' | 'delivered' | 'read' | 'failed';
  automation_id?: number;
  template_id?: number;
  timestamp: Date;
  channel: 'whatsapp' | 'telegram' | 'instagram' | 'sms';
  external_id?: string;
}

export interface MessageTemplate {
  id: number;
  user_id: number;
  name: string;
  category: 'marketing' | 'utility' | 'authentication';
  language: string;
  status: 'pending' | 'approved' | 'rejected';
  template_type: 'text' | 'media' | 'interactive';
  content: {
    text?: string;
    media_url?: string;
    buttons?: Array<{
      type: 'quick_reply' | 'url' | 'phone';
      text: string;
      payload?: string;
      url?: string;
      phone?: string;
    }>;
    variables?: Array<{
      name: string;
      example: string;
    }>;
  };
  created_at: Date;
  updated_at: Date;
}

export interface Campaign {
  id: number;
  user_id: number;
  name: string;
  description?: string;
  template_id: number;
  target_criteria: {
    tags?: string[];
    custom_fields?: Record<string, any>;
    last_interaction?: {
      operator: 'greater_than' | 'less_than';
      days: number;
    };
  };
  schedule: {
    type: 'immediate' | 'scheduled';
    datetime?: string;
    timezone?: string;
  };
  status: 'draft' | 'scheduled' | 'running' | 'completed' | 'paused';
  metrics: {
    total_contacts: number;
    sent: number;
    delivered: number;
    read: number;
    replied: number;
    failed: number;
  };
  created_at: Date;
  updated_at: Date;
}

export interface Analytics {
  id: number;
  user_id: number;
  metric_type: 'message' | 'automation' | 'campaign' | 'contact';
  metric_name: string;
  value: number;
  metadata: Record<string, any>;
  period_start: Date;
  period_end: Date;
  created_at: Date;
}

export interface QueueJob {
  id: number;
  user_id: number;
  job_type: 'send_message' | 'automation_action' | 'campaign_message';
  priority: number;
  payload: Record<string, any>;
  scheduled_at: Date;
  attempts: number;
  max_attempts: number;
  status: 'pending' | 'processing' | 'completed' | 'failed';
  error_message?: string;
  created_at: Date;
  updated_at: Date;
}

export interface Integration {
  id: number;
  user_id: number;
  type: 'crm' | 'ecommerce' | 'webhook' | 'zapier';
  name: string;
  config: {
    api_key?: string;
    webhook_url?: string;
    credentials?: Record<string, any>;
    mapping?: Record<string, string>;
  };
  is_active: boolean;
  created_at: Date;
  updated_at: Date;
}

export interface Channel {
  id: number;
  user_id: number;
  type: 'whatsapp' | 'telegram' | 'instagram' | 'sms';
  name: string;
  config: {
    api_key?: string;
    webhook_url?: string;
    phone_number?: string;
    access_token?: string;
  };
  status: 'connected' | 'disconnected' | 'error';
  is_active: boolean;
  created_at: Date;
  updated_at: Date;
}