import { Award } from "lucide-react";
import { Card, CardContent } from "@/components/ui/card";

export default function Atestado() {
  return (
    <div className="space-y-6">
      <h1 className="text-2xl font-display font-bold flex items-center gap-2">
        <Award className="h-6 w-6 text-primary" /> Atestado
      </h1>
      <Card className="border-border/50 shadow-sm">
        <CardContent className="min-h-[400px] flex items-center justify-center">
          <div className="text-center space-y-3">
            <Award className="h-16 w-16 text-muted-foreground/30 mx-auto" />
            <p className="text-muted-foreground text-sm font-medium">Módulo em desenvolvimento — Nexus Smile Studio</p>
            <p className="text-xs text-muted-foreground/60">Atestados odontológicos com templates personalizáveis e impressão.</p>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
