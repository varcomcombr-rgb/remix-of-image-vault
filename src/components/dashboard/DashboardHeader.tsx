import { useState } from "react";
import { Button } from "@/components/ui/button";
import { LogOut, Headset, Info } from "lucide-react";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import logoVarcom from "@/assets/logo-varcom.png";

interface DashboardHeaderProps {
  onLogout: () => void;
  totalFiles?: number;
  totalSize?: number;
}

const formatSize = (bytes: number) => {
  if (!bytes) return "0 B";
  if (bytes < 1024) return `${bytes} B`;
  if (bytes < 1048576) return `${(bytes / 1024).toFixed(1)} KB`;
  if (bytes < 1073741824) return `${(bytes / 1048576).toFixed(2)} MB`;
  return `${(bytes / 1073741824).toFixed(2)} GB`;
};

const DashboardHeader = ({ onLogout, totalFiles = 0, totalSize = 0 }: DashboardHeaderProps) => {
  return (
    <header className="border-b bg-card/50 backdrop-blur-sm sticky top-0 z-10">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 flex items-center justify-between h-16">
        <img src={logoVarcom} alt="Varcom" className="h-7" />
        <div className="flex items-center gap-1">
          <Button
            variant="ghost"
            size="sm"
            className="text-muted-foreground hover:text-foreground"
            asChild
          >
            <a href="https://www.varcom.com.br" target="_blank" rel="noopener noreferrer">
              <Headset className="w-4 h-4 mr-2" />
              Suporte
            </a>
          </Button>

          <Popover>
            <PopoverTrigger asChild>
              <Button
                variant="ghost"
                size="sm"
                className="text-muted-foreground hover:text-foreground"
              >
                <Info className="w-4 h-4 mr-2" />
                Detalhes
              </Button>
            </PopoverTrigger>
            <PopoverContent className="w-72" align="end">
              <div className="space-y-3">
                <h4 className="font-semibold text-sm text-foreground">Detalhes do Bucket</h4>
                <div className="space-y-2 text-sm">
                  <div className="flex justify-between">
                    <span className="text-muted-foreground">Classe de armazenamento</span>
                    <span className="font-medium text-foreground">Premium</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-muted-foreground">Acesso Público</span>
                    <span className="font-medium text-foreground">Habilitado</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-muted-foreground">Tamanho do bucket</span>
                    <span className="font-medium text-foreground">{formatSize(totalSize)}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-muted-foreground">Quantidade de Arquivos</span>
                    <span className="font-medium text-foreground">{totalFiles}</span>
                  </div>
                </div>
              </div>
            </PopoverContent>
          </Popover>

          <Button
            variant="ghost"
            size="sm"
            onClick={onLogout}
            className="text-muted-foreground hover:text-foreground"
          >
            <LogOut className="w-4 h-4 mr-2" />
            Sair
          </Button>
        </div>
      </div>
    </header>
  );
};

export default DashboardHeader;
