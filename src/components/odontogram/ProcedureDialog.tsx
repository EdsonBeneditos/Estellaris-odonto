import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { ToothStatus, STATUS_LABELS, SurfaceName, SURFACE_LABELS } from "./types";

const PROCEDURE_OPTIONS: ToothStatus[] = ["carie", "canal", "extraction", "implant", "crown", "adjustment", "treated", "healthy"];

const PROCEDURE_ICONS: Record<ToothStatus, string> = {
  healthy: "✓",
  carie: "⚠",
  canal: "🔧",
  extraction: "✕",
  implant: "⬡",
  treated: "✔",
  crown: "♛",
  adjustment: "⚙",
};

interface ProcedureDialogProps {
  open: boolean;
  toothNumber: number;
  surfaceName: SurfaceName | null;
  onSelect: (status: ToothStatus) => void;
  onClose: () => void;
}

export function ProcedureDialog({ open, toothNumber, surfaceName, onSelect, onClose }: ProcedureDialogProps) {
  return (
    <Dialog open={open} onOpenChange={(v) => !v && onClose()}>
      <DialogContent className="sm:max-w-sm">
        <DialogHeader>
          <DialogTitle className="font-display text-base">
            Dente {toothNumber}
            {surfaceName && (
              <span className="text-muted-foreground font-normal ml-1.5">
                — Face {SURFACE_LABELS[surfaceName]}
              </span>
            )}
          </DialogTitle>
        </DialogHeader>
        <div className="grid grid-cols-2 gap-2 pt-2">
          {PROCEDURE_OPTIONS.map((status) => (
            <button
              key={status}
              onClick={() => onSelect(status)}
              className="flex items-center gap-2.5 rounded-lg border border-border px-3 py-2.5 text-sm hover:bg-accent/10 hover:border-accent transition-colors text-left"
            >
              <span
                className="flex h-7 w-7 shrink-0 items-center justify-center rounded-md text-xs font-bold"
                style={{ backgroundColor: `hsl(var(--tooth-${status}))`, color: status === "healthy" ? "hsl(var(--foreground))" : "white" }}
              >
                {PROCEDURE_ICONS[status]}
              </span>
              <span>{STATUS_LABELS[status]}</span>
            </button>
          ))}
        </div>
      </DialogContent>
    </Dialog>
  );
}
