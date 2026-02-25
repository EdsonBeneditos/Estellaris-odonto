import { useAuth } from "@/contexts/AuthContext";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Users, CalendarDays, FileHeart, TrendingUp } from "lucide-react";

const stats = [
  { label: "Pacientes", value: "—", icon: Users, color: "text-accent" },
  { label: "Consultas Hoje", value: "—", icon: CalendarDays, color: "text-primary" },
  { label: "Prontuários", value: "—", icon: FileHeart, color: "text-chart-3" },
  { label: "Receita Mensal", value: "—", icon: TrendingUp, color: "text-chart-1" },
];

export default function Dashboard() {
  const { profile, organization } = useAuth();

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-display font-bold">
          Bem-vindo, <span className="text-primary">{profile?.id_nome ?? "Profissional"}</span>
        </h1>
        <p className="text-sm text-muted-foreground">{organization?.nome_clinica ?? "Sua Clínica"} • Visão geral do dia</p>
      </div>

      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        {stats.map((s) => (
          <Card key={s.label} className="border-border/50">
            <CardHeader className="flex flex-row items-center justify-between pb-2">
              <CardTitle className="text-sm font-medium text-muted-foreground">{s.label}</CardTitle>
              <s.icon className={`h-4 w-4 ${s.color}`} />
            </CardHeader>
            <CardContent>
              <p className="text-3xl font-display font-bold">{s.value}</p>
            </CardContent>
          </Card>
        ))}
      </div>

      <Card className="border-border/50">
        <CardHeader>
          <CardTitle className="text-lg font-display">Agenda de Hoje</CardTitle>
        </CardHeader>
        <CardContent>
          <p className="text-muted-foreground text-sm">Nenhuma consulta agendada. O módulo de Agenda será implementado em breve.</p>
        </CardContent>
      </Card>
    </div>
  );
}
