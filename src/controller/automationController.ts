/*
 * Automation Controller for Zapi-like functionality
 * Handles automation creation, management, and execution
 */

import { Request, Response } from 'express';
import { logger } from '../index';
import { AutomationEngine } from '../services/AutomationEngine';
import { ContactSegmentation } from '../services/ContactSegmentation';
import { TemplateEngine } from '../services/TemplateEngine';

const automationEngine = new AutomationEngine();
const contactSegmentation = new ContactSegmentation();
const templateEngine = new TemplateEngine();

export async function createAutomation(req: Request, res: Response): Promise<void> {
  try {
    const { session } = req.params;
    const {
      name,
      description,
      trigger_type,
      trigger_config,
      actions,
      is_active = true
    } = req.body;

    // Validate required fields
    if (!name || !trigger_type || !trigger_config || !actions) {
      res.status(400).json({
        success: false,
        error: 'Missing required fields: name, trigger_type, trigger_config, actions'
      });
      return;
    }

    // Get user ID from session
    const userId = await getUserIdFromSession(session);
    if (!userId) {
      res.status(401).json({
        success: false,
        error: 'Invalid session'
      });
      return;
    }

    // Create automation
    const automation = {
      id: generateAutomationId(),
      user_id: userId,
      name,
      description,
      trigger_type,
      trigger_config,
      actions,
      is_active,
      created_at: new Date(),
      updated_at: new Date()
    };

    // Save automation (database implementation needed)
    await saveAutomation(automation);

    logger.info(`Created automation "${name}" for user ${userId}`);

    res.json({
      success: true,
      message: 'Automation created successfully',
      automation: {
        id: automation.id,
        name: automation.name,
        trigger_type: automation.trigger_type,
        is_active: automation.is_active
      }
    });

  } catch (error) {
    logger.error('Error creating automation:', error);
    res.status(500).json({
      success: false,
      error: 'Internal server error'
    });
  }
}

export async function getAutomations(req: Request, res: Response): Promise<void> {
  try {
    const { session } = req.params;
    const { status, trigger_type } = req.query;

    const userId = await getUserIdFromSession(session);
    if (!userId) {
      res.status(401).json({
        success: false,
        error: 'Invalid session'
      });
      return;
    }

    // Get user automations with filters
    let automations = await getUserAutomations(userId);

    if (status) {
      const isActive = status === 'active';
      automations = automations.filter(auto => auto.is_active === isActive);
    }

    if (trigger_type) {
      automations = automations.filter(auto => auto.trigger_type === trigger_type);
    }

    res.json({
      success: true,
      automations: automations.map(automation => ({
        id: automation.id,
        name: automation.name,
        description: automation.description,
        trigger_type: automation.trigger_type,
        is_active: automation.is_active,
        created_at: automation.created_at,
        actions_count: automation.actions.length
      }))
    });

  } catch (error) {
    logger.error('Error getting automations:', error);
    res.status(500).json({
      success: false,
      error: 'Internal server error'
    });
  }
}

export async function updateAutomation(req: Request, res: Response): Promise<void> {
  try {
    const { session, automationId } = req.params;
    const updates = req.body;

    const userId = await getUserIdFromSession(session);
    if (!userId) {
      res.status(401).json({
        success: false,
        error: 'Invalid session'
      });
      return;
    }

    // Check if automation exists and belongs to user
    const automation = await getAutomation(parseInt(automationId));
    if (!automation || automation.user_id !== userId) {
      res.status(404).json({
        success: false,
        error: 'Automation not found'
      });
      return;
    }

    // Update automation
    Object.assign(automation, updates, { updated_at: new Date() });
    await saveAutomation(automation);

    logger.info(`Updated automation ${automationId} for user ${userId}`);

    res.json({
      success: true,
      message: 'Automation updated successfully'
    });

  } catch (error) {
    logger.error('Error updating automation:', error);
    res.status(500).json({
      success: false,
      error: 'Internal server error'
    });
  }
}

