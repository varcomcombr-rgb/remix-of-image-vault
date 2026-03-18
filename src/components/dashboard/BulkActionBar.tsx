import { Button } from "@/components/ui/button";
import { Download, Trash2, X, Loader2 } from "lucide-react";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from "@/components/ui/alert-dialog";

interface BulkActionBarProps {
  count: number;
  onDownload: () => void;
  onDelete: () => void;
  onClear: () => void;
  downloading: boolean;
  deleting: boolean;
}

const BulkActionBar = ({ count, onDownload, onDelete, onClear, downloading, deleting }: BulkActionBarProps) => {
  if (count === 0) return null;

  return (
    <div className="fixed bottom-6 left-1/2 -translate-x-1/2 z-50 flex items-center gap-2 sm:gap-3 bg-card border shadow-lg rounded-full px-4 sm:px-6 py-3">
      <span className="text-sm font-medium text-foreground whitespace-nowrap">
        {count} selecionado{count > 1 ? "s" : ""}
      </span>

      <Button size="sm" variant="outline" className="text-xs gap-1.5" onClick={onDownload} disabled={downloading}>
        {downloading ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <Download className="w-3.5 h-3.5" />}
        <span className="hidden sm:inline">Baixar</span>
      </Button>

      <AlertDialog>
        <AlertDialogTrigger asChild>
          <Button size="sm" variant="destructive" className="text-xs gap-1.5" disabled={deleting}>
            {deleting ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <Trash2 className="w-3.5 h-3.5" />}
            <span className="hidden sm:inline">Excluir</span>
          </Button>
        </AlertDialogTrigger>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Confirmar exclusão</AlertDialogTitle>
            <AlertDialogDescription>
              Tem certeza que deseja excluir {count} arquivo{count > 1 ? "s" : ""}? Esta ação não pode ser desfeita.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancelar</AlertDialogCancel>
            <AlertDialogAction onClick={onDelete} className="bg-destructive text-destructive-foreground hover:bg-destructive/90">
              Excluir
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      <Button size="sm" variant="ghost" className="text-xs px-2" onClick={onClear}>
        <X className="w-3.5 h-3.5" />
      </Button>
    </div>
  );
};

export default BulkActionBar;
