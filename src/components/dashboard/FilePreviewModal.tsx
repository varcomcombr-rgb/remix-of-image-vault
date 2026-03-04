import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";

interface FilePreviewModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  fileName: string;
  fileUrl: string;
}

const isImage = (name: string) =>
  /\.(jpg|jpeg|png|gif|webp|svg|bmp|ico)$/i.test(name);

const isText = (name: string) =>
  /\.(txt|csv|json|xml|html|css|js|ts|md|log)$/i.test(name);

const FilePreviewModal = ({
  open,
  onOpenChange,
  fileName,
  fileUrl,
}: FilePreviewModalProps) => {
  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-3xl max-h-[85vh] overflow-auto">
        <DialogHeader>
          <DialogTitle className="font-mono text-sm truncate">
            {fileName}
          </DialogTitle>
        </DialogHeader>
        <div className="flex items-center justify-center min-h-[200px]">
          {isImage(fileName) ? (
            <img
              src={fileUrl}
              alt={fileName}
              className="max-w-full max-h-[70vh] object-contain rounded-lg"
            />
          ) : isText(fileName) ? (
            <TextPreview url={fileUrl} />
          ) : (
            <p className="text-muted-foreground text-sm">
              Pré-visualização não disponível para este tipo de arquivo.
            </p>
          )}
        </div>
      </DialogContent>
    </Dialog>
  );
};

const TextPreview = ({ url }: { url: string }) => {
  const [content, setContent] = useState<string | null>(null);
  const [error, setError] = useState(false);

  useState(() => {
    fetch(url)
      .then((r) => r.text())
      .then(setContent)
      .catch(() => setError(true));
  });

  if (error) return <p className="text-destructive text-sm">Erro ao carregar conteúdo.</p>;
  if (content === null) return <p className="text-muted-foreground text-sm">Carregando...</p>;

  return (
    <pre className="w-full text-sm font-mono bg-muted p-4 rounded-lg overflow-auto max-h-[60vh] whitespace-pre-wrap">
      {content}
    </pre>
  );
};

import { useState } from "react";

export default FilePreviewModal;
