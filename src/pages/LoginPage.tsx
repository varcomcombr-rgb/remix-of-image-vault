import { useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { toast } from "sonner";
import { Loader2, Eye, EyeOff } from "lucide-react";
import heroImage from "@/assets/hero-woman.png";
import logoVarcom from "@/assets/logo-varcom.png";

interface LoginPageProps {
  onLogin: () => void;
}

const LoginPage = ({ onLogin }: LoginPageProps) => {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [loading, setLoading] = useState(false);
  const [showPassword, setShowPassword] = useState(false);

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
    <div className="min-h-screen flex flex-col bg-background">
      <div className="flex-1 flex flex-col lg:flex-row">
        {/* Left Panel - Hero */}
        <div className="hidden lg:flex lg:w-1/2 items-center justify-center p-12 gap-10">
          <img
            src={heroImage}
            alt="Mulher trabalhando em laptop"
            className="w-72 h-auto rounded-3xl object-cover flex-shrink-0"
          />
          <div className="max-w-sm">
            <h2 className="text-3xl font-bold leading-tight text-foreground mb-4">
              Tecnologia sob medida para o seu crescimento.
            </h2>
            <p className="text-muted-foreground text-base leading-relaxed">
              Tudo o que o seu negócio precisa para crescer: gestão de tarefas, arquivos e novas soluções, a um clique de distância.
            </p>
          </div>
        </div>

        {/* Vertical Separator */}
        <div className="hidden lg:flex items-center">
          <div className="w-px h-2/3 bg-border" />
        </div>

        {/* Right Panel - Login Form */}
        <div className="flex-1 flex items-center justify-center p-8 lg:p-12">
          <div className="w-full max-w-sm">
            <img
              src={logoVarcom}
              alt="Varcom"
              className="h-8 mb-10"
            />

            <form onSubmit={handleLogin} className="space-y-5">
              <div className="space-y-1.5">
                <Label htmlFor="email" className="text-foreground font-semibold text-sm">
                  E-mail
                </Label>
                <Input
                  id="email"
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="seu@email.com"
                  required
                  className="h-11 bg-background border-border"
                />
              </div>

              <div className="space-y-1.5">
                <Label htmlFor="password" className="text-foreground font-semibold text-sm">
                  Senha
                </Label>
                <div className="relative">
                  <Input
                    id="password"
                    type={showPassword ? "text" : "password"}
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    placeholder="Mínimo de 6 caracteres"
                    required
                    className="h-11 bg-background border-border pr-10"
                  />
                  <button
                    type="button"
                    onClick={() => setShowPassword(!showPassword)}
                    className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground transition-colors"
                  >
                    {showPassword ? (
                      <EyeOff className="w-4 h-4" />
                    ) : (
                      <Eye className="w-4 h-4" />
                    )}
                  </button>
                </div>
              </div>

              <Button
                type="submit"
                className="w-full h-12 font-semibold text-base rounded-lg mt-2"
                disabled={loading}
              >
                {loading ? (
                  <Loader2 className="w-4 h-4 animate-spin mr-2" />
                ) : null}
                Entrar
              </Button>
            </form>
          </div>
        </div>
      </div>

      {/* Footer */}
      <footer className="flex items-center justify-between px-8 py-4 border-t border-border">
        <p className="text-xs text-muted-foreground">
          © 2026 Varcom. Todos os direitos reservados.
        </p>
        <img
          src={logoVarcom}
          alt="Varcom"
          className="h-4 opacity-40"
        />
      </footer>
    </div>
  );
};

export default LoginPage;
