import * as React from "react"
import { cn } from "../../lib/utils"

export interface CurrencyInputProps
  extends Omit<React.InputHTMLAttributes<HTMLInputElement>, 'onChange'> {
  value: number;
  onChange: (value: number) => void;
  placeholder?: string;
}

const CurrencyInput = React.forwardRef<HTMLInputElement, CurrencyInputProps>(
  ({ className, value, onChange, placeholder = "0,00", ...props }, ref) => {
    const [displayValue, setDisplayValue] = React.useState<string>('');
    const [isEditing, setIsEditing] = React.useState(false);

    const formatCurrency = (amount: number): string => {
      return new Intl.NumberFormat('pt-BR', {
        style: 'currency',
        currency: 'BRL',
        minimumFractionDigits: 2,
        maximumFractionDigits: 2,
      }).format(amount);
    };

    const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
      const inputValue = e.target.value;
      
      // Remove formatação existente para processar apenas números
      const cleanValue = inputValue.replace(/[^\d]/g, '');
      
      // Se não há números, limpa o campo
      if (cleanValue === '') {
        setDisplayValue('');
        onChange(0);
        return;
      }

      // Converte para número (em centavos)
      const numericValue = parseInt(cleanValue, 10);
      
      // Converte centavos para reais para formatação
      const valueInReais = numericValue / 100;
      
      // Formata em tempo real
      const formattedValue = formatCurrency(valueInReais);
      setDisplayValue(formattedValue);
      
      // Atualiza o valor em centavos
      onChange(numericValue);
    };

    const handleKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
      // Permite apenas: números, backspace, delete, tab, enter, setas
      const allowedKeys = [
        'Backspace', 'Delete', 'Tab', 'Enter', 'Escape',
        'ArrowLeft', 'ArrowRight', 'ArrowUp', 'ArrowDown',
        'Home', 'End'
      ];
      
      // Permite números (0-9)
      const isNumber = /^[0-9]$/.test(e.key);
      
      // Permite teclas de controle
      const isControlKey = allowedKeys.includes(e.key);
      
      // Permite Ctrl+A, Ctrl+C, Ctrl+V, Ctrl+X
      const isCtrlKey = (e.ctrlKey || e.metaKey) && ['a', 'c', 'v', 'x'].includes(e.key.toLowerCase());
      
      if (!isNumber && !isControlKey && !isCtrlKey) {
        e.preventDefault();
      }
    };

    const handleFocus = () => {
      setIsEditing(true);
      // Mostra o valor formatado quando foca
      if (value > 0) {
        setDisplayValue(formatCurrency(value / 100));
      }
    };

    const handleBlur = () => {
      setIsEditing(false);
      // Garante que o valor final está formatado
      if (value > 0) {
        setDisplayValue(formatCurrency(value / 100));
      }
    };

    const handlePaste = (e: React.ClipboardEvent<HTMLInputElement>) => {
      e.preventDefault();
      
      // Pega apenas números do texto colado
      const pastedText = e.clipboardData.getData('text');
      const numbersOnly = pastedText.replace(/\D/g, '');
      
      if (numbersOnly) {
        const numericValue = parseInt(numbersOnly, 10);
        const valueInReais = numericValue / 100;
        const formattedValue = formatCurrency(valueInReais);
        setDisplayValue(formattedValue);
        onChange(numericValue);
      }
    };

    return (
      <input
        className={cn(
          "flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background file:border-0 file:bg-transparent file:text-sm file:font-medium placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50",
          className
        )}
        ref={ref}
        value={displayValue}
        onChange={handleChange}
        onKeyDown={handleKeyDown}
        onFocus={handleFocus}
        onBlur={handleBlur}
        onPaste={handlePaste}
        placeholder={placeholder}
        {...props}
      />
    )
  }
)
CurrencyInput.displayName = "CurrencyInput"

export { CurrencyInput } 