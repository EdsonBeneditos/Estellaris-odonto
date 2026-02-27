import { useEffect, useState } from "react";
import { useAuth } from "@/contexts/AuthContext";
import { supabase } from "@/integrations/supabase/client";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Button } from "@/components/ui/button";
import { Users, CalendarDays, FileHeart, TrendingUp, AlertTriangle, X } from "lucide-react";
import { format, addMonths, isBefore } from "date-fns";

export default function Dashboard() {
  const { profile, organization } = useAuth();
  const [consultasHoje, setConsultasHoje] = useState<number>(0);
  const [croAlert, setCroAlert] = useState(false);
  const [croAlertDismissed, setCroAlertDismissed] = useState(false);

  // Real-time count of today's appointments
  useEffect(() => {
    if (!profile?.organization_id) return;
    const today = format(new Date(), "yyyy-MM-dd");
    const fetchCount = async () => {
      const { count } = await supabase
        .from("appointments")
        .select("*", { count: "exact", head: true })
        .eq("organization_id", profile.organization_id)
        .eq("appointment_date", today);
      setConsultasHoje(count ?? 0);
    };
    fetchCount();
  }, [profile?.organization_id]);

  // CRO expiry alert
  useEffect(() => {
    if (!profile?.id) return;
    const checkCro = async () => {
      const { data } = await supabase
        .from("profiles")
        .select("data_vencimento_cro")
        .eq("id", profile.id)
        .single();
      if (data && (data as any).data_vencimento_cro) {
        const vencimento = new Date((data as any).data_vencimento_cro);
        const oneMonthFromNow = addMonths(new Date(), 1);
        if (isBefore(vencimento, oneMonthFromNow)) {
          setCroAlert(true);
        }
      }
    };
    checkCro();
  }, [profile?.id]);

  const stats = [
    { label: "Pacientes", value: "—", icon: Users, color: "text-accent" },
    { label: "Consultas Hoje", value: String(consultasHoje), icon: CalendarDays, color: "text-primary" },
    { label: "Prontuários", value: "—", icon: FileHeart, color: "text-chart-3" },
    { label: "Receita Mensal", value: "—", icon: TrendingUp, color: "text-chart-1" },
  ];

  return (
    <div className="space-y-6">
      {/* CRO Alert Banner */}
      {croAlert && !croAlertDismissed && (
        <Alert variant="destructive" className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <AlertTriangle className="h-4 w-4" />
            <AlertDescription>
              Seu CRO está próximo do vencimento! Atualize em Configurações &gt; Meu Perfil.
            </AlertDescription>
          </div>
          <Button variant="ghost" size="icon" className="h-6 w-6 shrink-0" onClick={() => setCroAlertDismissed(true)}>
            <X className="h-4 w-4" />
          </Button>
        </Alert>
      )}

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
          <p className="text-muted-foreground text-sm">
            {consultasHoje > 0
              ? `Você tem ${consultasHoje} consulta(s) agendada(s) para hoje.`
              : "Nenhuma consulta agendada para hoje."}
          </p>
        </CardContent>
      </Card>
    </div>
  );
}
