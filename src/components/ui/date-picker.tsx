import * as React from "react"
import { cn } from "../../lib/utils"
import { Button } from "./button"
import { Calendar, ChevronLeft, ChevronRight } from "lucide-react"

export interface DatePickerProps {
  value: string;
  onChange: (value: string) => void;
  placeholder?: string;
  outputFormat?: 'dd/mm/aaaa' | 'iso';
  disabled?: boolean;
  className?: string;
}

const DatePicker = React.forwardRef<HTMLButtonElement, DatePickerProps>(
  ({ value, onChange, placeholder = "Selecione uma data", outputFormat = 'iso', disabled, className }, ref) => {
    const [isOpen, setIsOpen] = React.useState(false);
    const [currentDate, setCurrentDate] = React.useState(new Date());
    const [selectedDate, setSelectedDate] = React.useState<Date | null>(null);
    const containerRef = React.useRef<HTMLDivElement>(null);

    // Converte formato dd/mm/aaaa para Date
    const parseDate = (dateStr: string): Date | null => {
      if (!dateStr) return null;
      
      if (dateStr.includes('/')) {
        const parts = dateStr.split('/');
        if (parts.length === 3) {
          const day = parseInt(parts[0], 10);
          const month = parseInt(parts[1], 10) - 1; // Mês começa em 0
          const year = parseInt(parts[2], 10);
          return new Date(year, month, day);
        }
      } else if (dateStr.includes('-')) {
        return new Date(dateStr);
      }
      
      return null;
    };

    // Converte Date para string no formato desejado
    const formatDate = (date: Date): string => {
      if (outputFormat === 'iso') {
        return date.toISOString().split('T')[0]; // YYYY-MM-DD
      } else {
        const day = date.getDate().toString().padStart(2, '0');
        const month = (date.getMonth() + 1).toString().padStart(2, '0');
        const year = date.getFullYear();
        return `${day}/${month}/${year}`;
      }
    };

    // Inicializar data selecionada
    React.useEffect(() => {
      if (value) {
        const parsed = parseDate(value);
        if (parsed) {
          setSelectedDate(parsed);
          setCurrentDate(parsed);
        }
      } else {
        setSelectedDate(null);
      }
    }, [value]);

    // Fechar calendário quando clicar fora
    React.useEffect(() => {
      const handleClickOutside = (event: MouseEvent) => {
        if (containerRef.current && !containerRef.current.contains(event.target as Node)) {
          setIsOpen(false);
        }
      };

      if (isOpen) {
        document.addEventListener('mousedown', handleClickOutside);
        return () => {
          document.removeEventListener('mousedown', handleClickOutside);
        };
      }
    }, [isOpen]);

    const handleDateSelect = (date: Date) => {
      setSelectedDate(date);
      onChange(formatDate(date));
      setIsOpen(false);
    };

    const handlePreviousMonth = () => {
      setCurrentDate(prev => {
        const newDate = new Date(prev);
        newDate.setMonth(prev.getMonth() - 1);
        return newDate;
      });
    };

    const handleNextMonth = () => {
      setCurrentDate(prev => {
        const newDate = new Date(prev);
        newDate.setMonth(prev.getMonth() + 1);
        return newDate;
      });
    };

    const getDaysInMonth = (date: Date) => {
      const year = date.getFullYear();
      const month = date.getMonth();
      const firstDay = new Date(year, month, 1);
      const lastDay = new Date(year, month + 1, 0);
      const daysInMonth = lastDay.getDate();
      const firstDayOfWeek = firstDay.getDay();
      
      return { daysInMonth, firstDayOfWeek };
    };

    const generateCalendarDays = () => {
      const { daysInMonth, firstDayOfWeek } = getDaysInMonth(currentDate);
      const days = [];
      
      // Adicionar dias vazios no início
      for (let i = 0; i < firstDayOfWeek; i++) {
        days.push(null);
      }
      
      // Adicionar dias do mês
      for (let day = 1; day <= daysInMonth; day++) {
        const date = new Date(currentDate.getFullYear(), currentDate.getMonth(), day);
        days.push(date);
      }
      
      return days;
    };

    const isToday = (date: Date) => {
      const today = new Date();
      return date.toDateString() === today.toDateString();
    };

    const isSelected = (date: Date) => {
      return selectedDate && date.toDateString() === selectedDate.toDateString();
    };

    const isSameMonth = (date: Date) => {
      return date.getMonth() === currentDate.getMonth() && 
             date.getFullYear() === currentDate.getFullYear();
    };

    const getMonthName = (date: Date) => {
      const months = [
        'Janeiro', 'Fevereiro', 'Março', 'Abril', 'Maio', 'Junho',
        'Julho', 'Agosto', 'Setembro', 'Outubro', 'Novembro', 'Dezembro'
      ];
      return months[date.getMonth()];
    };

    const displayValue = selectedDate ? formatDate(selectedDate) : '';

    return (
      <div className="relative" ref={containerRef}>
        <Button
          ref={ref}
          type="button"
          variant="outline"
          className={cn(
            "w-full justify-start text-left font-normal",
            !displayValue && "text-muted-foreground",
            className
          )}
          disabled={disabled}
          onClick={() => setIsOpen(!isOpen)}
        >
          <Calendar className="mr-2 h-4 w-4" />
          {displayValue || placeholder}
        </Button>
        
        {isOpen && (
          <div className="absolute top-full left-0 mt-1 z-50 bg-popover border border-border rounded-md shadow-lg p-3 min-w-[280px]">
            {/* Header do calendário */}
            <div className="flex items-center justify-between mb-4">
              <Button
                type="button"
                variant="ghost"
                size="sm"
                onClick={handlePreviousMonth}
                className="h-8 w-8 p-0"
              >
                <ChevronLeft className="h-4 w-4" />
              </Button>
              
              <div className="text-sm font-medium">
                {getMonthName(currentDate)} {currentDate.getFullYear()}
              </div>
              
              <Button
                type="button"
                variant="ghost"
                size="sm"
                onClick={handleNextMonth}
                className="h-8 w-8 p-0"
              >
                <ChevronRight className="h-4 w-4" />
              </Button>
            </div>

            {/* Dias da semana */}
            <div className="grid grid-cols-7 gap-1 mb-2">
              {['Dom', 'Seg', 'Ter', 'Qua', 'Qui', 'Sex', 'Sáb'].map(day => (
                <div key={day} className="text-center text-xs font-medium text-muted-foreground h-8 flex items-center justify-center">
                  {day}
                </div>
              ))}
            </div>

            {/* Dias do mês */}
            <div className="grid grid-cols-7 gap-1">
              {generateCalendarDays().map((date, index) => {
                if (!date) {
                  return <div key={`empty-${index}`} className="h-8" />;
                }

                return (
                  <Button
                    key={date.toISOString()}
                    type="button"
                    variant="ghost"
                    size="sm"
                    className={cn(
                      "h-8 w-8 p-0 text-xs",
                      !isSameMonth(date) && "text-muted-foreground opacity-50",
                      isToday(date) && "bg-primary text-primary-foreground hover:bg-primary/90",
                      isSelected(date) && !isToday(date) && "bg-secondary text-secondary-foreground hover:bg-secondary/90",
                      !isSelected(date) && !isToday(date) && "hover:bg-accent hover:text-accent-foreground"
                    )}
                    onClick={() => handleDateSelect(date)}
                  >
                    {date.getDate()}
                  </Button>
                );
              })}
            </div>
          </div>
        )}
      </div>
    );
  }
);

DatePicker.displayName = "DatePicker";

export { DatePicker }; 