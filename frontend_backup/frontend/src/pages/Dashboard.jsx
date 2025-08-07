import React, { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import Layout from '../components/Layout';
import ContactsList from '../components/ContactsList';
import SendMessageForm from '../components/SendMessageForm';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { 
  MessageCircle, 
  Users, 
  Send, 
  TrendingUp,
  Activity,
  Clock,
  CheckCircle,
  AlertCircle
} from 'lucide-react';
import { whatsappAPI } from '../lib/api';

const Dashboard = () => {
  const [selectedContact, setSelectedContact] = useState(null);

  // Buscar estatísticas do dashboard
  const { data: stats, isLoading: statsLoading } = useQuery({
    queryKey: ['dashboard-stats'],
    queryFn: () => whatsappAPI.getStats?.() || Promise.resolve({ data: {} }),
    refetchInterval: 60000, // Atualizar a cada minuto
  });

  const dashboardStats = stats?.data || {
    totalContacts: 0,
    totalMessages: 0,
    messagesThisMonth: 0,
    responseRate: 0,
    avgResponseTime: 0,
    activeChats: 0
  };

  const StatCard = ({ title, value, icon: Icon, description, trend, color = "green" }) => (
    <Card>
      <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
        <CardTitle className="text-sm font-medium">{title}</CardTitle>
        <Icon className={`h-4 w-4 text-${color}-600`} />
      </CardHeader>
      <CardContent>
        <div className="text-2xl font-bold">{value}</div>
        {description && (
          <p className="text-xs text-gray-500 mt-1">{description}</p>
        )}
        {trend && (
          <div className="flex items-center mt-2">
            <TrendingUp className="h-3 w-3 text-green-500 mr-1" />
            <span className="text-xs text-green-600">{trend}</span>
          </div>
        )}
      </CardContent>
    </Card>
  );

  return (
    <Layout>
      <div className="p-6 space-y-6">
        {/* Header */}
        <div>
          <h1 className="text-3xl font-bold text-gray-900">Dashboard</h1>
          <p className="text-gray-600 mt-2">
            Gerencie suas conversas e monitore suas estatísticas
          </p>
        </div>

        {/* Stats Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
          <StatCard
            title="Total de Contatos"
            value={dashboardStats.totalContacts.toLocaleString()}
            icon={Users}
            description="Contatos cadastrados"
            trend="+12% este mês"
          />
          
          <StatCard
            title="Mensagens Enviadas"
            value={dashboardStats.totalMessages.toLocaleString()}
            icon={Send}
            description="Total de mensagens"
            trend="+8% este mês"
          />
          
          <StatCard
            title="Conversas Ativas"
            value={dashboardStats.activeChats}
            icon={MessageCircle}
            description="Conversas em andamento"
            color="blue"
          />
          
          <StatCard
            title="Taxa de Resposta"
            value={`${dashboardStats.responseRate}%`}
            icon={CheckCircle}
            description="Mensagens respondidas"
            trend="+5% este mês"
            color="purple"
          />
        </div>

        {/* Status Cards */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center space-x-2">
                <Activity className="h-5 w-5 text-green-600" />
                <span>Status da Conexão</span>
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="flex items-center space-x-3">
                <div className="h-3 w-3 bg-green-500 rounded-full animate-pulse"></div>
                <div>
                  <p className="font-medium text-green-700">Conectado</p>
                  <p className="text-sm text-gray-500">WhatsApp Web ativo</p>
                </div>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle className="flex items-center space-x-2">
                <Clock className="h-5 w-5 text-blue-600" />
                <span>Tempo de Resposta</span>
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-blue-600">
                {dashboardStats.avgResponseTime}min
              </div>
              <p className="text-sm text-gray-500">Tempo médio de resposta</p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle className="flex items-center space-x-2">
                <TrendingUp className="h-5 w-5 text-purple-600" />
                <span>Este Mês</span>
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-purple-600">
                {dashboardStats.messagesThisMonth.toLocaleString()}
              </div>
              <p className="text-sm text-gray-500">Mensagens enviadas</p>
            </CardContent>
          </Card>
        </div>

        {/* Main Content */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {/* Contacts List */}
          <div className="h-[600px]">
            <ContactsList 
              onSelectContact={setSelectedContact}
              selectedContact={selectedContact}
            />
          </div>

          {/* Send Message Form */}
          <div className="h-[600px]">
            <SendMessageForm selectedContact={selectedContact} />
          </div>
        </div>

        {/* Recent Activity */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center space-x-2">
              <Activity className="h-5 w-5 text-green-600" />
              <span>Atividade Recente</span>
            </CardTitle>
            <CardDescription>
              Últimas ações realizadas na plataforma
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              {[
                {
                  action: 'Mensagem enviada',
                  contact: 'João Silva',
                  time: '2 minutos atrás',
                  status: 'success'
                },
                {
                  action: 'Novo contato adicionado',
                  contact: 'Maria Santos',
                  time: '15 minutos atrás',
                  status: 'info'
                },
                {
                  action: 'Configurações atualizadas',
                  contact: 'Sistema',
                  time: '1 hora atrás',
                  status: 'warning'
                },
                {
                  action: 'Webhook configurado',
                  contact: 'Sistema',
                  time: '2 horas atrás',
                  status: 'success'
                }
              ].map((activity, index) => (
                <div key={index} className="flex items-center space-x-4 p-3 bg-gray-50 rounded-lg">
                  <div className={`
                    h-2 w-2 rounded-full
                    ${activity.status === 'success' ? 'bg-green-500' : ''}
                    ${activity.status === 'info' ? 'bg-blue-500' : ''}
                    ${activity.status === 'warning' ? 'bg-yellow-500' : ''}
                  `} />
                  <div className="flex-1">
                    <p className="text-sm font-medium">{activity.action}</p>
                    <p className="text-xs text-gray-500">{activity.contact}</p>
                  </div>
                  <Badge variant="outline" className="text-xs">
                    {activity.time}
                  </Badge>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      </div>
    </Layout>
  );
};

export default Dashboard;

