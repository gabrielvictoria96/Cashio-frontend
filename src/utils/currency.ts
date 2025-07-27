export const formatCurrency = (amount: number): string => {
  // Converte centavos para reais
  const valueInReais = amount / 100;
  
  return new Intl.NumberFormat('pt-BR', {
    style: 'currency',
    currency: 'BRL',
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  }).format(valueInReais);
};

export const formatPlanPrice = (plan: { price?: number; amount?: number } | number | undefined): string => {
  let price: number | undefined;
  
  if (typeof plan === 'number') {
    price = plan;
  } else if (plan && typeof plan === 'object') {
    price = plan.price ?? plan.amount;
  } else {
    price = undefined;
  }
  
  // Para preços de planos que já estão em reais
  if (price === undefined || price === null || isNaN(price)) {
    return 'R$ 0,00';
  }
  
  return new Intl.NumberFormat('pt-BR', {
    style: 'currency',
    currency: 'BRL',
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  }).format(price);
};

export const parseCurrency = (value: string): number => {
  if (!value || value.trim() === '') {
    return 0;
  }

  // Remove todos os caracteres não numéricos exceto vírgula, ponto e hífen
  let cleanValue = value.replace(/[^\d,.-]/g, '');
  
  // Se não há números, retorna 0
  if (!/\d/.test(cleanValue)) {
    return 0;
  }

  // Se há apenas um separador decimal, assume que é vírgula
  if (cleanValue.includes(',') && !cleanValue.includes('.')) {
    cleanValue = cleanValue.replace(',', '.');
  }
  
  // Se há vírgula e ponto, assume que vírgula é separador de milhares
  if (cleanValue.includes(',') && cleanValue.includes('.')) {
    cleanValue = cleanValue.replace(',', '');
  }

  // Converte para número
  const numberValue = parseFloat(cleanValue);
  
  return isNaN(numberValue) ? 0 : Math.max(0, numberValue);
}; 