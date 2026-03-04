import { useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { toast } from "sonner";
import { Loader2, ImageIcon } from "lucide-react";

interface LoginPageProps {
  onLogin: () => void;
}

const LoginPage = ({ onLogin }: LoginPageProps) => {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [loading, setLoading] = useState(false);

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);

    const { error } = await supabase.auth.signInWithPassword({
      email,
      password,
    });

    if (error) {
      toast.error("Credenciais inválidas. Tente novamente.");
    } else {
      toast.success("Login realizado com sucesso!");
      onLogin();
    }
    setLoading(false);
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-background">
      <div className="w-full max-w-md px-6">
        <div className="text-center mb-8">
          <div className="inline-flex items-center justify-center w-16 h-16 rounded-2xl bg-primary/10 mb-4 glow-border">
            <ImageIcon className="w-8 h-8 text-primary" />
          </div>
          <h1 className="text-3xl font-bold text-gradient">VarCom CDN</h1>
          <p className="text-muted-foreground mt-2 text-sm">
            Sistema de Gestão de Imagens
          </p>
        </div>

        <form onSubmit={handleLogin} className="space-y-5">
          <div className="rounded-xl border bg-card p-6 space-y-4">
            <div className="space-y-2">
              <Label htmlFor="email" className="text-secondary-foreground text-sm">
                Usuário (E-mail)
              </Label>
              <Input
                id="email"
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="seu@email.com"
                required
                className="bg-muted border-border focus:ring-primary"
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="password" className="text-secondary-foreground text-sm">
                Senha
              </Label>
              <Input
                id="password"
                type="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="••••••••"
                required
                className="bg-muted border-border focus:ring-primary"
              />
            </div>
          </div>

          <Button
            type="submit"
            className="w-full h-11 font-semibold"
            disabled={loading}
          >
            {loading ? (
              <Loader2 className="w-4 h-4 animate-spin mr-2" />
            ) : null}
            Entrar
          </Button>
        </form>

        <p className="text-center text-muted-foreground text-xs mt-6">
          Acesso restrito a usuários autorizados
        </p>
      </div>
    </div>
  );
};

export default LoginPage;