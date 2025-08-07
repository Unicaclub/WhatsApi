# WhatsAPI Frontend

Frontend React para o sistema WhatsAPI - Uma interface moderna e responsiva para gerenciar conversas do WhatsApp via API.

## 🚀 Características

- **Interface Moderna**: Design limpo e responsivo usando TailwindCSS e shadcn/ui
- **Autenticação Completa**: Sistema de login/cadastro com proteção de rotas
- **Dashboard Interativo**: Visualização de estatísticas e métricas em tempo real
- **Gerenciamento de Contatos**: Lista e busca de contatos com status online
- **Envio de Mensagens**: Interface intuitiva para envio de mensagens via Z-API
- **Configurações Avançadas**: Painel para configurar webhooks e preferências
- **Perfil de Usuário**: Gerenciamento completo do perfil do usuário

## 🛠️ Tecnologias Utilizadas

- **React 19** - Framework principal
- **React Router v6** - Roteamento
- **TailwindCSS** - Estilização
- **shadcn/ui** - Componentes de interface
- **React Query** - Gerenciamento de estado e cache
- **Axios** - Cliente HTTP
- **Lucide React** - Ícones
- **Vite** - Build tool

## 📁 Estrutura do Projeto

```
src/
├── components/          # Componentes reutilizáveis
│   ├── ui/             # Componentes shadcn/ui
│   ├── Layout.jsx      # Layout principal com sidebar
│   ├── ProtectedRoute.jsx # Proteção de rotas
│   ├── ContactsList.jsx   # Lista de contatos
│   └── SendMessageForm.jsx # Formulário de envio
├── contexts/           # Contextos React
│   └── AuthContext.jsx # Contexto de autenticação
├── lib/               # Utilitários e configurações
│   └── api.js         # Configuração da API
├── pages/             # Páginas da aplicação
│   ├── Login.jsx      # Página de login
│   ├── Register.jsx   # Página de cadastro
│   ├── Dashboard.jsx  # Dashboard principal
│   ├── Profile.jsx    # Perfil do usuário
│   ├── EditProfile.jsx # Edição de perfil
│   └── Settings.jsx   # Configurações
└── App.jsx           # Componente principal
```

## 🔧 Instalação e Configuração

### Pré-requisitos

- Node.js 18+ 
- pnpm (recomendado) ou npm

### Instalação

1. **Clone o repositório**:
   ```bash
   git clone https://github.com/Unicaclub/WhatsApi.git
   cd WhatsApi/frontend
   ```

2. **Instale as dependências**:
   ```bash
   pnpm install
   ```

3. **Configure as variáveis de ambiente**:
   ```bash
   cp .env.example .env
   ```
   
   Edite o arquivo `.env` com suas configurações:
   ```env
   VITE_API_BASE_URL=http://localhost:21466
   VITE_Z_API_BASE_URL=https://www.z-api.io
   ```

## 🚀 Scripts Disponíveis

- **Desenvolvimento**:
  ```bash
  pnpm run dev
  ```
  Inicia o servidor de desenvolvimento em `http://localhost:5173`

- **Build de Produção**:
  ```bash
  pnpm run build
  ```
  Cria a versão otimizada para produção na pasta `dist/`

- **Preview**:
  ```bash
  pnpm run preview
  ```
  Visualiza a build de produção localmente

- **Lint**:
  ```bash
  pnpm run lint
  ```
  Executa o ESLint para verificar o código

## 🔗 Integração com Backend

O frontend se conecta com o backend WhatsAPI através das seguintes rotas:

### Autenticação
- `POST /api/login` - Login do usuário
- `POST /api/register` - Cadastro de usuário
- `GET /api/profile` - Dados do perfil
- `PUT /api/profile` - Atualizar perfil

### Configurações
- `GET /api/settings` - Buscar configurações
- `PUT /api/settings` - Atualizar configurações

### WhatsApp (Z-API)
- `GET /api/contacts` - Listar contatos
- `POST /api/messages` - Enviar mensagem
- `GET /api/messages/:contactId` - Histórico de mensagens

## 🎨 Componentes Principais

### AuthContext
Gerencia o estado de autenticação da aplicação:
- Login/logout de usuários
- Armazenamento de token no localStorage
- Interceptors do Axios para autenticação automática

### Layout
Componente de layout principal com:
- Sidebar responsiva com navegação
- Header com informações do usuário
- Menu mobile com overlay

### ProtectedRoute
Componente para proteção de rotas:
- Verifica autenticação antes de renderizar
- Redireciona para login se não autenticado
- Loading state durante verificação

### ContactsList
Lista de contatos com:
- Busca em tempo real
- Status online/offline
- Contadores de mensagens não lidas
- Avatar e informações do contato

### SendMessageForm
Formulário para envio de mensagens:
- Textarea com contador de caracteres
- Mensagens rápidas predefinidas
- Suporte a anexos (futuro)
- Validação de entrada

## 🔒 Segurança

- **Autenticação JWT**: Tokens seguros para autenticação
- **Rotas Protegidas**: Acesso controlado às páginas internas
- **Interceptors HTTP**: Renovação automática de tokens
- **Validação de Formulários**: Validação client-side e server-side

## 📱 Responsividade

A aplicação é totalmente responsiva e funciona em:
- **Desktop**: Layout completo com sidebar
- **Tablet**: Layout adaptado com navegação otimizada
- **Mobile**: Menu hambúrguer e layout vertical

## 🎯 Funcionalidades Implementadas

### ✅ Concluído
- [x] Sistema de autenticação completo
- [x] Dashboard com estatísticas
- [x] Gerenciamento de perfil
- [x] Lista de contatos
- [x] Envio de mensagens
- [x] Configurações de usuário
- [x] Layout responsivo
- [x] Proteção de rotas

### 🔄 Em Desenvolvimento
- [ ] Histórico de mensagens
- [ ] Upload de arquivos
- [ ] Notificações push
- [ ] Temas dark/light
- [ ] Relatórios avançados

## 🐛 Solução de Problemas

### Erro de CORS
Se encontrar erros de CORS, certifique-se de que o backend está configurado para aceitar requisições do frontend:

```javascript
app.use(cors({
  origin: 'http://localhost:5173',
  credentials: true
}));
```

### Erro de Autenticação
Verifique se:
1. O token está sendo enviado corretamente
2. O backend está validando o token
3. As rotas da API estão corretas

### Problemas de Build
Para resolver problemas de build:
```bash
# Limpar cache
rm -rf node_modules
rm pnpm-lock.yaml
pnpm install

# Rebuild
pnpm run build
```

## 📄 Licença

Este projeto está sob a licença Apache 2.0. Veja o arquivo [LICENSE](../LICENSE) para mais detalhes.

## 🤝 Contribuição

1. Fork o projeto
2. Crie uma branch para sua feature (`git checkout -b feature/AmazingFeature`)
3. Commit suas mudanças (`git commit -m 'Add some AmazingFeature'`)
4. Push para a branch (`git push origin feature/AmazingFeature`)
5. Abra um Pull Request

## 📞 Suporte

Para suporte e dúvidas:
- Abra uma [issue](https://github.com/Unicaclub/WhatsApi/issues)
- Entre em contato via email: suporte@unicaclub.com

---

Desenvolvido com ❤️ pela equipe UnicaClub

