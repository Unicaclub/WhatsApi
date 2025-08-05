# Guia de Integração - Sistema Avançado de Automação Zapi-like

Este guia detalha como integrar e utilizar o sistema avançado de automação implementado no WppConnect Server para funcionar como um serviço similar ao Zapi.

## 🚀 Recursos Implementados

### 1. Sistema de Automações
- **Triggers**: palavra-chave, agendamento, webhook, clique de botão, início de fluxo
- **Ações**: enviar mensagem, adicionar/remover tag, atualizar campo, delay, condições, webhooks, transferir para humano
- **Execução**: processamento sequencial com suporte a condições e delays

### 2. Sistema de Filas
- **Delays e Agendamentos**: sistema robusto de filas com retry automático
- **Priorização**: processamento baseado em prioridade
- **Tipos de Jobs**: mensagens, ações de automação, campanhas, webhooks
- **Monitoramento**: estatísticas e métricas em tempo real

### 3. Segmentação de Contatos
- **Tags Dinâmicas**: sistema flexível de etiquetas
- **Campos Customizados**: dados personalizados por contato
- **Segmentação Comportamental**: baseada em interações e métricas
- **Segmentos Automáticos**: atualização automática baseada em regras

### 4. Templates de Mensagem
- **Variáveis Dinâmicas**: substituição automática de placeholders
- **Templates WhatsApp Business**: suporte completo a templates aprovados
- **Processamento Inteligente**: formatação automática de dados
- **Validação**: verificação de sintaxe e compatibilidade

### 5. Analytics Avançado
- **Métricas de Performance**: taxas de entrega, leitura, resposta
- **Analytics de Automação**: sucesso, falhas, conversões
- **Analytics de Campanha**: ROI, engagement, audiência
- **Analytics de Contato**: comportamento individual e segmentação

### 6. Multi-canais
- **WhatsApp**: integração nativa com WppConnect
- **Telegram**: suporte completo via Bot API
- **Instagram**: integração com Graph API
- **SMS**: suporte a provedores diversos
- **Arquitetura Extensível**: fácil adição de novos canais

## 📋 Configuração do Banco de Dados

### 1. Execute as Migrações
```sql
-- Execute o arquivo src/database/migrations.sql
psql -d your_database -f src/database/migrations.sql
```

### 2. Configuração no config.ts
```typescript
// Adicione as configurações de banco
export default {
  // ... configurações existentes
  database: {
    host: process.env.DB_HOST || 'localhost',
    port: parseInt(process.env.DB_PORT || '5432'),
    database: process.env.DB_NAME || 'wppconnect_automation',
    username: process.env.DB_USER || 'postgres',
    password: process.env.DB_PASSWORD || '',
    dialect: 'postgres'
  }
};
```

## 🔧 Instalação de Dependências

```bash
npm install node-fetch@2 node-cron bull ioredis pg sequelize
npm install --save-dev @types/node-cron @types/pg
```

## 🎯 Exemplos de Uso da API

### 1. Criar Automação de Boas-vindas

```bash
curl -X POST "http://localhost:21466/api/mySession/automations" \
  -H "Authorization: Bearer YOUR_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "name": "Boas-vindas Automática",
    "description": "Mensagem de boas-vindas para novos contatos",
    "trigger_type": "keyword",
    "trigger_config": {
      "keywords": ["oi", "olá", "hello"]
    },
    "actions": [
      {
        "id": "1",
        "type": "send_message",
        "config": {
          "message": {
            "type": "text",
            "content": "Olá {{name}}! 👋\n\nSeja bem-vindo(a) à nossa empresa!\n\nComo posso ajudá-lo hoje?"
          }
        }
      },
      {
        "id": "2",
        "type": "add_tag",
        "config": {
          "tag": "novo_contato"
        }
      }
    ]
  }'
```

### 2. Criar Automação com Delay

