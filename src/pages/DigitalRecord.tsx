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
import { generateClinicalSummary } from "@/lib/generateClinicalSummary";
import { Search, Save, FileHeart, User, CheckCircle2, Clock, AlertCircle } from "lucide-react";
import type { Json } from "@/integrations/supabase/types";
import { format } from "date-fns";

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
  const [estadoBucalRaw, setEstadoBucalRaw] = useState<Json | null>(null);
  const [saving, setSaving] = useState(false);
  const [searching, setSearching] = useState(false);
  const [autoSaved, setAutoSaved] = useState(false);
  const saveTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  const clinicalSummary = generateClinicalSummary(estadoBucalRaw);

  const searchPatient = async (cpf?: string) => {
    const searchCpf = (cpf ?? cpfSearch).replace(/\D/g, "");
    if (searchCpf.length < 11) return;
    setSearching(true);
    setPatient(null);
    setEstadoBucalRaw(null);
    setAnamnese("");
    setRecordId(null);

    // 1. Find patient by CPF (+ organization_id for multi-tenant isolation)
    const query = supabase.from("patients").select("*").eq("cpf", searchCpf);
    if (profile?.organization_id) query.eq("organization_id", profile.organization_id);
    const { data: patients } = await query.limit(1);

    if (!patients?.length) {
      toast({ title: "Paciente não encontrado", variant: "destructive" });
      setSearching(false);
      return;
    }

    const p = patients[0];
    setPatient(p);

    // 2. Load medical_records using the same patient_id + organization_id
    const recQuery = supabase
      .from("medical_records")
      .select("id, anamnese, estado_bucal")
      .eq("patient_id", p.id);
    if (profile?.organization_id) recQuery.eq("organization_id", profile.organization_id);
    const { data: records } = await recQuery.limit(1);

    if (records?.length) {
      setRecordId(records[0].id);
      setAnamnese(records[0].anamnese ?? "");
      setEstadoBucalRaw(records[0].estado_bucal);
    } else {
      setRecordId(null);
      setAnamnese("");
      setEstadoBucalRaw(null);
    }
    setSearching(false);
  };

  useEffect(() => {
    const cpf = searchParams.get("cpf");
    if (cpf) {
      setCpfSearch(cpf);
      searchPatient(cpf);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // Upsert anamnese — insert if no record exists, update if it does
  const persistAnamnese = useCallback(async (text: string) => {
    if (!patient || !profile?.organization_id) return;
    setSaving(true);

    if (recordId) {
      // UPDATE existing record (preserve estado_bucal)
      await supabase
        .from("medical_records")
        .update({
          anamnese: text || null,
          updated_at: new Date().toISOString(),
        })
        .eq("id", recordId);
    } else {
      // INSERT new record
      const { data } = await supabase
        .from("medical_records")
        .insert({
          patient_id: patient.id,
          organization_id: profile.organization_id,
          anamnese: text || null,
          updated_at: new Date().toISOString(),
        })
        .select("id")
        .single();
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

  const getPhaseColorClass = (color: string) => {
    switch (color) {
      case "destructive": return "text-destructive";
      case "warning": return "text-[hsl(var(--tooth-in-progress))]";
      case "completed": return "text-[hsl(var(--tooth-completed))]";
      default: return "text-muted-foreground";
    }
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

      {/* Clinical Summary from JSONB estado_bucal */}
      {patient && (
        <Card className="border-border/50">
          <CardHeader className="pb-3">
            <CardTitle className="text-lg font-display flex items-center gap-2">
              <Clock className="h-5 w-5 text-primary" /> Histórico de Procedimentos (Resumo do Odontograma)
            </CardTitle>
          </CardHeader>
          <CardContent>
            {clinicalSummary.length === 0 ? (
              <div className="flex items-center gap-2 text-sm text-muted-foreground py-4">
                <AlertCircle className="h-4 w-4" />
                Nenhum histórico dentário registrado para este paciente.
              </div>
            ) : (
              <div className="space-y-2">
                {clinicalSummary.map((entry) => (
                  <div key={entry.tooth} className="flex items-start gap-3 rounded-lg border border-border px-3 py-2 text-sm">
                    <div className="shrink-0 w-16 font-semibold text-foreground">Dente {entry.tooth}</div>
                    <div className="flex-1 space-y-0.5">
                      <p>
                        <span className="text-muted-foreground">Diagnóstico:</span>{" "}
                        <span className="font-medium">{entry.conditionLabel}</span>
                      </p>
                      <p>
                        <span className="text-muted-foreground">Status:</span>{" "}
                        <span className={`font-medium ${getPhaseColorClass(entry.phaseColor)}`}>
                          {entry.phaseLabel}
                        </span>
                      </p>
                      {entry.surfaces.length > 0 && (
                        <div className="text-xs text-muted-foreground mt-1">
                          {entry.surfaces.map((s, i) => (
                            <span key={i}>{s.label}: {s.condition}{i < entry.surfaces.length - 1 ? " · " : ""}</span>
                          ))}
                        </div>
                      )}
                      {entry.evolution.length > 0 && (
                        <div className="mt-1 space-y-0.5">
                          {entry.evolution.map((ev, i) => (
                            <p key={i} className="text-xs text-muted-foreground">
                              {ev.date ? format(new Date(ev.date), "dd/MM/yyyy") : "—"} — {ev.condition} ({ev.phase})
                              {ev.professional && ` — ${ev.professional}`}
                              {ev.notes && ` — ${ev.notes}`}
                            </p>
                          ))}
                        </div>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            )}
          </CardContent>
        </Card>
      )}
    </div>
  );
}
