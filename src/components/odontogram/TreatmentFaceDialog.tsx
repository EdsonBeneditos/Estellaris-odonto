import { useState, useEffect } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Separator } from "@/components/ui/separator";
import { Textarea } from "@/components/ui/textarea";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { supabase } from "@/integrations/supabase/client";
import { SurfaceName, TreatmentPhase, getSurfaceFullLabel } from "./types";
import { Loader2, Plus, ArrowRight, Clock, CheckCircle2, XCircle } from "lucide-react";
import { useToast } from "@/hooks/use-toast";

// ─── Constants ───────────────────────────────────────────────────────────────

const TREATMENT_TYPES = [
  "Restauração", "Canal", "Extração", "Coroa", "Selante",
  "Prótese", "Implante", "Ortodontia", "Clareamento", "Raspagem", "Cirurgia", "Outros",
];

const STATUS_NEXT: Record<string, string | null> = {
  planejado: "em_andamento",
  em_andamento: "concluido",
  concluido: null,
  cancelado: null,
};

const STATUS_NEXT_LABEL: Record<string, string> = {
  planejado: "Iniciar tratamento",
  em_andamento: "Marcar como concluído",
};

export const STATUS_BADGE: Record<string, string> = {
  planejado: "bg-red-100 text-red-700 border border-red-200",
  em_andamento: "bg-yellow-100 text-yellow-700 border border-yellow-200",
  concluido: "bg-blue-100 text-blue-700 border border-blue-200",
  cancelado: "bg-gray-100 text-gray-500 border border-gray-200",
};

export const STATUS_LABELS: Record<string, string> = {
  planejado: "Planejado",
  em_andamento: "Em andamento",
  concluido: "Concluído",
  cancelado: "Cancelado",
};

// Maps treatment_status → TreatmentPhase (for local face color)
export function statusToPhase(status: string): TreatmentPhase {
  if (status === "em_andamento") return "in_progress";
  if (status === "concluido") return "completed";
  return "diagnosis";
}

// ─── Types ────────────────────────────────────────────────────────────────────

interface TreatmentRecord {
  id: string;
  treatment_type: string;
  treatment_description: string | null;
  treatment_status: string;
  phase_number: number;
  performed_by_name: string | null;
  treatment_date: string | null;
  notes: string | null;
  created_at: string;
  updated_at: string | null;
}

export interface SurfaceUpdate {
  toothNumber: number;
  faceName: SurfaceName;
  phase: TreatmentPhase;
  condition: "healthy" | "cariado" | "restaurado";
}

interface Props {
  open: boolean;
  toothNumber: number;
  faceName: SurfaceName;
  isUpper: boolean;
  allToothNumbers: number[];
  patientId: string;
  medicalRecordId: string | null;
  organizationId: string;
  performedBy: string;
  performedByName: string;
  onSurfaceUpdated: (updates: SurfaceUpdate[]) => void;
  onClose: () => void;
}

// ─── Component ───────────────────────────────────────────────────────────────

