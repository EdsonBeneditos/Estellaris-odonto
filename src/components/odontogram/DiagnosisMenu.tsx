import { ToothStatus, STATUS_LABELS, SurfaceName, SURFACE_NAMES, SURFACE_LABELS } from "./types";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { X } from "lucide-react";

const diagnosisOptions: ToothStatus[] = ["healthy", "carie", "canal", "extraction", "implant", "treated"];

const STATUS_BADGE_CLASSES: Record<ToothStatus, string> = {
  healthy: "bg-muted text-muted-foreground",
  carie: "bg-tooth-carie text-white",
  canal: "bg-tooth-canal text-white",
  extraction: "bg-tooth-extraction text-white",
  implant: "bg-tooth-implant text-white",
  treated: "bg-tooth-treated text-white",
  crown: "bg-tooth-crown text-white",
  adjustment: "bg-tooth-adjustment text-white",
};

interface DiagnosisMenuProps {
  toothNumber: number;
  currentDiagnosis: ToothStatus;
  surfaces: Record<SurfaceName, { status: ToothStatus }>;
  onDiagnosisChange: (toothNum: number, status: ToothStatus) => void;
  onSurfaceChange: (toothNum: number, surface: SurfaceName, status: ToothStatus) => void;
  onClose: () => void;
}

export function DiagnosisMenu({ toothNumber, currentDiagnosis, surfaces, onDiagnosisChange, onSurfaceChange, onClose }: DiagnosisMenuProps) {
  return (
    <Card className="w-72 border-border shadow-xl">
      <CardHeader className="pb-3 flex flex-row items-center justify-between">
        <CardTitle className="text-base font-display">Dente {toothNumber}</CardTitle>
        <Button variant="ghost" size="icon" className="h-7 w-7" onClick={onClose}><X className="h-4 w-4" /></Button>
      </CardHeader>
      <CardContent className="space-y-4">
        <div>
          <p className="text-xs font-medium text-muted-foreground mb-2">Diagnóstico Geral</p>
          <div className="flex flex-wrap gap-1.5">
            {diagnosisOptions.map((s) => (
              <Badge
                key={s}
                variant="outline"
                className={`cursor-pointer text-xs transition-all ${currentDiagnosis === s ? STATUS_BADGE_CLASSES[s] + " ring-2 ring-ring" : "hover:opacity-80"}`}
                onClick={() => onDiagnosisChange(toothNumber, s)}
              >
                {STATUS_LABELS[s]}
              </Badge>
            ))}
          </div>
        </div>

        <div>
          <p className="text-xs font-medium text-muted-foreground mb-2">Superfícies</p>
          <div className="space-y-1.5">
            {SURFACE_NAMES.map((surf) => (
              <div key={surf} className="flex items-center justify-between">
                <span className="text-xs text-muted-foreground w-20">{SURFACE_LABELS[surf]} ({surf})</span>
                <div className="flex gap-1">
                  {diagnosisOptions.map((s) => (
                    <button
                      key={s}
                      title={STATUS_LABELS[s]}
                      className={`h-5 w-5 rounded-sm border transition-all ${surfaces[surf].status === s ? "ring-2 ring-ring scale-110" : "opacity-60 hover:opacity-100"}`}
                      style={{ backgroundColor: `hsl(var(--tooth-${s}))` }}
                      onClick={() => onSurfaceChange(toothNumber, surf, s)}
                    />
                  ))}
                </div>
              </div>
            ))}
          </div>
        </div>
      </CardContent>
    </Card>
  );
}
