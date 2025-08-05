# Guia de Configuração - Sistema de Automação PostgreSQL

Este guia detalha como configurar o sistema de automação com PostgreSQL integrado ao projeto WppConnect Server.

## 🚀 Pré-requisitos

### 1. Node.js e npm
```bash
# Verificar versões
node --version  # Deve ser 22.18.0
npm --version   # Qualquer versão recente
```

### 2. PostgreSQL
```bash
# Windows (usando Chocolatey)
choco install postgresql

# macOS (usando Homebrew)
brew install postgresql

# Ubuntu/Debian
sudo apt update
sudo apt install postgresql postgresql-contrib

# Iniciar o serviço
sudo systemctl start postgresql
sudo systemctl enable postgresql
```

### 3. Redis (Opcional - para sistema de filas avançado)
```bash
# Windows (usando Chocolatey)
choco install redis-64

# macOS (usando Homebrew)
brew install redis

# Ubuntu/Debian
sudo apt install redis-server
```

## 📊 Configuração do Banco de Dados

### 1. Criar Banco PostgreSQL
```bash
# Conectar ao PostgreSQL como superusuário
sudo -u postgres psql

# Criar usuário e banco
CREATE USER wppconnect_user WITH PASSWORD 'sua_senha_forte';
CREATE DATABASE wppconnect_automation OWNER wppconnect_user;
GRANT ALL PRIVILEGES ON DATABASE wppconnect_automation TO wppconnect_user;

# Sair do PostgreSQL
\q
```

### 2. Configurar Variáveis de Ambiente
```bash
# Copiar arquivo de exemplo
cp .env.example .env

# Editar arquivo .env
nano .env
```

Configure as seguintes variáveis no arquivo `.env`:
```bash
# Database Configuration
DB_HOST=localhost
DB_PORT=5432
DB_NAME=wppconnect_automation
DB_USER=wppconnect_user
DB_PASSWORD=sua_senha_forte

# Para desenvolvimento - recriar tabelas a cada reinício (cuidado!)
FORCE_SYNC=false

# Server Configuration
NODE_ENV=development
SECRET_KEY=seu_token_super_secreto_aqui
PORT=21466
```

## 🔧 Instalação e Configuração

### 1. Instalar Dependências
```bash
# Instalar todas as dependências
npm install

# Verificar se as dependências do PostgreSQL foram instaladas
npm list pg sequelize
```

### 2. Executar Migrações do Banco
```bash
# Criar estrutura do banco de dados
npm run db:migrate

# Verificar se as tabelas foram criadas
# Conectar ao banco e listar tabelas
psql -h localhost -U wppconnect_user -d wppconnect_automation -c "\dt"
```

### 3. Popular com Dados de Exemplo (Opcional)
```bash
# Inserir dados de demonstração
npm run db:seed
```

Este comando criará:
- 1 usuário demo (`demo@unicaclub.com`)
- 3 contatos de exemplo
- 3 templates de mensagem
- 3 automações de exemplo

### 4. Iniciar o Servidor
```bash
# Modo desenvolvimento com hot reload
npm run dev

# Modo produção
npm run build
npm start
```

## 🧪 Testando a Integração

### 1. Verificar Conexão com Banco
```bash
# O servidor deve mostrar estas mensagens no console:
# ✅ Database connection established successfully
# 📊 Database models synchronized
# 🗄️ Database initialized successfully
```

### 2. Testar APIs de Automação

#### Gerar Token
```bash
curl -X POST "http://localhost:21466/api/mySession/seu_token_super_secreto_aqui/generate-token"
```

#### Listar Automações
```bash
curl -X GET "http://localhost:21466/api/mySession/automations" \
  -H "Authorization: Bearer SEU_TOKEN_AQUI"
```

#### Criar Automação de Teste
```bash
curl -X POST "http://localhost:21466/api/mySession/automations" \
  -H "Authorization: Bearer SEU_TOKEN_AQUI" \
  -H "Content-Type: application/json" \
  -d '{
    "name": "Teste de Integração",
    "trigger_type": "keyword",
    "trigger_config": {
      "keywords": ["teste", "oi"]
    },
    "actions": [
      {
        "id": "1",
        "type": "send_message",
        "config": {
          "message": {
            "type": "text",
            "content": "Olá! Automação funcionando com PostgreSQL! 🎉"
          }
        }
      }
    ]
  }'
```

### 3. Verificar Dados no Banco
```bash
# Conectar ao banco e verificar dados
psql -h localhost -U wppconnect_user -d wppconnect_automation

# Listar automações
SELECT id, name, trigger_type, is_active FROM automations;

# Listar contatos
SELECT id, name, phone, channel FROM contacts;

# Sair
\q
```

## 🔍 Monitoramento e Logs

### 1. Logs do Servidor
Os logs são salvos em:
- Console (desenvolvimento)
- Arquivo `log/app.log` (produção)

### 2. Logs do Banco de Dados
Em modo de desenvolvimento, as queries SQL são exibidas no console.

### 3. Health Checks
```bash
# Verificar status do servidor
curl http://localhost:21466/health

# Verificar status detalhado
curl http://localhost:21466/debug
```

## 🚨 Troubleshooting

### 1. Erro de Conexão com PostgreSQL
```bash
# Verificar se PostgreSQL está rodando
sudo systemctl status postgresql

# Verificar conectividade
psql -h localhost -U wppconnect_user -d wppconnect_automation -c "SELECT version();"
```

### 2. Erro "relation does not exist"
```bash
# Executar migrações novamente
npm run db:migrate

# Se necessário, forçar recriação (CUIDADO - apaga dados!)
FORCE_SYNC=true npm run db:migrate
```

### 3. Erro de Dependências
```bash
# Limpar cache e reinstalar
rm -rf node_modules package-lock.json
npm install
```

### 4. Verificar Portas
```bash
# Verificar se porta 21466 está disponível
netstat -tlnp | grep 21466

# Verificar se PostgreSQL está na porta 5432
netstat -tlnp | grep 5432
```

## 📈 Próximos Passos

Após a configuração bem-sucedida:

1. **Configurar Webhooks**: Configurar URLs de webhook para receber mensagens
2. **Integrar com WhatsApp**: Conectar com instâncias do WhatsApp
3. **Criar Automações**: Usar a API para criar fluxos de automação
4. **Configurar Templates**: Criar templates de mensagem personalizados
5. **Analytics**: Acompanhar métricas de performance
6. **Backup**: Configurar backup automático do banco de dados

## 🔧 Comandos Úteis

```bash
# Backup do banco
pg_dump -h localhost -U wppconnect_user wppconnect_automation > backup.sql

# Restaurar backup
psql -h localhost -U wppconnect_user wppconnect_automation < backup.sql

# Ver logs em tempo real
tail -f log/app.log

# Verificar processos
ps aux | grep node
ps aux | grep postgres

# Limpar dados de teste
npm run db:migrate -- --force-sync
```

## 📞 Suporte

- **Logs**: Sempre verifique `log/app.log` para erros detalhados
- **Database**: Use `psql` para investigar problemas no banco
- **API**: Teste endpoints com curl ou Postman
- **Documentação**: Acesse `/api-docs` para documentação Swagger

O sistema está pronto para ser usado como uma plataforma de automação avançada! 🎉