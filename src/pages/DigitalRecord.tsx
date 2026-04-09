import { useEffect, useState, useRef, useCallback } from "react";
import { useSearchParams } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { useToast } from "@/hooks/use-toast";
import { formatCPF } from "@/lib/validators";
import { generateClinicalSummary } from "@/lib/generateClinicalSummary";
import { Search, Save, FileHeart, User, CheckCircle2, Clock, AlertCircle, Stethoscope, ClipboardList } from "lucide-react";
import type { Json } from "@/integrations/supabase/types";
import { format } from "date-fns";

interface Patient {
  id: string;
  nome_completo: string;
  cpf: string;
  telefone: string | null;
  data_nascimento: string | null;
}

interface TreatmentRecord {
  id: string;
  tooth_number: string | null;
  face_name: string | null;
  treatment_type: string | null;
  treatment_status: string | null;
  notes: string | null;
  treatment_date: string | null;
  created_at: string;
  updated_at: string | null;
}

const STATUS_LABEL: Record<string, string> = {
  diagnostico: "Diagnóstico",
  em_andamento: "Em andamento",
  concluido: "Concluído",
  cancelado: "Cancelado",
};

const STATUS_CLASS: Record<string, string> = {
  diagnostico: "bg-red-100 text-red-700 dark:bg-red-950/40 dark:text-red-400 border-red-200 dark:border-red-800",
  em_andamento: "bg-yellow-100 text-yellow-700 dark:bg-yellow-950/40 dark:text-yellow-400 border-yellow-200 dark:border-yellow-800",
  concluido: "bg-blue-100 text-blue-700 dark:bg-blue-950/40 dark:text-blue-400 border-blue-200 dark:border-blue-800",
  cancelado: "bg-muted text-muted-foreground border-border",
};

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
  const [treatments, setTreatments] = useState<TreatmentRecord[]>([]);
  const [loadingTreatments, setLoadingTreatments] = useState(false);
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
    setTreatments([]);

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
      loadTreatments(p.id);
    } else {
      setRecordId(null);
      setAnamnese("");
      setEstadoBucalRaw(null);
    }
    setSearching(false);
  };

  const loadTreatments = async (patientId: string) => {
    setLoadingTreatments(true);
    const { data } = await (supabase as any)
      .from("treatment_history")
      .select("id, tooth_number, face_name, treatment_type, treatment_status, notes, treatment_date, created_at, updated_at")
      .eq("patient_id", patientId)
      .order("created_at", { ascending: false });
    setTreatments(data ?? []);
    setLoadingTreatments(false);
  };

  useEffect(() => {
    const cpf = searchParams.get("cpf");
    if (cpf) {
      setCpfSearch(cpf);
      searchPatient(cpf);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const persistAnamnese = useCallback(async (text: string) => {
    if (!patient || !profile?.organization_id) return;
    setSaving(true);

    if (recordId) {
      await supabase
        .from("medical_records")
        .update({ anamnese: text || null, updated_at: new Date().toISOString() })
        .eq("id", recordId);
    } else {
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

  // Group treatments by tooth for display
  const treatmentsByTooth = treatments.reduce<Record<string, TreatmentRecord[]>>((acc, t) => {
    const key = t.tooth_number ?? "geral";
    if (!acc[key]) acc[key] = [];
    acc[key].push(t);
    return acc;
  }, {});

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

      {/* Tabs */}
      {patient && (
        <Tabs defaultValue="anamnese">
          <TabsList className="mb-4">
            <TabsTrigger value="anamnese" className="gap-2">
              <ClipboardList className="h-4 w-4" /> Anamnese
            </TabsTrigger>
            <TabsTrigger value="tratamentos" className="gap-2">
              <Stethoscope className="h-4 w-4" />
              Tratamentos
              {treatments.length > 0 && (
                <Badge variant="secondary" className="ml-1 h-4 px-1.5 text-[10px]">{treatments.length}</Badge>
              )}
            </TabsTrigger>
            <TabsTrigger value="odontograma" className="gap-2">
              <Clock className="h-4 w-4" />
              Odontograma
              {clinicalSummary.length > 0 && (
                <Badge variant="secondary" className="ml-1 h-4 px-1.5 text-[10px]">{clinicalSummary.length}</Badge>
              )}
            </TabsTrigger>
          </TabsList>

          {/* Anamnese tab */}
          <TabsContent value="anamnese">
            <Card className="border-border/50">
              <CardHeader className="pb-3">
                <CardTitle className="text-lg font-display">Anamnese</CardTitle>
              </CardHeader>
              <CardContent>
                <Textarea
                  value={anamnese}
                  onChange={(e) => handleAnamneseChange(e.target.value)}
                  placeholder="Histórico clínico, alergias, medicamentos em uso..."
                  rows={10}
                  className="resize-y"
                />
              </CardContent>
            </Card>
          </TabsContent>

          {/* Tratamentos tab */}
          <TabsContent value="tratamentos">
            <Card className="border-border/50">
              <CardHeader className="pb-3">
                <CardTitle className="text-lg font-display flex items-center justify-between">
                  <span>Histórico de Tratamentos</span>
                  {!loadingTreatments && (
                    <span className="text-sm font-normal text-muted-foreground">
                      {treatments.length} registro{treatments.length !== 1 ? "s" : ""}
                    </span>
                  )}
                </CardTitle>
              </CardHeader>
              <CardContent>
                {loadingTreatments ? (
                  <div className="py-8 text-center text-sm text-muted-foreground">Carregando...</div>
                ) : treatments.length === 0 ? (
                  <div className="flex items-center gap-2 text-sm text-muted-foreground py-6">
                    <AlertCircle className="h-4 w-4" />
                    Nenhum tratamento registrado para este paciente.
                  </div>
                ) : (
                  <div className="space-y-4">
                    {Object.entries(treatmentsByTooth)
                      .sort(([a], [b]) => {
                        if (a === "geral") return 1;
                        if (b === "geral") return -1;
                        return Number(a) - Number(b);
                      })
                      .map(([toothNum, records]) => (
                        <div key={toothNum}>
                          <div className="flex items-center gap-2 mb-2">
                            <span className="text-xs font-semibold text-muted-foreground uppercase tracking-wide">
                              {toothNum === "geral" ? "Geral" : `Dente ${toothNum}`}
                            </span>
                            <div className="flex-1 border-t border-border" />
                            <span className="text-xs text-muted-foreground">{records.length} reg.</span>
                          </div>
                          <div className="space-y-2 pl-1">
                            {records.map((r) => (
                              <div key={r.id} className="rounded-lg border border-border px-3 py-2.5 text-sm space-y-1.5">
                                <div className="flex items-center justify-between gap-2 flex-wrap">
                                  <div className="flex items-center gap-2 flex-wrap">
                                    {r.treatment_type && (
                                      <span className="font-medium text-foreground">{r.treatment_type}</span>
                                    )}
                                    {r.face_name && (
                                      <span className="text-xs text-muted-foreground">· Face {r.face_name}</span>
                                    )}
                                  </div>
                                  {r.treatment_status && (
                                    <span className={`inline-flex items-center rounded-full border px-2 py-0.5 text-[11px] font-medium ${STATUS_CLASS[r.treatment_status] ?? STATUS_CLASS.cancelado}`}>
                                      {STATUS_LABEL[r.treatment_status] ?? r.treatment_status}
                                    </span>
                                  )}
                                </div>
                                {r.notes && (
                                  <p className="text-xs text-muted-foreground leading-relaxed">{r.notes}</p>
                                )}
                                <div className="flex items-center gap-3 text-[11px] text-muted-foreground">
                                  <span>
                                    Início: {r.treatment_date
                                      ? format(new Date(r.treatment_date + "T12:00:00"), "dd/MM/yyyy")
                                      : format(new Date(r.created_at), "dd/MM/yyyy")}
                                  </span>
                                  {r.updated_at && r.updated_at !== r.created_at && (
                                    <span>· Atualizado: {format(new Date(r.updated_at), "dd/MM/yyyy")}</span>
                                  )}
                                </div>
                              </div>
                            ))}
                          </div>
                        </div>
                      ))}
                  </div>
                )}
              </CardContent>
            </Card>
          </TabsContent>

          {/* Odontograma tab */}
          <TabsContent value="odontograma">
            <Card className="border-border/50">
              <CardHeader className="pb-3">
                <CardTitle className="text-lg font-display">Resumo do Odontograma</CardTitle>
              </CardHeader>
              <CardContent>
                {clinicalSummary.length === 0 ? (
                  <div className="flex items-center gap-2 text-sm text-muted-foreground py-6">
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
          </TabsContent>
        </Tabs>
      )}
    </div>
  );
}
