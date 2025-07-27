import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { Button } from './ui/button';
import { Input } from './ui/input';
import { Label } from './ui/label';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from './ui/card';
import { ArrowLeft, Users, Plus, ChevronRight, Trash2, Search } from 'lucide-react';
import Layout from './Layout';
import { authService, type Client, type CreateClientData, type Company } from '../services/api';

const Clients: React.FC = () => {
  const navigate = useNavigate();
  const [clients, setClients] = useState<Client[]>([]);
  const [userCompany, setUserCompany] = useState<Company | null>(null);
  const [loading, setLoading] = useState(true);
  const [showForm, setShowForm] = useState(false);
  const [formData, setFormData] = useState<CreateClientData>({
    companyId: '',
    name: '',
    email: '',
    phoneNumber: ''
  });
  const [searchTerm, setSearchTerm] = useState('');

  useEffect(() => {
    const fetchCompanyAndClients = async () => {
      try {
        setLoading(true);
        const companyResponse = await authService.getUserCompany();
        setUserCompany(companyResponse.company);
        
        if (companyResponse.company?.id) {
          const clientsResponse = await authService.getClients();
          setClients(clientsResponse.clients || []);
        }
      } catch (error) {
        console.error('Erro ao buscar dados:', error);
      } finally {
        setLoading(false);
      }
    };

    fetchCompanyAndClients();
  }, []);

  const fetchClients = async () => {
    try {
      console.log('Buscando clientes...');
      const response = await authService.getClients();
      console.log('Resposta da API de clientes:', response);
      setClients(response.clients || []);
      console.log('Clientes definidos no estado:', response.clients || []);
    } catch (error) {
      console.error('Erro ao buscar clientes:', error);
      setClients([]);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!formData.name || !formData.email || !formData.phoneNumber) {
      alert('Por favor, preencha todos os campos obrigatórios.');
      return;
    }

    console.log('Dados do formulário:', formData);
    console.log('Company ID:', formData.companyId);

    try {
      await authService.createClient(formData);
      
      setShowForm(false);
      resetForm();
      fetchClients();
    } catch (error) {
      console.error('Erro ao salvar cliente:', error);
      alert('Erro ao salvar cliente. Tente novamente.');
    }
  };

  const handleClientClick = (clientId: string) => {
    navigate(`/clients/${clientId}`);
  };

  const handleDelete = async (clientId: string, clientName: string, e: React.MouseEvent) => {
    e.stopPropagation(); // Previne que o clique propague para o card
    
    if (window.confirm(`Tem certeza que deseja excluir o cliente "${clientName}"?\n\n⚠️ ATENÇÃO: Esta ação também excluirá todos os serviços e parcelas associados a este cliente.`)) {
      try {
        await authService.deleteClient(clientId);
        fetchClients(); // Recarrega a lista de clientes
        alert(`Cliente "${clientName}" excluído com sucesso!\n\nTodos os serviços e parcelas associados também foram removidos.`);
      } catch (error) {
        console.error('Erro ao excluir cliente:', error);
        alert('Erro ao excluir cliente. Tente novamente.');
      }
    }
  };

  const resetForm = () => {
    setFormData({
      companyId: userCompany?.id || '',
      name: '',
      email: '',
      phoneNumber: ''
    });
  };

  const handleCancel = () => {
    setShowForm(false);
    resetForm();
  };

  const handleShowForm = () => {
    if (userCompany?.id) {
      setFormData(prev => ({ ...prev, companyId: userCompany.id! }));
    }
    setShowForm(true);
  };

  const handleBack = () => {
    navigate('/dashboard');
  };

  const filteredClients = clients.filter(client =>
    client.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
    client.email.toLowerCase().includes(searchTerm.toLowerCase())
  );

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background">
        <div className="animate-spin rounded-full h-32 w-32 border-b-2 border-primary"></div>
      </div>
    );
  }

  return (
    <Layout>
      <div className="h-[calc(100vh-4rem)] flex flex-col p-6">
        <div className="flex items-center justify-between mb-6 flex-shrink-0">
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
            <h1 className="text-3xl font-bold">Clientes</h1>
          </div>
          <Button onClick={handleShowForm}>
            <Plus className="h-4 w-4 mr-2" />
            Novo Cliente
          </Button>
        </div>

        {!showForm && (
          <div className="flex-1 flex flex-col min-h-0">
            {/* Campo de busca */}
            <Card className="mb-6 flex-shrink-0">
              <CardContent className="pt-6">
                <div className="relative">
                  <Input
                    type="text"
                    placeholder="Buscar clientes por nome ou email..."
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                    className="pl-10"
                  />
                  <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                </div>
                {searchTerm && (
                  <p className="text-sm text-muted-foreground mt-2">
                    {filteredClients.length} {filteredClients.length === 1 ? 'cliente encontrado' : 'clientes encontrados'}
                  </p>
                )}
              </CardContent>
            </Card>

            <Card className="flex-1 flex flex-col min-h-0">
              <CardHeader className="flex-shrink-0">
                <CardTitle className="flex items-center">
                  <Users className="h-5 w-5 mr-2" />
                  Lista de Clientes
                </CardTitle>
                <CardDescription>
                  Clique no nome do cliente para ver seus serviços
                </CardDescription>
              </CardHeader>
              <CardContent 
                className="flex-1 overflow-y-auto hide-scrollbar"
              >
                {filteredClients.length === 0 ? (
                  <div className="text-center py-8">
                    <Users className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
                    {searchTerm ? (
                      <>
                        <h3 className="text-lg font-semibold mb-2">Nenhum cliente encontrado</h3>
                        <p className="text-muted-foreground mb-4">
                          Não foi encontrado nenhum cliente com "{searchTerm}". Tente outro termo de busca.
                        </p>
                        <Button onClick={() => setSearchTerm('')}>
                          Limpar busca
                        </Button>
                      </>
                    ) : (
                      <>
                        <h3 className="text-lg font-semibold mb-2">Nenhum cliente cadastrado</h3>
                        <p className="text-muted-foreground mb-4">
                          Você ainda não possui clientes cadastrados. Clique no botão "Novo Cliente" para começar.
                        </p>
                        <Button onClick={handleShowForm}>
                          <Plus className="h-4 w-4 mr-2" />
                          Cadastrar Cliente
                        </Button>
                      </>
                    )}
                  </div>
                ) : (
                  <div className="space-y-2 pr-2">
                    {filteredClients.map((client) => (
                      <div
                        key={client.id}
                        className="flex items-center justify-between p-4 rounded-lg border hover:bg-accent hover:border-accent-foreground transition-colors"
                      >
                        <div 
                          className="flex items-center space-x-3 flex-1 cursor-pointer"
                          onClick={() => handleClientClick(client.id!)}
                        >
                          <div className="w-10 h-10 bg-primary/10 rounded-full flex items-center justify-center">
                            <span className="text-primary font-semibold">
                              {client.name.charAt(0).toUpperCase()}
                            </span>
                          </div>
                          <div>
                            <h3 className="font-medium text-foreground">{client.name}</h3>
                            <p className="text-sm text-muted-foreground">{client.email}</p>
                          </div>
                        </div>
                        <div className="flex items-center space-x-2">
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={(e) => handleDelete(client.id!, client.name, e)}
                            className="text-red-600 hover:text-red-700 hover:bg-red-50"
                          >
                            <Trash2 className="h-4 w-4" />
                          </Button>
                          <ChevronRight className="h-4 w-4 text-muted-foreground" />
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </CardContent>
            </Card>
          </div>
        )}

        {showForm && (
          <Card>
            <CardHeader>
              <CardTitle>Novo Cliente</CardTitle>
              <CardDescription>
                Preencha as informações do cliente
              </CardDescription>
            </CardHeader>
            <CardContent>
              <form onSubmit={handleSubmit} className="space-y-4">
                <div className="space-y-2">
                  <Label htmlFor="name">Nome do Cliente *</Label>
                  <Input
                    id="name"
                    value={formData.name}
                    onChange={(e) => setFormData(prev => ({ ...prev, name: e.target.value }))}
                    placeholder="Digite o nome do cliente"
                    required
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="email">Email *</Label>
                  <Input
                    id="email"
                    type="email"
                    value={formData.email}
                    onChange={(e) => setFormData(prev => ({ ...prev, email: e.target.value }))}
                    placeholder="Digite o email do cliente"
                    required
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="phoneNumber">Telefone *</Label>
                  <Input
                    id="phoneNumber"
                    value={formData.phoneNumber}
                    onChange={(e) => setFormData(prev => ({ ...prev, phoneNumber: e.target.value }))}
                    placeholder="Digite o telefone do cliente"
                    required
                  />
                </div>

                <div className="flex space-x-2 pt-4">
                  <Button type="submit" className="flex-1">
                    Cadastrar Cliente
                  </Button>
                  <Button type="button" variant="outline" onClick={handleCancel}>
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

export default Clients; 