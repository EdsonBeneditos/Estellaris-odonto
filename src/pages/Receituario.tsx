import { useState } from "react";
import { useAuth } from "@/contexts/AuthContext";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";
import { FileText, Search, Printer } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { formatCPF } from "@/lib/validators";
import { format } from "date-fns";

export default function Receituario() {
  const { profile, organization } = useAuth();
  const { toast } = useToast();
  const [cpf, setCpf] = useState("");
  const [patientName, setPatientName] = useState("");
  const [patientCpf, setPatientCpf] = useState("");
  const [prescription, setPrescription] = useState("");
  const [date] = useState(format(new Date(), "yyyy-MM-dd"));
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

  const handlePrint = () => {
    const printWindow = window.open("", "_blank");
    if (!printWindow) return;
    printWindow.document.write(`
      <html><head><title>Receituário</title>
      <style>
        body { font-family: 'Inter', sans-serif; padding: 60px; max-width: 700px; margin: 0 auto; color: #1a1a2e; }
        .header { text-align: center; margin-bottom: 30px; border-bottom: 2px solid #2d6a6a; padding-bottom: 20px; }
        .header h1 { font-size: 18px; margin: 0; letter-spacing: 1px; }
        .header p { font-size: 12px; color: #666; margin: 4px 0 0; }
        .patient { font-size: 13px; margin-bottom: 30px; }
        .patient p { margin: 4px 0; }
        .rx { font-size: 32px; font-weight: bold; color: #2d6a6a; margin: 20px 0; }
        .prescription { font-size: 14px; line-height: 1.8; white-space: pre-wrap; min-height: 200px; border-top: 1px solid #eee; padding-top: 20px; }
        .footer { margin-top: 80px; text-align: center; }
        .footer .line { width: 300px; border-top: 1px solid #333; margin: 0 auto 8px; }
        .footer p { font-size: 12px; margin: 2px 0; }
        .date { text-align: right; font-size: 12px; color: #666; margin-top: 40px; }
      </style>
      </head><body>
        <div class="header">
          <h1>${organization?.nome_clinica ?? "Clínica Odontológica"}</h1>
          <p>RECEITUÁRIO</p>
        </div>
        <div class="patient">
          <p><strong>Paciente:</strong> ${patientName}</p>
          <p><strong>CPF:</strong> ${formatCPF(patientCpf)}</p>
        </div>
        <div class="rx">Rx</div>
        <div class="prescription">${prescription || "(prescrição)"}</div>
        <div class="date">${format(new Date(date + "T12:00:00"), "dd/MM/yyyy")}</div>
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
        <FileText className="h-6 w-6 text-primary" /> Receituário
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
              <CardTitle className="text-sm font-medium">Prescrição</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="bg-card border border-border rounded-lg p-6 space-y-6">
                {/* Header */}
                <div className="text-center border-b border-border pb-4">
                  <p className="font-display font-bold text-foreground">{organization?.nome_clinica ?? "Clínica Odontológica"}</p>
                  <p className="text-xs text-muted-foreground tracking-widest uppercase mt-1">Receituário</p>
                </div>

                {/* Patient */}
                <div className="text-sm space-y-1">
                  <p><span className="text-muted-foreground">Paciente:</span> <strong>{patientName}</strong></p>
                  <p><span className="text-muted-foreground">CPF:</span> {formatCPF(patientCpf)}</p>
                </div>

                {/* Rx */}
                <p className="text-3xl font-bold text-primary">Rx</p>

                {/* Prescription */}
                <Textarea
                  value={prescription}
                  onChange={e => setPrescription(e.target.value)}
                  placeholder="Medicamento, posologia, duração do tratamento..."
                  rows={8}
                  className="resize-y"
                />

                {/* Date */}
                <p className="text-right text-xs text-muted-foreground">
                  {format(new Date(date + "T12:00:00"), "dd/MM/yyyy")}
                </p>

                {/* Footer / Signature */}
                <div className="text-center pt-8 space-y-1">
                  <div className="w-64 mx-auto border-t border-foreground" />
                  <p className="text-sm font-semibold">{profile?.id_nome ?? "Profissional"}</p>
                  <p className="text-xs text-muted-foreground">CRO: {(profile as any)?.numero_cro ?? "___________"}</p>
                </div>
              </div>

              <Button className="w-full mt-4 gap-2" onClick={handlePrint}>
                <Printer className="h-4 w-4" /> Imprimir Receituário
              </Button>
            </CardContent>
          </Card>
        </>
      )}
    </div>
  );
}
