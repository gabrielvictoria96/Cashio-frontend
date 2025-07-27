# Pague-me - Frontend

## 📋 Contexto

O **Pague-me** é uma aplicação completa de gestão financeira para profissionais autônomos e pequenas empresas. O sistema permite gerenciar clientes, serviços, parcelas de pagamento e acompanhar receitas de forma organizada e eficiente.

Este repositório contém o **frontend** da aplicação, desenvolvido em React com TypeScript, oferecendo uma interface moderna, responsiva e intuitiva para gerenciar todas as operações financeiras.

## 🚀 Funcionalidades Principais

### 🔐 Autenticação e Onboarding
- **Login/Registro**: Sistema completo de autenticação
- **Login com Google**: Integração com Google OAuth
- **Fluxo de onboarding**: Seleção de plano → Criação de empresa → Dashboard
- **Proteção de rotas**: Acesso controlado por autenticação

### 📊 Dashboard Inteligente
- **Visão geral mensal**: Cards com receita, pagos, pendentes e taxa de pagamento
- **Gráficos anuais**: Comparação de receitas por ano com tooltips informativos
- **Filtros dinâmicos**: Visualize pagamentos por status (Todos, Pagos, Pendentes, Vencidos)
- **Estatísticas anuais**: Total recebido, falta receber, receita total e média mensal
- **Navegação temporal**: Mude entre meses e anos facilmente

### 👤 Gestão de Clientes
- **Cadastro completo**: Nome, email, telefone
- **Edição inline**: Modifique dados dos clientes diretamente
- **Exclusão com confirmação**: Delete clientes com segurança
- **Busca e filtros**: Encontre clientes rapidamente
- **Paginação**: Navegue por muitos clientes facilmente

### 💼 Gestão de Serviços
- **Cadastro avançado**: Descrição, valor, forma de pagamento, datas
- **Parcelas personalizadas**: Configure valores e datas específicas para cada parcela
- **Parcelas automáticas**: Geração automática de parcelas mensais iguais
- **Flexibilidade total**: Escolha entre parcelas iguais ou personalizadas
- **Validação inteligente**: Verificação de total e datas em tempo real
- **Página dedicada**: Visualize e gerencie todos os serviços

### 💰 Controle de Pagamentos
- **Status visual**: Cores e ícones para diferentes status (Pago, Pendente, Vencido)
- **Marcação de pagamentos**: Marque parcelas como pagas com confirmação
- **Filtros por status**: Visualize pagamentos por situação
- **Detalhes completos**: Cliente, serviço, parcela e data de vencimento
- **Scroll otimizado**: Lista com scroll para muitos pagamentos

### 🏢 Gestão de Empresa
- **Dados da empresa**: Nome, logo, código PIX
- **Edição de informações**: Atualize dados da empresa
- **Planos de assinatura**: Escolha e gerencie planos

## 🛠️ Tecnologias Utilizadas

### Core
- **React 18**: Biblioteca principal para interface
- **TypeScript**: Tipagem estática para maior confiabilidade
- **React Router DOM**: Navegação entre páginas
- **React Hook Form**: Gerenciamento de formulários

### UI/UX
- **Tailwind CSS**: Framework CSS utilitário
- **Shadcn/ui**: Componentes de interface modernos
- **Lucide React**: Ícones consistentes e bonitos
- **React Hot Toast**: Notificações elegantes

### Gráficos e Visualização
- **Recharts**: Gráficos interativos e responsivos
- **Custom Tooltips**: Tooltips personalizados para modo escuro

### Estado e Dados
- **Context API**: Gerenciamento de estado global
- **Axios**: Cliente HTTP para requisições
- **Local Storage**: Persistência de dados locais

### Validação e Formulários
- **React Hook Form**: Formulários performáticos
- **Currency Input**: Input especializado para valores monetários
- **Date Input**: Input especializado para datas

## 📁 Estrutura do Projeto

```
src/
├── components/          # Componentes React
│   ├── ui/             # Componentes de interface (Shadcn/ui)
│   ├── Layout.tsx      # Layout principal da aplicação
│   ├── Header.tsx      # Cabeçalho com navegação
│   ├── Sidebar.tsx     # Menu lateral
│   ├── Dashboard.tsx   # Página principal com estatísticas
│   ├── Clients.tsx     # Gestão de clientes
│   ├── ClientDetail.tsx # Detalhes do cliente
│   ├── Services.tsx    # Gestão de serviços
│   ├── Company.tsx     # Gestão da empresa
│   └── Login.tsx       # Autenticação
├── contexts/           # Contextos React
│   └── AuthContext.tsx # Contexto de autenticação
├── services/           # Serviços de API
│   └── api.ts         # Cliente HTTP e interfaces
├── utils/              # Utilitários
│   ├── currency.ts    # Formatação de moeda
│   └── notifications.ts # Sistema de notificações
└── App.tsx            # Componente raiz
```