export async function deleteAutomation(req: Request, res: Response): Promise<void> {
  try {
    const { session, automationId } = req.params;

    const userId = await getUserIdFromSession(session);
    if (!userId) {
      res.status(401).json({
        success: false,
        error: 'Invalid session'
      });
      return;
    }

    // Check if automation exists and belongs to user
    const automation = await getAutomation(parseInt(automationId));
    if (!automation || automation.user_id !== userId) {
      res.status(404).json({
        success: false,
        error: 'Automation not found'
      });
      return;
    }

    // Delete automation
    await deleteAutomationById(parseInt(automationId));

    logger.info(`Deleted automation ${automationId} for user ${userId}`);

    res.json({
      success: true,
      message: 'Automation deleted successfully'
    });

  } catch (error) {
    logger.error('Error deleting automation:', error);
    res.status(500).json({
      success: false,
      error: 'Internal server error'
    });
  }
}

export async function toggleAutomation(req: Request, res: Response): Promise<void> {
  try {
    const { session, automationId } = req.params;
    const { is_active } = req.body;

    if (typeof is_active !== 'boolean') {
      res.status(400).json({
        success: false,
        error: 'is_active must be a boolean'
      });
      return;
    }

    const userId = await getUserIdFromSession(session);
    if (!userId) {
      res.status(401).json({
        success: false,
        error: 'Invalid session'
      });
      return;
    }

    // Check if automation exists and belongs to user
    const automation = await getAutomation(parseInt(automationId));
    if (!automation || automation.user_id !== userId) {
      res.status(404).json({
        success: false,
        error: 'Automation not found'
      });
      return;
    }

    // Toggle automation
    automation.is_active = is_active;
    automation.updated_at = new Date();
    await saveAutomation(automation);

    logger.info(`${is_active ? 'Activated' : 'Deactivated'} automation ${automationId} for user ${userId}`);

    res.json({
      success: true,
      message: `Automation ${is_active ? 'activated' : 'deactivated'} successfully`
    });

  } catch (error) {
    logger.error('Error toggling automation:', error);
    res.status(500).json({
      success: false,
      error: 'Internal server error'
    });
  }
}

export async function testAutomation(req: Request, res: Response): Promise<void> {
  try {
    const { session, automationId } = req.params;
    const { test_phone, test_message } = req.body;

    const userId = await getUserIdFromSession(session);
    if (!userId) {
      res.status(401).json({
        success: false,
        error: 'Invalid session'
      });
      return;
    }

    // Check if automation exists and belongs to user
    const automation = await getAutomation(parseInt(automationId));
    if (!automation || automation.user_id !== userId) {
      res.status(404).json({
        success: false,
        error: 'Automation not found'
      });
      return;
    }

    // Create or get test contact
    const testContact = await findOrCreateContact(userId, test_phone || '5511999999999', 'whatsapp');

    // Test automation execution
    await automationEngine.executeAutomation(automation, testContact, {
      id: 0,
      user_id: userId,
      contact_id: testContact.id,
      session_id: session,
      message_type: 'text',
      content: test_message || 'test',
      direction: 'inbound',
      status: 'read',
      timestamp: new Date(),
      channel: 'whatsapp'
    });

    logger.info(`Tested automation ${automationId} for user ${userId}`);

    res.json({
      success: true,
      message: 'Automation test executed successfully'
    });

  } catch (error) {
    logger.error('Error testing automation:', error);
    res.status(500).json({
      success: false,
      error: 'Internal server error'
    });
  }
}

export async function getAutomationAnalytics(req: Request, res: Response): Promise<void> {
  try {
    const { session, automationId } = req.params;
    const { period = 'month' } = req.query;

    const userId = await getUserIdFromSession(session);
    if (!userId) {
      res.status(401).json({
        success: false,
        error: 'Invalid session'
      });
      return;
    }

    // Get automation analytics
    const analytics = await getAutomationAnalyticsData(
      userId, 
      parseInt(automationId), 
      period as 'day' | 'week' | 'month'
    );

    res.json({
      success: true,
      analytics
    });

  } catch (error) {
    logger.error('Error getting automation analytics:', error);
    res.status(500).json({
      success: false,
      error: 'Internal server error'
    });
  }
}

