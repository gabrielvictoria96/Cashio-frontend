import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { Button } from './ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from './ui/card';
import { ArrowLeft, Check, CreditCard } from 'lucide-react';
import Layout from './Layout';
import { authService, type SubscriptionPlan, type Company } from '../services/api';
import { formatPlanPrice } from '../utils/currency';

const SubscriptionPlanSelector: React.FC = () => {
  const navigate = useNavigate();
  const [subscriptionPlans, setSubscriptionPlans] = useState<SubscriptionPlan[]>([]);
  const [userCompany, setUserCompany] = useState<Company | null>(null);
  const [loading, setLoading] = useState(true);
  const [selectedPlan, setSelectedPlan] = useState<string>('');

  useEffect(() => {
    const fetchData = async () => {
      try {
        setLoading(true);
        
        // Buscar planos de assinatura
        const plansResponse = await authService.getSubscriptionPlans();
        setSubscriptionPlans(plansResponse.subscriptionPlans || []);
        
        // Verificar se o usuário já tem uma empresa
        try {
          const companyResponse = await authService.getUserCompany();
          setUserCompany(companyResponse.company);
          
          // Se o usuário já tem uma empresa, pré-selecionar o plano
          if (companyResponse.company?.subscriptionPlanId) {
            setSelectedPlan(companyResponse.company.subscriptionPlanId);
          }
        } catch (error) {
          // Usuário não tem empresa ainda, isso é normal
          console.log('Usuário não possui empresa cadastrada');
        }
      } catch (error) {
        console.error('Erro ao buscar dados:', error);
      } finally {
        setLoading(false);
      }
    };

    fetchData();
  }, []);

  const handlePlanSelect = (planId: string) => {
    setSelectedPlan(planId);
  };

  const handleContinue = async () => {
    if (!selectedPlan) {
      alert('Por favor, selecione um plano de assinatura.');
      return;
    }

    try {
      if (userCompany) {
        // Verificar se o plano foi alterado
        if (selectedPlan === userCompany.subscriptionPlanId) {
          // Plano não foi alterado, redirecionar diretamente
          navigate('/dashboard');
          return;
        }
        
        // Plano foi alterado, atualizar no backend
        await authService.updateCompany(userCompany.id!, {
          userId: userCompany.userId,
          subscriptionPlanId: selectedPlan,
          name: userCompany.name,
          urlLogo: userCompany.urlLogo,
          pixCode: userCompany.pixCode
        });
        alert('Plano atualizado com sucesso!');
      } else {
        // Se não tem empresa, salvar o plano selecionado no localStorage
        localStorage.setItem('selectedSubscriptionPlanId', selectedPlan);
      }
      
      navigate('/dashboard');
    } catch (error) {
      console.error('Erro ao atualizar plano:', error);
      alert('Erro ao atualizar plano. Tente novamente.');
    }
  };

  const handleBack = () => {
    navigate('/dashboard');
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
        <div className="flex items-center justify-between mb-6">
          <div className="flex items-center space-x-4">
            <Button
              variant="ghost"
              size="sm"
              onClick={handleBack}
              className="text-muted-foreground hover:text-foreground"
            >
              <ArrowLeft className="h-4 w-4 mr-2" />
              Voltar
            </Button>
            <h1 className="text-3xl font-bold">Selecionar Plano</h1>
          </div>
        </div>

        <div className="max-w-4xl mx-auto">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center">
                <CreditCard className="h-5 w-5 mr-2" />
                Escolha seu Plano de Assinatura
              </CardTitle>
              <CardDescription>
                {userCompany 
                  ? 'Seu plano atual está selecionado. Clique em "Continuar" para manter ou selecione outro plano para alterar.'
                  : 'Selecione o plano que melhor atende às suas necessidades'
                }
              </CardDescription>
            </CardHeader>
            <CardContent>
              {subscriptionPlans.length === 0 ? (
                <div className="text-center py-8">
                  <CreditCard className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
                  <h3 className="text-lg font-semibold mb-2">Nenhum plano disponível</h3>
                  <p className="text-muted-foreground">
                    Não há planos de assinatura disponíveis no momento.
                  </p>
                </div>
              ) : (
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                  {subscriptionPlans.map((plan) => {
                    console.log('Plan being rendered:', plan);
                    console.log('Plan price:', plan.price, 'Plan amount:', plan.amount);
                    return (
                      <Card
                        key={plan.id}
                        className={`cursor-pointer transition-all hover:shadow-md ${
                          selectedPlan === plan.id
                            ? 'ring-2 ring-primary border-primary'
                            : 'hover:border-primary/50'
                        }`}
                        onClick={() => plan.id && handlePlanSelect(plan.id)}
                      >
                        <CardHeader>
                          <div className="flex items-center justify-between">
                            <CardTitle className="text-lg">{plan.name}</CardTitle>
                            {selectedPlan === plan.id && (
                              <Check className="h-5 w-5 text-primary" />
                            )}
                          </div>
                          <CardDescription>{plan.description}</CardDescription>
                        </CardHeader>
                        <CardContent>
                          <div className="space-y-2">
                            <div className="text-2xl font-bold">
                              {formatPlanPrice(plan)}
                            </div>
                            <div className="text-sm text-muted-foreground">
                              {plan.type === 'MONTHLY' ? 'Mensal' : 'Anual'}
                            </div>
                          </div>
                        </CardContent>
                      </Card>
                    );
                  })}
                </div>
              )}

              {subscriptionPlans.length > 0 && (
                <div className="mt-8 flex justify-center">
                  <Button
                    onClick={handleContinue}
                    disabled={!selectedPlan}
                    className="px-8"
                  >
                    {userCompany ? 'Continuar' : 'Continuar'}
                  </Button>
                </div>
              )}
            </CardContent>
          </Card>
        </div>
      </div>
    </Layout>
  );
};

export default SubscriptionPlanSelector; 