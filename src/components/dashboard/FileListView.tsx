import { Button } from "@/components/ui/button";
import { Copy, Trash2 } from "lucide-react";

interface FileItem {
  name: string;
  url: string;
  updated_at: string;
}

interface FileListViewProps {
  files: FileItem[];
  onCopy: (url: string) => void;
  onDelete: (name: string) => void;
  onPreview: (file: FileItem) => void;
}

const FileListView = ({ files, onCopy, onDelete, onPreview }: FileListViewProps) => {
  return (
    <div className="border rounded-xl overflow-hidden">
      <table className="w-full text-sm">
        <thead>
          <tr className="border-b bg-muted/50">
            <th className="text-left px-4 py-3 font-medium text-muted-foreground">Miniatura</th>
            <th className="text-left px-4 py-3 font-medium text-muted-foreground">Nome do arquivo</th>
            <th className="text-right px-4 py-3 font-medium text-muted-foreground">Ações</th>
          </tr>
        </thead>
        <tbody>
          {files.map((file) => (
            <tr
              key={file.name}
              className="border-b last:border-b-0 hover:bg-muted/30 cursor-pointer transition-colors"
              onClick={() => onPreview(file)}
            >
              <td className="px-4 py-2">
                <div className="w-10 h-10 rounded bg-muted overflow-hidden">
                  <img
                    src={file.url}
                    alt={file.name}
                    className="w-full h-full object-cover"
                    loading="lazy"
                  />
                </div>
              </td>
              <td className="px-4 py-2 font-mono truncate max-w-[300px]">{file.name}</td>
              <td className="px-4 py-2">
                <div className="flex gap-1.5 justify-end" onClick={(e) => e.stopPropagation()}>
                  <Button variant="secondary" size="sm" className="text-xs" onClick={() => onCopy(file.url)}>
                    <Copy className="w-3 h-3 mr-1" />
                    Copiar URL
                  </Button>
                  <Button variant="destructive" size="sm" className="text-xs px-2.5" onClick={() => onDelete(file.name)}>
                    <Trash2 className="w-3 h-3" />
                  </Button>
                </div>
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
};

export default FileListView;
