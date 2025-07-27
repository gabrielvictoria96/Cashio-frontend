import axios from 'axios';

// Configuração base do Axios
const api = axios.create({
  baseURL: process.env.REACT_APP_API_URL || 'http://localhost:3000',
  headers: {
    'Content-Type': 'application/json',
  },
});

// Interceptor para adicionar token de autenticação
api.interceptors.request.use((config) => {
  const token = localStorage.getItem('token');
  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }
  return config;
});

// Interfaces
export interface User {
  id: string;
  name: string;
  email: string;
  phone?: string;
  createdAt?: string;
  updatedAt?: string;
}

export interface AuthResponse {
  user: User;
  token: string;
}

export interface LoginData {
  email: string;
  password: string;
}

export interface RegisterData {
  name: string;
  email: string;
  password: string;
  phone?: string;
}

export interface Company {
  id?: string;
  userId: string;
  subscriptionPlanId: string;
  name: string;
  urlLogo?: string;
  pixCode?: string;
  createdAt?: string;
  updatedAt?: string;
}

export interface CreateCompanyData {
  userId: string;
  subscriptionPlanId: string;
  name: string;
  urlLogo?: string;
  pixCode?: string;
}

export interface Client {
  id?: string;
  companyId: string;
  name: string;
  email: string;
  phoneNumber: string;
  createdAt?: string;
  updatedAt?: string;
}

export interface CreateClientData {
  companyId: string;
  name: string;
  email: string;
  phoneNumber: string;
}

export enum PaymentMethodType {
  PIX = "PIX",
  CREDIT_CARD = "CREDIT_CARD",
  BOLETO = "BOLETO",
}

export interface Service {
  id?: string;
  companyId: string;
  clientId: string;
  description: string;
  amount: number;
  paymentMethod: PaymentMethodType;
  templateNotificationMessage?: string;
  firstPaymentDate: string;
  serviceDate: string;
  installments: number;
  customInstallments?: CustomInstallment[];
  createdAt?: string;
  updatedAt?: string;
}

export interface CustomInstallment {
  installmentNumber: number;
  amount: number;
  dueDate: string;
}

export interface ServiceInstallment {
  id?: string;
  serviceId: string;
  installmentNumber: number;
  amount: number;
  dueDate: string;
  notificatedAt?: string;
  paidAt?: string;
  createdAt?: string;
  updatedAt?: string;
}

export interface CreateServiceData {
  companyId: string;
  clientId: string;
  description: string;
  amount: number;
  paymentMethod: PaymentMethodType;
  templateNotificationMessage?: string;
  firstPaymentDate: string;
  serviceDate: string;
  installments: number;
  customInstallments?: CustomInstallment[];
}

export interface SubscriptionPlan {
  id?: string;
  name: string;
  description: string;
  price?: number;
  amount?: number;
  type: string;
}

export const authService = {
  // Login
  async login(data: LoginData): Promise<AuthResponse> {
    const response = await api.post('/auth/login', data);
    return response.data;
  },

  // Registro
  async register(data: RegisterData): Promise<AuthResponse> {
    const response = await api.post('/auth/register', data);
    return response.data;
  },

  // Login com Google
  async loginWithGoogle(idToken: string): Promise<AuthResponse> {
    const response = await api.post('/auth/login/google', { idToken });
    return response.data;
  },

  // Reset de senha
  async resetPassword(email: string): Promise<{ message: string }> {
    const response = await api.post('/auth/reset-password', { email });
    return response.data;
  },

  // Atualizar senha
  async updatePassword(currentPassword: string, newPassword: string): Promise<{ message: string }> {
    const response = await api.put('/auth/update-password', { currentPassword, newPassword });
    return response.data;
  },

  // Buscar usuário atual
  async getCurrentUser(): Promise<{ user: User }> {
    const response = await api.get('/auth/me');
    return response.data;
  },

  // Buscar empresas do usuário
  async getCompanies(): Promise<{ companies: Company[] }> {
    const response = await api.get('/company');
    return response.data;
  },

  async getUserCompany(): Promise<{ company: Company | null }> {
    const response = await api.get('/company');
    const companies = response.data.companies;
    return { company: companies.length > 0 ? companies[0] : null };
  },

  // Criar empresa
  async createCompany(data: CreateCompanyData): Promise<{ company: Company }> {
    const response = await api.post('/company', data);
    return response.data;
  },

  // Atualizar empresa
  async updateCompany(id: string, data: CreateCompanyData): Promise<{ company: Company }> {
    const response = await api.put(`/company/${id}`, data);
    return response.data;
  },

  // Deletar empresa
  async deleteCompany(id: string): Promise<{ message: string }> {
    const response = await api.delete(`/company/${id}`);
    return response.data;
  },

  // Buscar planos de assinatura
  async getSubscriptionPlans(): Promise<{ subscriptionPlans: SubscriptionPlan[] }> {
    const response = await api.get('/subscription-plans');
    return response.data;
  },

  // Buscar clientes
  async getClients(): Promise<{ clients: Client[] }> {
    const response = await api.get('/clients');
    return response.data;
  },

  // Criar cliente
  async createClient(data: CreateClientData): Promise<{ client: Client }> {
    const response = await api.post('/clients', data);
    return response.data;
  },

  // Atualizar cliente
  async updateClient(id: string, data: CreateClientData): Promise<{ client: Client }> {
    const response = await api.put(`/clients/${id}`, data);
    return response.data;
  },

  // Deletar cliente
  async deleteClient(id: string): Promise<{ message: string }> {
    const response = await api.delete(`/clients/${id}`);
    return response.data;
  },

  // Buscar serviços
  async getServices(): Promise<{ services: Service[] }> {
    const response = await api.get('/services');
    return response.data;
  },

  // Criar serviço
  async createService(data: CreateServiceData): Promise<{ service: Service }> {
    const response = await api.post('/services', data);
    return response.data;
  },

  // Atualizar serviço
  async updateService(id: string, data: CreateServiceData): Promise<{ service: Service }> {
    const response = await api.put(`/services/${id}`, data);
    return response.data;
  },

  // Deletar serviço
  async deleteService(id: string): Promise<{ message: string }> {
    const response = await api.delete(`/services/${id}`);
    return response.data;
  },

  // Buscar parcelas de um serviço
  async getServiceInstallments(serviceId: string): Promise<{ installments: ServiceInstallment[] }> {
    const response = await api.get(`/services/${serviceId}/installments`);
    return response.data;
  },

  // Marcar parcela como paga
  async markInstallmentAsPaid(installmentId: string): Promise<{ installment: ServiceInstallment }> {
    const response = await api.put(`/service-installments/${installmentId}/mark-as-paid`);
    return response.data;
  },
}; 