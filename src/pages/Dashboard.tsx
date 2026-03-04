import { useState, useCallback, useMemo } from "react";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import {
  ImageIcon,
  FolderOpen,
  LayoutGrid,
  List,
  Loader2,
  Upload,
} from "lucide-react";
import DashboardHeader from "@/components/dashboard/DashboardHeader";
import FileGridView from "@/components/dashboard/FileGridView";
import FileListView from "@/components/dashboard/FileListView";
import FilePreviewModal from "@/components/dashboard/FilePreviewModal";
import FileSearchFilters from "@/components/dashboard/FileSearchFilters";
import { ToggleGroup, ToggleGroupItem } from "@/components/ui/toggle-group";

const BUCKET = "varcom";
const FOLDER = "Imagem";
const BASE_URL = `https://wdcqjsfsdaddgsbrnrnn.supabase.co/storage/v1/object/public/${BUCKET}/${FOLDER}`;

interface FileItem {
  name: string;
  url: string;
  updated_at: string;
  size?: number;
}

interface DashboardProps {
  onLogout: () => void;
}

const Dashboard = ({ onLogout }: DashboardProps) => {
  const [files, setFiles] = useState<FileItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [uploading, setUploading] = useState(false);
  const [dragOver, setDragOver] = useState(false);
  const [viewMode, setViewMode] = useState<string>("grid");
  const [previewFile, setPreviewFile] = useState<FileItem | null>(null);

  // Filters
  const [searchQuery, setSearchQuery] = useState("");
  const [typeFilter, setTypeFilter] = useState("all");
  const [dateFrom, setDateFrom] = useState<Date | undefined>();
  const [dateTo, setDateTo] = useState<Date | undefined>();
  const [exporting, setExporting] = useState(false);

  const getPublicUrl = (fileName: string) => `${BASE_URL}/${fileName}`;

  const fetchFiles = useCallback(async () => {
    setLoading(true);
    const { data, error } = await supabase.storage
      .from(BUCKET)
      .list(FOLDER, { sortBy: { column: "name", order: "asc" } });

    if (error) {
      toast.error("Erro ao carregar arquivos");
      setLoading(false);
      return;
    }

    const items: FileItem[] = (data || [])
      .filter((f) => f.name && f.id)
      .map((f) => ({
        name: f.name,
        url: getPublicUrl(f.name),
        updated_at: f.updated_at || "",
        size: (f.metadata as any)?.size || 0,
      }));

    setFiles(items);
    setLoading(false);
  }, []);

  useState(() => {
    fetchFiles();
  });

  const filteredFiles = useMemo(() => {
    let result = files;

    if (searchQuery.trim()) {
      const q = searchQuery.toLowerCase();
      result = result.filter((f) => f.name.toLowerCase().includes(q));
    }

    if (typeFilter !== "all") {
      result = result.filter((f) => f.name.toLowerCase().endsWith(typeFilter));
    }

    if (dateFrom) {
      const from = new Date(dateFrom);
      from.setHours(0, 0, 0, 0);
      result = result.filter((f) => f.updated_at && new Date(f.updated_at) >= from);
    }

    if (dateTo) {
      const to = new Date(dateTo);
      to.setHours(23, 59, 59, 999);
      result = result.filter((f) => f.updated_at && new Date(f.updated_at) <= to);
    }

    return result;
  }, [files, searchQuery, typeFilter, dateFrom, dateTo]);

  const hasActiveFilters = searchQuery !== "" || typeFilter !== "all" || !!dateFrom || !!dateTo;

  const clearFilters = () => {
    setSearchQuery("");
    setTypeFilter("all");
    setDateFrom(undefined);
    setDateTo(undefined);
  };

  const exportCSV = async () => {
    setExporting(true);
    try {
      const getExt = (name: string) => {
        const i = name.lastIndexOf(".");
        return i >= 0 ? name.substring(i) : "";
      };

      const formatSize = (bytes: number) => {
        if (!bytes) return "N/A";
        if (bytes < 1024) return `${bytes} B`;
        if (bytes < 1048576) return `${(bytes / 1024).toFixed(1)} KB`;
        return `${(bytes / 1048576).toFixed(2)} MB`;
      };

      const headers = ["Nome do Arquivo", "Tamanho", "Tipo", "Data de Criação", "URL Pública"];
      const rows = filteredFiles.map((f) => [
        f.name,
        formatSize(f.size || 0),
        getExt(f.name) || "N/A",
        f.updated_at ? new Date(f.updated_at).toLocaleDateString("pt-BR") : "N/A",
        `${BASE_URL}/${f.name}`,
      ]);

      const csvContent = [headers, ...rows]
        .map((row) => row.map((cell) => `"${cell}"`).join(","))
        .join("\n");

      const BOM = "\uFEFF";
      const blob = new Blob([BOM + csvContent], { type: "text/csv;charset=utf-8;" });
      const url = URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = url;
      a.download = `varcom-relatorio-${new Date().toISOString().slice(0, 10)}.csv`;
      a.click();
      URL.revokeObjectURL(url);
      toast.success("Relatório exportado com sucesso!");
    } catch {
      toast.error("Erro ao exportar relatório");
    }
    setExporting(false);
  };

  const uploadFiles = async (fileList: FileList | File[]) => {
    setUploading(true);
    const filesToUpload = Array.from(fileList);

    for (const file of filesToUpload) {
      const filePath = `${FOLDER}/${file.name}`;
      const { error } = await supabase.storage
        .from(BUCKET)
        .upload(filePath, file, { upsert: true });

      if (error) {
        toast.error(`Erro ao enviar ${file.name}: ${error.message}`);
      } else {
        toast.success(`${file.name} enviado com sucesso!`);
      }
    }

    setUploading(false);
    fetchFiles();
  };

  const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files.length > 0) {
      uploadFiles(e.target.files);
    }
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    setDragOver(false);
    if (e.dataTransfer.files.length > 0) {
      uploadFiles(e.dataTransfer.files);
    }
  };

  const handleDelete = async (fileName: string) => {
    const { error } = await supabase.storage
      .from(BUCKET)
      .remove([`${FOLDER}/${fileName}`]);

    if (error) {
      toast.error(`Erro ao excluir ${fileName}`);
    } else {
      toast.success(`${fileName} excluído`);
      fetchFiles();
    }
  };

  const copyUrl = (url: string) => {
    navigator.clipboard.writeText(url);
    toast.success("URL copiada!");
  };

  const handleLogout = async () => {
    await supabase.auth.signOut();
    onLogout();
  };

  return (
    <div className="min-h-screen bg-background">
      <DashboardHeader onLogout={handleLogout} />

      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Upload Zone */}
        <div
          className={`border-2 border-dashed rounded-xl p-8 text-center transition-all cursor-pointer mb-8 ${
            dragOver
              ? "dropzone-active"
              : "border-border hover:border-muted-foreground/40"
          }`}
          onDragOver={(e) => {
            e.preventDefault();
            setDragOver(true);
          }}
          onDragLeave={() => setDragOver(false)}
          onDrop={handleDrop}
          onClick={() => document.getElementById("file-input")?.click()}
        >
          <input
            id="file-input"
            type="file"
            multiple
            accept="image/*"
            className="hidden"
            onChange={handleFileSelect}
          />
          {uploading ? (
            <div className="flex flex-col items-center gap-2">
              <Loader2 className="w-8 h-8 text-primary animate-spin" />
              <p className="text-sm text-muted-foreground">Enviando...</p>
            </div>
          ) : (
            <div className="flex flex-col items-center gap-2">
              <Upload className="w-8 h-8 text-muted-foreground" />
              <p className="text-sm text-foreground font-medium">
                Arraste imagens aqui ou clique para selecionar
              </p>
              <p className="text-xs text-muted-foreground">
                Arquivos com o mesmo nome serão sobrescritos automaticamente
              </p>
            </div>
          )}
        </div>

        {/* Search & Filters */}
        <FileSearchFilters
          searchQuery={searchQuery}
          onSearchChange={setSearchQuery}
          typeFilter={typeFilter}
          onTypeFilterChange={setTypeFilter}
          dateFrom={dateFrom}
          onDateFromChange={setDateFrom}
          dateTo={dateTo}
          onDateToChange={setDateTo}
          onClearFilters={clearFilters}
          onExport={exportCSV}
          exporting={exporting}
          hasActiveFilters={hasActiveFilters}
        />

        {/* File Section Header */}
        <div className="flex items-center justify-between mb-4">
          <div className="flex items-center gap-2">
            <FolderOpen className="w-5 h-5 text-primary" />
            <h2 className="text-lg font-semibold">
              Arquivos{" "}
              <span className="text-muted-foreground font-normal text-sm">
                ({filteredFiles.length})
              </span>
            </h2>
          </div>
          <ToggleGroup
            type="single"
            value={viewMode}
            onValueChange={(v) => v && setViewMode(v)}
            size="sm"
          >
            <ToggleGroupItem value="grid" aria-label="Grade">
              <LayoutGrid className="w-4 h-4" />
            </ToggleGroupItem>
            <ToggleGroupItem value="list" aria-label="Lista">
              <List className="w-4 h-4" />
            </ToggleGroupItem>
          </ToggleGroup>
        </div>

        {loading ? (
          <div className="flex justify-center py-16">
            <Loader2 className="w-6 h-6 text-primary animate-spin" />
          </div>
        ) : filteredFiles.length === 0 ? (
          <div className="text-center py-16 text-muted-foreground">
            <ImageIcon className="w-12 h-12 mx-auto mb-3 opacity-30" />
            <p>{hasActiveFilters ? "Nenhum arquivo corresponde aos filtros" : "Nenhuma imagem encontrada"}</p>
          </div>
        ) : viewMode === "grid" ? (
          <FileGridView
            files={filteredFiles}
            onCopy={copyUrl}
            onDelete={handleDelete}
            onPreview={setPreviewFile}
          />
        ) : (
          <FileListView
            files={filteredFiles}
            onCopy={copyUrl}
            onDelete={handleDelete}
            onPreview={setPreviewFile}
          />
        )}
      </main>

      <FilePreviewModal
        open={!!previewFile}
        onOpenChange={(open) => !open && setPreviewFile(null)}
        fileName={previewFile?.name || ""}
        fileUrl={previewFile?.url || ""}
      />
    </div>
  );
};

export default Dashboard;
