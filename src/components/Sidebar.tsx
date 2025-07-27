import React from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { Button } from './ui/button';
import { 
  Home, 
  Building, 
  User, 
  Calendar,
  CreditCard
} from 'lucide-react';

interface SidebarProps {
  isOpen: boolean;
  onClose: () => void;
}

const Sidebar: React.FC<SidebarProps> = ({ isOpen, onClose }) => {
  const navigate = useNavigate();
  const location = useLocation();

  const handleNavigate = (path: string) => {
    navigate(path);
    onClose();
  };

  const isActive = (path: string) => {
    return location.pathname === path;
  };

  return (
    <>
      {/* Overlay para mobile */}
      {isOpen && (
        <div 
          className="fixed inset-0 bg-black bg-opacity-50 z-40 lg:hidden"
          onClick={onClose}
        />
      )}

      {/* Sidebar */}
      <div className={`fixed top-0 left-0 h-full w-64 bg-card border-r z-50 transform transition-transform duration-300 ease-in-out ${isOpen ? 'translate-x-0' : '-translate-x-full'} lg:translate-x-0 lg:static lg:z-auto lg:w-48`}>
        <div className="flex flex-col h-full">
          {/* Menu items */}
          <div className="flex-1 p-4 space-y-2">
            <Button 
              variant={isActive('/dashboard') ? 'default' : 'ghost'} 
              className="w-full justify-start flex items-center" 
              onClick={() => handleNavigate('/dashboard')}
            >
              <Home className="h-4 w-4 mr-3 text-current flex-shrink-0" /> Dashboard
            </Button>

            <Button 
              variant={isActive('/company') ? 'default' : 'ghost'} 
              className="w-full justify-start flex items-center" 
              onClick={() => handleNavigate('/company')}
            >
              <Building className="h-4 w-4 mr-3 text-current flex-shrink-0" /> Empresa
            </Button>

            <Button 
              variant={isActive('/clients') ? 'default' : 'ghost'} 
              className="w-full justify-start flex items-center" 
              onClick={() => handleNavigate('/clients')}
            >
              <User className="h-4 w-4 mr-3 text-current flex-shrink-0" /> Clientes
            </Button>

            <Button 
              variant={isActive('/agenda') ? 'default' : 'ghost'} 
              className="w-full justify-start flex items-center" 
              onClick={() => handleNavigate('/agenda')}
            >
              <Calendar className="h-4 w-4 mr-3 text-current flex-shrink-0" /> Agenda
            </Button>

            <Button 
              variant={isActive('/subscription-plan') ? 'default' : 'ghost'} 
              className="w-full justify-start flex items-center" 
              onClick={() => handleNavigate('/subscription-plan')}
            >
              <CreditCard className="h-4 w-4 mr-3 text-current flex-shrink-0" /> Plano
            </Button>
          </div>
        </div>
      </div>
    </>
  );
};

export default Sidebar; 