## 🚀 Como Executar

### Pré-requisitos
- Node.js 18+
- npm ou yarn
- Backend da aplicação rodando

### Instalação

1. **Clone o repositório**
```bash
git clone <repository-url>
cd frontend
```

2. **Instale as dependências**
```bash
npm install
```

3. **Configure as variáveis de ambiente**
```bash
cp .env.example .env
```

Edite o arquivo `.env` com suas configurações:
```env
REACT_APP_API_URL=http://localhost:3000
```

4. **Execute a aplicação**
```bash
# Desenvolvimento
npm start

# Build para produção
npm run build
```

## 🎨 Interface e UX

### Design System
- **Cores consistentes**: Paleta de cores unificada
- **Tipografia clara**: Hierarquia visual bem definida
- **Espaçamento harmonioso**: Sistema de espaçamento consistente
- **Modo escuro**: Suporte completo ao tema escuro

### Componentes Principais

#### Dashboard
- **Cards informativos**: Receita, pagos, pendentes, taxa
- **Gráficos interativos**: Comparação anual com tooltips
- **Filtros dinâmicos**: Status de pagamentos
- **Lista de pagamentos**: Scroll otimizado com status visual

#### Formulários
- **Validação em tempo real**: Feedback imediato
- **Campos especializados**: Inputs para moeda, datas, etc.
- **Parcelas personalizadas**: Interface intuitiva para configuração
- **Confirmações**: Modais para ações críticas

#### Navegação
- **Sidebar responsiva**: Menu lateral colapsável
- **Header informativo**: Usuário, tema, logout
- **Breadcrumbs**: Navegação contextual
- **Botões de ação**: Ações principais sempre visíveis

## 🔧 Scripts Disponíveis

```bash
# Desenvolvimento
npm start              # Executa em modo desenvolvimento
npm run build          # Build para produção
npm run test           # Executa testes
npm run eject          # Eject do Create React App

# Linting
npm run lint           # Executa ESLint
npm run lint:fix       # Corrige problemas de linting
```

## 📱 Responsividade

A aplicação é **totalmente responsiva** e funciona perfeitamente em:

- 📱 **Mobile**: Smartphones e tablets
- 💻 **Desktop**: Computadores e notebooks
- 🖥️ **Tablet**: Tablets em modo paisagem e retrato

### Breakpoints
- **Mobile**: < 768px
- **Tablet**: 768px - 1024px
- **Desktop**: > 1024px

## 🎯 Funcionalidades Avançadas

### Parcelas Personalizadas
- **Toggle de modo**: Padrão vs Personalizado
- **Configuração flexível**: Valores e datas específicas
- **Validação inteligente**: Total deve bater com valor do serviço
- **Interface intuitiva**: Adicionar/remover parcelas facilmente

### Filtros e Busca
- **Busca por nome**: Encontre clientes rapidamente
- **Filtros por status**: Pagamentos por situação
- **Paginação**: Navegue por muitos registros
- **Contadores dinâmicos**: Veja quantos itens foram encontrados

### Notificações
- **Sistema elegante**: React Hot Toast
- **Tipos variados**: Sucesso, erro, informação
- **Posicionamento inteligente**: Não interfere na interface
- **Auto-dismiss**: Desaparecem automaticamente

## 🔒 Segurança

- **Autenticação**: JWT tokens
- **Proteção de rotas**: Acesso controlado
- **Validação de dados**: Inputs sanitizados
- **HTTPS**: Comunicação segura

## 🚀 Deploy

### Vercel (Recomendado)
1. Conecte seu repositório ao Vercel
2. Configure as variáveis de ambiente
3. Deploy automático a cada push

### Netlify
1. Conecte seu repositório ao Netlify
2. Configure o build command: `npm run build`
3. Configure o publish directory: `build`

### Docker
```bash
# Build da imagem
docker build -t pague-me-frontend .

# Executar container
docker run -p 3000:3000 pague-me-frontend
```

## 🧪 Testes

```bash
# Executar testes
npm test

# Executar testes em modo watch
npm test -- --watch

# Executar testes com cobertura
npm test -- --coverage
```

## 🤝 Contribuição

1. Fork o projeto
2. Crie uma branch para sua feature (`git checkout -b feature/AmazingFeature`)
3. Commit suas mudanças (`git commit -m 'Add some AmazingFeature'`)
4. Push para a branch (`git push origin feature/AmazingFeature`)
5. Abra um Pull Request

## 📝 Licença

Este projeto está sob a licença MIT. Veja o arquivo [LICENSE](LICENSE) para mais detalhes.

## 📞 Suporte

Para dúvidas ou suporte, entre em contato através dos issues do GitHub ou email.

---

**Pague-me** - Simplificando a gestão financeira para profissionais autônomos.
