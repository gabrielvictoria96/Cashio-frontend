import React, { useState, useEffect, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';
import { authService } from '../services/api';

interface CompanyCheckProps {
  children: React.ReactNode;
}

const CompanyCheck: React.FC<CompanyCheckProps> = ({ children }) => {
  const { user } = useAuth();
  const navigate = useNavigate();
  const [loading, setLoading] = useState(true);
  const [hasCompany, setHasCompany] = useState(false);

  const checkUserCompany = useCallback(async () => {
    if (!user) {
      setLoading(false);
      return;
    }

    try {
      setLoading(true);
      const response = await authService.getUserCompany();
      const hasUserCompany = response.company !== null;
      setHasCompany(hasUserCompany);

      if (!hasUserCompany) {
        // Se não tem empresa, sempre redirecionar para seleção de plano primeiro
        navigate('/subscription-plan');
      }
    } catch (error) {
      console.error('Erro ao verificar empresa do usuário:', error);
      // Em caso de erro, redirecionar para seleção de plano
      navigate('/subscription-plan');
    } finally {
      setLoading(false);
    }
  }, [user, navigate]);

  useEffect(() => {
    checkUserCompany();
  }, [checkUserCompany]);

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background">
        <div className="animate-spin rounded-full h-32 w-32 border-b-2 border-primary"></div>
      </div>
    );
  }

  if (!hasCompany) {
    return null; // Será redirecionado pelo useEffect
  }

  return <>{children}</>;
};

export default CompanyCheck; 