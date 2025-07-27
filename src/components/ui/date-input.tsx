import * as React from "react"
import { cn } from "../../lib/utils"

export interface DateInputProps
  extends Omit<React.InputHTMLAttributes<HTMLInputElement>, 'onChange' | 'value'> {
  value: string;
  onChange: (value: string) => void;
  placeholder?: string;
  outputFormat?: 'dd/mm/aaaa' | 'iso';
}

const DateInput = React.forwardRef<HTMLInputElement, DateInputProps>(
  ({ className, value, onChange, placeholder = "dd/mm/aaaa", outputFormat = 'iso', ...props }, ref) => {
    const [displayValue, setDisplayValue] = React.useState<string>('');
    const [isEditing, setIsEditing] = React.useState(false);

    // Converte formato dd/mm/aaaa para ISO
    const convertToISO = (dateStr: string): string => {
      if (!dateStr || dateStr.length !== 10) return '';
      
      const parts = dateStr.split('/');
      if (parts.length !== 3) return '';
      
      const day = parts[0].padStart(2, '0');
      const month = parts[1].padStart(2, '0');
      const year = parts[2];
      
      return `${year}-${month}-${day}`;
    };

    // Converte formato ISO para dd/mm/aaaa
    const convertFromISO = (isoDate: string): string => {
      if (!isoDate) return '';
      
      // Se já está no formato dd/mm/aaaa, retorna como está
      if (isoDate.includes('/')) {
        return isoDate;
      }
      
      // Se está no formato ISO (YYYY-MM-DD)
      if (isoDate.includes('-')) {
        const parts = isoDate.split('-');
        if (parts.length === 3) {
          const year = parts[0];
          const month = parts[1];
          const day = parts[2];
          return `${day}/${month}/${year}`;
        }
      }
      
      return '';
    };

    // Atualiza o displayValue apenas quando não está editando
    React.useEffect(() => {
      if (!isEditing) {
        if (value) {
          // Se o valor está em formato ISO, converte para display
          if (value.includes('-')) {
            setDisplayValue(convertFromISO(value));
          } else {
            setDisplayValue(value);
          }
        } else {
          setDisplayValue('');
        }
      }
    }, [value, isEditing]);

    const formatDate = (input: string): string => {
      // Remove todos os caracteres não numéricos
      const numbersOnly = input.replace(/\D/g, '');
      
      // Aplica a máscara dd/mm/aaaa
      if (numbersOnly.length <= 2) {
        return numbersOnly;
      } else if (numbersOnly.length <= 4) {
        return `${numbersOnly.slice(0, 2)}/${numbersOnly.slice(2)}`;
      } else {
        return `${numbersOnly.slice(0, 2)}/${numbersOnly.slice(2, 4)}/${numbersOnly.slice(4, 8)}`;
      }
    };

    const validateDate = (dateStr: string): boolean => {
      if (!dateStr || dateStr.length < 10) return false;
      
      const parts = dateStr.split('/');
      if (parts.length !== 3) return false;
      
      const day = parseInt(parts[0], 10);
      const month = parseInt(parts[1], 10);
      const year = parseInt(parts[2], 10);
      
      // Validações básicas
      if (day < 1 || day > 31) return false;
      if (month < 1 || month > 12) return false;
      if (year < 1900 || year > 2100) return false;
      
      // Validação de meses com 30 dias
      const monthsWith30Days = [4, 6, 9, 11];
      if (monthsWith30Days.includes(month) && day > 30) return false;
      
      // Validação de fevereiro
      if (month === 2) {
        const isLeapYear = (year % 4 === 0 && year % 100 !== 0) || (year % 400 === 0);
        if (isLeapYear && day > 29) return false;
        if (!isLeapYear && day > 28) return false;
      }
      
      return true;
    };

    const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
      const inputValue = e.target.value;
      
      // Se o usuário está apagando, permite
      if (inputValue.length < displayValue.length) {
        setDisplayValue(inputValue);
        // Converte para o formato de saída se necessário
        if (outputFormat === 'iso' && inputValue.length === 10 && validateDate(inputValue)) {
          onChange(convertToISO(inputValue));
        } else {
          onChange(inputValue);
        }
        return;
      }
      
      // Formata a data conforme digita
      const formattedValue = formatDate(inputValue);
      setDisplayValue(formattedValue);
      
      // Converte para o formato de saída se a data estiver completa e válida
      if (formattedValue.length === 10 && validateDate(formattedValue)) {
        if (outputFormat === 'iso') {
          onChange(convertToISO(formattedValue));
        } else {
          onChange(formattedValue);
        }
      } else {
        onChange(formattedValue);
      }
    };

    const handleKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
      // Permite apenas: números, backspace, delete, tab, enter, setas, /
      const allowedKeys = [
        'Backspace', 'Delete', 'Tab', 'Enter', 'Escape',
        'ArrowLeft', 'ArrowRight', 'ArrowUp', 'ArrowDown',
        'Home', 'End', '/'
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
    };

    const handleBlur = () => {
      setIsEditing(false);
      // Valida a data final
      if (displayValue && displayValue.length === 10) {
        if (!validateDate(displayValue)) {
          // Se a data não é válida, limpa o campo
          setDisplayValue('');
          onChange('');
        } else if (outputFormat === 'iso') {
          // Converte para ISO se necessário
          onChange(convertToISO(displayValue));
        }
      }
    };

    const handlePaste = (e: React.ClipboardEvent<HTMLInputElement>) => {
      e.preventDefault();
      
      // Pega o texto colado
      const pastedText = e.clipboardData.getData('text');
      
      // Remove caracteres não numéricos
      const numbersOnly = pastedText.replace(/\D/g, '');
      
      if (numbersOnly) {
        const formattedValue = formatDate(numbersOnly);
        setDisplayValue(formattedValue);
        
        if (formattedValue.length === 10 && validateDate(formattedValue)) {
          if (outputFormat === 'iso') {
            onChange(convertToISO(formattedValue));
          } else {
            onChange(formattedValue);
          }
        } else {
          onChange(formattedValue);
        }
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
        maxLength={10}
        {...props}
      />
    )
  }
)
DateInput.displayName = "DateInput"

export { DateInput } 