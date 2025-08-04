import React from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import { Toaster } from 'react-hot-toast';
import { AuthProvider, useAuth } from './contexts/AuthContext';
import Login from './components/Login';
import Dashboard from './components/Dashboard';
import CompanyComponent from './components/Company';
import SubscriptionPlanSelector from './components/SubscriptionPlanSelector';
import CompanySetup from './components/CompanySetup';
import Clients from './components/Clients';
import ClientDetail from './components/ClientDetail';
import Services from './components/Services';
import Agenda from './components/Agenda';
import CompanyCheck from './components/CompanyCheck';

// Debug: Verificar se a aplicação está carregando
console.log('🚀 Cashio App iniciando...');
console.log('🌐 API URL:', process.env.REACT_APP_API_URL);

// Componente para rotas protegidas
const ProtectedRoute: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const { user, loading } = useAuth();

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background">
        <div className="animate-spin rounded-full h-32 w-32 border-b-2 border-primary"></div>
      </div>
    );
  }

  if (!user) {
    return <Navigate to="/login" replace />;
  }

  return <>{children}</>;
};

// Componente para rotas públicas
const PublicRoute: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const { user, loading } = useAuth();

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background">
        <div className="animate-spin rounded-full h-32 w-32 border-b-2 border-primary"></div>
      </div>
    );
  }

  if (user) {
    return <Navigate to="/dashboard" replace />;
  }

  return <>{children}</>;
};

const App: React.FC = () => {
  return (
    <AuthProvider>
      <Router>
        <Routes>
          {/* Rota de teste */}
          <Route
            path="/test"
            element={
              <div style={{ padding: '20px', textAlign: 'center' }}>
                <h1>🚀 Cashio App - Teste</h1>
                <p>API URL: {process.env.REACT_APP_API_URL}</p>
                <p>Status: Funcionando!</p>
              </div>
            }
          />
          <Route
            path="/login"
            element={
              <PublicRoute>
                <Login />
              </PublicRoute>
            }
          />
          <Route
            path="/dashboard"
            element={
              <ProtectedRoute>
                <CompanyCheck>
                  <Dashboard />
                </CompanyCheck>
              </ProtectedRoute>
            }
          />
          <Route
            path="/company"
            element={
              <ProtectedRoute>
                <CompanyCheck>
                  <CompanyComponent />
                </CompanyCheck>
              </ProtectedRoute>
            }
          />
          <Route
            path="/subscription-plan"
            element={
              <ProtectedRoute>
                <SubscriptionPlanSelector />
              </ProtectedRoute>
            }
          />
          <Route
            path="/company-setup"
            element={
              <ProtectedRoute>
                <CompanySetup />
              </ProtectedRoute>
            }
          />
          <Route
            path="/clients"
            element={
              <ProtectedRoute>
                <CompanyCheck>
                  <Clients />
                </CompanyCheck>
              </ProtectedRoute>
            }
          />
          <Route
            path="/clients/:clientId"
            element={
              <ProtectedRoute>
                <CompanyCheck>
                  <ClientDetail />
                </CompanyCheck>
              </ProtectedRoute>
            }
          />
          <Route
            path="/services"
            element={
              <ProtectedRoute>
                <CompanyCheck>
                  <Services />
                </CompanyCheck>
              </ProtectedRoute>
            }
          />
          <Route
            path="/agenda"
            element={
              <ProtectedRoute>
                <CompanyCheck>
                  <Agenda />
                </CompanyCheck>
              </ProtectedRoute>
            }
          />
          <Route path="/" element={<Navigate to="/dashboard" replace />} />
        </Routes>
        <Toaster 
          position="top-right"
          toastOptions={{
            duration: 4000,
            style: {
              background: 'hsl(var(--card))',
              color: 'hsl(var(--card-foreground))',
              border: '1px solid hsl(var(--border))',
            },
            success: {
              iconTheme: {
                primary: 'hsl(var(--primary))',
                secondary: 'hsl(var(--primary-foreground))',
              },
            },
            error: {
              iconTheme: {
                primary: 'hsl(var(--destructive))',
                secondary: 'hsl(var(--destructive-foreground))',
              },
            },
          }}
        />
      </Router>
    </AuthProvider>
  );
};

export default App;
