import { useState } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Switch } from "@/components/ui/switch";
import { Label } from "@/components/ui/label";
import { Separator } from "@/components/ui/separator";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Copy, CopyCheck, Clock } from "lucide-react";
import {
  ClinicalCondition, TreatmentPhase, SurfaceName,
  CLINICAL_CONDITIONS, CONDITION_LABELS, PHASE_LABELS,
  ToothData, EvolutionEntry, SURFACE_LABELS,
  getPhaseColor,
} from "./types";

interface ClinicalDialogProps {
  open: boolean;
  tooth: ToothData;
  surfaceName: SurfaceName | null;
  onApply: (condition: ClinicalCondition, phase: TreatmentPhase, replicateToTeeth: number[]) => void;
  onClose: () => void;
  allToothNumbers: number[];
}

export function ClinicalDialog({ open, tooth, surfaceName, onApply, onClose, allToothNumbers }: ClinicalDialogProps) {
  const [selectedCondition, setSelectedCondition] = useState<ClinicalCondition | null>(null);
  const [selectedPhase, setSelectedPhase] = useState<TreatmentPhase>("diagnosis");
  const [replicateMode, setReplicateMode] = useState(false);
  const [replicateTeeth, setReplicateTeeth] = useState<number[]>([]);
  const [showEvolution, setShowEvolution] = useState(false);

  const col1 = CLINICAL_CONDITIONS.filter(c => c.column === 1);
  const col2 = CLINICAL_CONDITIONS.filter(c => c.column === 2);

  const isCompleted = tooth.phase === "completed";
  const hasEvolution = tooth.evolution.length > 0;

  const handleApply = () => {
    if (!selectedCondition) return;
    onApply(selectedCondition, selectedPhase, replicateMode ? replicateTeeth : []);
    setSelectedCondition(null);
    setReplicateMode(false);
    setReplicateTeeth([]);
  };

  const toggleReplicateTooth = (num: number) => {
    setReplicateTeeth(prev =>
      prev.includes(num) ? prev.filter(n => n !== num) : [...prev, num]
    );
  };

  return (
    <Dialog open={open} onOpenChange={(v) => !v && onClose()}>
      <DialogContent className="sm:max-w-lg max-h-[85vh] p-0">
        <DialogHeader className="px-5 pt-5 pb-3">
          <DialogTitle className="font-display text-base flex items-center gap-2">
            Dente {tooth.number}
            {surfaceName && (
              <Badge variant="secondary" className="text-xs font-normal">
                Face {SURFACE_LABELS[surfaceName]}
              </Badge>
            )}
            {isCompleted && hasEvolution && (
              <Button
                variant="ghost" size="sm"
                className="ml-auto text-xs gap-1.5"
                onClick={() => setShowEvolution(!showEvolution)}
              >
                <Clock className="h-3.5 w-3.5" />
                {showEvolution ? "Condições" : "Evolução"}
              </Button>
            )}
          </DialogTitle>
        </DialogHeader>

        <ScrollArea className="max-h-[60vh] px-5 pb-5">
          {showEvolution ? (
            <EvolutionTimeline entries={tooth.evolution} />
          ) : (
            <div className="space-y-4">
              {/* Phase selector */}
              <div>
                <p className="text-xs font-medium text-muted-foreground mb-2">Fase do Tratamento</p>
                <div className="flex gap-2">
                  {(["diagnosis", "in_progress", "completed"] as TreatmentPhase[]).map(p => (
                    <button
                      key={p}
                      onClick={() => setSelectedPhase(p)}
                      className={`flex-1 rounded-lg border px-3 py-2 text-xs transition-all ${
                        selectedPhase === p ? "ring-2 ring-ring shadow-sm" : "border-border hover:border-muted-foreground/30"
                      }`}
                    >
                      <div
                        className="h-2 w-2 rounded-full mx-auto mb-1"
                        style={{ backgroundColor: getPhaseColor(p) }}
                      />
                      {PHASE_LABELS[p].split(" (")[0]}
                    </button>
                  ))}
                </div>
              </div>

              <Separator />

              {/* Conditions in 2 columns */}
              <div>
                <p className="text-xs font-medium text-muted-foreground mb-2">Condições Clínicas</p>
                <div className="grid grid-cols-2 gap-x-3 gap-y-1.5">
                  <div className="space-y-1.5">
                    {col1.map(c => (
                      <ConditionButton
                        key={c.id}
                        condition={c}
                        selected={selectedCondition === c.id}
                        phase={selectedPhase}
                        onClick={() => setSelectedCondition(selectedCondition === c.id ? null : c.id)}
                      />
                    ))}
                  </div>
                  <div className="space-y-1.5">
                    {col2.map(c => (
                      <ConditionButton
                        key={c.id}
                        condition={c}
                        selected={selectedCondition === c.id}
                        phase={selectedPhase}
                        onClick={() => setSelectedCondition(selectedCondition === c.id ? null : c.id)}
                      />
                    ))}
                  </div>
                </div>
              </div>

              <Separator />

              {/* Replicate section */}
              <div>
                <div className="flex items-center gap-2 mb-2">
                  <Switch id="replicate-dialog" checked={replicateMode} onCheckedChange={setReplicateMode} />
                  <Label htmlFor="replicate-dialog" className="text-xs flex items-center gap-1.5">
                    {replicateMode ? <CopyCheck className="h-3.5 w-3.5 text-accent" /> : <Copy className="h-3.5 w-3.5" />}
                    Replicar para outros dentes
                  </Label>
                </div>
                {replicateMode && (
                  <div className="flex flex-wrap gap-1 max-h-24 overflow-y-auto">
                    {allToothNumbers.filter(n => n !== tooth.number).map(num => (
                      <button
                        key={num}
                        onClick={() => toggleReplicateTooth(num)}
                        className={`h-7 w-9 rounded text-xs border transition-colors ${
                          replicateTeeth.includes(num)
                            ? "bg-accent text-accent-foreground border-accent"
                            : "border-border hover:border-muted-foreground/40"
                        }`}
                      >
                        {num}
                      </button>
                    ))}
                  </div>
                )}
              </div>

              {/* Apply button */}
              <Button
                className="w-full"
                disabled={!selectedCondition}
                onClick={handleApply}
              >
                Aplicar {selectedCondition ? CONDITION_LABELS[selectedCondition] : ""}
              </Button>
            </div>
          )}
        </ScrollArea>
      </DialogContent>
    </Dialog>
  );
}

