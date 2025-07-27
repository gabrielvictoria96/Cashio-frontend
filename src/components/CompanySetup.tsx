import React, { useState, useEffect } from 'react';
import { useAuth } from '../contexts/AuthContext';
import { useNavigate } from 'react-router-dom';
import { Button } from './ui/button';
import { Input } from './ui/input';
import { Label } from './ui/label';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from './ui/card';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from './ui/select';
import { Building2 } from 'lucide-react';
import Layout from './Layout';
import { authService, type SubscriptionPlan, type CreateCompanyData } from '../services/api';
import { formatPlanPrice } from '../utils/currency';
import { showError, showSuccess } from '../utils/notifications';

const CompanySetup: React.FC = () => {
  const { user } = useAuth();
  const navigate = useNavigate();
  const [subscriptionPlans, setSubscriptionPlans] = useState<SubscriptionPlan[]>([]);
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [formData, setFormData] = useState({
    name: '',
    urlLogo: '',
    pixCode: '',
    subscriptionPlanId: ''
  });

  useEffect(() => {
    const fetchSubscriptionPlans = async () => {
      try {
        setLoading(true);
        const response = await authService.getSubscriptionPlans();
        setSubscriptionPlans(response.subscriptionPlans || []);
        
        // Pré-selecionar o plano escolhido no SubscriptionPlanSelector
        const selectedPlanId = localStorage.getItem('selectedSubscriptionPlanId');
        if (selectedPlanId) {
          setFormData(prev => ({
            ...prev,
            subscriptionPlanId: selectedPlanId
          }));
        }
      } catch (error) {
        console.error('Erro ao buscar planos de assinatura:', error);
      } finally {
        setLoading(false);
      }
    };

    fetchSubscriptionPlans();
  }, []);

  const handleInputChange = (field: string, value: string) => {
    setFormData(prev => ({
      ...prev,
      [field]: value
    }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!formData.name || !formData.subscriptionPlanId) {
      showError('Por favor, preencha todos os campos obrigatórios.');
      return;
    }

    try {
      setSubmitting(true);
      
      // Salvar o plano selecionado no localStorage
      localStorage.setItem('selectedSubscriptionPlanId', formData.subscriptionPlanId);
      
      const companyData: CreateCompanyData = {
        name: formData.name,
        urlLogo: formData.urlLogo || undefined,
        pixCode: formData.pixCode || undefined,
        subscriptionPlanId: formData.subscriptionPlanId,
        userId: user?.id || '',
      };
      
      await authService.createCompany(companyData);
      showSuccess('Empresa criada com sucesso!');
      navigate('/dashboard');
    } catch (error) {
      console.error('Erro ao criar empresa:', error);
      showError('Erro ao criar empresa. Tente novamente.');
    } finally {
      setSubmitting(false);
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background">
        <div className="animate-spin rounded-full h-32 w-32 border-b-2 border-primary"></div>
      </div>
    );
  }

  return (
    <Layout>
      <div className="p-6">
        <div className="max-w-2xl mx-auto">
          <div className="text-center mb-8">
            <h1 className="text-3xl font-bold mb-4">Configurar sua Empresa</h1>
            <p className="text-muted-foreground">
              Complete as informações da sua empresa para começar a usar o Pague-me
            </p>
          </div>

          <Card>
            <CardHeader>
              <CardTitle className="flex items-center">
                <Building2 className="h-5 w-5 mr-2" />
                Informações da Empresa
              </CardTitle>
              <CardDescription>
                Preencha os dados da sua empresa para continuar
              </CardDescription>
            </CardHeader>
            <CardContent>
              <form onSubmit={handleSubmit} className="space-y-6">
                <div className="space-y-2">
                  <Label htmlFor="name">Nome da Empresa *</Label>
                  <Input
                    id="name"
                    value={formData.name}
                    onChange={(e) => handleInputChange('name', e.target.value)}
                    placeholder="Digite o nome da sua empresa"
                    required
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="subscriptionPlanId">Plano de Assinatura *</Label>
                  <Select
                    value={formData.subscriptionPlanId}
                    onValueChange={(value: string) => handleInputChange('subscriptionPlanId', value)}
                  >
                    <SelectTrigger>
                      <SelectValue placeholder="Selecione um plano" />
                    </SelectTrigger>
                    <SelectContent>
                      {subscriptionPlans.filter(plan => plan.id).map((plan) => (
                        <SelectItem key={plan.id} value={plan.id!}>
                          <div className="flex items-center justify-between w-full">
                            <span>{plan.name}</span>
                            <span className="text-muted-foreground ml-2">
                              {formatPlanPrice(plan)}
                            </span>
                          </div>
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="urlLogo">URL do Logo (opcional)</Label>
                  <Input
                    id="urlLogo"
                    value={formData.urlLogo}
                    onChange={(e) => handleInputChange('urlLogo', e.target.value)}
                    placeholder="https://exemplo.com/logo.png"
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="pixCode">Chave PIX (opcional)</Label>
                  <Input
                    id="pixCode"
                    value={formData.pixCode}
                    onChange={(e) => handleInputChange('pixCode', e.target.value)}
                    placeholder="Digite sua chave PIX"
                  />
                </div>

                <div className="flex space-x-4 pt-4">
                  <Button
                    type="submit"
                    className="flex-1"
                    disabled={submitting}
                  >
                    {submitting ? 'Criando...' : 'Criar Empresa'}
                  </Button>
                </div>
              </form>
            </CardContent>
          </Card>
        </div>
      </div>
    </Layout>
  );
};

export default CompanySetup; 