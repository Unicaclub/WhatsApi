import React, { useState, useEffect } from 'react';
// import { useNavigate } from 'react-router-dom';
// import { useAuth } from '../contexts/AuthContext';
import Layout from '../components/Layout';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { 
  User, 
  Mail, 
  Phone, 
  Save, 
  ArrowLeft,
  Upload,
  Camera
} from 'lucide-react';

const EditProfile = () => {
  // Página de edição de perfil desabilitada para modo público
  // Exibe apenas mensagem informativa

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
      <div className="p-6 max-w-2xl mx-auto">
        <Card>
          <CardHeader>
            <CardTitle>Editar Perfil</CardTitle>
            <CardDescription>Esta funcionalidade está desabilitada no modo público.</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="text-gray-500">Edição de perfil não disponível sem autenticação.</div>
          </CardContent>
        </Card>
      </div>
    </Layout>
  );
};

export default EditProfile;

