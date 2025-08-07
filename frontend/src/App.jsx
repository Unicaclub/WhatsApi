import React from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { AuthProvider } from './contexts/AuthContext';
// import ProtectedRoute from './components/ProtectedRoute';

// Importar páginas
import Login from './pages/Login';
import Register from './pages/Register';
import Dashboard from './pages/Dashboard';
import Profile from './pages/Profile';
import EditProfile from './pages/EditProfile';
import Settings from './pages/Settings';

import './App.css';

// Criar cliente do React Query
const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      retry: 1,
      refetchOnWindowFocus: false,
    },
  },
});

function App() {
  return (
    <QueryClientProvider client={queryClient}>
      <AuthProvider>
        <Router>
          <div className="min-h-screen bg-gray-50">
            <Routes>
              {/* Rotas públicas */}
              <Route path="/login" element={<Login />} />
              <Route path="/register" element={<Register />} />
              
              {/* Rotas protegidas */}
              <Route path="/" element={<Dashboard />} />
              
              <Route path="/profile" element={<Profile />} />
              
              <Route path="/profile/edit" element={<EditProfile />} />
              
              <Route path="/settings" element={<Settings />} />
              
              {/* Rota padrão - redirecionar para dashboard */}
              <Route path="*" element={<Navigate to="/" replace />} />
            </Routes>
          </div>
        </Router>
      </AuthProvider>
    </QueryClientProvider>
  );
}

export default App;
