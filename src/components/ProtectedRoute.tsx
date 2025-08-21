import { useEffect, useState } from 'react';
import { useNavigate, useLocation, Navigate } from 'react-router-dom';
import { useAuth } from '@/contexts/AuthContext';
import { Loader2 } from 'lucide-react';

interface ProtectedRouteProps {
  children: React.ReactNode;
  requiresOrganization?: boolean;
}

export default function ProtectedRoute({ 
  children, 
  requiresOrganization = true 
}: ProtectedRouteProps) {
  const { user, loading, currentOrganization } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();
  const [shouldRedirect, setShouldRedirect] = useState(false);

  useEffect(() => {
    console.log('🛡️ [DEBUG] ProtectedRoute - Estado atual:', {
      loading,
      user: !!user,
      requiresOrganization,
      currentOrganization: !!currentOrganization,
      pathname: location.pathname
    });
    
    // Aguardar o carregamento completo antes de fazer redirecionamentos
    if (loading) {
      console.log('⏳ [DEBUG] Aguardando carregamento...');
      return;
    }
    
    if (!user) {
      console.log('🔄 [DEBUG] Redirecionando para login - usuário não autenticado');
      navigate('/login');
      return;
    }
    
    // Gerenciar redirecionamento para org-select com delay
    if (user && requiresOrganization && !currentOrganization) {
      console.log('🔄 [DEBUG] Redirecionando para seleção de organização - organização necessária mas não definida');
      // Evitar loop infinito se já estiver na página de seleção
      if (location.pathname !== '/org-select') {
        const timer = setTimeout(() => {
          // Verifica novamente se ainda não há organização após o delay
          if (!currentOrganization) {
            setShouldRedirect(true);
          }
        }, 200);
        
        return () => clearTimeout(timer);
      }
      return;
    }
    
    // Reset do estado de redirecionamento se organização for encontrada
    if (currentOrganization) {
      setShouldRedirect(false);
    }
    
    if (user && currentOrganization) {
      console.log('✅ [DEBUG] Usuário autenticado com organização - permitindo acesso');
    }
  }, [loading, user, currentOrganization, requiresOrganization, navigate, location.pathname]);

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="flex items-center gap-2">
          <Loader2 className="h-6 w-6 animate-spin" />
          <span>Carregando...</span>
        </div>
      </div>
    );
  }

  if (!user) {
    return null;
  }



  // Se precisa de organização mas não tem uma definida, redireciona para seleção
  if (requiresOrganization && !currentOrganization) {
    if (shouldRedirect) {
      return <Navigate to="/org-select" replace />;
    }
    
    // Mostra loading enquanto aguarda
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="text-center">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600 mx-auto mb-4"></div>
          <p className="text-gray-600">Carregando...</p>
        </div>
      </div>
    );
  }

  return <>{children}</>;
}