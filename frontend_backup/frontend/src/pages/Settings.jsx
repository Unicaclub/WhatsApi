import React, { useState, useEffect } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import Layout from '../components/Layout';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Switch } from '@/components/ui/switch';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Separator } from '@/components/ui/separator';
import { 
  Settings as SettingsIcon, 
  Bell, 
  Webhook, 
  Save,
  Shield,
  Globe,
  Smartphone
} from 'lucide-react';
import { settingsAPI } from '../lib/api';

const Settings = () => {
  const [formData, setFormData] = useState({
    notifications: true,
    webhookUrl: '',
    autoReply: false,
    messageLimit: 100,
    apiTimeout: 30
  });
  const [success, setSuccess] = useState('');
  const [error, setError] = useState('');

  const queryClient = useQueryClient();

  // Buscar configurações atuais
  const { data: settings, isLoading } = useQuery({
    queryKey: ['settings'],
    queryFn: settingsAPI.getSettings,
    onSuccess: (data) => {
      if (data?.data) {
        setFormData(data.data);
      }
    },
    onError: (error) => {
      console.error('Erro ao carregar configurações:', error);
    }
  });

  // Mutation para salvar configurações
  const updateSettingsMutation = useMutation({
    mutationFn: settingsAPI.updateSettings,
    onSuccess: () => {
      setSuccess('Configurações salvas com sucesso!');
      setError('');
      queryClient.invalidateQueries(['settings']);
      setTimeout(() => setSuccess(''), 3000);
    },
    onError: (error) => {
      setError(error.response?.data?.message || 'Erro ao salvar configurações');
      setSuccess('');
    }
  });

  const handleChange = (name, value) => {
    setFormData(prev => ({
      ...prev,
      [name]: value
    }));
    setError('');
    setSuccess('');
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    updateSettingsMutation.mutate(formData);
  };

  if (isLoading) {
    return (
      <Layout>
        <div className="p-6 max-w-4xl mx-auto">
          <div className="animate-pulse space-y-6">
            <div className="h-8 bg-gray-200 rounded w-1/4"></div>
            <div className="h-64 bg-gray-200 rounded"></div>
          </div>
        </div>
      </Layout>
    );
  }

  return (
    <Layout>
      <div className="p-6 max-w-4xl mx-auto">
        <div className="mb-6">
          <h1 className="text-3xl font-bold text-gray-900">Configurações</h1>
          <p className="text-gray-600 mt-2">
            Gerencie suas preferências e configurações da API
          </p>
        </div>

        <form onSubmit={handleSubmit} className="space-y-6">
          {success && (
            <Alert className="border-green-200 bg-green-50">
              <AlertDescription className="text-green-700">
                {success}
              </AlertDescription>
            </Alert>
          )}
          
          {error && (
            <Alert variant="destructive">
              <AlertDescription>{error}</AlertDescription>
            </Alert>
          )}

          {/* Notificações */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center space-x-2">
                <Bell className="h-5 w-5 text-green-600" />
                <span>Notificações</span>
              </CardTitle>
              <CardDescription>
                Configure como você deseja receber notificações
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="flex items-center justify-between">
                <div className="space-y-0.5">
                  <Label htmlFor="notifications">Notificações Push</Label>
                  <p className="text-sm text-gray-500">
                    Receber notificações de novas mensagens
                  </p>
                </div>
                <Switch
                  id="notifications"
                  checked={formData.notifications}
                  onCheckedChange={(checked) => handleChange('notifications', checked)}
                />
              </div>
              
              <Separator />
              
              <div className="flex items-center justify-between">
                <div className="space-y-0.5">
                  <Label htmlFor="autoReply">Resposta Automática</Label>
                  <p className="text-sm text-gray-500">
                    Enviar resposta automática quando offline
                  </p>
                </div>
                <Switch
                  id="autoReply"
                  checked={formData.autoReply}
                  onCheckedChange={(checked) => handleChange('autoReply', checked)}
                />
              </div>
            </CardContent>
          </Card>

          {/* Webhook */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center space-x-2">
                <Webhook className="h-5 w-5 text-green-600" />
                <span>Webhook</span>
              </CardTitle>
              <CardDescription>
                Configure a URL para receber eventos em tempo real
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="webhookUrl">URL do Webhook</Label>
                <Input
                  id="webhookUrl"
                  name="webhookUrl"
                  type="url"
                  placeholder="https://seu-site.com/webhook"
                  value={formData.webhookUrl}
                  onChange={(e) => handleChange('webhookUrl', e.target.value)}
                />
                <p className="text-sm text-gray-500">
                  Esta URL receberá notificações de mensagens recebidas e outros eventos
                </p>
              </div>
            </CardContent>
          </Card>

          {/* API Settings */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center space-x-2">
                <Globe className="h-5 w-5 text-green-600" />
                <span>Configurações da API</span>
              </CardTitle>
              <CardDescription>
                Ajuste os limites e timeouts da API
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="messageLimit">Limite de Mensagens/Hora</Label>
                  <Input
                    id="messageLimit"
                    name="messageLimit"
                    type="number"
                    min="1"
                    max="1000"
                    value={formData.messageLimit}
                    onChange={(e) => handleChange('messageLimit', parseInt(e.target.value))}
                  />
                  <p className="text-sm text-gray-500">
                    Máximo de mensagens por hora (1-1000)
                  </p>
                </div>
                
                <div className="space-y-2">
                  <Label htmlFor="apiTimeout">Timeout da API (segundos)</Label>
                  <Input
                    id="apiTimeout"
                    name="apiTimeout"
                    type="number"
                    min="5"
                    max="120"
                    value={formData.apiTimeout}
                    onChange={(e) => handleChange('apiTimeout', parseInt(e.target.value))}
                  />
                  <p className="text-sm text-gray-500">
                    Tempo limite para requisições (5-120s)
                  </p>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Security */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center space-x-2">
                <Shield className="h-5 w-5 text-green-600" />
                <span>Segurança</span>
              </CardTitle>
              <CardDescription>
                Configurações de segurança e privacidade
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-4">
                <div className="flex items-start space-x-3">
                  <Shield className="h-5 w-5 text-yellow-600 mt-0.5" />
                  <div>
                    <h4 className="font-medium text-yellow-800">Chave da API</h4>
                    <p className="text-sm text-yellow-700 mt-1">
                      Sua chave da API está configurada e ativa. Para alterá-la, entre em contato com o suporte.
                    </p>
                  </div>
                </div>
              </div>
              
              <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
                <div className="flex items-start space-x-3">
                  <Smartphone className="h-5 w-5 text-blue-600 mt-0.5" />
                  <div>
                    <h4 className="font-medium text-blue-800">Dispositivo Conectado</h4>
                    <p className="text-sm text-blue-700 mt-1">
                      WhatsApp conectado e funcionando normalmente. Última sincronização: agora
                    </p>
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Save Button */}
          <div className="flex justify-end">
            <Button 
              type="submit" 
              className="bg-green-600 hover:bg-green-700"
              disabled={updateSettingsMutation.isLoading}
            >
              <Save className="h-4 w-4 mr-2" />
              {updateSettingsMutation.isLoading ? 'Salvando...' : 'Salvar Configurações'}
            </Button>
          </div>
        </form>
      </div>
    </Layout>
  );
};

export default Settings;