export async function processIncomingMessage(req: Request, res: Response): Promise<void> {
  try {
    const webhookData = req.body;
    
    // Extract message data from webhook
    const {
      user_id,
      session,
      from: phone,
      body: messageContent,
      type: messageType = 'text',
      channel = 'whatsapp'
    } = webhookData;

    if (!user_id || !phone || !messageContent) {
      res.status(400).json({
        success: false,
        error: 'Missing required webhook data'
      });
      return;
    }

    // Process message through automation engine
    await automationEngine.processIncomingMessage(
      user_id,
      phone,
      messageContent,
      messageType,
      channel,
      session
    );

    logger.info(`Processed incoming message from ${phone} for user ${user_id}`);

    res.json({
      success: true,
      message: 'Message processed successfully'
    });

  } catch (error) {
    logger.error('Error processing incoming message:', error);
    res.status(500).json({
      success: false,
      error: 'Internal server error'
    });
  }
}

export async function getAutomationTemplates(req: Request, res: Response): Promise<void> {
  try {
    const templates = [
      {
        name: 'Boas-vindas',
        description: 'Mensagem automática de boas-vindas para novos contatos',
        trigger_type: 'keyword',
        trigger_config: {
          keywords: ['oi', 'olá', 'hello', 'opa']
        },
        actions: [
          {
            id: '1',
            type: 'send_message',
            config: {
              message: {
                type: 'text',
                content: 'Olá {{name}}! 👋\n\nSeja bem-vindo(a)! Como posso ajudá-lo hoje?'
              }
            }
          }
        ]
      },
      {
        name: 'Resposta Automática - Horário Comercial',
        description: 'Resposta automática fora do horário comercial',
        trigger_type: 'schedule',
        trigger_config: {
          schedule: {
            type: 'daily',
            time: '18:00'
          }
        },
        actions: [
          {
            id: '1',
            type: 'send_message',
            config: {
              message: {
                type: 'text',
                content: 'Olá! Nosso atendimento está fechado. Horário de funcionamento: 8h às 18h. Responderemos em breve!'
              }
            }
          }
        ]
      },
      {
        name: 'Follow-up de Vendas',
        description: 'Acompanhamento automático após interesse em produto',
        trigger_type: 'button_click',
        trigger_config: {
          button_payload: 'INTERESTED_PRODUCT'
        },
        actions: [
          {
            id: '1',
            type: 'add_tag',
            config: {
              tag: 'lead_quente'
            }
          },
          {
            id: '2',
            type: 'delay',
            config: {
              delay: {
                duration: 1,
                unit: 'hours'
              }
            },
            next_action_id: '3'
          },
          {
            id: '3',
            type: 'send_message',
            config: {
              message: {
                type: 'text',
                content: 'Oi {{name}}! Vi que você demonstrou interesse em nossos produtos. Gostaria de mais informações? 😊'
              }
            }
          }
        ]
      }
    ];

    res.json({
      success: true,
      templates
    });

  } catch (error) {
    logger.error('Error getting automation templates:', error);
    res.status(500).json({
      success: false,
      error: 'Internal server error'
    });
  }
}

import { automationRepository, contactRepository } from '../database/repositories';

// Helper functions with real database implementation
async function getUserIdFromSession(session: string): Promise<number | null> {
  // For now, return a default user ID (in production, decode from JWT token)
  // TODO: Implement proper session validation
  return 1;
}

async function saveAutomation(automation: any): Promise<void> {
  await automationRepository.create(automation);
}

async function getUserAutomations(userId: number): Promise<any[]> {
  const result = await automationRepository.findByUserId(userId);
  return result.automations;
}

async function getAutomation(automationId: number): Promise<any | null> {
  return await automationRepository.findById(automationId);
}

async function deleteAutomationById(automationId: number): Promise<void> {
  await automationRepository.delete(automationId);
}

async function findOrCreateContact(userId: number, phone: string, channel: string): Promise<any> {
  const result = await contactRepository.findOrCreate(userId, phone, channel, {
    name: 'Test Contact'
  });
  return result.contact;
}

async function getAutomationAnalyticsData(userId: number, automationId: number, period: string): Promise<any> {
  // TODO: Implement analytics calculation from database
  return {
    total_triggers: 10,
    successful_executions: 9,
    failed_executions: 1,
    success_rate: 90
  };
}