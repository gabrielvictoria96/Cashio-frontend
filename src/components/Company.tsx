import React, { useState, useEffect } from 'react';
import { useAuth } from '../contexts/AuthContext';
import { useNavigate } from 'react-router-dom';
import { Button } from './ui/button';
import { Input } from './ui/input';
import { Label } from './ui/label';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from './ui/card';
import { ArrowLeft, Building2, Plus, Edit, Save, X } from 'lucide-react';
import Layout from './Layout';
import { authService, type Company, type CreateCompanyData } from '../services/api';

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
      setFormData(prev => ({ ...prev, userId: user.id }));
    }
    const selectedPlanId = localStorage.getItem('selectedSubscriptionPlanId');
    if (selectedPlanId) {
      setFormData(prev => ({ ...prev, subscriptionPlanId: selectedPlanId }));
    }
    fetchCompany();
  }, [user]);

  const fetchCompany = async () => {
    try {
      setLoading(true);
      const response = await authService.getCompanies();
      const companies = response.companies || [];
      setCompany(companies[0] || null);
    } catch (error) {
      console.error('Erro ao buscar empresa:', error);
      setCompany(null);
    } finally {
      setLoading(false);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!formData.name) {
      alert('Por favor, preencha todos os campos obrigatórios.');
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
    } catch (error) {
      console.error('Erro ao salvar empresa:', error);
      alert('Erro ao salvar empresa. Tente novamente.');
    }
  };

  const handleEdit = (company: Company) => {
    setEditingCompany(company);
    setFormData({
      userId: company.userId,
      subscriptionPlanId: company.subscriptionPlanId,
      name: company.name,
      urlLogo: company.urlLogo || '',
      pixCode: company.pixCode || ''
    });
    setShowForm(true);
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

        {!showForm && (
          <div className="space-y-6">
            {company ? (
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center justify-between">
                    <div className="flex items-center">
                      <Building2 className="h-5 w-5 mr-2" />
                      Sua Empresa
                    </div>
                    <div className="flex space-x-2">
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => handleEdit(company)}
                      >
                        <Edit className="h-4 w-4 mr-2" />
                        Editar
                      </Button>
                    </div>
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div>
                      <Label className="font-medium">Nome da Empresa</Label>
                      <p className="text-sm text-muted-foreground">{company.name}</p>
                    </div>
                    {company.urlLogo && (
                      <div>
                        <Label className="font-medium">URL do Logo</Label>
                        <p className="text-sm text-muted-foreground">{company.urlLogo}</p>
                      </div>
                    )}
                    {company.pixCode && (
                      <div>
                        <Label className="font-medium">Chave PIX</Label>
                        <p className="text-sm text-muted-foreground">{company.pixCode}</p>
                      </div>
                    )}
                  </div>
                </CardContent>
              </Card>
            ) : (
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center">
                    <Building2 className="h-5 w-5 mr-2" />
                    Cadastrar Empresa
                  </CardTitle>
                  <CardDescription>
                    Você ainda não possui uma empresa cadastrada. Clique no botão abaixo para criar sua primeira empresa.
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  <Button onClick={() => setShowForm(true)}>
                    <Plus className="h-4 w-4 mr-2" />
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
                  ? 'Edite as informações da sua empresa'
                  : 'Preencha as informações da sua empresa'
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
                    onChange={(e) => setFormData(prev => ({ ...prev, name: e.target.value }))}
                    placeholder="Digite o nome da empresa"
                    required
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="urlLogo">URL do Logo (opcional)</Label>
                  <Input
                    id="urlLogo"
                    value={formData.urlLogo}
                    onChange={(e) => setFormData(prev => ({ ...prev, urlLogo: e.target.value }))}
                    placeholder="Digite a URL do logo da empresa"
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="pixCode">chave PIX (opcional)</Label>
                  <Input
                    id="pixCode"
                    value={formData.pixCode}
                    onChange={(e) => setFormData(prev => ({ ...prev, pixCode: e.target.value }))}
                    placeholder="Digite a chave PIX da empresa"
                  />
                </div>

                <div className="flex space-x-2 pt-4">
                  <Button type="submit" className="flex-1">
                    {editingCompany ? (
                      <>
                        <Save className="h-4 w-4 mr-2" />
                        Atualizar Empresa
                      </>
                    ) : (
                      <>
                        <Plus className="h-4 w-4 mr-2" />
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
    </Layout>
  );
};

export default CompanyComponent; 