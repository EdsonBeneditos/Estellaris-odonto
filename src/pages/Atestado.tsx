import { useState } from "react";
import { useAuth } from "@/contexts/AuthContext";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";
import { Award, Search, Printer } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { formatCPF } from "@/lib/validators";
import { format } from "date-fns";

export default function Atestado() {
  const { profile, organization } = useAuth();
  const { toast } = useToast();
  const [cpf, setCpf] = useState("");
  const [patientName, setPatientName] = useState("");
  const [patientCpf, setPatientCpf] = useState("");
  const [date, setDate] = useState(format(new Date(), "yyyy-MM-dd"));
  const [time, setTime] = useState(format(new Date(), "HH:mm"));
  const [searching, setSearching] = useState(false);
  const [found, setFound] = useState(false);

  const searchPatient = async () => {
    const clean = cpf.replace(/\D/g, "");
    if (clean.length < 11) return;
    setSearching(true);
    const { data } = await supabase
      .from("patients")
      .select("nome_completo, cpf")
      .eq("cpf", clean)
      .limit(1);
    if (data?.length) {
      setPatientName(data[0].nome_completo);
      setPatientCpf(data[0].cpf);
      setFound(true);
    } else {
      toast({ title: "Paciente não encontrado", variant: "destructive" });
      setFound(false);
    }
    setSearching(false);
  };

  const templateText = found
    ? `Atesto para os devidos fins que o(a) Sr(a) ${patientName}, inscrito(a) no CPF ${formatCPF(patientCpf)}, esteve em atendimento odontológico no dia ${format(new Date(date + "T12:00:00"), "dd/MM/yyyy")} às ${time}h, necessitando de afastamento de suas atividades pelo período de _____ dia(s).\n\nNada mais havendo a declarar, firmo o presente atestado.`
    : "";

  const handlePrint = () => {
    const printWindow = window.open("", "_blank");
    if (!printWindow) return;
    printWindow.document.write(`
      <html><head><title>Atestado</title>
      <style>
        body { font-family: 'Inter', sans-serif; padding: 60px; max-width: 700px; margin: 0 auto; color: #1a1a2e; }
        .header { text-align: center; margin-bottom: 40px; border-bottom: 2px solid #2d6a6a; padding-bottom: 20px; }
        .header h1 { font-size: 18px; margin: 0; letter-spacing: 1px; }
        .header p { font-size: 12px; color: #666; margin: 4px 0 0; }
        .body { font-size: 14px; line-height: 1.8; white-space: pre-wrap; margin: 40px 0; }
        .footer { margin-top: 80px; text-align: center; }
        .footer .line { width: 300px; border-top: 1px solid #333; margin: 0 auto 8px; }
        .footer p { font-size: 12px; margin: 2px 0; }
      </style>
      </head><body>
        <div class="header">
          <h1>${organization?.nome_clinica ?? "Clínica Odontológica"}</h1>
          <p>ATESTADO ODONTOLÓGICO</p>
        </div>
        <div class="body">${templateText}</div>
        <div class="footer">
          <div class="line"></div>
          <p><strong>${profile?.id_nome ?? "Profissional"}</strong></p>
          <p>CRO: ${(profile as any)?.numero_cro ?? "___________"}</p>
        </div>
      </body></html>
    `);
    printWindow.document.close();
    printWindow.print();
  };

  return (
    <div className="space-y-6">
      <h1 className="text-2xl font-display font-bold flex items-center gap-2">
        <Award className="h-6 w-6 text-primary" /> Atestado
      </h1>

      <Card className="border-border/50">
        <CardContent className="p-4">
          <form onSubmit={e => { e.preventDefault(); searchPatient(); }} className="flex gap-3 items-end">
            <div className="flex-1 max-w-xs space-y-1.5">
              <Label className="text-xs">Buscar paciente por CPF</Label>
              <div className="relative">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                <Input className="pl-10" placeholder="000.000.000-00" value={cpf} onChange={e => setCpf(formatCPF(e.target.value))} />
              </div>
            </div>
            <Button type="submit" variant="secondary" disabled={searching}>
              {searching ? "Buscando..." : "Buscar"}
            </Button>
          </form>
        </CardContent>
      </Card>

      {found && (
        <>
          <Card className="border-border/50">
            <CardHeader className="pb-3">
              <CardTitle className="text-sm font-medium">Dados do Atestado</CardTitle>
            </CardHeader>
            <CardContent className="space-y-3">
              <div className="grid grid-cols-2 gap-3">
                <div className="space-y-1">
                  <Label className="text-xs">Data da Consulta</Label>
                  <Input type="date" value={date} onChange={e => setDate(e.target.value)} className="h-9 text-sm" />
                </div>
                <div className="space-y-1">
                  <Label className="text-xs">Horário</Label>
                  <Input type="time" value={time} onChange={e => setTime(e.target.value)} className="h-9 text-sm" />
                </div>
              </div>
            </CardContent>
          </Card>

          <Card className="border-border/50">
            <CardHeader className="pb-3">
              <CardTitle className="text-sm font-medium">Pré-visualização</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="bg-card border border-border rounded-lg p-6 space-y-6">
                <div className="text-center border-b border-border pb-4">
                  <p className="font-display font-bold text-foreground">{organization?.nome_clinica ?? "Clínica Odontológica"}</p>
                  <p className="text-xs text-muted-foreground tracking-widest uppercase mt-1">Atestado Odontológico</p>
                </div>
                <Textarea
                  value={templateText}
                  readOnly
                  rows={6}
                  className="resize-none text-sm leading-relaxed bg-transparent border-none focus-visible:ring-0 p-0"
                />
                <div className="text-center pt-8 space-y-1">
                  <div className="w-64 mx-auto border-t border-foreground" />
                  <p className="text-sm font-semibold">{profile?.id_nome ?? "Profissional"}</p>
                  <p className="text-xs text-muted-foreground">CRO: {(profile as any)?.numero_cro ?? "___________"}</p>
                </div>
              </div>
              <Button className="w-full mt-4 gap-2" onClick={handlePrint}>
                <Printer className="h-4 w-4" /> Imprimir Atestado
              </Button>
            </CardContent>
          </Card>
        </>
      )}
    </div>
  );
}
