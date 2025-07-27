import React, { useState, useEffect } from 'react';
import { useAuth } from '../contexts/AuthContext';
import { Button } from './ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from './ui/card';
import { Badge } from './ui/badge';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from './ui/select';
import { ArrowLeft, DollarSign, TrendingUp, Users, Calendar, Check, Clock, AlertTriangle, Filter } from 'lucide-react';
import Layout from './Layout';
import { authService, type ServiceInstallment, type Client, type Company, type Service } from '../services/api';
import { formatCurrency } from '../utils/currency';
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from 'recharts';
import { showError } from '../utils/notifications';

// Componente de tooltip customizado para funcionar no modo escuro
const CustomTooltip = ({ active, payload, label, selectedYear }: any) => {
  if (active && payload && payload.length) {
    return (
      <div className="bg-card border border-border rounded-lg p-3 shadow-lg">
        <p className="text-foreground font-medium">{`${label} ${selectedYear}`}</p>
        <p className="text-primary font-bold">
          {formatCurrency(payload[0].value)}
        </p>
      </div>
    );
  }
  return null;
};

const Dashboard: React.FC = () => {
  const { user } = useAuth();
  const [clients, setClients] = useState<Client[]>([]);
  const [services, setServices] = useState<Service[]>([]);
  const [installments, setInstallments] = useState<{ [serviceId: string]: ServiceInstallment[] }>({});
  const [loading, setLoading] = useState(true);
  const [selectedMonth, setSelectedMonth] = useState(new Date().getMonth());
  const [selectedYear, setSelectedYear] = useState(new Date().getFullYear());
  const [showConfirmModal, setShowConfirmModal] = useState(false);
  const [installmentToMark, setInstallmentToMark] = useState<ServiceInstallment | null>(null);
  const [paymentStatusFilter, setPaymentStatusFilter] = useState<'all' | 'paid' | 'pending' | 'overdue'>('all');
  const [maxPaymentsHeight, setMaxPaymentsHeight] = useState('max-h-96'); // Altura máxima aumentada para ~8-10 pagamentos

  useEffect(() => {
    fetchData();
  }, []); // eslint-disable-line react-hooks/exhaustive-deps

  // Forçar recálculo quando o ano mudar
  useEffect(() => {
    // Isso garante que os componentes sejam re-renderizados quando o ano mudar
  }, [selectedYear]);

  // Resetar filtro quando mês ou ano mudar
  useEffect(() => {
    setPaymentStatusFilter('all');
  }, [selectedMonth, selectedYear]);

  const fetchData = async () => {
    try {
      setLoading(true);
      await Promise.all([fetchClients(), fetchServices()]);
    } catch (error) {
      console.error('Erro ao carregar dados:', error);
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
      setInstallments(prev => ({
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
      setInstallments(prev => {
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

  const getPaymentStatus = (installment: any) => {
    if (installment.paidAt) {
      return 'paid'; // Verde - Pago
    }
    
    const dueDate = new Date(installment.dueDate);
    const today = new Date();
    
    // Remove as horas para comparar apenas as datas
    const dueDateOnly = new Date(dueDate.getFullYear(), dueDate.getMonth(), dueDate.getDate());
    const todayOnly = new Date(today.getFullYear(), today.getMonth(), today.getDate());
    
    if (dueDateOnly < todayOnly) {
      return 'overdue'; // Vermelho - Vencido
    } else {
      return 'pending'; // Amarelo - Pendente (não venceu ainda)
    }
  };

  const getMonthlyData = () => {
    const months = [
      'Janeiro', 'Fevereiro', 'Março', 'Abril', 'Maio', 'Junho',
      'Julho', 'Agosto', 'Setembro', 'Outubro', 'Novembro', 'Dezembro'
    ];

    return months.map((month, index) => {
      // Converter objeto installments em array plano
      const allInstallments = Object.values(installments).flat();
      
      const monthInstallments = allInstallments.filter(installment => {
        const dueDate = new Date(installment.dueDate);
        return dueDate.getMonth() === index && dueDate.getFullYear() === selectedYear;
      });

      const totalRevenue = monthInstallments.reduce((sum, installment) => sum + installment.amount, 0);
      const paidAmount = monthInstallments
        .filter(installment => installment.paidAt)
        .reduce((sum, installment) => sum + installment.amount, 0);
      const pendingAmount = totalRevenue - paidAmount;

      return {
        month,
        revenue: totalRevenue,
        paid: paidAmount,
        pending: pendingAmount
      };
    });
  };

  const getSelectedMonthData = () => {
    // Converter objeto installments em array plano
    const allInstallments = Object.values(installments).flat();
    
    const monthInstallments = allInstallments.filter(installment => {
      const dueDate = new Date(installment.dueDate);
      return dueDate.getMonth() === selectedMonth && dueDate.getFullYear() === selectedYear;
    });

    // Aplicar filtro de status
    const filteredInstallments = monthInstallments.filter(installment => {
      if (paymentStatusFilter === 'all') return true;
      
      const status = getPaymentStatus(installment);
      return status === paymentStatusFilter;
    });

    const totalRevenue = monthInstallments.reduce((sum, installment) => sum + installment.amount, 0);
    const paidAmount = monthInstallments
      .filter(installment => installment.paidAt)
      .reduce((sum, installment) => sum + installment.amount, 0);
    const pendingAmount = totalRevenue - paidAmount;

    return {
      totalRevenue,
      paidAmount,
      pendingAmount,
      installments: filteredInstallments.sort((a, b) => new Date(a.dueDate).getTime() - new Date(b.dueDate).getTime())
    };
  };

  const totalRevenue = services.reduce((sum, service) => sum + service.amount, 0);
  const allInstallments = Object.values(installments).flat();
  const totalPaid = allInstallments.filter(installment => installment.paidAt).reduce((sum, installment) => sum + installment.amount, 0);

  const selectedMonthData = getSelectedMonthData();
  const monthlyData = getMonthlyData();

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('pt-BR');
  };

  const getClientName = (serviceId: string) => {
    const service = services.find(s => s.id === serviceId);
    if (!service) return 'Serviço não encontrado';
    
    const client = clients.find(c => c.id === service.clientId);
    return client ? client.name : 'Cliente não encontrado';
  };

  const getServiceDescription = (serviceId: string) => {
    const service = services.find(s => s.id === serviceId);
    return service ? service.description : 'Serviço não encontrado';
  };

  const getMonthName = (month: number) => {
    const months = [
      'Janeiro', 'Fevereiro', 'Março', 'Abril', 'Maio', 'Junho',
      'Julho', 'Agosto', 'Setembro', 'Outubro', 'Novembro', 'Dezembro'
    ];
    return months[month];
  };

  const getAnnualStats = () => {
    const currentYear = new Date().getFullYear();
    const currentMonth = new Date().getMonth();
    
    // Calcular baseado nas parcelas do ano selecionado
    const allInstallments = Object.values(installments).flat();
    
    // Verificar se há dados
    if (allInstallments.length === 0) {
      return {
        totalRevenue: 0,
        totalReceived: 0,
        averageRevenue: 0,
        averageReceived: 0,
        pendingAmount: 0,
        monthsCount: 0,
        monthsWithPayments: 0,
        isCurrentYear: selectedYear === currentYear
      };
    }
    
    const yearInstallments = allInstallments.filter(installment => {
      const dueDate = new Date(installment.dueDate);
      return dueDate.getFullYear() === selectedYear;
    });
    
    const totalAnnualRevenue = yearInstallments.reduce((sum, installment) => sum + installment.amount, 0);
    const totalReceived = yearInstallments
      .filter(installment => installment.paidAt)
      .reduce((sum, installment) => sum + installment.amount, 0);
    
    // Calcular valor que falta receber (parcelas não pagas)
    const pendingAmount = yearInstallments
      .filter(installment => !installment.paidAt)
      .reduce((sum, installment) => sum + installment.amount, 0);
    
    const averageRevenue = totalAnnualRevenue / 12;
    
    // Calcular quantos meses têm dados para o ano selecionado
    const monthsWithData = new Set(
      yearInstallments.map(installment => new Date(installment.dueDate).getMonth())
    ).size;

    // Calcular quantos meses têm pagamentos (parcelas pagas)
    const monthsWithPayments = new Set(
      yearInstallments
        .filter(installment => installment.paidAt)
        .map(installment => new Date(installment.dueDate).getMonth())
    ).size;

    // Calcular a média mensal dos valores recebidos (considerando apenas os meses que tiveram pagamentos)
    const averageReceived = monthsWithPayments > 0 ? totalReceived / monthsWithPayments : 0;

    return {
      totalRevenue: totalAnnualRevenue,
      totalReceived,
      averageRevenue,
      averageReceived,
      pendingAmount,
      monthsCount: monthsWithData,
      monthsWithPayments,
      isCurrentYear: selectedYear === currentYear
    };
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

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background">
        <div className="animate-spin rounded-full h-32 w-32 border-b-2 border-primary"></div>
      </div>
    );
  }

  return (
    <Layout>
      <div className="p-4 lg:p-6">
        <div className="space-y-6">
          {/* Header com boas-vindas e seletor de mês */}
          <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between space-y-4 lg:space-y-0">
            <div className="space-y-2">
              <h1 className="text-4xl font-bold tracking-tight">
                Oi, {user?.name?.split(' ')[0]}! 👋
              </h1>
              <p className="text-xl text-muted-foreground">
                Dashboard de {getMonthName(selectedMonth)} de {selectedYear}
              </p>
            </div>
            
            {/* Seletor de mês */}
            <div className="flex items-center space-x-4">
              <Button
                variant="outline"
                size="sm"
                onClick={handlePreviousMonth}
              >
                <ArrowLeft className="h-4 w-4" />
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
                <ArrowLeft className="h-4 w-4 rotate-180" />
              </Button>
            </div>
          </div>

          {/* Cards de resumo do mês selecionado */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
            <Card className="bg-gradient-to-br from-blue-50 to-blue-100 dark:from-blue-950 dark:to-blue-900">
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium text-blue-700 dark:text-blue-300">Receita do Mês</CardTitle>
                <DollarSign className="h-4 w-4 text-blue-600" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold text-blue-700 dark:text-blue-300">
                  {formatCurrency(selectedMonthData.totalRevenue)}
                </div>
                <p className="text-xs text-blue-600 dark:text-blue-400 mt-1">
                  {selectedMonthData.installments.length} pagamentos
                </p>
              </CardContent>
            </Card>

            <Card className="bg-gradient-to-br from-green-50 to-green-100 dark:from-green-950 dark:to-green-900">
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium text-green-700 dark:text-green-300">Já Pago</CardTitle>
                <Check className="h-4 w-4 text-green-600" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold text-green-700 dark:text-green-300">
                  {formatCurrency(selectedMonthData.paidAmount)}
                </div>
                <p className="text-xs text-green-600 dark:text-green-400 mt-1">
                  {selectedMonthData.installments.filter(i => i.paidAt).length} pagos
                </p>
              </CardContent>
            </Card>

            <Card className="bg-gradient-to-br from-orange-50 to-orange-100 dark:from-orange-950 dark:to-orange-900">
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium text-orange-700 dark:text-orange-300">A Receber</CardTitle>
                <Clock className="h-4 w-4 text-orange-600" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold text-orange-700 dark:text-orange-300">
                  {formatCurrency(selectedMonthData.pendingAmount)}
                </div>
                <p className="text-xs text-orange-600 dark:text-orange-400 mt-1">
                  {selectedMonthData.installments.filter(i => !i.paidAt).length} pendentes
                </p>
              </CardContent>
            </Card>

            <Card className="bg-gradient-to-br from-purple-50 to-purple-100 dark:from-purple-950 dark:to-purple-900">
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium text-purple-700 dark:text-purple-300">Taxa de Pagamento</CardTitle>
                <TrendingUp className="h-4 w-4 text-purple-600" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold text-purple-700 dark:text-purple-300">
                  {selectedMonthData.totalRevenue > 0 
                    ? Math.round((selectedMonthData.paidAmount / selectedMonthData.totalRevenue) * 100)
                    : 0}%
                </div>
                <p className="text-xs text-purple-600 dark:text-purple-400 mt-1">
                  {selectedMonthData.paidAmount > selectedMonthData.pendingAmount ? (
                    <span className="flex items-center">
                      <TrendingUp className="h-3 w-3 mr-1" />
                      Crescendo
                    </span>
                  ) : (
                    <span className="flex items-center">
                      <TrendingUp className="h-3 w-3 mr-1" />
                      Atenção
                    </span>
                  )}
                </p>
              </CardContent>
            </Card>
          </div>

          {/* Lista de Pagamentos do Mês Selecionado */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center justify-between">
                <div className="flex items-center">
                  <Calendar className="h-5 w-5 mr-2" />
                  Pagamentos de {getMonthName(selectedMonth)} de {selectedYear}
                </div>
                <div className="flex items-center space-x-2">
                  <Badge variant="outline" className="text-green-600 border-green-600">
                    {formatCurrency(selectedMonthData.paidAmount)} Pago
                  </Badge>
                  <Badge variant="outline" className="text-yellow-600 border-yellow-600">
                    {formatCurrency(selectedMonthData.installments.filter(i => i.id && getPaymentStatus(i) === 'pending').reduce((sum, i) => sum + i.amount, 0))} Pendente
                  </Badge>
                  <Badge variant="outline" className="text-red-600 border-red-600">
                    {formatCurrency(selectedMonthData.installments.filter(i => i.id && getPaymentStatus(i) === 'overdue').reduce((sum, i) => sum + i.amount, 0))} Vencido
                  </Badge>
                </div>
              </CardTitle>
              <CardDescription>
                Gerencie os pagamentos do mês selecionado
              </CardDescription>
              
              {/* Filtros de Status */}
              <div className="flex items-center justify-between mt-4">
                <div className="flex items-center space-x-2">
                  <span className="text-sm font-medium text-muted-foreground">Filtrar por:</span>
                  <div className="flex items-center space-x-1">
                    <Button
                      variant={paymentStatusFilter === 'all' ? 'default' : 'outline'}
                      size="sm"
                      onClick={() => setPaymentStatusFilter('all')}
                      className="text-xs"
                    >
                      Todos
                    </Button>
                    <Button
                      variant={paymentStatusFilter === 'paid' ? 'default' : 'outline'}
                      size="sm"
                      onClick={() => setPaymentStatusFilter('paid')}
                      className="text-xs text-green-600 border-green-600 hover:text-green-700 hover:bg-green-50"
                    >
                      Pagos
                    </Button>
                    <Button
                      variant={paymentStatusFilter === 'pending' ? 'default' : 'outline'}
                      size="sm"
                      onClick={() => setPaymentStatusFilter('pending')}
                      className="text-xs text-yellow-600 border-yellow-600 hover:text-yellow-700 hover:bg-yellow-50"
                    >
                      Pendentes
                    </Button>
                    <Button
                      variant={paymentStatusFilter === 'overdue' ? 'default' : 'outline'}
                      size="sm"
                      onClick={() => setPaymentStatusFilter('overdue')}
                      className="text-xs text-red-600 border-red-600 hover:text-red-700 hover:bg-red-50"
                    >
                      Vencidos
                    </Button>
                  </div>
                </div>
                
                {/* Contador de pagamentos filtrados */}
                <div className="text-sm text-muted-foreground">
                  {selectedMonthData.installments.length} pagamento{selectedMonthData.installments.length !== 1 ? 's' : ''} 
                  {paymentStatusFilter !== 'all' && (
                    <span>
                      {' '}
                      {paymentStatusFilter === 'paid' ? 'pago' : paymentStatusFilter === 'pending' ? 'pendente' : 'vencido'}
                      {selectedMonthData.installments.length !== 1 ? 's' : ''}
                    </span>
                  )}
                </div>
              </div>
            </CardHeader>
            <CardContent>
              {selectedMonthData.installments.length === 0 ? (
                <div className="text-center py-8">
                  <Calendar className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
                  <h3 className="text-lg font-semibold mb-2">
                    {paymentStatusFilter === 'all' 
                      ? 'Nenhum pagamento este mês'
                      : paymentStatusFilter === 'paid'
                      ? 'Nenhum pagamento pago este mês'
                      : paymentStatusFilter === 'pending'
                      ? 'Nenhum pagamento pendente este mês'
                      : 'Nenhum pagamento vencido este mês'
                    }
                  </h3>
                  <p className="text-muted-foreground">
                    {paymentStatusFilter === 'all' 
                      ? `Não há parcelas vencendo em ${getMonthName(selectedMonth)} de ${selectedYear}`
                      : `Não há parcelas ${paymentStatusFilter === 'paid' ? 'pagas' : paymentStatusFilter === 'pending' ? 'pendentes' : 'vencidas'} em ${getMonthName(selectedMonth)} de ${selectedYear}`
                    }
                  </p>
                </div>
              ) : (
                <div className={`space-y-3 overflow-y-auto ${maxPaymentsHeight}`} style={{ scrollbarWidth: 'thin', msOverflowStyle: 'none' }}>
                  {selectedMonthData.installments.map((installment) => {
                    const status = getPaymentStatus(installment);
                    
                    const getCardStyles = () => {
                      switch (status) {
                        case 'paid':
                          return 'bg-gradient-to-r from-green-50 to-green-100 border-green-200 dark:from-green-950 dark:to-green-900 dark:border-green-800';
                        case 'overdue':
                          return 'bg-gradient-to-r from-red-50 to-red-100 border-red-200 dark:from-red-950 dark:to-red-900 dark:border-red-800';
                        case 'pending':
                          return 'bg-gradient-to-r from-yellow-50 to-yellow-100 border-yellow-200 dark:from-yellow-950 dark:to-yellow-900 dark:border-yellow-800';
                        default:
                          return 'bg-gradient-to-r from-orange-50 to-orange-100 border-orange-200 dark:from-orange-950 dark:to-orange-900 dark:border-orange-800';
                      }
                    };

                    const getIconStyles = () => {
                      switch (status) {
                        case 'paid':
                          return 'bg-green-100 text-green-600 dark:bg-green-900 dark:text-green-400';
                        case 'overdue':
                          return 'bg-red-100 text-red-600 dark:bg-red-900 dark:text-red-400';
                        case 'pending':
                          return 'bg-yellow-100 text-yellow-600 dark:bg-yellow-900 dark:text-yellow-400';
                        default:
                          return 'bg-orange-100 text-orange-600 dark:bg-orange-900 dark:text-orange-400';
                      }
                    };

                    const getStatusText = () => {
                      switch (status) {
                        case 'paid':
                          return 'Pago em ' + (installment.paidAt ? formatDate(installment.paidAt) : 'Data não informada');
                        case 'overdue':
                          return 'Vencido';
                        case 'pending':
                          return 'Pendente';
                        default:
                          return 'Pendente';
                      }
                    };

                    return (
                      <div
                        key={installment.id}
                        className={`flex items-center justify-between p-4 rounded-lg border transition-all hover:shadow-md ${getCardStyles()}`}
                      >
                        <div className="flex items-center space-x-4">
                          <div className={`p-2 rounded-full ${getIconStyles()}`}>
                            {status === 'paid' ? (
                              <Check className="h-4 w-4" />
                            ) : status === 'overdue' ? (
                              <AlertTriangle className="h-4 w-4" />
                            ) : (
                              <Clock className="h-4 w-4" />
                            )}
                          </div>
                          <div>
                            <div className="font-medium">
                              {getClientName(installment.serviceId)}
                            </div>
                            <div className="text-sm text-muted-foreground">
                              {getServiceDescription(installment.serviceId)} - {installment.installmentNumber}ª parcela
                            </div>
                            <div className="text-xs text-muted-foreground">
                              Vencimento: {formatDate(installment.dueDate)}
                            </div>
                          </div>
                        </div>
                        <div className="flex items-center space-x-4">
                          <div className="text-right">
                            <div className="font-bold">{formatCurrency(installment.amount)}</div>
                            <div className="text-xs text-muted-foreground">
                              {getStatusText()}
                            </div>
                          </div>
                          {status !== 'paid' && (
                            <Button
                              size="default"
                              onClick={() => handleMarkAsPaidClick(installment)}
                              className="bg-green-600 hover:bg-green-700 text-white border-green-600"
                              title="Marcar como pago"
                            >
                              <Check className="h-5 w-5" />
                            </Button>
                          )}
                        </div>
                      </div>
                    );
                  })}
                </div>
              )}
            </CardContent>
          </Card>

          {/* Gráfico de Comparação Anual */}
          <Card>
            <CardHeader>
              <CardTitle>Receita Anual - {selectedYear}</CardTitle>
              <CardDescription>
                Evolução da receita ao longo do ano
              </CardDescription>
            </CardHeader>
            <CardContent>
              <ResponsiveContainer width="100%" height={400}>
                <LineChart data={monthlyData}>
                  <CartesianGrid strokeDasharray="3 3" className="stroke-border" />
                  <XAxis 
                    dataKey="month" 
                    className="stroke-muted-foreground"
                    fontSize={12}
                  />
                  <YAxis 
                    className="stroke-muted-foreground"
                    fontSize={12}
                    tickFormatter={(value) => formatCurrency(value).replace('R$', '')}
                  />
                  <Tooltip 
                    content={<CustomTooltip selectedYear={selectedYear} />}
                  />
                  <Line 
                    type="monotone" 
                    dataKey="revenue" 
                    stroke="#3b82f6" 
                    name="Receita Total"
                    dot={false}
                  />
                </LineChart>
              </ResponsiveContainer>
            </CardContent>
          </Card>

          {/* Estatísticas Anuais */}
          <div className="space-y-6">
            {/* Primeira linha: Total Recebido e Valor que Falta Receber */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <Card className="bg-gradient-to-br from-green-50 to-green-100 dark:from-green-950 dark:to-green-900">
                <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                  <CardTitle className="text-sm font-medium text-green-700 dark:text-green-300">
                    Total Recebido {selectedYear}
                  </CardTitle>
                  <Check className="h-4 w-4 text-green-600" />
                </CardHeader>
                <CardContent>
                  <div className="text-2xl font-bold text-green-700 dark:text-green-300">
                    {formatCurrency(getAnnualStats().totalReceived)}
                  </div>
                  <p className="text-xs text-green-600 dark:text-green-400 mt-1">
                    Valor recebido até o momento
                  </p>
                </CardContent>
              </Card>

              <Card className="bg-gradient-to-br from-orange-50 to-orange-100 dark:from-orange-950 dark:to-orange-900">
                <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                  <CardTitle className="text-sm font-medium text-orange-700 dark:text-orange-300">
                    Falta Receber {selectedYear}
                  </CardTitle>
                  <Clock className="h-4 w-4 text-orange-600" />
                </CardHeader>
                <CardContent>
                  <div className="text-2xl font-bold text-orange-700 dark:text-orange-300">
                    {formatCurrency(getAnnualStats().pendingAmount)}
                  </div>
                  <p className="text-xs text-orange-600 dark:text-orange-400 mt-1">
                    Valor pendente de recebimento
                  </p>
                </CardContent>
              </Card>
            </div>

            {/* Segunda linha: Receita Total e Média Mensal da Receita */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <Card className="bg-gradient-to-br from-purple-50 to-purple-100 dark:from-purple-950 dark:to-purple-900">
                <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                  <CardTitle className="text-sm font-medium text-purple-700 dark:text-purple-300">
                    Receita Total {selectedYear}
                  </CardTitle>
                  <TrendingUp className="h-4 w-4 text-purple-600" />
                </CardHeader>
                <CardContent>
                  <div className="text-2xl font-bold text-purple-700 dark:text-purple-300">
                    {formatCurrency(getAnnualStats().totalRevenue)}
                  </div>
                  <p className="text-xs text-purple-600 dark:text-purple-400 mt-1">
                    Receita total do ano {selectedYear}
                  </p>
                </CardContent>
              </Card>

              <Card className="bg-gradient-to-br from-indigo-50 to-indigo-100 dark:from-indigo-950 dark:to-indigo-900">
                <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                  <CardTitle className="text-sm font-medium text-indigo-700 dark:text-indigo-300">
                    Média Mensal {selectedYear}
                  </CardTitle>
                  <TrendingUp className="h-4 w-4 text-indigo-600" />
                </CardHeader>
                <CardContent>
                  <div className="text-2xl font-bold text-indigo-700 dark:text-indigo-300">
                    {formatCurrency(getAnnualStats().averageRevenue)}
                  </div>
                  <p className="text-xs text-indigo-600 dark:text-indigo-400 mt-1">
                    Receita anual dividida por 12 meses
                  </p>
                </CardContent>
              </Card>
            </div>
          </div>
        </div>
      </div>

      {/* Modal de Confirmação */}
      {showConfirmModal && installmentToMark && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-card border border-border rounded-lg p-6 max-w-md w-full">
            <h3 className="text-lg font-semibold mb-2">Confirmar Pagamento</h3>
            <p className="text-sm text-muted-foreground mb-4">
              Você tem certeza de que deseja marcar a parcela de R$ {formatCurrency(installmentToMark.amount)} como paga?
            </p>
            <div className="flex justify-end space-x-2">
              <Button variant="outline" onClick={handleCancelMarkAsPaid}>
                Cancelar
              </Button>
              <Button onClick={handleConfirmMarkAsPaid}>
                Confirmar
              </Button>
            </div>
          </div>
        </div>
      )}
    </Layout>
  );
};

export default Dashboard; 