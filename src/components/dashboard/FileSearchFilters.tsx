import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Search, X, Download, Loader2, Filter } from "lucide-react";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import { Calendar } from "@/components/ui/calendar";
import { format } from "date-fns";
import { ptBR } from "date-fns/locale";
import { CalendarIcon } from "lucide-react";
import { cn } from "@/lib/utils";

interface FileSearchFiltersProps {
  searchQuery: string;
  onSearchChange: (query: string) => void;
  typeFilter: string;
  onTypeFilterChange: (type: string) => void;
  dateFrom: Date | undefined;
  onDateFromChange: (date: Date | undefined) => void;
  dateTo: Date | undefined;
  onDateToChange: (date: Date | undefined) => void;
  onApplyFilters: () => void;
  onClearFilters: () => void;
  onExport: () => void;
  exporting: boolean;
  hasActiveFilters: boolean;
}

const FileSearchFilters = ({
  searchQuery,
  onSearchChange,
  typeFilter,
  onTypeFilterChange,
  dateFrom,
  onDateFromChange,
  dateTo,
  onDateToChange,
  onApplyFilters,
  onClearFilters,
  onExport,
  exporting,
  hasActiveFilters,
}: FileSearchFiltersProps) => {
  return (
    <div className="space-y-3 mb-6">
      {/* Search bar */}
      <div className="relative">
        <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
        <Input
          placeholder="Buscar por nome do arquivo..."
          value={searchQuery}
          onChange={(e) => onSearchChange(e.target.value)}
          className="pl-10"
        />
      </div>

      {/* Filters row */}
      <div className="flex flex-wrap items-center gap-2">
        {/* Date from */}
        <Popover>
          <PopoverTrigger asChild>
            <Button
              variant="outline"
              size="sm"
              className={cn(
                "text-xs gap-1.5 min-w-[140px] justify-start",
                !dateFrom && "text-muted-foreground"
              )}
            >
              <CalendarIcon className="w-3.5 h-3.5" />
              {dateFrom ? format(dateFrom, "dd/MM/yyyy", { locale: ptBR }) : "Data inicial"}
            </Button>
          </PopoverTrigger>
          <PopoverContent className="w-auto p-0" align="start">
            <Calendar
              mode="single"
              selected={dateFrom}
              onSelect={onDateFromChange}
              locale={ptBR}
              initialFocus
            />
          </PopoverContent>
        </Popover>

        {/* Date to */}
        <Popover>
          <PopoverTrigger asChild>
            <Button
              variant="outline"
              size="sm"
              className={cn(
                "text-xs gap-1.5 min-w-[140px] justify-start",
                !dateTo && "text-muted-foreground"
              )}
            >
              <CalendarIcon className="w-3.5 h-3.5" />
              {dateTo ? format(dateTo, "dd/MM/yyyy", { locale: ptBR }) : "Data final"}
            </Button>
          </PopoverTrigger>
          <PopoverContent className="w-auto p-0" align="start">
            <Calendar
              mode="single"
              selected={dateTo}
              onSelect={onDateToChange}
              locale={ptBR}
              initialFocus
            />
          </PopoverContent>
        </Popover>

        {/* Type filter */}
        <Select value={typeFilter} onValueChange={onTypeFilterChange}>
          <SelectTrigger className="w-[140px] h-9 text-xs">
            <SelectValue placeholder="Tipo" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">Todos os tipos</SelectItem>
            <SelectItem value=".jpg">.jpg</SelectItem>
            <SelectItem value=".jpeg">.jpeg</SelectItem>
            <SelectItem value=".png">.png</SelectItem>
            <SelectItem value=".gif">.gif</SelectItem>
            <SelectItem value=".webp">.webp</SelectItem>
            <SelectItem value=".svg">.svg</SelectItem>
            <SelectItem value=".txt">.txt</SelectItem>
          </SelectContent>
        </Select>

        {/* Apply */}
        <Button
          size="sm"
          className="text-xs gap-1.5"
          onClick={onApplyFilters}
        >
          <Filter className="w-3.5 h-3.5" />
          Aplicar
        </Button>

        {/* Clear filters */}
        {hasActiveFilters && (
          <Button
            variant="ghost"
            size="sm"
            className="text-xs gap-1"
            onClick={onClearFilters}
          >
            <X className="w-3.5 h-3.5" />
            Limpar
          </Button>
        )}

        {/* Export */}
        <div className="ml-auto">
          <Button
            variant="outline"
            size="sm"
            className="text-xs gap-1.5"
            onClick={onExport}
            disabled={exporting}
          >
            {exporting ? (
              <Loader2 className="w-3.5 h-3.5 animate-spin" />
            ) : (
              <Download className="w-3.5 h-3.5" />
            )}
            {exporting ? "Gerando Planilha..." : "Exportar Excel"}
          </Button>
        </div>
      </div>
    </div>
  );
};

export default FileSearchFilters;
