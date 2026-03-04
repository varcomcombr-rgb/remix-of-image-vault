import { Button } from "@/components/ui/button";
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
}

const FileGridView = ({ files, onCopy, onDelete, onPreview }: FileGridViewProps) => {
  return (
    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
      {files.map((file) => (
        <div
          key={file.name}
          className="group rounded-xl border bg-card overflow-hidden hover:glow-border transition-shadow cursor-pointer"
          onClick={() => onPreview(file)}
        >
          <div className="aspect-square bg-muted relative overflow-hidden">
            <img
              src={file.url}
              alt={file.name}
              className="w-full h-full object-cover"
              loading="lazy"
            />
          </div>
          <div className="p-3 space-y-2" onClick={(e) => e.stopPropagation()}>
            <p className="text-sm font-mono text-foreground truncate" title={file.name}>
              {file.name}
            </p>
            <div className="flex gap-1.5">
              <Button variant="secondary" size="sm" className="flex-1 text-xs" onClick={() => onCopy(file.url)}>
                <Copy className="w-3 h-3 mr-1" />
                Copiar URL
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
