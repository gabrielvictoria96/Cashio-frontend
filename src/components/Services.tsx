import React, { useState, useEffect } from 'react';
import { useAuth } from '../contexts/AuthContext';
import { useNavigate } from 'react-router-dom';
import { Button } from './ui/button';
import { Input } from './ui/input';
import { Label } from './ui/label';
import { Textarea } from './ui/textarea';
import { CurrencyInput } from './ui/currency-input';
import { DateInput } from './ui/date-input';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from './ui/card';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from './ui/select';
import { ArrowLeft, Briefcase, Plus, Edit, Trash2, DollarSign, Calendar, User, CreditCard, Check, Search } from 'lucide-react';
import Layout from './Layout';
import { authService, type Service, type CreateServiceData, type Client, type Company, PaymentMethodType, type ServiceInstallment } from '../services/api';
import { formatCurrency } from '../utils/currency';
import { showError, showSuccess } from '../utils/notifications';
import ConfirmDialog from './ui/confirm-dialog';

const Services: React.FC = () => {
  const { user } = useAuth();
  const navigate = useNavigate();
  const [services, setServices] = useState<Service[]>([]);
  const [clients, setClients] = useState<Client[]>([]);
  const [company, setCompany] = useState<Company | null>(null);
  const [loading, setLoading] = useState(true);
  const [showForm, setShowForm] = useState(false);
  const [editingService, setEditingService] = useState<Service | null>(null);
  const [serviceInstallments, setServiceInstallments] = useState<{ [serviceId: string]: ServiceInstallment[] }>({});
  const [showDeleteServiceModal, setShowDeleteServiceModal] = useState(false);
  const [serviceToDelete, setServiceToDelete] = useState<Service | null>(null);
  const [searchTerm, setSearchTerm] = useState('');
  const [currentPage, setCurrentPage] = useState(1);
  const [servicesPerPage] = useState(9); // 3 linhas x 3 colunas
  const [customInstallments, setCustomInstallments] = useState(false);
  const [installmentsData, setInstallmentsData] = useState<Array<{
    installmentNumber: number;
    amount: number;
    dueDate: string;
  }>>([]);
  const [formData, setFormData] = useState<CreateServiceData>({
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
  const [submitting, setSubmitting] = useState(false);

  useEffect(() => {
    fetchData();
  }, []);

  // Gerar parcelas padrão quando os campos mudarem
  useEffect(() => {
    if (!customInstallments && formData.firstPaymentDate && formData.amount && formData.installments) {
      generateDefaultInstallments();
    }
  }, [formData.firstPaymentDate, formData.amount, formData.installments, customInstallments]);

  const fetchData = async () => {
    try {
      setLoading(true);
      
      // Buscar empresa do usuário
      const companyResponse = await authService.getCompanies();
      const companies = companyResponse.companies || [];
      const userCompany = companies[0];
      
      if (!userCompany) {
        navigate('/company-setup');
        return;
      }
      
      setCompany(userCompany);
      if (userCompany?.id) {
        const companyId = userCompany.id;
        setFormData(prev => ({ ...prev, companyId }));
      }
      
      // Buscar clientes e serviços
      await Promise.all([fetchClients(), fetchServices()]);
    } catch (error) {
      console.error('Erro ao buscar dados:', error);
    } finally {
      setLoading(false);
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

  const fetchServices = async () => {
    try {
      const response = await authService.getServices();
      console.log('Serviços carregados:', response);
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

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!formData.clientId || !formData.description || !formData.amount || !formData.firstPaymentDate || !formData.serviceDate) {
      showError('Por favor, preencha todos os campos obrigatórios.');
      return;
    }

    // Validar parcelas personalizadas se estiver ativado
    if (!validateInstallments()) {
      return;
    }

    try {
      setSubmitting(true);
      
      // Preparar dados para envio
      const serviceData = {
        ...formData,
        // Incluir parcelas personalizadas se estiver ativado
        ...(customInstallments && installmentsData.length > 0 && {
          customInstallments: installmentsData
        })
      };
      
      if (editingService) {
        await authService.updateService(editingService.id!, serviceData);
        showSuccess('Serviço atualizado com sucesso!');
      } else {
        await authService.createService(serviceData);
        showSuccess('Serviço criado com sucesso!');
      }
      
      setShowForm(false);
      setEditingService(null);
      setCustomInstallments(false);
      setInstallmentsData([]);
      resetForm();
      fetchServices();
    } catch (error) {
      console.error('Erro ao salvar serviço:', error);
      showError('Erro ao salvar serviço. Tente novamente.');
    } finally {
      setSubmitting(false);
    }
  };

  const handleEdit = (service: Service) => {
    setEditingService(service);
    setFormData({
      companyId: service.companyId,
      clientId: service.clientId,
      description: service.description,
      amount: service.amount,
      paymentMethod: service.paymentMethod,
      templateNotificationMessage: service.templateNotificationMessage || '',
      firstPaymentDate: service.firstPaymentDate,
      serviceDate: service.serviceDate,
      installments: service.installments
    });
    setShowForm(true);
  };

  const handleDelete = async (serviceId: string) => {
    const service = services.find(s => s.id === serviceId);
    if (service) {
      setServiceToDelete(service);
      setShowDeleteServiceModal(true);
    }
  };

  const handleConfirmDelete = async () => {
    if (!serviceToDelete) return;

    try {
      await authService.deleteService(serviceToDelete.id!);
      fetchServices();
      showSuccess('Serviço excluído com sucesso!');
    } catch (error) {
      console.error('Erro ao excluir serviço:', error);
      showError('Erro ao excluir serviço. Tente novamente.');
    } finally {
      setServiceToDelete(null);
      setShowDeleteServiceModal(false);
    }
  };

  const handleCancelDelete = () => {
    setServiceToDelete(null);
    setShowDeleteServiceModal(false);
  };

  // Funções para gerenciar parcelas personalizadas
  const generateDefaultInstallments = () => {
    if (!formData.firstPaymentDate || !formData.amount || !formData.installments) return;

    const installments = [];
    const installmentAmount = formData.amount / formData.installments;
    const firstDate = new Date(formData.firstPaymentDate);

    for (let i = 0; i < formData.installments; i++) {
      const dueDate = new Date(firstDate);
      dueDate.setMonth(dueDate.getMonth() + i);
      
      installments.push({
        installmentNumber: i + 1,
        amount: installmentAmount,
        dueDate: dueDate.toISOString().split('T')[0]
      });
    }

    setInstallmentsData(installments);
  };

  const updateInstallment = (index: number, field: 'amount' | 'dueDate', value: string | number) => {
    const updatedInstallments = [...installmentsData];
    updatedInstallments[index] = {
      ...updatedInstallments[index],
      [field]: field === 'amount' ? Number(value) : value
    };
    setInstallmentsData(updatedInstallments);
  };

  const addInstallment = () => {
    const newInstallment = {
      installmentNumber: installmentsData.length + 1,
      amount: 0,
      dueDate: ''
    };
    setInstallmentsData([...installmentsData, newInstallment]);
  };

  const removeInstallment = (index: number) => {
    const updatedInstallments = installmentsData.filter((_, i) => i !== index);
    // Renumerar as parcelas
    const renumberedInstallments = updatedInstallments.map((installment, i) => ({
      ...installment,
      installmentNumber: i + 1
    }));
    setInstallmentsData(renumberedInstallments);
  };

  const validateInstallments = () => {
    if (!customInstallments) return true;
    
    const totalAmount = installmentsData.reduce((sum, installment) => sum + installment.amount, 0);
    const hasEmptyFields = installmentsData.some(installment => !installment.dueDate || installment.amount <= 0);
    
    if (hasEmptyFields) {
      showError('Por favor, preencha todas as datas e valores das parcelas.');
      return false;
    }
    
    if (Math.abs(totalAmount - formData.amount) > 0.01) {
      showError(`O total das parcelas (${formatCurrency(totalAmount)}) deve ser igual ao valor do serviço (${formatCurrency(formData.amount)}).`);
      return false;
    }
    
    return true;
  };

  const getClientName = (clientId: string) => {
    const client = clients.find(c => c.id === clientId);
    return client ? client.name : 'Cliente não encontrado';
  };

  // Filtrar serviços por nome do cliente
  const filteredServices = services.filter(service => {
    const clientName = getClientName(service.clientId);
    return clientName.toLowerCase().includes(searchTerm.toLowerCase());
  });

  // Calcular paginação
  const indexOfLastService = currentPage * servicesPerPage;
  const indexOfFirstService = indexOfLastService - servicesPerPage;
  const currentServices = filteredServices.slice(indexOfFirstService, indexOfLastService);
  const totalPages = Math.ceil(filteredServices.length / servicesPerPage);

  // Resetar página quando o filtro mudar
  useEffect(() => {
    setCurrentPage(1);
  }, [searchTerm]);

  const resetForm = () => {
    setFormData({
      companyId: company?.id || '',
      clientId: '',
      description: '',
      amount: 0,
      paymentMethod: PaymentMethodType.PIX,
      templateNotificationMessage: '',
      firstPaymentDate: '',
      serviceDate: '',
      installments: 1
    });
  };

  const handleCancel = () => {
    setShowForm(false);
    setEditingService(null);
    resetForm();
  };

  const handleBack = () => {
    navigate('/dashboard');
  };

  // Usando a função utilitária formatCurrency importada

  const formatDate = (dateString: string) => {
    if (!dateString) return '';
    
    try {
      // Se a data está no formato dd/mm/aaaa, converte para ISO
      if (dateString.includes('/')) {
        const parts = dateString.split('/');
        if (parts.length === 3) {
          const day = parts[0];
          const month = parts[1];
          const year = parts[2];
          const isoDate = `${year}-${month}-${day}`;
          return new Date(isoDate).toLocaleDateString('pt-BR');
        }
      }
      
      // Se já está no formato ISO
      return new Date(dateString).toLocaleDateString('pt-BR');
    } catch (error) {
      console.error('Erro ao formatar data:', error);
      return dateString;
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background">
        <div className="animate-spin rounded-full h-32 w-32 border-b-2 border-primary"></div>
      </div>
    );
  }

  // Verificar se há clientes cadastrados
  if (clients.length === 0) {
    return (
      <Layout>
        <div className="p-4 lg:p-6">
          <div className="flex items-center space-x-4 mb-6">
            <Button
              variant="ghost"
              size="sm"
              onClick={() => navigate('/dashboard')}
              className="text-muted-foreground hover:text-foreground"
            >
              <ArrowLeft className="h-4 w-4 mr-2" />
              Voltar
            </Button>
            <h1 className="text-3xl font-bold">Serviços</h1>
          </div>

          <Card className="max-w-md mx-auto">
            <CardHeader className="text-center">
              <div className="mx-auto w-16 h-16 bg-orange-100 dark:bg-orange-900 rounded-full flex items-center justify-center mb-4">
                <User className="h-8 w-8 text-orange-600" />
              </div>
              <CardTitle className="text-xl">Nenhum Cliente Cadastrado</CardTitle>
              <CardDescription>
                Para cadastrar serviços, você precisa ter pelo menos um cliente cadastrado.
              </CardDescription>
            </CardHeader>
            <CardContent className="text-center space-y-4">
              <p className="text-sm text-muted-foreground">
                Primeiro, cadastre um cliente e depois volte aqui para criar os serviços.
              </p>
              <Button onClick={() => navigate('/clients')} className="w-full">
                <User className="h-4 w-4 mr-2" />
                Cadastrar Cliente
              </Button>
            </CardContent>
          </Card>
        </div>
      </Layout>
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
            <h1 className="text-3xl font-bold">Gerenciar Serviços</h1>
          </div>
        </div>

        {!showForm && (
          <div className="space-y-6">
            {/* Campo de busca */}
            <Card>
              <CardContent className="pt-6">
                <div className="relative">
                  <Input
                    type="text"
                    placeholder="Buscar serviços por nome do cliente..."
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                    className="pl-10"
                  />
                  <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                </div>
                {searchTerm && (
                  <p className="text-sm text-muted-foreground mt-2">
                    {filteredServices.length} {filteredServices.length === 1 ? 'serviço encontrado' : 'serviços encontrados'}
                  </p>
                )}
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle className="flex items-center justify-between">
                  <div className="flex items-center">
                    <Briefcase className="h-5 w-5 mr-2" />
                    Serviços
                  </div>
                  <Button onClick={() => setShowForm(true)}>
                    <Plus className="h-4 w-4 mr-2" />
                    Novo Serviço
                  </Button>
                </CardTitle>
                <CardDescription>
                  Gerencie os serviços prestados aos seus clientes
                </CardDescription>
              </CardHeader>
              <CardContent>
                {filteredServices.length === 0 ? (
                  <div className="text-center py-8">
                    <Briefcase className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
                    {searchTerm ? (
                      <>
                        <h3 className="text-lg font-semibold mb-2">Nenhum serviço encontrado</h3>
                        <p className="text-muted-foreground mb-4">
                          Não foi encontrado nenhum serviço com cliente "{searchTerm}". Tente outro termo de busca.
                        </p>
                        <Button onClick={() => setSearchTerm('')}>
                          Limpar busca
                        </Button>
                      </>
                    ) : (
                      <>
                        <h3 className="text-lg font-semibold mb-2">Nenhum serviço cadastrado</h3>
                        <p className="text-muted-foreground mb-4">
                          Você ainda não possui serviços cadastrados. Clique no botão "Novo Serviço" para começar.
                        </p>
                        <Button onClick={() => setShowForm(true)}>
                          <Plus className="h-4 w-4 mr-2" />
                          Cadastrar Serviço
                        </Button>
                      </>
                    )}
                  </div>
                ) : (
                  <>
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                      {currentServices.map((service) => (
                        <Card key={service.id} className="hover:shadow-md transition-shadow">
                          <CardHeader className="pb-3">
                            <div className="flex justify-between items-start">
                              <div>
                                <CardTitle className="text-lg">{service.description}</CardTitle>
                                <CardDescription className="flex items-center mt-1">
                                  <User className="h-3 w-3 mr-1" />
                                  {getClientName(service.clientId)}
                                </CardDescription>
                              </div>
                              <div className="flex space-x-1">
                                <Button
                                  variant="ghost"
                                  size="sm"
                                  onClick={() => handleEdit(service)}
                                >
                                  <Edit className="h-4 w-4" />
                                </Button>
                                <Button
                                  variant="ghost"
                                  size="sm"
                                  onClick={() => handleDelete(service.id!)}
                                  className="text-red-600 hover:text-red-700"
                                >
                                  <Trash2 className="h-4 w-4" />
                                </Button>
                              </div>
                            </div>
                          </CardHeader>
                          <CardContent className="pt-0 space-y-2">
                            <div className="flex items-center text-sm text-muted-foreground">
                              <DollarSign className="h-3 w-3 mr-1" />
                              {formatCurrency(service.amount)}
                            </div>
                            <div className="flex items-center text-sm text-muted-foreground">
                              <CreditCard className="h-3 w-3 mr-1" />
                              {service.paymentMethod}
                            </div>
                            <div className="flex items-center text-sm text-muted-foreground">
                              <Calendar className="h-3 w-3 mr-1" />
                              {formatDate(service.serviceDate)}
                            </div>
                            <div className="flex items-center justify-between text-xs text-muted-foreground">
                              <span>
                                {service.installments} parcela{service.installments > 1 ? 's' : ''}
                              </span>
                              {serviceInstallments[service.id!] && serviceInstallments[service.id!].length > 0 && (
                                <span className="flex items-center">
                                  <Check className="h-3 w-3 mr-1 text-green-600" />
                                  {serviceInstallments[service.id!].filter(i => i.paidAt).length} paga{serviceInstallments[service.id!].filter(i => i.paidAt).length !== 1 ? 's' : ''}
                                </span>
                              )}
                            </div>
                          </CardContent>
                        </Card>
                      ))}
                    </div>
                    
                    {/* Paginação */}
                    {totalPages > 1 && (
                      <div className="flex items-center justify-center space-x-2 mt-6">
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => setCurrentPage(prev => Math.max(prev - 1, 1))}
                          disabled={currentPage === 1}
                        >
                          Anterior
                        </Button>
                        
                        <div className="flex items-center space-x-1">
                          {Array.from({ length: totalPages }, (_, i) => i + 1).map((page) => (
                            <Button
                              key={page}
                              variant={currentPage === page ? 'default' : 'outline'}
                              size="sm"
                              onClick={() => setCurrentPage(page)}
                              className="w-8 h-8 p-0"
                            >
                              {page}
                            </Button>
                          ))}
                        </div>
                        
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => setCurrentPage(prev => Math.min(prev + 1, totalPages))}
                          disabled={currentPage === totalPages}
                        >
                          Próxima
                        </Button>
                      </div>
                    )}
                    
                    {/* Informações da paginação */}
                    {filteredServices.length > 0 && (
                      <div className="text-center text-sm text-muted-foreground mt-4">
                        Mostrando {indexOfFirstService + 1} a {Math.min(indexOfLastService, filteredServices.length)} de {filteredServices.length} {filteredServices.length === 1 ? 'serviço' : 'serviços'}
                      </div>
                    )}
                  </>
                )}
              </CardContent>
            </Card>
          </div>
        )}

          {showForm && (
            <Card>
              <CardHeader>
                <CardTitle>
                  {editingService ? 'Editar Serviço' : 'Novo Serviço'}
                </CardTitle>
                <CardDescription>
                  {editingService 
                    ? 'Edite as informações do serviço'
                    : 'Preencha as informações do serviço'
                  }
                </CardDescription>
              </CardHeader>
              <CardContent>
                <form onSubmit={handleSubmit} className="space-y-4">
                  <div className="space-y-2">
                    <Label htmlFor="clientId">Cliente *</Label>
                    <Select
                      value={formData.clientId}
                      onValueChange={(value: string) => setFormData(prev => ({ ...prev, clientId: value }))}
                    >
                      <SelectTrigger>
                        <SelectValue placeholder="Selecione o cliente" />
                      </SelectTrigger>
                      <SelectContent>
                        {clients.map((client) => (
                          <SelectItem key={client.id} value={client.id!}>
                            {client.name}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="description">Descrição do Serviço *</Label>
                    <Textarea
                      id="description"
                      value={formData.description}
                      onChange={(e) => setFormData(prev => ({ ...prev, description: e.target.value }))}
                      placeholder="Descreva o serviço prestado"
                      required
                    />
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div className="space-y-2">
                      <Label htmlFor="amount">Valor (R$) *</Label>
                      <CurrencyInput
                        id="amount"
                        value={formData.amount}
                        onChange={(value) => setFormData(prev => ({ ...prev, amount: value || 0 }))}
                        placeholder="0,00"
                        required
                      />
                    </div>

                    <div className="space-y-2">
                      <Label htmlFor="paymentMethod">Forma de Pagamento *</Label>
                      <Select
                        value={formData.paymentMethod}
                        onValueChange={(value: PaymentMethodType) => setFormData(prev => ({ ...prev, paymentMethod: value }))}
                      >
                        <SelectTrigger>
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value={PaymentMethodType.PIX}>PIX</SelectItem>
                          <SelectItem value={PaymentMethodType.CREDIT_CARD}>Cartão de Crédito</SelectItem>
                          <SelectItem value={PaymentMethodType.BOLETO}>Boleto</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                    <div className="space-y-2">
                      <Label htmlFor="firstPaymentDate">Data do Primeiro Pagamento *</Label>
                      <DateInput
                        id="firstPaymentDate"
                        value={formData.firstPaymentDate}
                        onChange={(value) => setFormData(prev => ({ ...prev, firstPaymentDate: value }))}
                        placeholder="dd/mm/aaaa"
                        outputFormat="iso"
                        required
                      />
                    </div>

                    <div className="space-y-2">
                      <Label htmlFor="serviceDate">Data do Serviço *</Label>
                      <DateInput
                        id="serviceDate"
                        value={formData.serviceDate}
                        onChange={(value) => setFormData(prev => ({ ...prev, serviceDate: value }))}
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
                        value={formData.installments}
                        onChange={(e) => setFormData(prev => ({ ...prev, installments: parseInt(e.target.value) || 1 }))}
                        required
                        disabled={customInstallments}
                      />
                    </div>
                  </div>

                  {/* Seção de Parcelas Personalizadas */}
                  <div className="space-y-4">
                    <div className="flex items-center justify-between">
                      <Label className="text-base font-medium">Configuração de Parcelas</Label>
                      <div className="flex items-center space-x-2">
                        <Button
                          type="button"
                          variant={customInstallments ? "default" : "outline"}
                          size="sm"
                          onClick={() => setCustomInstallments(!customInstallments)}
                        >
                          {!customInstallments ? "Personalizar parcelas" : "Parcelas Padrão"}
                        </Button>
                      </div>
                    </div>

                    {customInstallments ? (
                      <div className="space-y-4">
                        <div className="flex items-center justify-between">
                          <p className="text-sm text-muted-foreground">
                            Configure as datas e valores das parcelas manualmente
                          </p>
                          <Button
                            type="button"
                            variant="outline"
                            size="sm"
                            onClick={addInstallment}
                          >
                            + Adicionar Parcela
                          </Button>
                        </div>

                        {installmentsData.length > 0 && (
                          <div className="space-y-3">
                            {installmentsData.map((installment, index) => (
                              <div key={index} className="flex items-center space-x-3 p-3 border rounded-lg">
                                <div className="flex-shrink-0">
                                  <span className="text-sm font-medium text-muted-foreground">
                                    {installment.installmentNumber}ª
                                  </span>
                                </div>
                                
                                <div className="flex-1">
                                  <Label className="text-xs text-muted-foreground">Valor</Label>
                                  <CurrencyInput
                                    value={installment.amount}
                                    onChange={(value) => updateInstallment(index, 'amount', value || 0)}
                                    placeholder="0,00"
                                    className="w-full"
                                  />
                                </div>
                                
                                <div className="flex-1">
                                  <Label className="text-xs text-muted-foreground">Data de Vencimento</Label>
                                  <DateInput
                                    value={installment.dueDate}
                                    onChange={(value) => updateInstallment(index, 'dueDate', value)}
                                    placeholder="dd/mm/aaaa"
                                    outputFormat="iso"
                                    className="w-full"
                                  />
                                </div>
                                
                                <Button
                                  type="button"
                                  variant="ghost"
                                  size="sm"
                                  onClick={() => removeInstallment(index)}
                                  className="text-red-600 hover:text-red-700"
                                  disabled={installmentsData.length === 1}
                                >
                                  <Trash2 className="h-4 w-4" />
                                </Button>
                              </div>
                            ))}
                            
                            <div className="flex justify-between items-center p-3 bg-muted rounded-lg">
                              <span className="text-sm font-medium">Total das Parcelas:</span>
                              <span className="text-sm font-bold">
                                {formatCurrency(installmentsData.reduce((sum, installment) => sum + installment.amount, 0))}
                              </span>
                            </div>
                            
                            {Math.abs(installmentsData.reduce((sum, installment) => sum + installment.amount, 0) - formData.amount) > 0.01 && (
                              <div className="p-3 bg-yellow-50 border border-yellow-200 rounded-lg">
                                <p className="text-sm text-yellow-800">
                                  ⚠️ O total das parcelas deve ser igual ao valor do serviço ({formatCurrency(formData.amount)})
                                </p>
                              </div>
                            )}
                          </div>
                        )}
                      </div>
                    ) : (
                      <div className="p-4 bg-muted rounded-lg">
                        <p className="text-sm text-muted-foreground">
                          As parcelas serão geradas automaticamente com valores iguais e vencimentos mensais a partir da data do primeiro pagamento.
                        </p>
                        {installmentsData.length > 0 && (
                          <div className="mt-3 space-y-2">
                            {installmentsData.map((installment, index) => (
                              <div key={index} className="flex justify-between items-center text-sm">
                                <span>{installment.installmentNumber}ª parcela</span>
                                <span className="font-medium">{formatCurrency(installment.amount)}</span>
                                <span className="text-muted-foreground">{formatDate(installment.dueDate)}</span>
                              </div>
                            ))}
                          </div>
                        )}
                      </div>
                    )}
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="templateNotificationMessage">Mensagem de Notificação (opcional)</Label>
                    <Textarea
                      id="templateNotificationMessage"
                      value={formData.templateNotificationMessage}
                      onChange={(e) => setFormData(prev => ({ ...prev, templateNotificationMessage: e.target.value }))}
                      placeholder="Mensagem personalizada para notificar o cliente sobre o pagamento"
                      rows={3}
                    />
                  </div>

                  <div className="flex space-x-2 pt-4">
                    <Button type="submit" className="flex-1" disabled={submitting}>
                      {editingService ? 'Atualizar Serviço' : 'Cadastrar Serviço'}
                      {submitting && <span className="ml-2">...</span>}
                    </Button>
                    <Button type="button" variant="outline" onClick={handleCancel}>
                      Cancelar
                    </Button>
                  </div>
                </form>
              </CardContent>
            </Card>
          )}
          
          <ConfirmDialog
            open={showDeleteServiceModal}
            onOpenChange={setShowDeleteServiceModal}
            title="Excluir Serviço"
            description={`Tem certeza que deseja excluir o serviço "${serviceToDelete?.description}"? Esta ação não pode ser desfeita.`}
            confirmText="Excluir"
            cancelText="Cancelar"
            variant="destructive"
            onConfirm={handleConfirmDelete}
            onCancel={handleCancelDelete}
          />
        </div>
    </Layout>
  );
};

export default Services; 