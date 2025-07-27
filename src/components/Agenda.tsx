import React, { useState, useEffect, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import { Button } from './ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from './ui/card';
import { Badge } from './ui/badge';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from './ui/select';
import { ArrowLeft, Calendar, ChevronLeft, ChevronRight, User, DollarSign, Clock, CheckCircle } from 'lucide-react';
import Layout from './Layout';
import { authService, type Service, type Client, type ServiceInstallment } from '../services/api';
import { formatCurrency } from '../utils/currency';
import { showError } from '../utils/notifications';

const Agenda: React.FC = () => {
  const navigate = useNavigate();
  const [services, setServices] = useState<Service[]>([]);
  const [clients, setClients] = useState<Client[]>([]);
  const [serviceInstallments, setServiceInstallments] = useState<{ [serviceId: string]: ServiceInstallment[] }>({});
  const [loading, setLoading] = useState(true);
  const [selectedMonth, setSelectedMonth] = useState(new Date().getMonth());
  const [selectedYear, setSelectedYear] = useState(new Date().getFullYear());

  const fetchData = useCallback(async () => {
    try {
      setLoading(true);
      await Promise.all([fetchServices(), fetchClients()]);
    } catch (error) {
      console.error('Erro ao buscar dados:', error);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchData();
  }, [fetchData]);

  const fetchServices = async () => {
    try {
      const response = await authService.getServices();
      setServices(response.services || []);
      
      // Buscar parcelas para cada serviço
      for (const service of response.services || []) {
        await fetchServiceInstallments(service.id!);
      }
    } catch (error) {
      console.error('Erro ao buscar serviços:', error);
      setServices([]);
    }
  };

  const fetchClients = async () => {
    try {
      const response = await authService.getClients();
      setClients(response.clients || []);
    } catch (error) {
      console.error('Erro ao buscar clientes:', error);
      setClients([]);
    }
  };

  const fetchServiceInstallments = async (serviceId: string) => {
    try {
      const response = await authService.getServiceInstallments(serviceId);
      setServiceInstallments(prev => ({
        ...prev,
        [serviceId]: response.installments || []
      }));
    } catch (error) {
      console.error('Erro ao buscar parcelas do serviço:', error);
    }
  };

  const markInstallmentAsPaid = async (installmentId: string) => {
    try {
      await authService.markInstallmentAsPaid(installmentId);
      setServiceInstallments(prev => {
        const newInstallments = { ...prev };
        Object.keys(newInstallments).forEach(serviceId => {
          newInstallments[serviceId] = newInstallments[serviceId].map(installment => 
            installment.id === installmentId 
              ? { ...installment, paidAt: new Date().toISOString() }
              : installment
          );
        });
        return newInstallments;
      });
    } catch (error) {
      console.error('Erro ao marcar parcela como paga:', error);
      showError('Erro ao marcar parcela como paga. Tente novamente.');
    }
  };

  const getMonthName = (month: number) => {
    const months = [
      'Janeiro', 'Fevereiro', 'Março', 'Abril', 'Maio', 'Junho',
      'Julho', 'Agosto', 'Setembro', 'Outubro', 'Novembro', 'Dezembro'
    ];
    return months[month];
  };

  const handlePreviousMonth = () => {
    if (selectedMonth === 0) {
      setSelectedMonth(11);
      setSelectedYear(selectedYear - 1);
    } else {
      setSelectedMonth(selectedMonth - 1);
    }
  };

  const handleNextMonth = () => {
    if (selectedMonth === 11) {
      setSelectedMonth(0);
      setSelectedYear(selectedYear + 1);
    } else {
      setSelectedMonth(selectedMonth + 1);
    }
  };

  const handleClientClick = (clientId: string) => {
    navigate(`/clients/${clientId}`);
  };

  const handleBack = () => {
    navigate('/dashboard');
  };

  // Filtrar serviços do mês selecionado
  const getMonthServices = () => {
    return services.filter(service => {
      const serviceDate = new Date(service.serviceDate);
      return serviceDate.getMonth() === selectedMonth && serviceDate.getFullYear() === selectedYear;
    }).sort((a, b) => new Date(a.serviceDate).getTime() - new Date(b.serviceDate).getTime());
  };

  const getClientName = (clientId: string) => {
    const client = clients.find(c => c.id === clientId);
    return client ? client.name : 'Cliente não encontrado';
  };

  const getPaymentMethodLabel = (method: string) => {
    const labels = {
      'PIX': 'PIX',
      'CREDIT_CARD': 'Cartão de Crédito',
      'BOLETO': 'Boleto'
    };
    return labels[method as keyof typeof labels] || method;
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('pt-BR');
  };

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background">
        <div className="animate-spin rounded-full h-32 w-32 border-b-2 border-primary"></div>
      </div>
    );
  }

  const monthServices = getMonthServices();

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
            <h1 className="text-3xl font-bold">Agenda</h1>
          </div>
        </div>

        {/* Seletor de Mês */}
        <Card className="mb-6">
          <CardHeader>
            <CardTitle className="flex items-center justify-between">
              <div className="flex items-center">
                <Calendar className="h-5 w-5 mr-2" />
                Serviços de {getMonthName(selectedMonth)} de {selectedYear}
              </div>
              
              {/* Seletor de mês */}
              <div className="flex items-center space-x-4">
                <Button
                  variant="outline"
                  size="sm"
                  onClick={handlePreviousMonth}
                >
                  <ChevronLeft className="h-4 w-4" />
                </Button>
                
                <div className="flex items-center space-x-2">
                  <Select value={selectedMonth.toString()} onValueChange={(value) => setSelectedMonth(parseInt(value))}>
                    <SelectTrigger className="w-32">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      {Array.from({ length: 12 }, (_, i) => (
                        <SelectItem key={i} value={i.toString()}>
                          {getMonthName(i)}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                  
                  <Select value={selectedYear.toString()} onValueChange={(value) => setSelectedYear(parseInt(value))}>
                    <SelectTrigger className="w-24">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      {Array.from({ length: 5 }, (_, i) => {
                        const year = new Date().getFullYear() - 2 + i;
                        return (
                          <SelectItem key={year} value={year.toString()}>
                            {year}
                          </SelectItem>
                        );
                      })}
                    </SelectContent>
                  </Select>
                </div>
                
                <Button
                  variant="outline"
                  size="sm"
                  onClick={handleNextMonth}
                >
                  <ChevronRight className="h-4 w-4" />
                </Button>
              </div>
            </CardTitle>
            <CardDescription>
              Visualize e gerencie os serviços agendados para o mês selecionado
            </CardDescription>
          </CardHeader>
          <CardContent>
            {monthServices.length === 0 ? (
              <div className="text-center py-8">
                <Calendar className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
                <h3 className="text-lg font-semibold mb-2">Nenhum serviço agendado</h3>
                <p className="text-muted-foreground">
                  Não há serviços agendados para {getMonthName(selectedMonth)} de {selectedYear}
                </p>
              </div>
            ) : (
              <div className="space-y-4">
                {monthServices.map((service) => {
                  const clientName = getClientName(service.clientId);
                  const serviceInstallmentsList = serviceInstallments[service.id!] || [];
                  const paidInstallments = serviceInstallmentsList.filter(i => i.paidAt).length;
                  const totalInstallments = serviceInstallmentsList.length;
                  
                  return (
                    <Card key={service.id} className="border-l-4 border-l-primary hover:shadow-md transition-shadow">
                      <CardContent className="p-6">
                        <div className="flex items-center justify-between">
                          <div className="flex-1">
                            <div className="flex items-center space-x-3 mb-2">
                              <h3 className="text-lg font-semibold">{service.description}</h3>
                              <Badge variant="outline">
                                {getPaymentMethodLabel(service.paymentMethod)}
                              </Badge>
                            </div>
                            
                            <div className="flex items-center space-x-4 text-sm text-muted-foreground mb-3">
                              <div className="flex items-center space-x-1">
                                <User className="h-4 w-4" />
                                <span 
                                  className="text-primary hover:underline cursor-pointer"
                                  onClick={() => handleClientClick(service.clientId)}
                                >
                                  {clientName}
                                </span>
                              </div>
                              <div className="flex items-center space-x-1">
                                <Calendar className="h-4 w-4" />
                                <span>{formatDate(service.serviceDate)}</span>
                              </div>
                              <div className="flex items-center space-x-1">
                                <DollarSign className="h-4 w-4" />
                                <span>{formatCurrency(service.amount)}</span>
                              </div>
                            </div>
                            
                            {totalInstallments > 0 && (
                              <div className="flex items-center space-x-4">
                                <div className="flex items-center space-x-1 text-sm">
                                  <Clock className="h-4 w-4" />
                                  <span>{service.installments} parcela{service.installments > 1 ? 's' : ''}</span>
                                </div>
                                <div className="flex items-center space-x-1 text-sm">
                                  <CheckCircle className="h-4 w-4 text-green-600" />
                                  <span>{paidInstallments}/{totalInstallments} pagas</span>
                                </div>
                              </div>
                            )}
                          </div>
                          
                          <div className="flex items-center space-x-2">
                            <Button
                              variant="outline"
                              size="sm"
                              onClick={() => handleClientClick(service.clientId)}
                            >
                              Ver Cliente
                            </Button>
                          </div>
                        </div>
                      </CardContent>
                    </Card>
                  );
                })}
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    </Layout>
  );
};

export default Agenda; 