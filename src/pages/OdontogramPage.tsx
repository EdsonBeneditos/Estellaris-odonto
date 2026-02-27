import { useState, useCallback, useEffect } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";
import { Odontogram } from "@/components/odontogram/Odontogram";
import { OdontogramData, OdontogramMeta, DEFAULT_META } from "@/components/odontogram/types";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent } from "@/components/ui/card";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { useToast } from "@/hooks/use-toast";
import { formatCPF } from "@/lib/validators";
import { Search, Save, SmilePlus, UserPlus, CheckCircle2, Download } from "lucide-react";
import {
  Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription,
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
  const [meta, setMeta] = useState<OdontogramMeta>(DEFAULT_META);
  const [patient, setPatient] = useState<Patient | null>(null);
  const [saving, setSaving] = useState(false);
  const [saved, setSaved] = useState(false);

  // Link dialog
  const [linkOpen, setLinkOpen] = useState(false);
  const [cpfSearch, setCpfSearch] = useState("");
  const [searching, setSearching] = useState(false);

  // Patient selector for loading
  const [patientList, setPatientList] = useState<Patient[]>([]);
  const [loadingPatients, setLoadingPatients] = useState(false);

  const hasMarks = Object.keys(odontogramData).length > 0;

  // Load patient list on mount
  useEffect(() => {
    if (!profile?.organization_id) return;
    const fetchPatients = async () => {
      setLoadingPatients(true);
      const { data } = await supabase
        .from("patients")
        .select("id, nome_completo, cpf")
        .eq("organization_id", profile.organization_id)
        .order("nome_completo")
        .limit(200);
      setPatientList((data as Patient[]) ?? []);
      setLoadingPatients(false);
    };
    fetchPatients();
  }, [profile?.organization_id]);

  // Load odontogram when patient changes
  const loadOdontogram = useCallback(async (patientId: string) => {
    const { data: records } = await supabase
      .from("medical_records")
      .select("estado_bucal")
      .eq("patient_id", patientId)
      .limit(1);

    if (records?.length && records[0].estado_bucal) {
      const stored = records[0].estado_bucal as any;
      if (stored.teeth) setOdontogramData(stored.teeth);
      if (stored.meta) setMeta(stored.meta);
      toast({ title: "Prontuário carregado!" });
    } else {
      setOdontogramData({});
      setMeta(DEFAULT_META);
    }
  }, [toast]);

  const handleSelectPatient = (patientId: string) => {
    const p = patientList.find(x => x.id === patientId);
    if (p) {
      setPatient(p);
      loadOdontogram(p.id);
    }
  };

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
    loadOdontogram(patients[0].id);
    toast({ title: `Vinculado a ${patients[0].nome_completo}` });
  };

  const handleSave = useCallback(async () => {
    if (!patient || !profile?.organization_id) {
      setLinkOpen(true);
      return;
    }
    setSaving(true);

    const payload = {
      patient_id: patient.id,
      organization_id: profile.organization_id,
      estado_bucal: { teeth: odontogramData, meta } as unknown as Json,
      updated_at: new Date().toISOString(),
    };

    const { data: existing } = await supabase
      .from("medical_records")
      .select("id")
      .eq("patient_id", patient.id)
      .limit(1);

    if (existing?.length) {
      await supabase.from("medical_records").update(payload).eq("id", existing[0].id);
    } else {
      await supabase.from("medical_records").insert(payload);
    }

    setSaving(false);
    setSaved(true);
    setTimeout(() => setSaved(false), 2500);
    toast({ title: "Odontograma salvo com sucesso!" });
  }, [patient, profile, odontogramData, meta, toast]);

  const handleNewBudget = () => {
    setPatient(null);
    setOdontogramData({});
    setMeta(DEFAULT_META);
  };

  return (
    <div className="space-y-5">
      {/* Header */}
      <div className="flex items-center justify-between flex-wrap gap-3">
        <h1 className="text-2xl font-display font-bold flex items-center gap-2">
          <SmilePlus className="h-6 w-6 text-accent" /> Odontograma
        </h1>
        <div className="flex items-center gap-3 flex-wrap">
          {/* Patient selector */}
          <div className="flex items-center gap-2">
            <Label className="text-xs text-muted-foreground whitespace-nowrap">Carregar Prontuário:</Label>
            <Select value={patient?.id ?? ""} onValueChange={handleSelectPatient}>
              <SelectTrigger className="h-8 w-52 text-xs">
                <SelectValue placeholder="Selecionar paciente..." />
              </SelectTrigger>
              <SelectContent>
                {patientList.map(p => (
                  <SelectItem key={p.id} value={p.id} className="text-xs">
                    {p.nome_completo}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          {patient && (
            <span className="text-sm text-muted-foreground">
              <strong className="text-foreground">{patient.nome_completo}</strong>
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
          <Button variant="ghost" size="sm" onClick={handleNewBudget}>
            Novo Orçamento
          </Button>
          <Button onClick={handleSave} disabled={saving || !hasMarks} size="sm">
            <Save className="h-4 w-4 mr-2" /> {saving ? "Salvando..." : "Salvar"}
          </Button>
        </div>
      </div>

      {/* Odontogram */}
      <Card className="border-border/50 shadow-sm">
        <CardContent className="p-5">
          <Odontogram
            data={odontogramData}
            meta={meta}
            onChange={setOdontogramData}
            onMetaChange={setMeta}
            profileId={profile?.id}
            profileName={profile?.id_nome}
          />
        </CardContent>
      </Card>

      {/* Link patient dialog */}
      <Dialog open={linkOpen} onOpenChange={setLinkOpen}>
        <DialogContent className="sm:max-w-sm">
          <DialogHeader>
            <DialogTitle className="font-display">Vincular Paciente</DialogTitle>
            <DialogDescription>
              Busque pelo CPF para vincular este odontograma a um paciente cadastrado.
            </DialogDescription>
          </DialogHeader>
          <form onSubmit={(e) => { e.preventDefault(); searchAndLink(); }} className="space-y-4 pt-2">
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
