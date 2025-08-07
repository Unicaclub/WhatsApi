import React, { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { ScrollArea } from '@/components/ui/scroll-area';
import { 
  Search, 
  Users, 
  MessageCircle, 
  Phone,
  Clock,
  CheckCircle
} from 'lucide-react';
import { whatsappAPI } from '../lib/api';

const ContactsList = ({ onSelectContact, selectedContact }) => {
  const [searchTerm, setSearchTerm] = useState('');

  const { data: contacts, isLoading, error } = useQuery({
    queryKey: ['contacts'],
    queryFn: () => whatsappAPI.getContacts(),
    refetchInterval: 30000, // Atualizar a cada 30 segundos
  });

  const filteredContacts = contacts?.data?.filter(contact =>
    contact.name?.toLowerCase().includes(searchTerm.toLowerCase()) ||
    contact.phone?.includes(searchTerm)
  ) || [];

  const getInitials = (name) => {
    if (!name) return '?';
    return name
      .split(' ')
      .map(word => word[0])
      .join('')
      .toUpperCase()
      .slice(0, 2);
  };

  const formatLastSeen = (lastSeen) => {
    if (!lastSeen) return 'Nunca visto';
    
    const now = new Date();
    const lastSeenDate = new Date(lastSeen);
    const diffInMinutes = Math.floor((now - lastSeenDate) / (1000 * 60));
    
    if (diffInMinutes < 1) return 'Agora';
    if (diffInMinutes < 60) return `${diffInMinutes}m atrás`;
    if (diffInMinutes < 1440) return `${Math.floor(diffInMinutes / 60)}h atrás`;
    return `${Math.floor(diffInMinutes / 1440)}d atrás`;
  };

  const getStatusColor = (status) => {
    switch (status) {
      case 'online': return 'bg-green-500';
      case 'typing': return 'bg-blue-500';
      case 'away': return 'bg-yellow-500';
      default: return 'bg-gray-400';
    }
  };

  if (isLoading) {
    return (
      <Card className="h-full">
        <CardHeader>
          <CardTitle className="flex items-center space-x-2">
            <Users className="h-5 w-5" />
            <span>Contatos</span>
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            {[...Array(5)].map((_, i) => (
              <div key={i} className="flex items-center space-x-3 animate-pulse">
                <div className="h-10 w-10 bg-gray-200 rounded-full"></div>
                <div className="flex-1 space-y-2">
                  <div className="h-4 bg-gray-200 rounded w-3/4"></div>
                  <div className="h-3 bg-gray-200 rounded w-1/2"></div>
                </div>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>
    );
  }

  if (error) {
    return (
      <Card className="h-full">
        <CardHeader>
          <CardTitle className="flex items-center space-x-2">
            <Users className="h-5 w-5" />
            <span>Contatos</span>
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="text-center py-8">
            <MessageCircle className="h-12 w-12 text-gray-400 mx-auto mb-4" />
            <p className="text-gray-500">Erro ao carregar contatos</p>
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card className="h-full">
      <CardHeader>
        <CardTitle className="flex items-center justify-between">
          <div className="flex items-center space-x-2">
            <Users className="h-5 w-5" />
            <span>Contatos</span>
          </div>
          <Badge variant="secondary">
            {filteredContacts.length}
          </Badge>
        </CardTitle>
        
        <div className="relative">
          <Search className="absolute left-3 top-3 h-4 w-4 text-gray-400" />
          <Input
            placeholder="Buscar contatos..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="pl-10"
          />
        </div>
      </CardHeader>
      
      <CardContent className="p-0">
        <ScrollArea className="h-96">
          {filteredContacts.length === 0 ? (
            <div className="text-center py-8 px-4">
              <Users className="h-12 w-12 text-gray-400 mx-auto mb-4" />
              <p className="text-gray-500">
                {searchTerm ? 'Nenhum contato encontrado' : 'Nenhum contato disponível'}
              </p>
            </div>
          ) : (
            <div className="space-y-1 p-4">
              {filteredContacts.map((contact) => (
                <div
                  key={contact.id}
                  onClick={() => onSelectContact(contact)}
                  className={`
                    flex items-center space-x-3 p-3 rounded-lg cursor-pointer transition-colors
                    ${selectedContact?.id === contact.id
                      ? 'bg-green-50 border border-green-200'
                      : 'hover:bg-gray-50'
                    }
                  `}
                >
                  <div className="relative">
                    <Avatar className="h-10 w-10">
                      <AvatarImage src={contact.avatar} alt={contact.name} />
                      <AvatarFallback className="bg-green-100 text-green-700">
                        {getInitials(contact.name)}
                      </AvatarFallback>
                    </Avatar>
                    {contact.status && (
                      <div className={`
                        absolute -bottom-1 -right-1 h-3 w-3 rounded-full border-2 border-white
                        ${getStatusColor(contact.status)}
                      `} />
                    )}
                  </div>
                  
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center justify-between">
                      <p className="text-sm font-medium text-gray-900 truncate">
                        {contact.name || contact.phone}
                      </p>
                      {contact.unreadCount > 0 && (
                        <Badge variant="destructive" className="text-xs">
                          {contact.unreadCount}
                        </Badge>
                      )}
                    </div>
                    
                    <div className="flex items-center space-x-2 mt-1">
                      <Phone className="h-3 w-3 text-gray-400" />
                      <p className="text-xs text-gray-500 truncate">
                        {contact.phone}
                      </p>
                    </div>
                    
                    {contact.lastMessage && (
                      <div className="flex items-center space-x-2 mt-1">
                        <MessageCircle className="h-3 w-3 text-gray-400" />
                        <p className="text-xs text-gray-500 truncate">
                          {contact.lastMessage}
                        </p>
                      </div>
                    )}
                    
                    <div className="flex items-center space-x-2 mt-1">
                      <Clock className="h-3 w-3 text-gray-400" />
                      <p className="text-xs text-gray-500">
                        {formatLastSeen(contact.lastSeen)}
                      </p>
                      {contact.isVerified && (
                        <CheckCircle className="h-3 w-3 text-green-500" />
                      )}
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </ScrollArea>
      </CardContent>
    </Card>
  );
};

export default ContactsList;