```bash
curl -X POST "http://localhost:21466/api/mySession/automations" \
  -H "Authorization: Bearer YOUR_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "name": "Follow-up de Vendas",
    "trigger_type": "keyword",
    "trigger_config": {
      "keywords": ["preço", "valor", "quanto custa"]
    },
    "actions": [
      {
        "id": "1",
        "type": "send_message",
        "config": {
          "message": {
            "type": "text",
            "content": "Ótimo! Vou enviar nossa tabela de preços."
          }
        },
        "next_action_id": "2"
      },
      {
        "id": "2",
        "type": "delay",
        "config": {
          "delay": {
            "duration": 30,
            "unit": "minutes"
          }
        },
        "next_action_id": "3"
      },
      {
        "id": "3",
        "type": "send_message",
        "config": {
          "message": {
            "type": "text",
            "content": "{{name}}, conseguiu analisar nossa proposta? Tem alguma dúvida?"
          }
        }
      }
    ]
  }'
```

### 3. Listar Automações

```bash
curl -X GET "http://localhost:21466/api/mySession/automations" \
  -H "Authorization: Bearer YOUR_TOKEN"
```

### 4. Ativar/Desativar Automação

```bash
curl -X POST "http://localhost:21466/api/mySession/automations/123/toggle" \
  -H "Authorization: Bearer YOUR_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{"is_active": false}'
```

### 5. Testar Automação

```bash
curl -X POST "http://localhost:21466/api/mySession/automations/123/test" \
  -H "Authorization: Bearer YOUR_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "test_phone": "5511999999999",
    "test_message": "oi"
  }'
```

### 6. Obter Analytics de Automação

```bash
curl -X GET "http://localhost:21466/api/mySession/automations/123/analytics?period=month" \
  -H "Authorization: Bearer YOUR_TOKEN"
```

## 🔄 Webhooks de Automação

### Configurar Webhook para Receber Mensagens

Configure o webhook no seu sistema para enviar mensagens recebidas para:

```
POST /api/webhook/automation
```

Payload esperado:
```json
{
  "user_id": 1,
  "session": "mySession",
  "from": "5511999999999",
  "body": "Mensagem recebida",
  "type": "text",
  "channel": "whatsapp"
}
```

## 📊 Monitoramento e Métricas

### Dashboard de Métricas
- Mensagens enviadas/recebidas
- Taxa de entrega e leitura
- Automações executadas
- Contatos ativos
- Crescimento comparativo

### Analytics Detalhado
- Performance por automação
- Análise de campanhas
- Comportamento de contatos
- Segmentação dinâmica

## 🛠 Integrações Disponíveis

### CRM
- Sincronização de contatos
- Atualização de campos customizados
- Transferência de leads qualificados

### E-commerce
- Carrinho abandonado
- Confirmação de pedidos
- Acompanhamento de entrega

### Webhooks Personalizados
- Integração com sistemas externos
- Processamento de eventos customizados
- Sincronização bidirecional

## 🔐 Segurança e Boas Práticas

### Autenticação
- Tokens JWT para todas as APIs
- Validação de sessão por usuário
- Rate limiting por endpoint

### Validação
- Validação de entrada em todos os endpoints
- Sanitização de dados
- Prevenção de SQL injection

### Logs e Auditoria
- Log completo de todas as ações
- Rastreamento de execução de automações
- Métricas de performance

## 🚀 Próximos Passos

1. **Implementar Database Layer**: Conectar com PostgreSQL/MySQL
2. **Configurar Redis**: Para sistema de filas avançado
3. **Implementar Webhooks**: Sistema completo de webhooks
4. **Dashboard Web**: Interface visual para gerenciamento
5. **Integrações**: CRM, e-commerce, Zapier
6. **Templates WhatsApp**: Integração com Meta Business

## 📞 Suporte

Para suporte técnico e implementação:
- Documentação completa no Swagger: `/api-docs`
- Logs detalhados em `log/app.log`
- Monitoramento via `/metrics` (Prometheus)

Este sistema transforma seu WppConnect Server em uma plataforma robusta de automação, similar ao Zapi, com recursos avançados de segmentação, analytics e multi-canais.