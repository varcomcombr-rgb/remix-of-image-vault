import { useState, useCallback } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { toast } from "sonner";
import {
  Upload,
  Trash2,
  Copy,
  LogOut,
  ImageIcon,
  Loader2,
  CheckCircle,
  FolderOpen,
} from "lucide-react";

const BUCKET = "varcom";
const FOLDER = "Imagem";

interface FileItem {
  name: string;
  url: string;
  updated_at: string;
}

interface DashboardProps {
  onLogout: () => void;
}

const Dashboard = ({ onLogout }: DashboardProps) => {
  const [files, setFiles] = useState<FileItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [uploading, setUploading] = useState(false);
  const [dragOver, setDragOver] = useState(false);

  const getPublicUrl = (fileName: string) => {
    const { data } = supabase.storage
      .from(BUCKET)
      .getPublicUrl(`${FOLDER}/${fileName}`);
    return data.publicUrl;
  };

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
      }));

    setFiles(items);
    setLoading(false);
  }, []);

  useState(() => {
    fetchFiles();
  });

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
      {/* Header */}
      <header className="border-b bg-card/50 backdrop-blur-sm sticky top-0 z-10">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 flex items-center justify-between h-16">
          <div className="flex items-center gap-3">
            <div className="w-9 h-9 rounded-lg bg-primary/10 flex items-center justify-center">
              <ImageIcon className="w-5 h-5 text-primary" />
            </div>
            <div>
              <h1 className="text-lg font-bold text-gradient">VarCom CDN</h1>
              <p className="text-xs text-muted-foreground font-mono">
                /varcom/Imagem/
              </p>
            </div>
          </div>
          <Button
            variant="ghost"
            size="sm"
            onClick={handleLogout}
            className="text-muted-foreground hover:text-foreground"
          >
            <LogOut className="w-4 h-4 mr-2" />
            Sair
          </Button>
        </div>
      </header>

      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Upload Zone */}
        <div
          className={`border-2 border-dashed rounded-xl p-8 text-center transition-all cursor-pointer mb-8 ${
            dragOver ? "dropzone-active" : "border-border hover:border-muted-foreground/40"
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

        {/* File Grid */}
        <div className="flex items-center gap-2 mb-4">
          <FolderOpen className="w-5 h-5 text-primary" />
          <h2 className="text-lg font-semibold">
            Arquivos{" "}
            <span className="text-muted-foreground font-normal text-sm">
              ({files.length})
            </span>
          </h2>
        </div>

        {loading ? (
          <div className="flex justify-center py-16">
            <Loader2 className="w-6 h-6 text-primary animate-spin" />
          </div>
        ) : files.length === 0 ? (
          <div className="text-center py-16 text-muted-foreground">
            <ImageIcon className="w-12 h-12 mx-auto mb-3 opacity-30" />
            <p>Nenhuma imagem encontrada</p>
          </div>
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
            {files.map((file) => (
              <div
                key={file.name}
                className="group rounded-xl border bg-card overflow-hidden hover:glow-border transition-shadow"
              >
                <div className="aspect-square bg-muted relative overflow-hidden">
                  <img
                    src={file.url}
                    alt={file.name}
                    className="w-full h-full object-cover"
                    loading="lazy"
                  />
                </div>
                <div className="p-3 space-y-2">
                  <p
                    className="text-sm font-mono text-foreground truncate"
                    title={file.name}
                  >
                    {file.name}
                  </p>
                  <div className="flex gap-1.5">
                    <Button
                      variant="secondary"
                      size="sm"
                      className="flex-1 text-xs"
                      onClick={() => copyUrl(file.url)}
                    >
                      <Copy className="w-3 h-3 mr-1" />
                      Copiar URL
                    </Button>
                    <Button
                      variant="destructive"
                      size="sm"
                      className="text-xs px-2.5"
                      onClick={() => handleDelete(file.name)}
                    >
                      <Trash2 className="w-3 h-3" />
                    </Button>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </main>
    </div>
  );
};

export default Dashboard;