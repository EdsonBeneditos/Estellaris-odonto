import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { CalendarDays, Clock, Plus } from "lucide-react";
import { Button } from "@/components/ui/button";
import { useAuth } from "@/contexts/AuthContext";

export default function Agenda() {
  const { profile } = useAuth();

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-display font-bold flex items-center gap-2">
          <CalendarDays className="h-6 w-6 text-primary" /> Agenda
        </h1>
        <Button>
          <Plus className="h-4 w-4 mr-2" /> Nova Consulta
        </Button>
      </div>

      <div className="grid gap-4 sm:grid-cols-3">
        <Card className="border-border/50">
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">Hoje</CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-3xl font-display font-bold">0</p>
            <p className="text-xs text-muted-foreground">consultas agendadas</p>
          </CardContent>
        </Card>
        <Card className="border-border/50">
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">Esta Semana</CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-3xl font-display font-bold">0</p>
            <p className="text-xs text-muted-foreground">consultas</p>
          </CardContent>
        </Card>
        <Card className="border-border/50">
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">Próximo Horário</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="flex items-center gap-2 text-muted-foreground">
              <Clock className="h-4 w-4" />
              <span className="text-sm">Nenhum agendamento</span>
            </div>
          </CardContent>
        </Card>
      </div>

      <Card className="border-border/50">
        <CardHeader>
          <CardTitle className="text-lg font-display">Calendário</CardTitle>
        </CardHeader>
        <CardContent className="min-h-[400px] flex items-center justify-center">
          <div className="text-center space-y-3">
            <CalendarDays className="h-16 w-16 text-muted-foreground/30 mx-auto" />
            <p className="text-muted-foreground text-sm">O módulo de agendamento interativo será implementado em breve.</p>
            <p className="text-xs text-muted-foreground/60">Gerencie consultas, horários e lembretes automáticos.</p>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
