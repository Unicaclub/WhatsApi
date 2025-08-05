import axios from 'axios';

// Configuração base do axios
const api = axios.create({
  baseURL: process.env.NODE_ENV === 'production' 
    ? 'https://api.whatsapp.com' // URL de produção
    : 'http://localhost:21466', // URL de desenvolvimento
  timeout: 10000,
  headers: {
    'Content-Type': 'application/json',
  },
});

// Interceptor para adicionar token automaticamente
api.interceptors.request.use(
  (config) => {
    const token = localStorage.getItem('token');
    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }
    return config;
  },
  (error) => {
    return Promise.reject(error);
  }
);

// Interceptor para tratar respostas e erros
api.interceptors.response.use(
  (response) => {
    return response;
  },
  (error) => {
    if (error.response?.status === 401) {
      // Token expirado ou inválido
      localStorage.removeItem('token');
      window.location.href = '/login';
    }
    return Promise.reject(error);
  }
);

// Funções da API para autenticação
export const authAPI = {
  login: (email, password) => api.post('/api/login', { email, password }),
  register: (userData) => api.post('/api/register', userData),
  getProfile: () => api.get('/api/profile'),
  updateProfile: (profileData) => api.put('/api/profile', profileData),
};

// Funções da API para configurações
export const settingsAPI = {
  getSettings: () => api.get('/api/settings'),
  updateSettings: (settings) => api.put('/api/settings', settings),
};

// Funções da API para contatos e mensagens (Z-API)
export const whatsappAPI = {
  getContacts: () => api.get('/api/contacts'),
  sendMessage: (messageData) => api.post('/api/messages', messageData),
  getMessages: (contactId) => api.get(`/api/messages/${contactId}`),
};

export default api;

