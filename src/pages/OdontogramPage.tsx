import { useState, useCallback } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";
import { Odontogram } from "@/components/odontogram/Odontogram";
import { OdontogramData } from "@/components/odontogram/types";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent } from "@/components/ui/card";
import { Label } from "@/components/ui/label";
import { useToast } from "@/hooks/use-toast";
import { formatCPF } from "@/lib/validators";
import { Search, Save, SmilePlus, UserPlus, CheckCircle2 } from "lucide-react";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from "@/components/ui/dialog";
import type { Json } from "@/integrations/supabase/types";

interface Patient {
  id: string;
  nome_completo: string;
  cpf: string;
}

export default function OdontogramPage() {
  const { profile } = useAuth();
  const { toast } = useToast();
  const [odontogramData, setOdontogramData] = useState<OdontogramData>({});
  const [patient, setPatient] = useState<Patient | null>(null);
  const [saving, setSaving] = useState(false);
  const [saved, setSaved] = useState(false);

  // Link dialog
  const [linkOpen, setLinkOpen] = useState(false);
  const [cpfSearch, setCpfSearch] = useState("");
  const [searching, setSearching] = useState(false);

  const hasMarks = Object.keys(odontogramData).length > 0;

  const searchAndLink = async () => {
    const cpf = cpfSearch.replace(/\D/g, "");
    if (cpf.length < 11) return;
    setSearching(true);
    const { data: patients } = await supabase
      .from("patients")
      .select("id, nome_completo, cpf")
      .eq("cpf", cpf)
      .limit(1);

    if (!patients?.length) {
      toast({ title: "Paciente não encontrado", description: "Cadastre-o primeiro na aba Pacientes.", variant: "destructive" });
      setSearching(false);
      return;
    }
    setPatient(patients[0]);
    setLinkOpen(false);
    setSearching(false);
    toast({ title: `Vinculado a ${patients[0].nome_completo}` });
  };

  const handleSave = useCallback(async () => {
    if (!patient || !profile?.organization_id) {
      setLinkOpen(true);
      return;
    }
    setSaving(true);

    // Check if record exists
    const { data: existing } = await supabase
      .from("medical_records")
      .select("id")
      .eq("patient_id", patient.id)
      .limit(1);

    const payload = {
      patient_id: patient.id,
      organization_id: profile.organization_id,
      estado_bucal: odontogramData as unknown as Json,
      updated_at: new Date().toISOString(),
    };

    if (existing?.length) {
      await supabase.from("medical_records").update(payload).eq("id", existing[0].id);
    } else {
      await supabase.from("medical_records").insert(payload);
    }

    setSaving(false);
    setSaved(true);
    setTimeout(() => setSaved(false), 2500);
    toast({ title: "Odontograma salvo!" });
  }, [patient, profile, odontogramData, toast]);

  return (
    <div className="space-y-5">
      {/* Header */}
      <div className="flex items-center justify-between flex-wrap gap-3">
        <h1 className="text-2xl font-display font-bold flex items-center gap-2">
          <SmilePlus className="h-6 w-6 text-accent" /> Odontograma
        </h1>
        <div className="flex items-center gap-3">
          {patient && (
            <span className="text-sm text-muted-foreground">
              Paciente: <strong className="text-foreground">{patient.nome_completo}</strong>
            </span>
          )}
          {saved && (
            <span className="flex items-center gap-1 text-xs text-accent animate-in fade-in">
              <CheckCircle2 className="h-3.5 w-3.5" /> Salvo
            </span>
          )}
          {!patient && hasMarks && (
            <Button variant="outline" size="sm" onClick={() => setLinkOpen(true)}>
              <UserPlus className="h-4 w-4 mr-2" /> Vincular Paciente
            </Button>
          )}
          <Button onClick={handleSave} disabled={saving || !hasMarks} size="sm">
            <Save className="h-4 w-4 mr-2" /> {saving ? "Salvando..." : "Salvar"}
          </Button>
        </div>
      </div>

      {/* Odontogram card */}
      <Card className="border-border/50 shadow-sm">
        <CardContent className="p-5">
          <Odontogram data={odontogramData} onChange={setOdontogramData} />
        </CardContent>
      </Card>

      {/* Link patient dialog */}
      <Dialog open={linkOpen} onOpenChange={setLinkOpen}>
        <DialogContent className="sm:max-w-sm">
          <DialogHeader>
            <DialogTitle className="font-display">Vincular Paciente</DialogTitle>
            <DialogDescription>
              Busque pelo CPF para vincular este odontograma a um paciente.
            </DialogDescription>
          </DialogHeader>
          <form
            onSubmit={(e) => { e.preventDefault(); searchAndLink(); }}
            className="space-y-4 pt-2"
          >
            <div className="space-y-1.5">
              <Label className="text-xs">CPF do Paciente</Label>
              <div className="relative">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                <Input
                  className="pl-10"
                  placeholder="000.000.000-00"
                  value={cpfSearch}
                  onChange={(e) => setCpfSearch(formatCPF(e.target.value))}
                />
              </div>
            </div>
            <Button type="submit" className="w-full" disabled={searching}>
              {searching ? "Buscando..." : "Buscar e Vincular"}
            </Button>
          </form>
        </DialogContent>
      </Dialog>
    </div>
  );
}
