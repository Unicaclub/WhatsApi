/*
 * Database Seeder
 * Creates initial data for development and testing
 */

import { v4 as uuidv4 } from 'uuid';
import bcrypt from 'bcrypt';
import { dbConnection } from './connection';
import { logger } from '../index';
import {
  UserModel,
  ContactModel,
  AutomationModel,
  MessageTemplateModel
} from './models';

async function seedDatabase(): Promise<void> {
  try {
    logger.info('🌱 Starting database seeding...');

    // Connect to database
    await dbConnection.connect();

    // Create demo user
    const demoUser = await UserModel.findOrCreate({
      where: { email: 'demo@unicaclub.com' },
      defaults: {
        name: 'Demo User',
        email: 'demo@unicaclub.com',
        plan_type: 'premium',
        api_key: uuidv4()
      }
    });

    const userId = demoUser[0].id;
    logger.info(`👤 Demo user created/found with ID: ${userId}`);

    // Create demo contacts
    const demoContacts = [
      {
        user_id: userId,
        phone: '5511999999999',
        name: 'João Silva',
        tags: ['cliente', 'vip'],
        custom_fields: { cidade: 'São Paulo', idade: 35 },
        channel: 'whatsapp' as const,
        status: 'active' as const
      },
      {
        user_id: userId,
        phone: '5511888888888',
        name: 'Maria Santos',
        tags: ['lead', 'interessado'],
        custom_fields: { cidade: 'Rio de Janeiro', idade: 28 },
        channel: 'whatsapp' as const,
        status: 'active' as const
      },
      {
        user_id: userId,
        phone: '5511777777777',
        name: 'Pedro Costa',
        tags: ['cliente'],
        custom_fields: { cidade: 'Belo Horizonte', idade: 42 },
        channel: 'telegram' as const,
        status: 'active' as const
      }
    ];

    for (const contactData of demoContacts) {
      await ContactModel.findOrCreate({
        where: { 
          user_id: contactData.user_id, 
          phone: contactData.phone, 
          channel: contactData.channel 
        },
         defaults: { ...contactData, last_interaction: new Date(), created_at: new Date(), updated_at: new Date() }
      });
    }

    logger.info('👥 Demo contacts created/updated');

    // Create demo message templates
    const demoTemplates = [
      {
        user_id: userId,
        name: 'Boas-vindas',
        category: 'utility' as const,
        language: 'pt_BR',
        status: 'approved' as const,
        template_type: 'text' as const,
        content: {
          text: 'Olá {{name}}! 👋\n\nSeja bem-vindo(a) à nossa empresa!\n\nEstamos aqui para ajudá-lo com tudo o que precisar.',
          variables: [
            { name: 'name', example: 'João' }
          ]
        }
      },
      {
        user_id: userId,
        name: 'Confirmação de Pedido',
        category: 'utility' as const,
        language: 'pt_BR',
        status: 'approved' as const,
        template_type: 'text' as const,
        content: {
          text: 'Olá {{name}}! 📦\n\nSeu pedido #{{order_id}} foi confirmado com sucesso!\n\n💰 Valor: {{total_amount}}\n📅 Previsão de entrega: {{delivery_date}}\n\nObrigado pela sua preferência!',
          variables: [
            { name: 'name', example: 'João' },
            { name: 'order_id', example: '12345' },
            { name: 'total_amount', example: 'R$ 150,00' },
            { name: 'delivery_date', example: '25/12/2024' }
          ]
        }
      },
      {
        user_id: userId,
        name: 'Promoção Especial',
        category: 'marketing' as const,
        language: 'pt_BR',
        status: 'approved' as const,
        template_type: 'interactive' as const,
        content: {
          text: '🎉 OFERTA ESPECIAL para você, {{name}}!\n\n{{discount_percentage}}% OFF em toda a loja!\n\nVálido até {{expiry_date}}',
          buttons: [
            { type: 'url', text: 'Ver Ofertas', url: 'https://loja.exemplo.com' },
            { type: 'quick_reply', text: 'Quero saber mais', payload: 'WANT_MORE_INFO' }
          ],
          variables: [
            { name: 'name', example: 'João' },
            { name: 'discount_percentage', example: '20' },
            { name: 'expiry_date', example: '31/12/2024' }
          ]
        }
      }
    ];

    for (const templateData of demoTemplates) {
      await MessageTemplateModel.findOrCreate({
        where: { 
          user_id: templateData.user_id, 
          name: templateData.name 
        },
         defaults: { ...templateData, created_at: new Date(), updated_at: new Date() }
      });
    }

    logger.info('📝 Demo templates created/updated');

    // Create demo automations
    const demoAutomations = [
      {
        user_id: userId,
        name: 'Boas-vindas Automática',
        description: 'Resposta automática para primeiros contatos',
        trigger_type: 'keyword' as const,
        trigger_config: {
          keywords: ['oi', 'olá', 'hello', 'opa', 'bom dia', 'boa tarde', 'boa noite']
        },
        actions: [
          {
            id: '1',
            type: 'send_message' as const,
            config: {
              message: {
                type: 'text',
                content: 'Olá {{name}}! 👋\n\nSeja bem-vindo(a) à nossa empresa!\n\nComo posso ajudá-lo hoje?'
              }
            }
          },
          {
            id: '2',
            type: 'add_tag' as const,
            config: {
              tag: 'novo_contato'
            }
          }
        ],
        is_active: true
      },
      {
        user_id: userId,
        name: 'Follow-up de Interesse',
        description: 'Seguimento para contatos interessados em produtos',
        trigger_type: 'keyword' as const,
        trigger_config: {
          keywords: ['preço', 'valor', 'quanto custa', 'interessado', 'orçamento']
        },
        actions: [
          {
            id: '1',
            type: 'send_message' as const,
            config: {
              message: {
                type: 'text',
                content: 'Ótimo! Vou enviar nossa tabela de preços para você, {{name}}! 📋'
              }
            }
          },
          {
            id: '2',
            type: 'add_tag' as const,
            config: {
              tag: 'interessado'
            }
          },
          {
            id: '3',
            type: 'delay' as const,
            config: {
              delay: {
                duration: 30,
                unit: 'minutes'
              }
            },
            next_action_id: '4'
          },
          {
            id: '4',
            type: 'send_message' as const,
            config: {
              message: {
                type: 'text',
                content: '{{name}}, conseguiu analisar nossa proposta? Tem alguma dúvida que posso esclarecer? 🤔'
              }
            }
          }
        ],
        is_active: true
      },
      {
        user_id: userId,
        name: 'Suporte Técnico',
        description: 'Resposta automática para solicitações de suporte',
        trigger_type: 'keyword' as const,
        trigger_config: {
          keywords: ['problema', 'erro', 'não funciona', 'suporte', 'ajuda', 'bug']
        },
        actions: [
          {
            id: '1',
            type: 'send_message' as const,
            config: {
              message: {
                type: 'text',
                content: 'Olá {{name}}! 🛠️\n\nVi que você está com algum problema. Nossa equipe de suporte já foi notificada e entrará em contato em breve.\n\nEnquanto isso, você pode tentar:\n1. Reiniciar o aplicativo\n2. Verificar sua conexão\n3. Atualizar para a versão mais recente'
              }
            }
          },
          {
            id: '2',
            type: 'add_tag' as const,
            config: {
              tag: 'suporte_necessario'
            }
          },
          {
            id: '3',
            type: 'transfer_human' as const,
            config: {
              reason: 'Solicitação de suporte técnico'
            }
          }
        ],
        is_active: true
      }
    ];

    for (const automationData of demoAutomations) {
      await AutomationModel.findOrCreate({
        where: { 
          user_id: automationData.user_id, 
          name: automationData.name 
        },
         defaults: { ...automationData, created_at: new Date(), updated_at: new Date() }
      });
    }

    logger.info('🤖 Demo automations created/updated');

    logger.info('✅ Database seeding completed successfully!');

    // Display demo user info
    logger.info('📋 Demo User Info:');
    logger.info(`   Email: ${demoUser[0].email}`);
    logger.info(`   API Key: ${demoUser[0].api_key}`);
    logger.info(`   Plan: ${demoUser[0].plan_type}`);

  } catch (error) {
    logger.error('❌ Seeding failed:', error);
    throw error;
  } finally {
    await dbConnection.disconnect();
  }
}

// Run seeding if this file is executed directly
if (require.main === module) {
  seedDatabase()
    .then(() => {
      console.log('Seeding completed successfully!');
      process.exit(0);
    })
    .catch((error) => {
      console.error('Seeding failed:', error);
      process.exit(1);
    });
}

export { seedDatabase };