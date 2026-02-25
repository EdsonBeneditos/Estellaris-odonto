import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Settings, User, Building2, Bell, Palette } from "lucide-react";
import { useAuth } from "@/contexts/AuthContext";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Button } from "@/components/ui/button";
import { Separator } from "@/components/ui/separator";

export default function Configuracoes() {
  const { profile, organization } = useAuth();

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
              <Input value={profile?.id_nome ?? ""} readOnly className="bg-muted/50" />
            </div>
            <div className="space-y-1.5">
              <Label className="text-xs">Cargo</Label>
              <Input value={profile?.cargo ?? "Profissional"} readOnly className="bg-muted/50" />
            </div>
            <Button variant="outline" size="sm" disabled>
              Editar Perfil (em breve)
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
              <Input value={organization?.nome_clinica ?? ""} readOnly className="bg-muted/50" />
            </div>
            <div className="space-y-1.5">
              <Label className="text-xs">CNPJ</Label>
              <Input value={organization?.cnpj ?? "Não informado"} readOnly className="bg-muted/50" />
            </div>
            <div className="space-y-1.5">
              <Label className="text-xs">Plano</Label>
              <Input value={organization?.plano ?? "Free"} readOnly className="bg-muted/50" />
            </div>
            <Button variant="outline" size="sm" disabled>
              Gerenciar Clínica (em breve)
            </Button>
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

        {/* Aparência */}
        <Card className="border-border/50">
          <CardHeader className="pb-3">
            <CardTitle className="text-base font-display flex items-center gap-2">
              <Palette className="h-4 w-4 text-accent" /> Aparência
            </CardTitle>
          </CardHeader>
          <CardContent className="flex items-center justify-center min-h-[120px]">
            <p className="text-sm text-muted-foreground">Use o botão de tema no menu lateral para alternar entre modo claro e escuro.</p>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
