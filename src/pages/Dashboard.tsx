import { useState, useCallback, useMemo, useEffect, useRef } from "react";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import JSZip from "jszip";
import * as XLSX from "xlsx";
import {
  ImageIcon,
  FolderOpen,
  LayoutGrid,
  List,
  Loader2,
  Upload,
} from "lucide-react";
import { Checkbox } from "@/components/ui/checkbox";
import DashboardHeader from "@/components/dashboard/DashboardHeader";
import FileGridView from "@/components/dashboard/FileGridView";
import FileListView from "@/components/dashboard/FileListView";
import FilePreviewModal from "@/components/dashboard/FilePreviewModal";
import FileSearchFilters from "@/components/dashboard/FileSearchFilters";
import BulkActionBar from "@/components/dashboard/BulkActionBar";
import { ToggleGroup, ToggleGroupItem } from "@/components/ui/toggle-group";
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";

const BUCKET = "varcom";

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
  const [user, setUser] = useState<any>(null);
  const [files, setFiles] = useState<FileItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [uploading, setUploading] = useState(false);
  const [dragOver, setDragOver] = useState(false);
  const [viewMode, setViewMode] = useState<string>("grid");
  const [previewFile, setPreviewFile] = useState<FileItem | null>(null);
  const [selectedFiles, setSelectedFiles] = useState<Set<string>>(new Set());
  const [bulkDownloading, setBulkDownloading] = useState(false);
  const [bulkDeleting, setBulkDeleting] = useState(false);

  const [searchQuery, setSearchQuery] = useState("");
  const [typeFilter, setTypeFilter] = useState("all");
  const [dateFrom, setDateFrom] = useState<Date | undefined>();
  const [dateTo, setDateTo] = useState<Date | undefined>();

  const [appliedSearch, setAppliedSearch] = useState("");
  const [appliedType, setAppliedType] = useState("all");
  const [appliedDateFrom, setAppliedDateFrom] = useState<Date | undefined>();
  const [appliedDateTo, setAppliedDateTo] = useState<Date | undefined>();

  const [exporting, setExporting] = useState(false);
  const [visibleCount, setVisibleCount] = useState(50);

  // Upload Management State
  type UploadStatus = "IDLE" | "UPLOADING" | "PAUSED_DUPLICATE" | "FINISHED" | "CANCELLED";
  const [uploadStatus, setUploadStatus] = useState<UploadStatus>("IDLE");
  const [uploadQueue, setUploadQueue] = useState<File[]>([]);
  const [uploadCurrentIndex, setUploadCurrentIndex] = useState(0);
  const [uploadProgress, setUploadProgress] = useState(0);
  const [duplicateFile, setDuplicateFile] = useState<File | null>(null);

  const abortControllerRef = useRef<AbortController | null>(null);
  const duplicateResolverRef = useRef<((choice: 'copy' | 'skip') => void) | null>(null);

  const folderPath = user?.id;

  useEffect(() => {
    supabase.auth.getUser().then(({ data }) => setUser(data.user));
    const { data: { subscription } } = supabase.auth.onAuthStateChange((_event, session) => {
      setUser(session?.user ?? null);
    });
    return () => subscription.unsubscribe();
  }, []);

  const getPublicUrl = useCallback((fileName: string) => {
    if (!folderPath) return "";
    return `${import.meta.env.VITE_SUPABASE_URL}/storage/v1/object/public/${BUCKET}/${folderPath}/${fileName}`;
  }, [folderPath]);

  const fetchFiles = useCallback(async () => {
    if (!folderPath) return;
    setLoading(true);
    let allData: any[] = [];
    let offset = 0;
    const limit = 100;
    let hasMore = true;

    while (hasMore) {
      const { data, error } = await supabase.storage
        .from(BUCKET)
        .list(folderPath, {
          sortBy: { column: "name", order: "asc" },
          limit,
          offset
        });

      if (error) {
        toast.error("Erro ao carregar arquivos");
        setLoading(false);
        return;
      }

      if (data) {
        allData = [...allData, ...data];
      }

      if (!data || data.length < limit) {
        hasMore = false;
      } else {
        offset += limit;
      }
    }

    const items: FileItem[] = allData
      .filter((f) => f.name && f.id)
      .map((f) => ({
        name: f.name,
        url: getPublicUrl(f.name),
        updated_at: f.updated_at || "",
        size: (f.metadata as any)?.size || 0,
      }));

    setFiles(items);
    setLoading(false);
  }, [folderPath, getPublicUrl]);

  useEffect(() => {
    fetchFiles();
  }, [fetchFiles]);

  const totalFiles = files.length;
  const totalSize = useMemo(() => files.reduce((sum, f) => sum + (f.size || 0), 0), [files]);

  const filteredFiles = useMemo(() => {
    let result = files;
    if (appliedSearch.trim()) {
      const q = appliedSearch.toLowerCase();
      result = result.filter((f) => f.name.toLowerCase().includes(q));
    }
    if (appliedType !== "all") {
      result = result.filter((f) => f.name.toLowerCase().endsWith(appliedType));
    }
    if (appliedDateFrom) {
      const from = new Date(appliedDateFrom);
      from.setHours(0, 0, 0, 0);
      result = result.filter((f) => f.updated_at && new Date(f.updated_at) >= from);
    }
    if (appliedDateTo) {
      const to = new Date(appliedDateTo);
      to.setHours(23, 59, 59, 999);
      result = result.filter((f) => f.updated_at && new Date(f.updated_at) <= to);
    }
    return result;
  }, [files, appliedSearch, appliedType, appliedDateFrom, appliedDateTo]);

  const hasActiveFilters = searchQuery !== "" || typeFilter !== "all" || !!dateFrom || !!dateTo;

  const applyFilters = () => {
    setAppliedSearch(searchQuery);
    setAppliedType(typeFilter);
    setAppliedDateFrom(dateFrom);
    setAppliedDateTo(dateTo);
    setVisibleCount(50);
  };

  const clearFilters = () => {
    setSearchQuery("");
    setTypeFilter("all");
    setDateFrom(undefined);
    setDateTo(undefined);
    setAppliedSearch("");
    setAppliedType("all");
    setAppliedDateFrom(undefined);
    setAppliedDateTo(undefined);
    setVisibleCount(50);
  };

  // Selection logic
  const toggleSelect = (name: string) => {
    setSelectedFiles((prev) => {
      const next = new Set(prev);
      if (next.has(name)) next.delete(name);
      else next.add(name);
      return next;
    });
  };

  const toggleSelectAll = () => {
    if (selectedFiles.size === filteredFiles.length) {
      setSelectedFiles(new Set());
    } else {
      setSelectedFiles(new Set(filteredFiles.map((f) => f.name)));
    }
  };

  const clearSelection = () => setSelectedFiles(new Set());

  // Bulk download
  const bulkDownload = async () => {
    const selected = filteredFiles.filter((f) => selectedFiles.has(f.name));
    if (selected.length === 0) return;

    setBulkDownloading(true);
    try {
      if (selected.length === 1) {
        const link = document.createElement("a");
        link.href = selected[0].url;
        link.download = selected[0].name;
        link.target = "_blank";
        link.click();
      } else {
        const zip = new JSZip();
        await Promise.all(
          selected.map(async (file) => {
            const res = await fetch(file.url);
            const blob = await res.blob();
            zip.file(file.name, blob);
          })
        );
        const content = await zip.generateAsync({ type: "blob" });
        const link = document.createElement("a");
        link.href = URL.createObjectURL(content);
        link.download = `varcom-${new Date().toISOString().slice(0, 10)}.zip`;
        link.click();
        URL.revokeObjectURL(link.href);
      }
      toast.success("Download iniciado!");
    } catch {
      toast.error("Erro ao baixar arquivos");
    }
    setBulkDownloading(false);
  };

  // Bulk delete
  const bulkDelete = async () => {
    if (!folderPath) return;
    const names = Array.from(selectedFiles);
    if (names.length === 0) return;

    setBulkDeleting(true);
    const paths = names.map((n) => `${folderPath}/${n}`);
    const { error } = await supabase.storage.from(BUCKET).remove(paths);

    if (error) {
      toast.error("Erro ao excluir arquivos");
    } else {
      toast.success(`${names.length} arquivo(s) excluído(s)`);
      setSelectedFiles(new Set());
      fetchFiles();
    }
    setBulkDeleting(false);
  };

  const exportXLSX = async () => {
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
      const rows = filteredFiles.map((f) => ({
        "Nome do Arquivo": f.name,
        "Tamanho": formatSize(f.size || 0),
        "Tipo": getExt(f.name) || "N/A",
        "Data de Criação": f.updated_at ? new Date(f.updated_at).toLocaleDateString("pt-BR") : "N/A",
        "URL Pública": getPublicUrl(f.name),
      }));
      const ws = XLSX.utils.json_to_sheet(rows);
      const wb = XLSX.utils.book_new();
      XLSX.utils.book_append_sheet(wb, ws, "Relatório");
      XLSX.writeFile(wb, `varcom-relatorio-${new Date().toISOString().slice(0, 10)}.xlsx`);
      toast.success("Planilha exportada com sucesso!");
    } catch {
      toast.error("Erro ao exportar planilha");
    }
    setExporting(false);
  };

  const startUploadBatch = async (fileList: FileList | File[]) => {
    if (!folderPath) return;
    const items = Array.from(fileList);
    if (items.length === 0) return;

    setUploadQueue(items);
    setUploadCurrentIndex(0);
    setUploadProgress(0);
    setUploadStatus("UPLOADING");

    const abortController = new AbortController();
    abortControllerRef.current = abortController;

    const { data: { session } } = await supabase.auth.getSession();
    const token = session?.access_token;
    if (!token) {
      toast.error("Sessão inválida. Faça login novamente.");
      setUploadStatus("IDLE");
      return;
    }

    let currentIndex = 0;

    for (let file of items) {
      if (abortController.signal.aborted) break;

      setUploadCurrentIndex(currentIndex);
      setUploadProgress(0);

      // Duplicate Check
      if (files.some(f => f.name === file.name)) {
        setUploadStatus("PAUSED_DUPLICATE");
        setDuplicateFile(file);

        const choice = await new Promise<'copy' | 'skip'>((resolve) => {
          duplicateResolverRef.current = resolve;
        });

        duplicateResolverRef.current = null;
        setDuplicateFile(null);

        if (abortController.signal.aborted) break;

        if (choice === 'skip') {
          currentIndex++;
          setUploadStatus("UPLOADING");
          continue;
        } else {
          const extIndex = file.name.lastIndexOf(".");
          const nameWithoutExt = extIndex >= 0 ? file.name.substring(0, extIndex) : file.name;
          const ext = extIndex >= 0 ? file.name.substring(extIndex) : "";
          const newName = `${nameWithoutExt}_copia_${Date.now()}${ext}`;
          file = new File([file], newName, { type: file.type });
        }

        setUploadStatus("UPLOADING");
      }

      if (abortController.signal.aborted) break;

      // Real XHR Upload
      try {
        await new Promise<void>((resolve, reject) => {
          const xhr = new XMLHttpRequest();
          const url = `${import.meta.env.VITE_SUPABASE_URL}/storage/v1/object/${BUCKET}/${folderPath}/${file.name}`;
          xhr.open("POST", url);
          xhr.setRequestHeader("Authorization", `Bearer ${token}`);
          xhr.setRequestHeader("apikey", import.meta.env.VITE_SUPABASE_PUBLISHABLE_KEY);
          xhr.setRequestHeader("Content-Type", file.type || "application/octet-stream");

          xhr.upload.onprogress = (e) => {
            if (e.lengthComputable) {
              setUploadProgress(Math.round((e.loaded / e.total) * 100));
            }
          };

          xhr.onload = () => {
            if (xhr.status >= 200 && xhr.status < 300) resolve();
            else reject(new Error(`HTTP ${xhr.status}: ${xhr.responseText}`));
          };
          xhr.onerror = () => reject(new Error("Erro de rede"));
          xhr.onabort = () => reject(new Error("Aborted"));

          abortController.signal.addEventListener('abort', () => xhr.abort());
          xhr.send(file);
        });
      } catch (err: any) {
        if (err.message === "Aborted") {
          break;
        } else {
          toast.error(`Falha ao enviar ${file.name}: ${err.message}`);
        }
      }

      currentIndex++;
    }

    if (abortController.signal.aborted) {
      setUploadStatus("CANCELLED");
      setUploadQueue([]);
      toast.info("Upload cancelado pelo usuário");
      setTimeout(() => setUploadStatus("IDLE"), 2000);
    } else {
      setUploadStatus("FINISHED");
      fetchFiles();
      setTimeout(() => {
        setUploadStatus("IDLE");
        setUploadQueue([]);
      }, 2500);
    }
  };

  const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files.length > 0) startUploadBatch(e.target.files);
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    setDragOver(false);
    if (e.dataTransfer.files.length > 0) startUploadBatch(e.dataTransfer.files);
  };

  const handleDelete = async (fileName: string) => {
    if (!folderPath) return;
    const { error } = await supabase.storage.from(BUCKET).remove([`${folderPath}/${fileName}`]);
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

  const allSelected = filteredFiles.length > 0 && selectedFiles.size === filteredFiles.length;

  return (
    <div className="min-h-screen bg-background">
      <DashboardHeader onLogout={handleLogout} totalFiles={totalFiles} totalSize={totalSize} userEmail={user?.email} />

      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6 sm:py-8">
        {/* Upload Zone */}
        <div
          className={`border-2 border-dashed rounded-xl p-6 sm:p-8 text-center transition-all cursor-pointer mb-6 sm:mb-8 ${dragOver ? "dropzone-active" : "border-border hover:border-muted-foreground/40"
            }`}
          onDragOver={(e) => { e.preventDefault(); setDragOver(true); }}
          onDragLeave={() => setDragOver(false)}
          onDrop={handleDrop}
          onClick={() => document.getElementById("file-input")?.click()}
        >
          <input id="file-input" type="file" multiple accept="image/*" className="hidden" onChange={handleFileSelect} />
          <div className="flex flex-col items-center gap-2">
            <Upload className="w-8 h-8 text-muted-foreground" />
            <p className="text-sm text-foreground font-medium">
              Arraste imagens aqui ou clique para selecionar
            </p>
            <p className="text-xs text-muted-foreground">
              O sistema monitora e previne envios de arquivos duplicados
            </p>
          </div>
        </div>

        <FileSearchFilters
          searchQuery={searchQuery}
          onSearchChange={setSearchQuery}
          typeFilter={typeFilter}
          onTypeFilterChange={setTypeFilter}
          dateFrom={dateFrom}
          onDateFromChange={setDateFrom}
          dateTo={dateTo}
          onDateToChange={setDateTo}
          onApplyFilters={applyFilters}
          onClearFilters={clearFilters}
          onExport={exportXLSX}
          exporting={exporting}
          hasActiveFilters={hasActiveFilters}
        />

        {/* File Section Header */}
        <div className="flex items-center justify-between mb-4">
          <div className="flex items-center gap-2">
            {filteredFiles.length > 0 && (
              <Checkbox
                checked={allSelected}
                onCheckedChange={toggleSelectAll}
                aria-label="Selecionar todos"
              />
            )}
            <FolderOpen className="w-5 h-5 text-primary" />
            <h2 className="text-base sm:text-lg font-semibold">
              Arquivos{" "}
              <span className="text-muted-foreground font-normal text-sm">
                ({filteredFiles.length})
              </span>
            </h2>
          </div>
          <ToggleGroup type="single" value={viewMode} onValueChange={(v) => v && setViewMode(v)} size="sm">
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
        ) : (
          <>
            {viewMode === "grid" ? (
              <FileGridView
                files={filteredFiles.slice(0, visibleCount)}
                onCopy={copyUrl}
                onDelete={handleDelete}
                onPreview={setPreviewFile}
                selectedFiles={selectedFiles}
                onToggleSelect={toggleSelect}
              />
            ) : (
              <FileListView
                files={filteredFiles.slice(0, visibleCount)}
                onCopy={copyUrl}
                onDelete={handleDelete}
                onPreview={setPreviewFile}
                selectedFiles={selectedFiles}
                onToggleSelect={toggleSelect}
              />
            )}

            {visibleCount < filteredFiles.length && (
              <div className="flex justify-center mt-8">
                <button
                  onClick={() => setVisibleCount((prev) => prev + 50)}
                  className="px-6 py-2 bg-secondary text-secondary-foreground hover:bg-secondary/80 rounded-md font-medium transition-colors cursor-pointer"
                >
                  Carregar mais
                </button>
              </div>
            )}
          </>
        )}
      </main>

      <BulkActionBar
        count={selectedFiles.size}
        onDownload={bulkDownload}
        onDelete={bulkDelete}
        onClear={clearSelection}
        downloading={bulkDownloading}
        deleting={bulkDeleting}
      />

      <FilePreviewModal
        open={!!previewFile}
        onOpenChange={(open) => !open && setPreviewFile(null)}
        fileName={previewFile?.name || ""}
        fileUrl={previewFile?.url || ""}
      />

      <Dialog open={uploadStatus !== "IDLE" && uploadStatus !== "PAUSED_DUPLICATE"} onOpenChange={() => { }}>
        <DialogContent onInteractOutside={(e) => e.preventDefault()} onEscapeKeyDown={(e) => e.preventDefault()} className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle className="text-center">
              {uploadStatus === "FINISHED" ? "Upload concluído com sucesso!" :
                uploadStatus === "CANCELLED" ? "Upload cancelado" : "Enviando Arquivos"}
            </DialogTitle>
          </DialogHeader>

          {uploadStatus === "UPLOADING" && uploadQueue.length > 0 && (
            <div className="py-6 space-y-6">
              <div className="text-base font-medium text-center text-foreground">
                Enviando arquivo {uploadCurrentIndex + 1} de {uploadQueue.length}
              </div>
              <div className="text-sm text-center text-muted-foreground truncate px-4">
                {uploadQueue[uploadCurrentIndex]?.name}
              </div>
              <div className="px-4">
                <div className="h-3 w-full bg-secondary rounded-full overflow-hidden">
                  <div
                    className="h-full bg-primary transition-all duration-200 ease-out"
                    style={{ width: `${uploadProgress}%` }}
                  />
                </div>
                <div className="text-xs text-right mt-2 font-medium text-muted-foreground">
                  {uploadProgress}%
                </div>
              </div>
              <div className="pt-4 flex justify-center">
                <Button variant="destructive" onClick={() => abortControllerRef.current?.abort()}>
                  Cancelar Upload
                </Button>
              </div>
            </div>
          )}

          {uploadStatus === "FINISHED" && (
            <div className="py-8 flex justify-center text-green-500">
              <svg className="w-16 h-16 animate-in zoom-in duration-300 mx-auto" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="3" d="M5 13l4 4L19 7"></path></svg>
            </div>
          )}
        </DialogContent>
      </Dialog>

      <Dialog open={uploadStatus === "PAUSED_DUPLICATE"} onOpenChange={() => { }}>
        <DialogContent onInteractOutside={(e) => e.preventDefault()} onEscapeKeyDown={(e) => e.preventDefault()}>
          <DialogHeader>
            <DialogTitle>Atenção: Sobrescrita de Arquivo</DialogTitle>
            <DialogDescription>
              Já existe um arquivo com esse exato nome no seu diretório. Continuar pode gerar conflitos de cache na CDN.
              <br /><br />
              Arquivo: <strong className="text-foreground">{duplicateFile?.name}</strong>
            </DialogDescription>
          </DialogHeader>
          <DialogFooter className="mt-4 flex gap-2 sm:justify-end">
            <Button variant="secondary" onClick={() => duplicateResolverRef.current?.('skip')}>
              Cancelar (Pular)
            </Button>
            <Button onClick={() => duplicateResolverRef.current?.('copy')}>
              Gerar Cópia
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
};

export default Dashboard;
