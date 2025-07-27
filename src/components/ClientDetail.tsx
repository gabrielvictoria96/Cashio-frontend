import React, { useState, useEffect, useCallback } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { Button } from './ui/button';
import { Input } from './ui/input';
import { Label } from './ui/label';
import { Textarea } from './ui/textarea';
import { CurrencyInput } from './ui/currency-input';
import { DateInput } from './ui/date-input';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from './ui/card';
import { Badge } from './ui/badge';
import { ArrowLeft, User, Mail, Phone, MapPin, DollarSign, Plus, Edit, Trash2, Check, X, ChevronDown, ChevronUp } from 'lucide-react';
import Layout from './Layout';
import { authService, type Client, type Service, type CreateServiceData, type ServiceInstallment, PaymentMethodType } from '../services/api';
import { formatCurrency } from '../utils/currency';
import { showError, showSuccess } from '../utils/notifications';

const ClientDetail: React.FC = () => {
  const navigate = useNavigate();
  const { clientId } = useParams<{ clientId: string }>();
  const [client, setClient] = useState<Client | null>(null);
  const [clientServices, setClientServices] = useState<Service[]>([]);
  const [serviceInstallments, setServiceInstallments] = useState<{ [serviceId: string]: ServiceInstallment[] }>({});
  const [loading, setLoading] = useState(true);
  const [expandedServices, setExpandedServices] = useState<Set<string>>(new Set());
  const [showServiceForm, setShowServiceForm] = useState(false);
  const [showConfirmModal, setShowConfirmModal] = useState(false);
  const [installmentToMark, setInstallmentToMark] = useState<ServiceInstallment | null>(null);
  const [serviceFormData, setServiceFormData] = useState<CreateServiceData>({
    companyId: '',
    clientId: '',
    description: '',
    amount: 0,
    paymentMethod: PaymentMethodType.PIX,
    templateNotificationMessage: '',
    firstPaymentDate: '',
    serviceDate: '',
    installments: 1
  });

  const resetServiceForm = useCallback(() => {
    setServiceFormData({
      companyId: client?.companyId || '',
      clientId: clientId || '',
      description: '',
      amount: 0,
      paymentMethod: PaymentMethodType.PIX,
      templateNotificationMessage: '',
      firstPaymentDate: '',
      serviceDate: '',
      installments: 1
    });
  }, [client, clientId]);

  const fetchClientData = useCallback(async () => {
    try {
      setLoading(true);
      
      // Buscar todos os clientes para encontrar o cliente específico
      const clientsResponse = await authService.getClients();
      const allClients = clientsResponse.clients || [];
      const foundClient = allClients.find(c => c.id === clientId);
      
      if (!foundClient) {
        showError('Cliente não encontrado');
        navigate('/clients');
        return;
      }
      
      setClient(foundClient);
      
      // Buscar serviços do cliente
      await fetchClientServices();
    } catch (error) {
      console.error('Erro ao buscar dados do cliente:', error);
      navigate('/clients');
    } finally {
      setLoading(false);
    }
  }, [clientId, navigate]);

  useEffect(() => {
    if (clientId) {
      fetchClientData();
    }
  }, [clientId, fetchClientData]);

  useEffect(() => {
    if (client) {
      resetServiceForm();
    }
  }, [client, resetServiceForm]);

  const fetchClientServices = async () => {
    try {
      const servicesResponse = await authService.getServices();
      const allServices = servicesResponse.services || [];
      const clientServices = allServices.filter(service => service.clientId === clientId);
      
      setClientServices(clientServices);
      
      // Buscar parcelas para cada serviço
      for (const service of clientServices) {
        await fetchServiceInstallments(service.id!);
      }
    } catch (error) {
      console.error('Erro ao buscar serviços do cliente:', error);
      setClientServices([]);
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
      setShowConfirmModal(false);
      setInstallmentToMark(null);
      showSuccess('Parcela marcada como paga!');
    } catch (error) {
      console.error('Erro ao marcar parcela como paga:', error);
      showError('Erro ao marcar parcela como paga. Tente novamente.');
    }
  };

  const handleMarkAsPaidClick = (installment: ServiceInstallment) => {
    setInstallmentToMark(installment);
    setShowConfirmModal(true);
  };

  const handleConfirmMarkAsPaid = () => {
    if (installmentToMark?.id) {
      markInstallmentAsPaid(installmentToMark.id);
    }
  };

  const handleCancelMarkAsPaid = () => {
    setShowConfirmModal(false);
    setInstallmentToMark(null);
  };

  const handleDeleteService = async (serviceId: string, serviceDescription: string) => {
    if (window.confirm(`Tem certeza que deseja excluir o serviço "${serviceDescription}"?\n\n⚠️ ATENÇÃO: Esta ação também excluirá todas as parcelas associadas a este serviço.`)) {
      try {
        await authService.deleteService(serviceId);
        // Recarregar os serviços do cliente
        await fetchClientServices();
        showSuccess(`Serviço "${serviceDescription}" excluído com sucesso!\n\nTodas as parcelas associadas também foram removidas.`);
      } catch (error) {
        console.error('Erro ao excluir serviço:', error);
        showError('Erro ao excluir serviço. Tente novamente.');
      }
    }
  };

  const toggleServiceExpansion = (serviceId: string) => {
    setExpandedServices(prev => {
      const newSet = new Set(prev);
      if (newSet.has(serviceId)) {
        newSet.delete(serviceId);
      } else {
        newSet.add(serviceId);
      }
      return newSet;
    });
  };

  const handleServiceSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!serviceFormData.description || !serviceFormData.amount || !serviceFormData.firstPaymentDate || !serviceFormData.serviceDate) {
      showError('Por favor, preencha todos os campos obrigatórios.');
      return;
    }

    try {
      await authService.createService(serviceFormData);
      
      setShowServiceForm(false);
      resetServiceForm();
      await fetchClientServices();
      showSuccess('Serviço cadastrado com sucesso!');
    } catch (error) {
      console.error('Erro ao salvar serviço:', error);
      showError('Erro ao salvar serviço. Tente novamente.');
    }
  };

  const handleCancelServiceForm = () => {
    setShowServiceForm(false);
    resetServiceForm();
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('pt-BR');
  };

  const getPaymentMethodLabel = (method: string) => {
    const labels = {
      'PIX': 'PIX',
      'CREDIT_CARD': 'Cartão de Crédito',
      'BOLETO': 'Boleto'
    };
    return labels[method as keyof typeof labels] || method;
  };

  const handleBack = () => {
    navigate('/clients');
  };

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background">
        <div className="animate-spin rounded-full h-32 w-32 border-b-2 border-primary"></div>
      </div>
    );
  }

  if (!client) {
    return (
      <Layout>
        <div className="p-6">
          <div className="text-center py-8">
            <User className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
            <h3 className="text-lg font-semibold mb-2">Cliente não encontrado</h3>
            <Button onClick={handleBack}>
              <ArrowLeft className="h-4 w-4 mr-2" />
              Voltar para Clientes
            </Button>
          </div>
        </div>
      </Layout>
    );
  }

  const totalRevenue = clientServices.reduce((sum, service) => sum + service.amount, 0);
  const allInstallments = Object.values(serviceInstallments).flat();
  const totalPaid = allInstallments.filter(installment => installment.paidAt).reduce((sum, installment) => sum + installment.amount, 0);
  const totalPending = totalRevenue - totalPaid;

  return (
    <Layout>
      <div className="p-6">
        <div className="flex items-center space-x-4 mb-6">
          <Button
            variant="ghost"
            size="sm"
            onClick={handleBack}
            className="text-muted-foreground hover:text-foreground"
          >
            <ArrowLeft className="h-4 w-4 mr-2" />
            Voltar
          </Button>
          <h1 className="text-3xl font-bold">{client.name}</h1>
        </div>

        {/* Informações do Cliente */}
        <Card className="mb-6">
          <CardHeader>
            <CardTitle className="flex items-center">
              <User className="h-5 w-5 mr-2" />
              Informações do Cliente
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="flex items-center space-x-3">
                <Mail className="h-4 w-4 text-muted-foreground" />
                <div>
                  <p className="text-sm font-medium">Email</p>
                  <p className="text-sm text-muted-foreground">{client.email}</p>
                </div>
              </div>
              <div className="flex items-center space-x-3">
                <Phone className="h-4 w-4 text-muted-foreground" />
                <div>
                  <p className="text-sm font-medium">Telefone</p>
                  <p className="text-sm text-muted-foreground">{client.phoneNumber}</p>
                </div>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Resumo Financeiro */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-6">
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Receita Total</CardTitle>
              <DollarSign className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{formatCurrency(totalRevenue)}</div>
              <p className="text-xs text-muted-foreground">
                {clientServices.length} serviço{clientServices.length !== 1 ? 's' : ''}
              </p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Já Pago</CardTitle>
              <Check className="h-4 w-4 text-green-600" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-green-600">{formatCurrency(totalPaid)}</div>
              <p className="text-xs text-muted-foreground">
                {allInstallments.filter(i => i.paidAt).length} pagamento{allInstallments.filter(i => i.paidAt).length !== 1 ? 's' : ''}
              </p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">A Receber</CardTitle>
              <X className="h-4 w-4 text-orange-600" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-orange-600">{formatCurrency(totalPending)}</div>
              <p className="text-xs text-muted-foreground">
                {allInstallments.filter(i => !i.paidAt).length} pendente{allInstallments.filter(i => !i.paidAt).length !== 1 ? 's' : ''}
              </p>
            </CardContent>
          </Card>
        </div>

        {/* Serviços do Cliente */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center justify-between">
              <div className="flex items-center">
                <MapPin className="h-5 w-5 mr-2" />
                Serviços Contratados
              </div>
              <Button onClick={() => setShowServiceForm(true)}>
                <Plus className="h-4 w-4 mr-2" />
                Novo Serviço
              </Button>
            </CardTitle>
            <CardDescription>
              Todos os serviços prestados para este cliente
            </CardDescription>
          </CardHeader>
          <CardContent>
            {clientServices.length === 0 ? (
              <div className="text-center py-8">
                <MapPin className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
                <h3 className="text-lg font-semibold mb-2">Nenhum serviço encontrado</h3>
                <p className="text-muted-foreground">
                  Este cliente ainda não possui serviços contratados.
                </p>
              </div>
            ) : (
              <div className="space-y-4">
                {clientServices.map((service) => {
                  const isExpanded = expandedServices.has(service.id!);
                  const serviceInstallmentsList = serviceInstallments[service.id!] || [];
                  const paidInstallments = serviceInstallmentsList.filter(i => i.paidAt).length;
                  const totalInstallments = serviceInstallmentsList.length;
                  
                  return (
                    <Card key={service.id} className="border-l-4 border-l-primary">
                      <CardHeader className="pb-3">
                        <div className="flex items-center justify-between">
                          <div className="flex-1">
                            <CardTitle className="text-lg">{service.description}</CardTitle>
                            <div className="flex items-center space-x-4 mt-2">
                              <Badge variant="outline">
                                {getPaymentMethodLabel(service.paymentMethod)}
                              </Badge>
                              <span className="text-sm text-muted-foreground">
                                {service.installments} parcela{service.installments > 1 ? 's' : ''}
                              </span>
                              {totalInstallments > 0 && (
                                <span className="text-sm text-muted-foreground">
                                  {paidInstallments}/{totalInstallments} pagas
                                </span>
                              )}
                            </div>
                          </div>
                          <div className="flex items-center space-x-4">
                            <div className="text-right">
                              <div className="text-2xl font-bold">{formatCurrency(service.amount)}</div>
                              <p className="text-sm text-muted-foreground">
                                Serviço: {formatDate(service.serviceDate)}
                              </p>
                            </div>
                            <Button
                              variant="ghost"
                              size="sm"
                              onClick={() => toggleServiceExpansion(service.id!)}
                              className="ml-2"
                            >
                              {isExpanded ? (
                                <ChevronUp className="h-4 w-4" />
                              ) : (
                                <ChevronDown className="h-4 w-4" />
                              )}
                            </Button>
                            <Button
                              variant="ghost"
                              size="sm"
                              onClick={(e) => {
                                e.stopPropagation();
                                handleDeleteService(service.id!, service.description);
                              }}
                              className="text-red-600 hover:text-red-700 hover:bg-red-50"
                              title="Excluir serviço"
                            >
                              <Trash2 className="h-4 w-4" />
                            </Button>
                          </div>
                        </div>
                      </CardHeader>
                      
                      {/* Parcelas do Serviço - Expandível */}
                      {isExpanded && serviceInstallmentsList.length > 0 && (
                        <CardContent className="pt-0">
                          <div className="border-t pt-4">
                            <h4 className="font-medium mb-3">Parcelas:</h4>
                            <div className="space-y-2">
                              {serviceInstallmentsList
                                .sort((a, b) => a.installmentNumber - b.installmentNumber)
                                .map((installment) => (
                                  <div
                                    key={installment.id}
                                    className={`flex items-center justify-between p-3 rounded-lg border ${
                                      installment.paidAt 
                                        ? 'bg-green-50 border-green-200 dark:bg-green-950 dark:border-green-800' 
                                        : 'bg-orange-50 border-orange-200 dark:bg-orange-950 dark:border-orange-800'
                                    }`}
                                  >
                                    <div className="flex items-center space-x-3">
                                      <div className={`p-1 rounded-full ${
                                        installment.paidAt 
                                          ? 'bg-green-100 text-green-600 dark:bg-green-900 dark:text-green-400' 
                                          : 'bg-orange-100 text-orange-600 dark:bg-orange-900 dark:text-orange-400'
                                      }`}>
                                        {installment.paidAt ? (
                                          <Check className="h-3 w-3" />
                                        ) : (
                                          <X className="h-3 w-3" />
                                        )}
                                      </div>
                                      <div>
                                        <div className="font-medium">
                                          {installment.installmentNumber}ª parcela
                                        </div>
                                        <div className="text-xs text-muted-foreground">
                                          Vencimento: {formatDate(installment.dueDate)}
                                        </div>
                                      </div>
                                    </div>
                                    <div className="flex items-center space-x-3">
                                      <div className="text-right">
                                        <div className="font-bold">{formatCurrency(installment.amount)}</div>
                                        <div className="text-xs text-muted-foreground">
                                          {installment.paidAt ? 'Pago em ' + formatDate(installment.paidAt) : 'Pendente'}
                                        </div>
                                      </div>
                                      {!installment.paidAt && (
                                        <Button
                                          size="sm"
                                          onClick={() => handleMarkAsPaidClick(installment)}
                                          className="bg-green-600 hover:bg-green-700"
                                        >
                                          Marcar como Pago
                                        </Button>
                                      )}
                                    </div>
                                  </div>
                                ))}
                            </div>
                          </div>
                        </CardContent>
                      )}
                    </Card>
                  );
                })}
              </div>
            )}
          </CardContent>
        </Card>

        {/* Formulário de Novo Serviço - Modal */}
        {showServiceForm && (
          <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
            <div className="bg-card border border-border rounded-lg p-6 max-w-2xl w-full mx-4 max-h-[90vh] overflow-y-auto">
              <div className="flex items-center justify-between mb-4">
                <h2 className="text-xl font-semibold">Novo Serviço</h2>
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={handleCancelServiceForm}
                  className="text-muted-foreground hover:text-foreground"
                >
                  ✕
                </Button>
              </div>
              <p className="text-sm text-muted-foreground mb-6">
                Cadastre um novo serviço para este cliente
              </p>
              
              <form onSubmit={handleServiceSubmit} className="space-y-4">
                <div className="space-y-2">
                  <Label htmlFor="description">Descrição do Serviço *</Label>
                  <Textarea
                    id="description"
                    value={serviceFormData.description}
                    onChange={(e) => setServiceFormData(prev => ({ ...prev, description: e.target.value }))}
                    placeholder="Descreva o serviço prestado"
                    required
                  />
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label htmlFor="amount">Valor (R$) *</Label>
                    <CurrencyInput
                      id="amount"
                      value={serviceFormData.amount}
                      onChange={(value) => setServiceFormData(prev => ({ ...prev, amount: value || 0 }))}
                      placeholder="0,00"
                      required
                    />
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="paymentMethod">Forma de Pagamento *</Label>
                    <select
                      id="paymentMethod"
                      value={serviceFormData.paymentMethod}
                      onChange={(e) => setServiceFormData(prev => ({ ...prev, paymentMethod: e.target.value as PaymentMethodType }))}
                      className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background file:border-0 file:bg-transparent file:text-sm file:font-medium placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50"
                      required
                    >
                      <option value={PaymentMethodType.PIX}>PIX</option>
                      <option value={PaymentMethodType.CREDIT_CARD}>Cartão de Crédito</option>
                      <option value={PaymentMethodType.BOLETO}>Boleto</option>
                    </select>
                  </div>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                  <div className="space-y-2">
                    <Label htmlFor="firstPaymentDate">Data do Primeiro Pagamento *</Label>
                    <DateInput
                      id="firstPaymentDate"
                      value={serviceFormData.firstPaymentDate}
                      onChange={(value) => setServiceFormData(prev => ({ ...prev, firstPaymentDate: value }))}
                      placeholder="dd/mm/aaaa"
                      outputFormat="iso"
                      required
                    />
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="serviceDate">Data do Serviço *</Label>
                    <DateInput
                      id="serviceDate"
                      value={serviceFormData.serviceDate}
                      onChange={(value) => setServiceFormData(prev => ({ ...prev, serviceDate: value }))}
                      placeholder="dd/mm/aaaa"
                      outputFormat="iso"
                      required
                    />
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="installments">Número de Parcelas *</Label>
                    <Input
                      id="installments"
                      type="number"
                      min="1"
                      max="12"
                      value={serviceFormData.installments}
                      onChange={(e) => setServiceFormData(prev => ({ ...prev, installments: parseInt(e.target.value) || 1 }))}
                      required
                    />
                  </div>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="templateNotificationMessage">Mensagem de Notificação (opcional)</Label>
                  <Textarea
                    id="templateNotificationMessage"
                    value={serviceFormData.templateNotificationMessage}
                    onChange={(e) => setServiceFormData(prev => ({ ...prev, templateNotificationMessage: e.target.value }))}
                    placeholder="Mensagem personalizada para notificar o cliente sobre o pagamento"
                    rows={3}
                  />
                </div>

                <div className="flex space-x-2 pt-4">
                  <Button type="submit" className="flex-1">
                    Cadastrar Serviço
                  </Button>
                  <Button type="button" variant="outline" onClick={handleCancelServiceForm}>
                    Cancelar
                  </Button>
                </div>
              </form>
            </div>
          </div>
        )}

        {/* Modal de Confirmação */}
        {showConfirmModal && installmentToMark && (
          <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
            <div className="bg-card border border-border rounded-lg p-6 max-w-md w-full mx-4 max-h-[90vh] overflow-y-auto">
              <div className="flex items-center justify-between mb-4">
                <h2 className="text-xl font-semibold">Confirmar Pagamento</h2>
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={handleCancelMarkAsPaid}
                  className="text-muted-foreground hover:text-foreground"
                >
                  ✕
                </Button>
              </div>
              <p className="text-sm text-muted-foreground mb-6">
                Você tem certeza que deseja marcar a parcela de R$ {formatCurrency(installmentToMark.amount)} como paga?
              </p>
              <div className="flex justify-end space-x-2">
                <Button variant="outline" onClick={handleCancelMarkAsPaid}>
                  Cancelar
                </Button>
                <Button onClick={handleConfirmMarkAsPaid} className="bg-green-600 hover:bg-green-700">
                  Confirmar
                </Button>
              </div>
            </div>
          </div>
        )}
      </div>
    </Layout>
  );
};

export default ClientDetail; 