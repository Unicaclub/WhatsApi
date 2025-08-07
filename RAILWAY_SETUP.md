# Railway.com Setup Guide

## Configurações necessárias no Railway Dashboard

### 1. Backend (whatsapi-production-5412.up.railway.app)

#### Variáveis de Ambiente necessárias:

```bash
# Obrigatórias
NODE_ENV=production
SECRET_KEY=Mestre888

# Database (Railway fornece automaticamente)
DATABASE_URL=postgresql://username:password@host:port/database

# CORS e URLs
<!-- FRONTEND_URL removido: não há mais frontend -->
BACKEND_URL=https://whatsapi-production-5412.up.railway.app

# Upload e Storage
UPLOAD_DIR=uploads
TOKEN_STORE_TYPE=file
TOKEN_STORE_PATH=./tokens

# WhatsApp
WHATSAPP_SESSION_PATH=./userDataDir
WHATSAPP_TOKEN_PATH=./tokens

# Logging
LOG_LEVEL=info
LOG_FILE=./log/app.log

# Puppeteer (importante para Railway)
PUPPETEER_SKIP_CHROMIUM_DOWNLOAD=true
```

<!-- Seção de Frontend removida: não há mais frontend -->

#### Variáveis de Ambiente necessárias:

```bash
# URL da API Backend
VITE_API_URL=https://whatsapi-production-5412.up.railway.app
REACT_APP_API_URL=https://whatsapi-production-5412.up.railway.app
```

### 3. Comandos para testar em produção:

```bash
# Cadastrar usuário
curl -X POST https://whatsapi-production-5412.up.railway.app/register \
  -H "Content-Type: application/json" \
  -d '{"name":"Test User","email":"test@example.com","password":"123456"}'

# Login
curl -X POST https://whatsapi-production-5412.up.railway.app/login \
  -H "Content-Type: application/json" \
  -d '{"email":"test@example.com","password":"123456"}'

# Health check
curl https://whatsapi-production-5412.up.railway.app/health
```

### 4. Arquivos importantes para deploy:

- `package.json` - Scripts de build e start corretos
- `Dockerfile.*` - Configurações Docker (se usar)
- `railway.json` - Configurações específicas Railway
- `nixpacks.toml` - Configurações Nixpacks

### 5. Troubleshooting Railway:

1. **Database Connection Issues**: Certifique-se que DATABASE_URL está definida
2. **CORS Issues**: Certifique-se de que apenas os origins necessários estão permitidos
3. **Build Issues**: Use `npm run build` antes do deploy
4. **Port Issues**: Railway define PORT automaticamente
5. **Puppeteer Issues**: Use PUPPETEER_SKIP_CHROMIUM_DOWNLOAD=true

### 6. Logs importantes:

- Check Railway logs para erros de conexão database
- Verifique se models Sequelize sincronizam corretamente
- Monitor memory usage para puppeteer/chrome instances