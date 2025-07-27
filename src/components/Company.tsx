import React, { useState, useEffect } from 'react';
import { useAuth } from '../contexts/AuthContext';
import { useNavigate } from 'react-router-dom';
import { Button } from './ui/button';
import { Input } from './ui/input';
import { Label } from './ui/label';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from './ui/card';
import { ArrowLeft, Building2, Edit, X } from 'lucide-react';
import Layout from './Layout';
import { authService, type Company, type CreateCompanyData } from '../services/api';
import { showError, showSuccess } from '../utils/notifications';

const CompanyComponent: React.FC = () => {
  const { user } = useAuth();
  const navigate = useNavigate();
  const [company, setCompany] = useState<Company | null>(null);
  const [loading, setLoading] = useState(true);
  const [showForm, setShowForm] = useState(false);
  const [editingCompany, setEditingCompany] = useState<Company | null>(null);
  const [formData, setFormData] = useState<CreateCompanyData>({
    userId: '',
    subscriptionPlanId: '',
    name: '',
    urlLogo: '',
    pixCode: ''
  });

  useEffect(() => {
    if (user) {
      setFormData((prev: CreateCompanyData) => ({ ...prev, userId: user.id }));
    }
    const selectedPlanId = localStorage.getItem('selectedSubscriptionPlanId');
    if (selectedPlanId) {
      setFormData((prev: CreateCompanyData) => ({ ...prev, subscriptionPlanId: selectedPlanId }));
    }
    fetchCompany();
  }, [user]);

  const fetchCompany = async () => {
    try {
      setLoading(true);
      const response = await authService.getUserCompany();
      setCompany(response.company);
      
      if (response.company) {
        setEditingCompany(response.company);
        setFormData({
          userId: response.company.userId,
          subscriptionPlanId: response.company.subscriptionPlanId,
          name: response.company.name,
          urlLogo: response.company.urlLogo || '',
          pixCode: response.company.pixCode || ''
        });
      }
    } catch (error) {
      console.error('Erro ao buscar empresa:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!formData.name) {
      showError('Por favor, preencha todos os campos obrigatórios.');
      return;
    }

    try {
      if (editingCompany) {
        await authService.updateCompany(editingCompany.id!, formData);
      } else {
        await authService.createCompany(formData);
      }
      
      setShowForm(false);
      setEditingCompany(null);
      resetForm();
      fetchCompany();
      showSuccess('Empresa salva com sucesso!');
    } catch (error) {
      console.error('Erro ao salvar empresa:', error);
      showError('Erro ao salvar empresa. Tente novamente.');
    }
  };

  const resetForm = () => {
    setFormData({
      userId: user?.id || '',
      subscriptionPlanId: localStorage.getItem('selectedSubscriptionPlanId') || '',
      name: '',
      urlLogo: '',
      pixCode: ''
    });
  };

  const handleCancel = () => {
    setShowForm(false);
    setEditingCompany(null);
    resetForm();
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
            <h1 className="text-3xl font-bold">Gerenciar Empresa</h1>
          </div>
        </div>

        <div className="max-w-4xl mx-auto">
          {!showForm && (
            <div className="space-y-6">
              {company ? (
                <Card>
                  <CardHeader>
                    <CardTitle className="flex items-center">
                      <Building2 className="h-5 w-5 mr-2" />
                      Informações da Empresa
                    </CardTitle>
                    <CardDescription>
                      Visualize e edite as informações da sua empresa
                    </CardDescription>
                  </CardHeader>
                  <CardContent>
                    <div className="space-y-4">
                      <div>
                        <Label className="text-sm font-medium">Nome da Empresa</Label>
                        <p className="text-sm text-muted-foreground">{company.name}</p>
                      </div>
                      {company.urlLogo && (
                        <div>
                          <Label className="text-sm font-medium">URL do Logo</Label>
                          <p className="text-sm text-muted-foreground">{company.urlLogo}</p>
                        </div>
                      )}
                      {company.pixCode && (
                        <div>
                          <Label className="text-sm font-medium">Chave PIX</Label>
                          <p className="text-sm text-muted-foreground">{company.pixCode}</p>
                        </div>
                      )}
                    </div>
                    <div className="mt-6">
                      <Button onClick={() => setShowForm(true)}>
                        <Edit className="h-4 w-4 mr-2" />
                        Editar Empresa
                      </Button>
                    </div>
                  </CardContent>
                </Card>
              ) : (
                <Card>
                  <CardHeader>
                    <CardTitle className="flex items-center">
                      <Building2 className="h-5 w-5 mr-2" />
                      Nenhuma Empresa Cadastrada
                    </CardTitle>
                    <CardDescription>
                      Cadastre sua empresa para começar a usar o sistema
                    </CardDescription>
                  </CardHeader>
                  <CardContent>
                    <Button onClick={() => setShowForm(true)}>
                      <Edit className="h-4 w-4 mr-2" />
                      Cadastrar Empresa
                    </Button>
                  </CardContent>
                </Card>
              )}
            </div>
          )}

          {showForm && (
            <Card>
              <CardHeader>
                <CardTitle>
                  {editingCompany ? 'Editar Empresa' : 'Nova Empresa'}
                </CardTitle>
                <CardDescription>
                  {editingCompany 
                    ? 'Edite as informações da empresa'
                    : 'Preencha as informações da empresa'
                  }
                </CardDescription>
              </CardHeader>
              <CardContent>
                <form onSubmit={handleSubmit} className="space-y-4">
                  <div className="space-y-2">
                    <Label htmlFor="name">Nome da Empresa *</Label>
                    <Input
                      id="name"
                      value={formData.name}
                      onChange={(e) => setFormData((prev: CreateCompanyData) => ({ ...prev, name: e.target.value }))}
                      placeholder="Digite o nome da empresa"
                      required
                    />
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="urlLogo">URL do Logo (opcional)</Label>
                    <Input
                      id="urlLogo"
                      value={formData.urlLogo}
                      onChange={(e) => setFormData((prev: CreateCompanyData) => ({ ...prev, urlLogo: e.target.value }))}
                      placeholder="Digite a URL do logo da empresa"
                    />
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="pixCode">Chave PIX (opcional)</Label>
                    <Input
                      id="pixCode"
                      value={formData.pixCode}
                      onChange={(e) => setFormData((prev: CreateCompanyData) => ({ ...prev, pixCode: e.target.value }))}
                      placeholder="Digite a chave PIX da empresa"
                    />
                  </div>

                  <div className="flex space-x-2 pt-4">
                    <Button type="submit" className="flex-1">
                      {editingCompany ? (
                        <>
                          <Edit className="h-4 w-4 mr-2" />
                          Atualizar Empresa
                        </>
                      ) : (
                        <>
                          <Edit className="h-4 w-4 mr-2" />
                          Cadastrar Empresa
                        </>
                      )}
                    </Button>
                    <Button type="button" variant="outline" onClick={handleCancel}>
                      <X className="h-4 w-4 mr-2" />
                      Cancelar
                    </Button>
                  </div>
                </form>
              </CardContent>
            </Card>
          )}
        </div>
      </div>
    </Layout>
  );
};

export default CompanyComponent; 