import React from 'react';
// import { useNavigate } from 'react-router-dom';
// import { useAuth } from '../contexts/AuthContext';
import Layout from '../components/Layout';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Badge } from '@/components/ui/badge';
import { 
  User, 
  Mail, 
  Phone, 
  Edit, 
  Calendar,
  Shield
} from 'lucide-react';

const Profile = () => {

  // Dados fictícios para exibição pública
  const user = {
    name: 'Usuário Público',
    email: 'publico@exemplo.com',
    phone: '(00) 00000-0000',
    avatar: '',
    createdAt: new Date().toISOString(),
    stats: {
      totalMessages: 0,
      totalContacts: 0,
      daysActive: 0
    }
  };

  // Removido handleEditProfile e navegação

  const getInitials = (name) => {
    if (!name) return 'U';
    return name
      .split(' ')
      .map(word => word[0])
      .join('')
      .toUpperCase()
      .slice(0, 2);
  };

  return (
    <Layout>
      <div className="p-6 max-w-4xl mx-auto">
        <div className="mb-6">
          <h1 className="text-3xl font-bold text-gray-900">Meu Perfil</h1>
          <p className="text-gray-600 mt-2">
            Visualize e gerencie suas informações pessoais
          </p>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Profile Card */}
          <div className="lg:col-span-1">
            <Card>
              <CardHeader className="text-center">
                <div className="flex justify-center mb-4">
                  <Avatar className="h-24 w-24">
                    <AvatarImage src={user?.avatar} alt={user?.name} />
                    <AvatarFallback className="text-xl bg-green-100 text-green-700">
                      {getInitials(user?.name)}
                    </AvatarFallback>
                  </Avatar>
                </div>
                <CardTitle className="text-xl">{user?.name || 'Nome não informado'}</CardTitle>
                <CardDescription className="flex items-center justify-center space-x-2">
                  <Badge variant="secondary" className="bg-green-100 text-green-700">
                    <Shield className="h-3 w-3 mr-1" />
                    Ativo
                  </Badge>
                </CardDescription>
              </CardHeader>
              <CardContent>
                {/* Botão de editar removido pois não há autenticação */}
                <Button disabled className="w-full bg-gray-300 cursor-not-allowed">
                  <Edit className="h-4 w-4 mr-2" />
                  Editar Perfil
                </Button>
              </CardContent>
            </Card>
          </div>

          {/* Information Cards */}
          <div className="lg:col-span-2 space-y-6">
            {/* Personal Information */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center space-x-2">
                  <User className="h-5 w-5 text-green-600" />
                  <span>Informações Pessoais</span>
                </CardTitle>
                <CardDescription>
                  Suas informações básicas de cadastro
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <label className="text-sm font-medium text-gray-500">Nome Completo</label>
                    <p className="text-gray-900 font-medium">
                      {user?.name || 'Não informado'}
                    </p>
                  </div>
                  <div>
                    <label className="text-sm font-medium text-gray-500">Email</label>
                    <div className="flex items-center space-x-2">
                      <Mail className="h-4 w-4 text-gray-400" />
                      <p className="text-gray-900 font-medium">
                        {user?.email || 'Não informado'}
                      </p>
                    </div>
                  </div>
                  <div>
                    <label className="text-sm font-medium text-gray-500">Telefone</label>
                    <div className="flex items-center space-x-2">
                      <Phone className="h-4 w-4 text-gray-400" />
                      <p className="text-gray-900 font-medium">
                        {user?.phone || 'Não informado'}
                      </p>
                    </div>
                  </div>
                  <div>
                    <label className="text-sm font-medium text-gray-500">Data de Cadastro</label>
                    <div className="flex items-center space-x-2">
                      <Calendar className="h-4 w-4 text-gray-400" />
                      <p className="text-gray-900 font-medium">
                        {user?.createdAt 
                          ? new Date(user.createdAt).toLocaleDateString('pt-BR')
                          : 'Não disponível'
                        }
                      </p>
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>

            {/* Account Statistics */}
            <Card>
              <CardHeader>
                <CardTitle>Estatísticas da Conta</CardTitle>
                <CardDescription>
                  Resumo da sua atividade na plataforma
                </CardDescription>
              </CardHeader>
              <CardContent>
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                  <div className="text-center p-4 bg-green-50 rounded-lg">
                    <div className="text-2xl font-bold text-green-600">
                      {user?.stats?.totalMessages || 0}
                    </div>
                    <div className="text-sm text-gray-600">Mensagens Enviadas</div>
                  </div>
                  <div className="text-center p-4 bg-blue-50 rounded-lg">
                    <div className="text-2xl font-bold text-blue-600">
                      {user?.stats?.totalContacts || 0}
                    </div>
                    <div className="text-sm text-gray-600">Contatos</div>
                  </div>
                  <div className="text-center p-4 bg-purple-50 rounded-lg">
                    <div className="text-2xl font-bold text-purple-600">
                      {user?.stats?.daysActive || 0}
                    </div>
                    <div className="text-sm text-gray-600">Dias Ativo</div>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>
        </div>
      </div>
    </Layout>
  );
};

export default Profile;

