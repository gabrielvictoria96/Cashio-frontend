# Frontend - Pague-me

Frontend React para o sistema de gestão de pagamentos "Pague-me".

## 🚀 Funcionalidades

- ✅ **Autenticação completa** (Login/Registro)
- ✅ **Login com Google** (Firebase Auth)
- ✅ **Interface moderna** (Tailwind CSS)
- ✅ **Formulários validados** (React Hook Form + Yup)
- ✅ **Roteamento protegido** (React Router)
- ✅ **Context API** para gerenciamento de estado

## 🛠️ Tecnologias

- **React 18** com TypeScript
- **React Router DOM** para roteamento
- **React Hook Form** para formulários
- **Yup** para validação
- **Tailwind CSS** para estilização
- **Firebase Auth** para autenticação Google
- **Axios** para requisições HTTP
- **Lucide React** para ícones

## 📦 Instalação

```bash
# Instalar dependências
npm install

# Iniciar servidor de desenvolvimento
npm start
```

## ⚙️ Configuração

### 1. Firebase Configuration

Você precisa configurar o Firebase no arquivo `src/config/firebase.ts`:

```typescript
const firebaseConfig = {
  apiKey: "sua-api-key",
  authDomain: "notification-manager-5164f.firebaseapp.com",
  projectId: "notification-manager-5164f",
  storageBucket: "notification-manager-5164f.appspot.com",
  messagingSenderId: "123456789012",
  appId: "1:123456789012:web:abcdef1234567890"
};
```

### 2. API Backend

O frontend está configurado para se conectar ao backend na porta 3000. Se necessário, altere a URL no arquivo `src/services/api.ts`:

```typescript
const API_BASE_URL = process.env.REACT_APP_API_URL || 'http://localhost:3000';
```

## 🎯 Como usar

### 1. Registro de usuário
- Acesse `/login`
- Clique em "criar uma nova conta"
- Preencha os dados e clique em "Criar conta"

### 2. Login
- Acesse `/login`
- Digite email e senha
- Ou clique em "Google" para login social

### 3. Dashboard
- Após o login, você será redirecionado para `/dashboard`
- Visualize suas informações e estatísticas

## 📁 Estrutura do Projeto

```
src/
├── components/
│   ├── Login.tsx          # Página de login/registro
│   └── Dashboard.tsx      # Dashboard principal
├── contexts/
│   └── AuthContext.tsx    # Contexto de autenticação
├── services/
│   └── api.ts            # Serviços de API
├── config/
│   └── firebase.ts       # Configuração Firebase
├── App.tsx               # Componente principal
└── index.tsx             # Ponto de entrada
```

## 🔧 Scripts Disponíveis

- `npm start` - Inicia o servidor de desenvolvimento
- `npm run build` - Gera build de produção
- `npm test` - Executa testes
- `npm run eject` - Ejecta configurações (irreversível)

## 🌐 URLs

- **Login/Registro**: `http://localhost:3000/login`
- **Dashboard**: `http://localhost:3000/dashboard`

## 🔒 Autenticação

O sistema usa:
- **JWT tokens** para autenticação
- **Firebase Auth** para login Google
- **Context API** para gerenciamento de estado
- **Roteamento protegido** para páginas privadas

## 🎨 Design

- **Tailwind CSS** para estilização
- **Componentes reutilizáveis**
- **Interface responsiva**
- **Tema personalizado** com cores primárias

## 🚀 Próximos Passos

1. **Configurar Firebase** com suas credenciais
2. **Conectar com backend** rodando na porta 3000
3. **Testar login/registro**
4. **Implementar funcionalidades** adicionais do dashboard
