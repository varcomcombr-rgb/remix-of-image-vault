import { Button } from "@/components/ui/button";
import { Checkbox } from "@/components/ui/checkbox";
import { Copy, Trash2 } from "lucide-react";

interface FileItem {
  name: string;
  url: string;
  updated_at: string;
}

interface FileGridViewProps {
  files: FileItem[];
  onCopy: (url: string) => void;
  onDelete: (name: string) => void;
  onPreview: (file: FileItem) => void;
  selectedFiles: Set<string>;
  onToggleSelect: (name: string) => void;
}

const FileGridView = ({ files, onCopy, onDelete, onPreview, selectedFiles, onToggleSelect }: FileGridViewProps) => {
  return (
    <div className="grid grid-cols-2 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-3 sm:gap-4">
      {files.map((file) => (
        <div
          key={file.name}
          className={`group rounded-xl border bg-card overflow-hidden hover:glow-border transition-shadow cursor-pointer ${
            selectedFiles.has(file.name) ? "ring-2 ring-primary" : ""
          }`}
          onClick={() => onPreview(file)}
        >
          <div className="aspect-square bg-muted relative overflow-hidden">
            <img src={file.url} alt={file.name} className="w-full h-full object-cover" loading="lazy" />
            <div
              className="absolute top-2 left-2"
              onClick={(e) => {
                e.stopPropagation();
                onToggleSelect(file.name);
              }}
            >
              <Checkbox
                checked={selectedFiles.has(file.name)}
                className="bg-background/80 backdrop-blur-sm"
              />
            </div>
          </div>
          <div className="p-2 sm:p-3 space-y-2" onClick={(e) => e.stopPropagation()}>
            <p className="text-xs sm:text-sm font-mono text-foreground truncate" title={file.name}>
              {file.name}
            </p>
            <div className="flex gap-1.5">
              <Button variant="secondary" size="sm" className="flex-1 text-xs" onClick={() => onCopy(file.url)}>
                <Copy className="w-3 h-3 mr-1" />
                <span className="hidden sm:inline">Copiar URL</span>
                <span className="sm:hidden">URL</span>
              </Button>
              <Button variant="destructive" size="sm" className="text-xs px-2.5" onClick={() => onDelete(file.name)}>
                <Trash2 className="w-3 h-3" />
              </Button>
            </div>
          </div>
        </div>
      ))}
    </div>
  );
};

export default FileGridView;
