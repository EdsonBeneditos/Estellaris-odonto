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
import { SurfaceName, SURFACE_LABELS, TreatmentPhase } from "./types";
import { Loader2, Plus, ArrowRight, Clock, CheckCircle2, XCircle } from "lucide-react";
import { useToast } from "@/hooks/use-toast";

// ─── Constants ───────────────────────────────────────────────────────────────

const TREATMENT_TYPES = [
  "Restauração",
  "Canal",
  "Extração",
  "Coroa",
  "Selante",
  "Prótese",
  "Implante",
  "Ortodontia",
  "Clareamento",
  "Raspagem",
  "Cirurgia",
  "Outros",
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

const STATUS_BADGE: Record<string, string> = {
  planejado: "bg-red-100 text-red-700 border border-red-200",
  em_andamento: "bg-yellow-100 text-yellow-700 border border-yellow-200",
  concluido: "bg-blue-100 text-blue-700 border border-blue-200",
  cancelado: "bg-gray-100 text-gray-500 border border-gray-200",
};

const STATUS_LABELS: Record<string, string> = {
  planejado: "Planejado",
  em_andamento: "Em andamento",
  concluido: "Concluído",
  cancelado: "Cancelado",
};

// Maps treatment_status → TreatmentPhase (for local face color)
export function statusToPhase(status: string): TreatmentPhase {
  if (status === "em_andamento") return "in_progress";
  if (status === "concluido") return "completed";
  if (status === "cancelado") return "diagnosis"; // treat canceled as diagnosis (white/grey)
  return "diagnosis"; // planejado
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
}

interface Props {
  open: boolean;
  toothNumber: number;
  faceName: SurfaceName;
  patientId: string;
  medicalRecordId: string | null;
  organizationId: string;
  performedBy: string;
  performedByName: string;
  /** Called when a treatment is created or its status changes, so the parent
   *  can update the local odontogram surface color. */
  onSurfaceUpdated: (phase: TreatmentPhase, condition: "healthy" | "cariado" | "restaurado") => void;
  onClose: () => void;
}

// ─── Component ───────────────────────────────────────────────────────────────

export function TreatmentFaceDialog({
  open,
  toothNumber,
  faceName,
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

  // Existing records for this tooth+face (newest first)
  const [records, setRecords] = useState<TreatmentRecord[]>([]);
  const [showNewForm, setShowNewForm] = useState(false);

  // New-treatment form state
  const [formType, setFormType] = useState("");
  const [formDesc, setFormDesc] = useState("");
  const [formNotes, setFormNotes] = useState("");
  const [formDate, setFormDate] = useState(new Date().toISOString().slice(0, 10));

  // ── Load records ──────────────────────────────────────────────────────────

  const fetchRecords = async () => {
    if (!patientId || !organizationId) return;
    setLoading(true);
    const { data, error } = await (supabase as any)
      .from("treatment_history")
      .select(
        "id, treatment_type, treatment_description, treatment_status, phase_number, performed_by_name, treatment_date, notes, created_at",
      )
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
    }
  }, [open, toothNumber, faceName]);

  // ── Helpers ───────────────────────────────────────────────────────────────

  const resetForm = () => {
    setFormType("");
    setFormDesc("");
    setFormNotes("");
    setFormDate(new Date().toISOString().slice(0, 10));
  };

  const activeRecord = records.find(
    (r) => r.treatment_status === "planejado" || r.treatment_status === "em_andamento",
  );

  const hasActive = !!activeRecord;
  const latestRecord = records[0] ?? null;

  // ── Create new treatment ──────────────────────────────────────────────────

  const handleCreate = async () => {
    if (!formType) return;
    setSaving(true);

    const nextPhase = (records.filter((r) => r.treatment_status !== "cancelado").length) + 1;

    const payload = {
      organization_id: organizationId,
      patient_id: patientId,
      medical_record_id: medicalRecordId,
      tooth_number: String(toothNumber),
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

    const { error } = await (supabase as any).from("treatment_history").insert(payload);

    setSaving(false);
    if (error) {
      toast({ title: "Erro ao salvar tratamento", description: error.message, variant: "destructive" });
      return;
    }

    toast({ title: `Tratamento "${formType}" registrado!` });
    onSurfaceUpdated("diagnosis", "cariado");
    fetchRecords();
    setShowNewForm(false);
    resetForm();
  };

  // ── Update treatment status ───────────────────────────────────────────────

  const handleStatusUpdate = async (record: TreatmentRecord, newStatus: string) => {
    setSaving(true);
    const { error } = await (supabase as any)
      .from("treatment_history")
      .update({ treatment_status: newStatus, updated_at: new Date().toISOString() })
      .eq("id", record.id);

    setSaving(false);
    if (error) {
      toast({ title: "Erro ao atualizar status", description: error.message, variant: "destructive" });
      return;
    }

    toast({ title: `Status atualizado para "${STATUS_LABELS[newStatus]}"` });
    const newPhase = statusToPhase(newStatus);
    const newCondition = newStatus === "concluido" ? "restaurado" : "cariado";
    onSurfaceUpdated(newPhase, newCondition as any);
    fetchRecords();
  };

  // ── Cancel treatment ──────────────────────────────────────────────────────

  const handleCancel = async (record: TreatmentRecord) => {
    await handleStatusUpdate(record, "cancelado");
  };

  // ─────────────────────────────────────────────────────────────────────────

  const faceLabel = SURFACE_LABELS[faceName];

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
          ) : (
            <div className="space-y-4">

              {/* ── Active treatment card ─────────────────────────── */}
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
                    <span
                      className={`text-[10px] font-medium px-2 py-0.5 rounded-full shrink-0 ${STATUS_BADGE[activeRecord!.treatment_status]}`}
                    >
                      {STATUS_LABELS[activeRecord!.treatment_status]}
                    </span>
                  </div>

                  {activeRecord!.treatment_date && (
                    <p className="text-[11px] text-muted-foreground flex items-center gap-1">
                      <Clock className="h-3 w-3" />
                      {new Date(activeRecord!.treatment_date + "T12:00:00").toLocaleDateString("pt-BR")}
                      {activeRecord!.performed_by_name && ` — ${activeRecord!.performed_by_name}`}
                    </p>
                  )}

                  {activeRecord!.notes && (
                    <p className="text-[11px] text-muted-foreground italic border-l-2 border-border pl-2">
                      {activeRecord!.notes}
                    </p>
                  )}

                  {/* Status transition buttons */}
                  <div className="flex gap-2 pt-1">
                    {STATUS_NEXT[activeRecord!.treatment_status] && (
                      <Button
                        size="sm"
                        className="flex-1 text-xs gap-1.5"
                        disabled={saving}
                        onClick={() =>
                          handleStatusUpdate(
                            activeRecord!,
                            STATUS_NEXT[activeRecord!.treatment_status]!,
                          )
                        }
                      >
                        {saving ? (
                          <Loader2 className="h-3 w-3 animate-spin" />
                        ) : (
                          <ArrowRight className="h-3 w-3" />
                        )}
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

              {/* ── History of past records ───────────────────────── */}
              {records.length > 0 && (
                <>
                  {(records.length > 1 || !hasActive) && (
                    <>
                      <div>
                        <p className="text-[11px] font-medium text-muted-foreground mb-2">
                          Histórico desta face
                        </p>
                        <div className="space-y-2">
                          {records
                            .filter((r) => !hasActive || r.id !== activeRecord!.id)
                            .map((r) => (
                              <div
                                key={r.id}
                                className="flex items-start gap-3 py-1.5"
                              >
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
                                    <span
                                      className={`text-[9px] font-medium px-1.5 py-0.5 rounded-full shrink-0 ${STATUS_BADGE[r.treatment_status]}`}
                                    >
                                      {STATUS_LABELS[r.treatment_status]}
                                    </span>
                                  </div>
                                  <p className="text-[10px] text-muted-foreground">
                                    {r.treatment_date
                                      ? new Date(r.treatment_date + "T12:00:00").toLocaleDateString("pt-BR")
                                      : new Date(r.created_at).toLocaleDateString("pt-BR")}
                                    {r.performed_by_name && ` — ${r.performed_by_name}`}
                                  </p>
                                </div>
                              </div>
                            ))}
                        </div>
                      </div>
                      <Separator />
                    </>
                  )}
                </>
              )}

              {/* ── New treatment form ────────────────────────────── */}
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
                              <SelectItem key={t} value={t} className="text-xs">
                                {t}
                              </SelectItem>
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
                        <Label className="text-[11px]">Data do tratamento</Label>
                        <Input
                          type="date"
                          className="h-8 text-xs [&::-webkit-calendar-picker-indicator]:dark:invert"
                          value={formDate}
                          onChange={(e) => setFormDate(e.target.value)}
                        />
                      </div>

                      <div className="space-y-1.5">
                        <Label className="text-[11px]">Observações</Label>
                        <Textarea
                          className="text-xs min-h-[64px] resize-none"
                          placeholder="Observações clínicas..."
                          value={formNotes}
                          onChange={(e) => setFormNotes(e.target.value)}
                        />
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
                          Registrar
                        </Button>
                      </div>
                    </div>
                  )}
                </>
              )}

              {/* No records and no active — prompt */}
              {records.length === 0 && !showNewForm && (
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
