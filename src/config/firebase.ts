import { initializeApp } from 'firebase/app';
import { getAuth, GoogleAuthProvider } from 'firebase/auth';

// 🔥 CONFIGURAÇÃO DO FIREBASE
// Para obter essas credenciais:
// 1. Acesse: https://console.firebase.google.com
// 2. Selecione seu projeto
// 3. Vá em "Project settings" (ícone de engrenagem)
// 4. Role para baixo até "Your apps"
// 5. Clique em "Add app" → "Web"
// 6. Copie as credenciais abaixo

const firebaseConfig = {
  // ✅ CREDENCIAIS CONFIGURADAS
  apiKey: "AIzaSyC1nKIJ72-R5hMmaE7jZ37umgdvZx9iwQo", // API Key real
  authDomain: "notification-manager-5164f.firebaseapp.com", // Seu domínio
  projectId: "notification-manager-5164f", // Seu Project ID
  storageBucket: "notification-manager-5164f.appspot.com", // Seu Storage Bucket
  messagingSenderId: "123456789012", // Seu Sender ID
  appId: "1:123456789012:web:abcdef1234567890" // Seu App ID
};

// Initialize Firebase
const app = initializeApp(firebaseConfig);

// Initialize Firebase Authentication and get a reference to the service
export const auth = getAuth(app);
export const googleProvider = new GoogleAuthProvider();

// Configurar escopo do Google (opcional)
googleProvider.addScope('email');
googleProvider.addScope('profile');

export default app; 