function ConditionButton({ condition, selected, phase, onClick }: {
  condition: { id: ClinicalCondition; label: string; abbr: string };
  selected: boolean;
  phase: TreatmentPhase;
  onClick: () => void;
}) {
  return (
    <button
      onClick={onClick}
      className={`w-full flex items-center gap-2 rounded-md border px-2.5 py-2 text-xs text-left transition-all ${
        selected
          ? "ring-2 ring-ring border-ring shadow-sm"
          : "border-border hover:bg-muted/50"
      }`}
    >
      <span
        className="flex h-5 w-5 shrink-0 items-center justify-center rounded text-[9px] font-bold"
        style={{
          backgroundColor: selected ? getPhaseColor(phase) : "hsl(var(--muted))",
          color: selected ? "white" : "hsl(var(--muted-foreground))",
        }}
      >
        {condition.abbr}
      </span>
      <span className="truncate">{condition.label}</span>
    </button>
  );
}

function EvolutionTimeline({ entries }: { entries: EvolutionEntry[] }) {
  if (!entries.length) {
    return <p className="text-sm text-muted-foreground py-4 text-center">Nenhum registro de evolução.</p>;
  }

  const sorted = [...entries].sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime());

  return (
    <div className="space-y-3 py-2">
      <p className="text-xs font-medium text-muted-foreground">Procedimentos (Evolução odontológica)</p>
      {sorted.map((entry, i) => (
        <div key={i} className="flex gap-3 items-start">
          <div className="flex flex-col items-center">
            <div
              className="h-3 w-3 rounded-full shrink-0 mt-0.5"
              style={{ backgroundColor: getPhaseColor(entry.phase) }}
            />
            {i < sorted.length - 1 && <div className="w-px flex-1 bg-border mt-1" />}
          </div>
          <div className="pb-3">
            <p className="text-xs font-medium">{CONDITION_LABELS[entry.condition]}</p>
            <p className="text-[11px] text-muted-foreground">
              {new Date(entry.date).toLocaleDateString("pt-BR")} — {entry.professional_name}
              {entry.surface && ` — Face ${SURFACE_LABELS[entry.surface]}`}
            </p>
            {entry.notes && <p className="text-[11px] text-muted-foreground mt-0.5">{entry.notes}</p>}
          </div>
        </div>
      ))}
    </div>
  );
}
