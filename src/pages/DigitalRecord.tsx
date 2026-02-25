import { useEffect, useState, useRef, useCallback } from "react";
import { useSearchParams } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { useToast } from "@/hooks/use-toast";
import { formatCPF } from "@/lib/validators";
import { Search, Save, FileHeart, User, CheckCircle2 } from "lucide-react";
import type { Json } from "@/integrations/supabase/types";

interface Patient {
  id: string;
  nome_completo: string;
  cpf: string;
  telefone: string | null;
  data_nascimento: string | null;
}

export default function DigitalRecord() {
  const { profile } = useAuth();
  const { toast } = useToast();
  const [searchParams] = useSearchParams();
  const [cpfSearch, setCpfSearch] = useState(searchParams.get("cpf") ?? "");
  const [patient, setPatient] = useState<Patient | null>(null);
  const [anamnese, setAnamnese] = useState("");
  const [recordId, setRecordId] = useState<string | null>(null);
  const [saving, setSaving] = useState(false);
  const [searching, setSearching] = useState(false);
  const [autoSaved, setAutoSaved] = useState(false);
  const saveTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  const searchPatient = async (cpf?: string) => {
    const searchCpf = (cpf ?? cpfSearch).replace(/\D/g, "");
    if (searchCpf.length < 11) return;
    setSearching(true);
    setPatient(null);

    const { data: patients } = await supabase
      .from("patients")
      .select("*")
      .eq("cpf", searchCpf)
      .limit(1);

    if (!patients?.length) {
      toast({ title: "Paciente não encontrado", variant: "destructive" });
      setSearching(false);
      return;
    }

    const p = patients[0];
    setPatient(p);

    const { data: records } = await supabase
      .from("medical_records")
      .select("id, anamnese")
      .eq("patient_id", p.id)
      .limit(1);

    if (records?.length) {
      setRecordId(records[0].id);
      setAnamnese(records[0].anamnese ?? "");
    } else {
      setRecordId(null);
      setAnamnese("");
    }
    setSearching(false);
  };

  useEffect(() => {
    const cpf = searchParams.get("cpf");
    if (cpf) {
      setCpfSearch(cpf);
      searchPatient(cpf);
    }
  }, []);

  const persistAnamnese = useCallback(async (text: string) => {
    if (!patient || !profile?.organization_id) return;
    setSaving(true);

    const payload = {
      patient_id: patient.id,
      organization_id: profile.organization_id,
      anamnese: text || null,
      updated_at: new Date().toISOString(),
    };

    if (recordId) {
      await supabase.from("medical_records").update(payload).eq("id", recordId);
    } else {
      const { data } = await supabase.from("medical_records").insert(payload).select("id").single();
      if (data) setRecordId(data.id);
    }

    setSaving(false);
    setAutoSaved(true);
    setTimeout(() => setAutoSaved(false), 2000);
  }, [patient, profile, recordId]);

  const scheduleAutoSave = useCallback((text: string) => {
    if (saveTimerRef.current) clearTimeout(saveTimerRef.current);
    saveTimerRef.current = setTimeout(() => persistAnamnese(text), 1500);
  }, [persistAnamnese]);

  const handleAnamneseChange = (text: string) => {
    setAnamnese(text);
    scheduleAutoSave(text);
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-display font-bold flex items-center gap-2">
          <FileHeart className="h-6 w-6 text-primary" /> Prontuário Digital
        </h1>
        <div className="flex items-center gap-3">
          {autoSaved && (
            <span className="flex items-center gap-1 text-xs text-accent animate-in fade-in">
              <CheckCircle2 className="h-3.5 w-3.5" /> Salvo
            </span>
          )}
          {patient && (
            <Button onClick={() => persistAnamnese(anamnese)} disabled={saving} size="sm">
              <Save className="h-4 w-4 mr-2" /> {saving ? "Salvando..." : "Salvar"}
            </Button>
          )}
        </div>
      </div>

      {/* Search */}
      <Card className="border-border/50">
        <CardContent className="p-4">
          <form onSubmit={(e) => { e.preventDefault(); searchPatient(); }} className="flex gap-3 items-end">
            <div className="flex-1 max-w-xs space-y-1.5">
              <Label className="text-xs">Buscar paciente por CPF</Label>
              <div className="relative">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                <Input className="pl-10" placeholder="000.000.000-00" value={cpfSearch} onChange={(e) => setCpfSearch(formatCPF(e.target.value))} />
              </div>
            </div>
            <Button type="submit" variant="secondary" disabled={searching}>
              {searching ? "Buscando..." : "Buscar"}
            </Button>
          </form>
        </CardContent>
      </Card>

      {/* Patient info */}
      {patient && (
        <Card className="border-border/50">
          <CardHeader className="pb-3">
            <CardTitle className="text-sm font-medium flex items-center gap-2">
              <User className="h-4 w-4 text-accent" /> Paciente
            </CardTitle>
          </CardHeader>
          <CardContent className="flex flex-wrap gap-x-8 gap-y-2 text-sm">
            <div><span className="text-muted-foreground">Nome:</span> <strong>{patient.nome_completo}</strong></div>
            <div><span className="text-muted-foreground">CPF:</span> {formatCPF(patient.cpf)}</div>
            {patient.telefone && <div><span className="text-muted-foreground">Tel:</span> {patient.telefone}</div>}
            {patient.data_nascimento && (
              <div><span className="text-muted-foreground">Nasc:</span> {new Date(patient.data_nascimento + "T12:00:00").toLocaleDateString("pt-BR")}</div>
            )}
          </CardContent>
        </Card>
      )}

      {/* Anamnese */}
      {patient && (
        <Card className="border-border/50">
          <CardHeader className="pb-3">
            <CardTitle className="text-lg font-display">Anamnese</CardTitle>
          </CardHeader>
          <CardContent>
            <Textarea
              value={anamnese}
              onChange={(e) => handleAnamneseChange(e.target.value)}
              placeholder="Histórico clínico, alergias, medicamentos em uso..."
              rows={8}
              className="resize-y"
            />
          </CardContent>
        </Card>
      )}
    </div>
  );
}
