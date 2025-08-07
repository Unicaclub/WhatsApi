import React, { useState } from 'react';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Badge } from '@/components/ui/badge';
import { 
  Send, 
  MessageCircle, 
  Paperclip, 
  Image, 
  FileText,
  Smile,
  Clock
} from 'lucide-react';
import { whatsappAPI } from '../lib/api';

const SendMessageForm = ({ selectedContact }) => {
  const [message, setMessage] = useState('');
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');

  const queryClient = useQueryClient();

  const sendMessageMutation = useMutation({
    mutationFn: (messageData) => whatsappAPI.sendMessage(messageData),
    onSuccess: () => {
      setMessage('');
      setSuccess('Mensagem enviada com sucesso!');
      setError('');
      // Atualizar a lista de mensagens
      queryClient.invalidateQueries(['messages', selectedContact?.id]);
      queryClient.invalidateQueries(['contacts']);
      setTimeout(() => setSuccess(''), 3000);
    },
    onError: (error) => {
      setError(error.response?.data?.message || 'Erro ao enviar mensagem');
      setSuccess('');
    }
  });

  const handleSubmit = async (e) => {
    e.preventDefault();
    
    if (!message.trim()) {
      setError('Digite uma mensagem');
      return;
    }
    
    if (!selectedContact) {
      setError('Selecione um contato');
      return;
    }

    const messageData = {
      contactId: selectedContact.id,
      phone: selectedContact.phone,
      message: message.trim(),
      type: 'text'
    };

    sendMessageMutation.mutate(messageData);
  };

  const handleKeyPress = (e) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSubmit(e);
    }
  };

  if (!selectedContact) {
    return (
      <Card className="h-full">
        <CardContent className="flex items-center justify-center h-full">
          <div className="text-center">
            <MessageCircle className="h-16 w-16 text-gray-400 mx-auto mb-4" />
            <h3 className="text-lg font-medium text-gray-900 mb-2">
              Selecione um contato
            </h3>
            <p className="text-gray-500">
              Escolha um contato da lista para começar a conversar
            </p>
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card className="h-full">
      <CardHeader>
        <CardTitle className="flex items-center justify-between">
          <div className="flex items-center space-x-3">
            <div className="h-10 w-10 bg-green-100 rounded-full flex items-center justify-center">
              <MessageCircle className="h-5 w-5 text-green-600" />
            </div>
            <div>
              <h3 className="font-medium">{selectedContact.name || selectedContact.phone}</h3>
              <p className="text-sm text-gray-500">{selectedContact.phone}</p>
            </div>
          </div>
          <Badge variant={selectedContact.status === 'online' ? 'default' : 'secondary'}>
            {selectedContact.status === 'online' ? 'Online' : 'Offline'}
          </Badge>
        </CardTitle>
      </CardHeader>
      
      <CardContent className="space-y-4">
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

        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="space-y-2">
            <Textarea
              placeholder="Digite sua mensagem..."
              value={message}
              onChange={(e) => {
                setMessage(e.target.value);
                setError('');
                setSuccess('');
              }}
              onKeyPress={handleKeyPress}
              className="min-h-[120px] resize-none"
              maxLength={4096}
            />
            <div className="flex justify-between items-center text-xs text-gray-500">
              <span>{message.length}/4096 caracteres</span>
              <span>Pressione Enter para enviar, Shift+Enter para nova linha</span>
            </div>
          </div>

          {/* Attachment Options */}
          <div className="flex items-center space-x-2 p-3 bg-gray-50 rounded-lg">
            <span className="text-sm text-gray-600">Anexos:</span>
            <Button
              type="button"
              variant="ghost"
              size="sm"
              className="h-8 w-8 p-0"
              title="Anexar imagem"
            >
              <Image className="h-4 w-4" />
            </Button>
            <Button
              type="button"
              variant="ghost"
              size="sm"
              className="h-8 w-8 p-0"
              title="Anexar arquivo"
            >
              <FileText className="h-4 w-4" />
            </Button>
            <Button
              type="button"
              variant="ghost"
              size="sm"
              className="h-8 w-8 p-0"
              title="Emojis"
            >
              <Smile className="h-4 w-4" />
            </Button>
          </div>

          <div className="flex space-x-2">
            <Button 
              type="submit" 
              className="flex-1 bg-green-600 hover:bg-green-700"
              disabled={sendMessageMutation.isLoading || !message.trim()}
            >
              {sendMessageMutation.isLoading ? (
                <>
                  <Clock className="h-4 w-4 mr-2 animate-spin" />
                  Enviando...
                </>
              ) : (
                <>
                  <Send className="h-4 w-4 mr-2" />
                  Enviar Mensagem
                </>
              )}
            </Button>
          </div>
        </form>

        {/* Message Templates */}
        <div className="space-y-2">
          <h4 className="text-sm font-medium text-gray-700">Mensagens Rápidas:</h4>
          <div className="grid grid-cols-1 gap-2">
            {[
              'Olá! Como posso ajudá-lo?',
              'Obrigado pelo contato!',
              'Estarei de volta em breve.',
              'Pode me enviar mais detalhes?'
            ].map((template, index) => (
              <Button
                key={index}
                variant="outline"
                size="sm"
                className="justify-start text-left h-auto p-2"
                onClick={() => setMessage(template)}
              >
                <span className="text-xs truncate">{template}</span>
              </Button>
            ))}
          </div>
        </div>
      </CardContent>
    </Card>
  );
};

export default SendMessageForm;