export function TreatmentFaceDialog({
  open,
  toothNumber,
  faceName,
  isUpper,
  allToothNumbers,
  patientId,
  medicalRecordId,
  organizationId,
  performedBy,
  performedByName,
  onSurfaceUpdated,
  onClose,
}: Props) {
  const { toast } = useToast();

  const [loading, setLoading] = useState(false);
  const [saving, setSaving] = useState(false);

  const [records, setRecords] = useState<TreatmentRecord[]>([]);
  const [showNewForm, setShowNewForm] = useState(false);

  // New-treatment form
  const [formType, setFormType] = useState("");
  const [formDesc, setFormDesc] = useState("");
  const [formNotes, setFormNotes] = useState("");
  const [formDate, setFormDate] = useState(new Date().toISOString().slice(0, 10));

  // Multi-tooth replication (Tarefa 2)
  const [replicateMode, setReplicateMode] = useState(false);
  const [replicateTeeth, setReplicateTeeth] = useState<number[]>([]);

  // Status-update observation (Tarefa 3)
  const [pendingStatus, setPendingStatus] = useState<{ record: TreatmentRecord; next: string } | null>(null);
  const [statusNotes, setStatusNotes] = useState("");

  // ── Load records ──────────────────────────────────────────────────────────

  const fetchRecords = async () => {
    if (!patientId || !organizationId) return;
    setLoading(true);
    const { data, error } = await (supabase as any)
      .from("treatment_history")
      .select("id, treatment_type, treatment_description, treatment_status, phase_number, performed_by_name, treatment_date, notes, created_at, updated_at")
      .eq("organization_id", organizationId)
      .eq("patient_id", patientId)
      .eq("tooth_number", String(toothNumber))
      .eq("tooth_face", faceName)
      .order("created_at", { ascending: false });

    if (!error) setRecords((data as TreatmentRecord[]) ?? []);
    setLoading(false);
  };

  useEffect(() => {
    if (open) {
      fetchRecords();
      setShowNewForm(false);
      resetForm();
      setPendingStatus(null);
      setStatusNotes("");
    }
  }, [open, toothNumber, faceName]);

  const resetForm = () => {
    setFormType("");
    setFormDesc("");
    setFormNotes("");
    setFormDate(new Date().toISOString().slice(0, 10));
    setReplicateMode(false);
    setReplicateTeeth([]);
  };

  const activeRecord = records.find(
    (r) => r.treatment_status === "planejado" || r.treatment_status === "em_andamento",
  );
  const hasActive = !!activeRecord;

  const toggleReplicateTooth = (num: number) =>
    setReplicateTeeth((prev) =>
      prev.includes(num) ? prev.filter((n) => n !== num) : [...prev, num],
    );

  // ── Create new treatment (+ optional replication) ─────────────────────────

  const handleCreate = async () => {
    if (!formType) return;
    setSaving(true);

    const nextPhase =
      records.filter((r) => r.treatment_status !== "cancelado").length + 1;

    const basePayload = {
      organization_id: organizationId,
      patient_id: patientId,
      medical_record_id: medicalRecordId,
      tooth_face: faceName,
      treatment_type: formType,
      treatment_description: formDesc || null,
      treatment_status: "planejado",
      phase_number: nextPhase,
      performed_by: performedBy,
      performed_by_name: performedByName,
      treatment_date: formDate,
      notes: formNotes || null,
    };

    // Primary tooth
    const inserts = [{ ...basePayload, tooth_number: String(toothNumber) }];

    // Replicated teeth
    for (const tn of replicateTeeth) {
      inserts.push({ ...basePayload, tooth_number: String(tn) });
    }

    const { error } = await (supabase as any).from("treatment_history").insert(inserts);

    setSaving(false);
    if (error) {
      toast({ title: "Erro ao salvar tratamento", description: error.message, variant: "destructive" });
      return;
    }

    toast({ title: `Tratamento "${formType}" registrado em ${inserts.length} dente(s)!` });

    const updates: SurfaceUpdate[] = inserts.map((ins) => ({
      toothNumber: Number(ins.tooth_number),
      faceName,
      phase: "diagnosis" as TreatmentPhase,
      condition: "cariado",
    }));
    onSurfaceUpdated(updates);
    fetchRecords();
    setShowNewForm(false);
    resetForm();
  };

  // ── Status update with mandatory notes (Tarefa 3) ─────────────────────────

  const requestStatusUpdate = (record: TreatmentRecord, next: string) => {
    setPendingStatus({ record, next });
    setStatusNotes("");
  };

  const confirmStatusUpdate = async () => {
    if (!pendingStatus) return;
    if (!statusNotes.trim()) {
      toast({ title: "Observação obrigatória antes de mudar o status.", variant: "destructive" });
      return;
    }
    setSaving(true);
    const { error } = await (supabase as any)
      .from("treatment_history")
      .update({
        treatment_status: pendingStatus.next,
        notes: statusNotes.trim(),
        updated_at: new Date().toISOString(),
      })
      .eq("id", pendingStatus.record.id);

    setSaving(false);
    if (error) {
      toast({ title: "Erro ao atualizar status", description: error.message, variant: "destructive" });
      return;
    }

    toast({ title: `Status: "${STATUS_LABELS[pendingStatus.next]}"` });
    const newPhase = statusToPhase(pendingStatus.next);
    const newCondition = pendingStatus.next === "concluido" ? "restaurado" : "cariado";
    onSurfaceUpdated([{ toothNumber, faceName, phase: newPhase, condition: newCondition }]);
    setPendingStatus(null);
    fetchRecords();
  };

  const handleCancel = async (record: TreatmentRecord) => {
    setSaving(true);
    await (supabase as any)
      .from("treatment_history")
      .update({ treatment_status: "cancelado", updated_at: new Date().toISOString() })
      .eq("id", record.id);
    setSaving(false);
    onSurfaceUpdated([{ toothNumber, faceName, phase: "diagnosis", condition: "healthy" }]);
    fetchRecords();
  };

  // ─────────────────────────────────────────────────────────────────────────

  const faceLabel = getSurfaceFullLabel(faceName, isUpper, toothNumber);
  const otherTeeth = allToothNumbers.filter((n) => n !== toothNumber).sort((a, b) => a - b);

  return (
    <Dialog open={open} onOpenChange={(v) => !v && onClose()}>
      <DialogContent className="sm:max-w-md max-h-[85vh] p-0">
        <DialogHeader className="px-5 pt-5 pb-3">
          <DialogTitle className="font-display text-base flex items-center gap-2">
            Dente {toothNumber}
            <Badge variant="secondary" className="text-xs font-normal">
              Face {faceLabel}
            </Badge>
          </DialogTitle>
        </DialogHeader>

        <ScrollArea className="max-h-[70vh] px-5 pb-5">
          {loading ? (
            <div className="flex items-center justify-center py-10">
              <Loader2 className="h-5 w-5 animate-spin text-muted-foreground" />
            </div>
          ) : pendingStatus ? (
            /* ── Status confirmation with mandatory notes ── */
            <div className="space-y-4 py-2">
              <div className="rounded-lg border border-border bg-muted/30 p-3 text-sm">
                <p className="font-medium">{pendingStatus.record.treatment_type}</p>
                <p className="text-xs text-muted-foreground mt-0.5">
                  {STATUS_LABELS[pendingStatus.record.treatment_status]}
                  {" → "}
                  <span className="font-medium text-foreground">
                    {STATUS_LABELS[pendingStatus.next]}
                  </span>
                </p>
              </div>

              <div className="space-y-1.5">
                <Label className="text-[11px]">
                  Observação <span className="text-destructive">*</span>
                </Label>
                <Textarea
                  className="text-xs min-h-[80px] resize-none"
                  placeholder="Descreva o procedimento realizado, intercorrências, etc..."
                  value={statusNotes}
                  onChange={(e) => setStatusNotes(e.target.value)}
                  autoFocus
                />
                <p className="text-[10px] text-muted-foreground">Campo obrigatório antes de alterar o status.</p>
              </div>

              <div className="flex gap-2">
                <Button
                  variant="ghost"
                  size="sm"
                  className="flex-1 text-xs"
                  onClick={() => setPendingStatus(null)}
                >
                  Voltar
                </Button>
                <Button
                  size="sm"
                  className="flex-1 text-xs"
                  disabled={saving || !statusNotes.trim()}
                  onClick={confirmStatusUpdate}
                >
                  {saving ? <Loader2 className="h-3 w-3 animate-spin mr-1" /> : <ArrowRight className="h-3 w-3 mr-1" />}
                  Confirmar
                </Button>
              </div>
            </div>
          ) : (
            <div className="space-y-4">

              {/* ── Active treatment card ── */}
              {hasActive && (
                <div className="rounded-lg border border-border bg-muted/30 p-4 space-y-3">
                  <div className="flex items-start justify-between gap-2">
                    <div>
                      <p className="text-sm font-semibold">{activeRecord!.treatment_type}</p>
                      {activeRecord!.treatment_description && (
                        <p className="text-xs text-muted-foreground mt-0.5">
                          {activeRecord!.treatment_description}
                        </p>
                      )}
                    </div>
                    <span className={`text-[10px] font-medium px-2 py-0.5 rounded-full shrink-0 ${STATUS_BADGE[activeRecord!.treatment_status]}`}>
                      {STATUS_LABELS[activeRecord!.treatment_status]}
                    </span>
                  </div>

                  <div className="text-[11px] text-muted-foreground space-y-0.5">
                    {activeRecord!.treatment_date && (
                      <p className="flex items-center gap-1">
                        <Clock className="h-3 w-3" />
                        Início: {new Date(activeRecord!.treatment_date + "T12:00:00").toLocaleDateString("pt-BR")}
                        {activeRecord!.performed_by_name && ` — ${activeRecord!.performed_by_name}`}
                      </p>
                    )}
                    {activeRecord!.updated_at && activeRecord!.updated_at !== activeRecord!.created_at && (
                      <p className="flex items-center gap-1">
                        <Clock className="h-3 w-3 opacity-50" />
                        Atualizado: {new Date(activeRecord!.updated_at).toLocaleDateString("pt-BR")}
                      </p>
                    )}
                    {activeRecord!.notes && (
                      <p className="italic border-l-2 border-border pl-2 mt-1">{activeRecord!.notes}</p>
                    )}
                  </div>

                  <div className="flex gap-2 pt-1">
                    {STATUS_NEXT[activeRecord!.treatment_status] && (
                      <Button
                        size="sm"
                        className="flex-1 text-xs gap-1.5"
                        disabled={saving}
                        onClick={() => requestStatusUpdate(activeRecord!, STATUS_NEXT[activeRecord!.treatment_status]!)}
                      >
                        <ArrowRight className="h-3 w-3" />
                        {STATUS_NEXT_LABEL[activeRecord!.treatment_status]}
                      </Button>
                    )}
                    <Button
                      size="sm"
                      variant="ghost"
                      className="text-xs gap-1.5 text-destructive hover:text-destructive"
                      disabled={saving}
                      onClick={() => handleCancel(activeRecord!)}
                    >
                      <XCircle className="h-3 w-3" />
                      Cancelar
                    </Button>
                  </div>
                </div>
              )}

              {/* ── Past history ── */}
              {records.filter((r) => !hasActive || r.id !== activeRecord!.id).length > 0 && (
                <>
                  <div>
                    <p className="text-[11px] font-medium text-muted-foreground mb-2">Histórico desta face</p>
                    <div className="space-y-2">
                      {records
                        .filter((r) => !hasActive || r.id !== activeRecord!.id)
                        .map((r) => (
                          <div key={r.id} className="flex items-start gap-3 py-1.5">
                            <div className="mt-0.5">
                              {r.treatment_status === "concluido" ? (
                                <CheckCircle2 className="h-3.5 w-3.5 text-blue-500" />
                              ) : r.treatment_status === "cancelado" ? (
                                <XCircle className="h-3.5 w-3.5 text-muted-foreground" />
                              ) : (
                                <Clock className="h-3.5 w-3.5 text-yellow-500" />
                              )}
                            </div>
                            <div className="flex-1 min-w-0">
                              <div className="flex items-center gap-2">
                                <p className="text-xs font-medium truncate">{r.treatment_type}</p>
                                <span className={`text-[9px] font-medium px-1.5 py-0.5 rounded-full shrink-0 ${STATUS_BADGE[r.treatment_status]}`}>
                                  {STATUS_LABELS[r.treatment_status]}
                                </span>
                              </div>
                              <p className="text-[10px] text-muted-foreground">
                                Início: {r.treatment_date
                                  ? new Date(r.treatment_date + "T12:00:00").toLocaleDateString("pt-BR")
                                  : new Date(r.created_at).toLocaleDateString("pt-BR")}
                                {r.updated_at && r.updated_at !== r.created_at &&
                                  ` · Atualizado: ${new Date(r.updated_at).toLocaleDateString("pt-BR")}`}
                                {r.performed_by_name && ` — ${r.performed_by_name}`}
                              </p>
                              {r.notes && (
                                <p className="text-[10px] text-muted-foreground italic mt-0.5 border-l border-border pl-1.5">
                                  {r.notes}
                                </p>
                              )}
                            </div>
                          </div>
                        ))}
                    </div>
                  </div>
                  <Separator />
                </>
              )}

              {/* ── New treatment form ── */}
              {(!hasActive || showNewForm) && (
                <>
                  {records.length > 0 && !showNewForm && (
                    <Button
                      variant="outline"
                      size="sm"
                      className="w-full gap-1.5 text-xs"
                      onClick={() => setShowNewForm(true)}
                    >
                      <Plus className="h-3.5 w-3.5" /> Novo tratamento para esta face
                    </Button>
                  )}

                  {(records.length === 0 || showNewForm) && (
                    <div className="space-y-3">
                      <p className="text-xs font-medium text-muted-foreground">
                        {records.length === 0 ? "Registrar tratamento" : "Novo tratamento"}
                      </p>

                      <div className="space-y-1.5">
                        <Label className="text-[11px]">Tipo de tratamento *</Label>
                        <Select value={formType} onValueChange={setFormType}>
                          <SelectTrigger className="h-8 text-xs">
                            <SelectValue placeholder="Selecionar..." />
                          </SelectTrigger>
                          <SelectContent>
                            {TREATMENT_TYPES.map((t) => (
                              <SelectItem key={t} value={t} className="text-xs">{t}</SelectItem>
                            ))}
                          </SelectContent>
                        </Select>
                      </div>

                      <div className="space-y-1.5">
                        <Label className="text-[11px]">Descrição</Label>
                        <Input
                          className="h-8 text-xs"
                          placeholder="Ex: Restauração em resina composta"
                          value={formDesc}
                          onChange={(e) => setFormDesc(e.target.value)}
                        />
                      </div>

                      <div className="space-y-1.5">
                        <Label className="text-[11px]">Data</Label>
                        <Input
                          type="date"
                          className="h-8 text-xs [&::-webkit-calendar-picker-indicator]:dark:invert"
                          value={formDate}
                          onChange={(e) => setFormDate(e.target.value)}
                        />
                      </div>

                      <div className="space-y-1.5">
                        <Label className="text-[11px]">Observações iniciais</Label>
                        <Textarea
                          className="text-xs min-h-[56px] resize-none"
                          placeholder="Observações clínicas..."
                          value={formNotes}
                          onChange={(e) => setFormNotes(e.target.value)}
                        />
                      </div>

                      {/* ── Multi-tooth replication (Tarefa 2) ── */}
                      <Separator />
                      <div className="space-y-2">
                        <div className="flex items-center gap-2">
                          <input
                            type="checkbox"
                            id="replicate-multi"
                            checked={replicateMode}
                            onChange={(e) => { setReplicateMode(e.target.checked); setReplicateTeeth([]); }}
                            className="h-3.5 w-3.5"
                          />
                          <Label htmlFor="replicate-multi" className="text-[11px] cursor-pointer">
                            Aplicar em múltiplos dentes (mesma face)
                          </Label>
                        </div>

                        {replicateMode && otherTeeth.length > 0 && (
                          <div>
                            <p className="text-[10px] text-muted-foreground mb-1.5">
                              Selecione os dentes adicionais:
                            </p>
                            <div className="flex flex-wrap gap-1 max-h-24 overflow-y-auto">
                              {otherTeeth.map((num) => (
                                <button
                                  key={num}
                                  type="button"
                                  onClick={() => toggleReplicateTooth(num)}
                                  className={`h-7 w-9 rounded text-[11px] border transition-colors ${
                                    replicateTeeth.includes(num)
                                      ? "bg-primary text-primary-foreground border-primary"
                                      : "border-border hover:border-muted-foreground/40"
                                  }`}
                                >
                                  {num}
                                </button>
                              ))}
                            </div>
                            {replicateTeeth.length > 0 && (
                              <p className="text-[10px] text-muted-foreground mt-1">
                                {replicateTeeth.length + 1} dente(s) serão registrados.
                              </p>
                            )}
                          </div>
                        )}
                      </div>

                      <div className="flex gap-2">
                        {showNewForm && (
                          <Button
                            variant="ghost"
                            size="sm"
                            className="flex-1 text-xs"
                            onClick={() => { setShowNewForm(false); resetForm(); }}
                          >
                            Cancelar
                          </Button>
                        )}
                        <Button
                          size="sm"
                          className="flex-1 text-xs"
                          disabled={!formType || saving}
                          onClick={handleCreate}
                        >
                          {saving ? (
                            <Loader2 className="h-3 w-3 animate-spin mr-1" />
                          ) : (
                            <Plus className="h-3 w-3 mr-1" />
                          )}
                          Registrar{replicateTeeth.length > 0 ? ` (${replicateTeeth.length + 1})` : ""}
                        </Button>
                      </div>
                    </div>
                  )}
                </>
              )}

              {records.length === 0 && (
                <p className="text-xs text-muted-foreground text-center py-2">
                  Nenhum tratamento registrado para esta face.
                </p>
              )}
            </div>
          )}
        </ScrollArea>
      </DialogContent>
    </Dialog>
  );
}
