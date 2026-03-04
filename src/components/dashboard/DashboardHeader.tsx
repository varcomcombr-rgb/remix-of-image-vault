import { Button } from "@/components/ui/button";
import { LogOut } from "lucide-react";
import logoVarcom from "@/assets/logo-varcom.png";

interface DashboardHeaderProps {
  onLogout: () => void;
}

const DashboardHeader = ({ onLogout }: DashboardHeaderProps) => {
  return (
    <header className="border-b bg-card/50 backdrop-blur-sm sticky top-0 z-10">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 flex items-center justify-between h-16">
        <img src={logoVarcom} alt="Varcom" className="h-7" />
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
    </header>
  );
};

export default DashboardHeader;
