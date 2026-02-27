import { useState, useEffect } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Settings, User, Building2, Bell, Palette, Moon, Sun } from "lucide-react";
import { useAuth } from "@/contexts/AuthContext";
import { useTheme } from "@/hooks/useTheme";
import { supabase } from "@/integrations/supabase/client";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Button } from "@/components/ui/button";
import { useToast } from "@/hooks/use-toast";

export default function Configuracoes() {
  const { profile, organization } = useAuth();
  const { theme, setTheme } = useTheme();
  const { toast } = useToast();

  const [idNome, setIdNome] = useState(profile?.id_nome ?? "");
  const [numeroCro, setNumeroCro] = useState("");
  const [dataVencimentoCro, setDataVencimentoCro] = useState("");
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    if (!profile?.id) return;
    // Load CRO fields
    const load = async () => {
      const { data } = await supabase
        .from("profiles")
        .select("numero_cro, data_vencimento_cro")
        .eq("id", profile.id)
        .single();
      if (data) {
        setNumeroCro((data as any).numero_cro ?? "");
        setDataVencimentoCro((data as any).data_vencimento_cro ?? "");
      }
    };
    load();
  }, [profile?.id]);

  const handleSaveProfile = async () => {
    if (!profile?.id) return;
    setSaving(true);
    const { error } = await supabase
      .from("profiles")
      .update({
        id_nome: idNome,
        numero_cro: numeroCro || null,
        data_vencimento_cro: dataVencimentoCro || null,
      } as any)
      .eq("id", profile.id);
    setSaving(false);
    if (error) {
      toast({ title: "Erro ao salvar", description: error.message, variant: "destructive" });
    } else {
      toast({ title: "Perfil atualizado!" });
    }
  };

  return (
    <div className="space-y-6">
      <h1 className="text-2xl font-display font-bold flex items-center gap-2">
        <Settings className="h-6 w-6 text-primary" /> Configurações
      </h1>

      <div className="grid gap-6 lg:grid-cols-2">
        {/* Perfil */}
        <Card className="border-border/50">
          <CardHeader className="pb-3">
            <CardTitle className="text-base font-display flex items-center gap-2">
              <User className="h-4 w-4 text-accent" /> Meu Perfil
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="space-y-1.5">
              <Label className="text-xs">ID Nome</Label>
              <Input value={idNome} onChange={e => setIdNome(e.target.value)} className="h-8 text-sm" />
            </div>
            <div className="space-y-1.5">
              <Label className="text-xs">Cargo</Label>
              <Input value={profile?.cargo ?? "Profissional"} readOnly className="bg-muted/50 h-8 text-sm" />
            </div>
            <div className="space-y-1.5">
              <Label className="text-xs">Número CRO</Label>
              <Input value={numeroCro} onChange={e => setNumeroCro(e.target.value)} placeholder="Ex: CRO-SP 12345" className="h-8 text-sm" />
            </div>
            <div className="space-y-1.5">
              <Label className="text-xs">Data de Vencimento CRO</Label>
              <Input type="date" value={dataVencimentoCro} onChange={e => setDataVencimentoCro(e.target.value)} className="h-8 text-sm" />
            </div>
            <Button size="sm" onClick={handleSaveProfile} disabled={saving}>
              {saving ? "Salvando..." : "Salvar Perfil"}
            </Button>
          </CardContent>
        </Card>

        {/* Clínica */}
        <Card className="border-border/50">
          <CardHeader className="pb-3">
            <CardTitle className="text-base font-display flex items-center gap-2">
              <Building2 className="h-4 w-4 text-accent" /> Clínica
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="space-y-1.5">
              <Label className="text-xs">Nome da Clínica</Label>
              <Input value={organization?.nome_clinica ?? ""} readOnly className="bg-muted/50 h-8 text-sm" />
            </div>
            <div className="space-y-1.5">
              <Label className="text-xs">CNPJ</Label>
              <Input value={organization?.cnpj ?? "Não informado"} readOnly className="bg-muted/50 h-8 text-sm" />
            </div>
            <div className="space-y-1.5">
              <Label className="text-xs">Plano</Label>
              <Input value={organization?.plano ?? "Free"} readOnly className="bg-muted/50 h-8 text-sm" />
            </div>
          </CardContent>
        </Card>

        {/* Aparência - Theme toggle moved here */}
        <Card className="border-border/50">
          <CardHeader className="pb-3">
            <CardTitle className="text-base font-display flex items-center gap-2">
              <Palette className="h-4 w-4 text-accent" /> Aparência
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <p className="text-sm text-muted-foreground">Selecione o tema de interface:</p>
            <div className="flex gap-3">
              <Button
                variant={theme === "light" ? "default" : "outline"}
                size="sm"
                onClick={() => setTheme("light")}
                className="gap-2"
              >
                <Sun className="h-4 w-4" /> Claro
              </Button>
              <Button
                variant={theme === "dark" ? "default" : "outline"}
                size="sm"
                onClick={() => setTheme("dark")}
                className="gap-2"
              >
                <Moon className="h-4 w-4" /> Escuro
              </Button>
            </div>
          </CardContent>
        </Card>

        {/* Notificações */}
        <Card className="border-border/50">
          <CardHeader className="pb-3">
            <CardTitle className="text-base font-display flex items-center gap-2">
              <Bell className="h-4 w-4 text-accent" /> Notificações
            </CardTitle>
          </CardHeader>
          <CardContent className="flex items-center justify-center min-h-[120px]">
            <p className="text-sm text-muted-foreground">Configuração de notificações em breve.</p>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
