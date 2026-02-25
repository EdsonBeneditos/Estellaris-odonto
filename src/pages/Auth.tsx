import { useState } from "react";
import { useAuth } from "@/contexts/AuthContext";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Label } from "@/components/ui/label";
import { useToast } from "@/hooks/use-toast";
import { Activity } from "lucide-react";

export default function Auth() {
  const [isSignUp, setIsSignUp] = useState(false);
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [idNome, setIdNome] = useState("");
  const [nomeClinica, setNomeClinica] = useState("");
  const [loading, setLoading] = useState(false);
  const { signIn, signUp } = useAuth();
  const { toast } = useToast();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);

    if (isSignUp) {
      if (!idNome.trim() || !nomeClinica.trim()) {
        toast({ title: "Preencha todos os campos", variant: "destructive" });
        setLoading(false);
        return;
      }
      const { error } = await signUp(email, password, idNome.trim(), nomeClinica.trim());
      if (error) {
        toast({ title: "Erro no cadastro", description: error.message, variant: "destructive" });
      } else {
        toast({ title: "Conta criada!", description: "Verifique seu e-mail para confirmar." });
      }
    } else {
      const { error } = await signIn(email, password);
      if (error) {
        toast({ title: "Erro no login", description: error.message, variant: "destructive" });
      }
    }
    setLoading(false);
  };

  return (
    <div className="flex min-h-screen items-center justify-center bg-background p-4">
      <Card className="w-full max-w-md border-border/50 shadow-xl">
        <CardHeader className="text-center space-y-4">
          <div className="mx-auto flex h-14 w-14 items-center justify-center rounded-xl bg-primary">
            <Activity className="h-7 w-7 text-primary-foreground" />
          </div>
          <div>
            <CardTitle className="text-2xl font-display">Nexus Health</CardTitle>
            <CardDescription>ERP Odontológico de Alta Performance</CardDescription>
          </div>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleSubmit} className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="email">E-mail</Label>
              <Input id="email" type="email" value={email} onChange={(e) => setEmail(e.target.value)} required placeholder="dentista@clinica.com" />
            </div>
            <div className="space-y-2">
              <Label htmlFor="password">Senha</Label>
              <Input id="password" type="password" value={password} onChange={(e) => setPassword(e.target.value)} required placeholder="••••••••" />
            </div>

            {isSignUp && (
              <>
                <div className="space-y-2">
                  <Label htmlFor="idNome">ID Nome (identificador único)</Label>
                  <Input id="idNome" value={idNome} onChange={(e) => setIdNome(e.target.value)} required placeholder="dr.silva" />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="nomeClinica">Nome da Clínica</Label>
                  <Input id="nomeClinica" value={nomeClinica} onChange={(e) => setNomeClinica(e.target.value)} required placeholder="Clínica Odonto Nexus" />
                </div>
              </>
            )}

            <Button type="submit" className="w-full" disabled={loading}>
              {loading ? "Carregando..." : isSignUp ? "Criar Conta" : "Entrar"}
            </Button>

            <p className="text-center text-sm text-muted-foreground">
              {isSignUp ? "Já tem conta?" : "Ainda não tem conta?"}{" "}
              <button type="button" onClick={() => setIsSignUp(!isSignUp)} className="text-primary underline-offset-4 hover:underline font-medium">
                {isSignUp ? "Fazer login" : "Cadastrar-se"}
              </button>
            </p>
          </form>
        </CardContent>
      </Card>
    </div>
  );
}
