import { useState } from "react";
import { ToothDiagram } from "./ToothDiagram";
import { ProcedureDialog } from "./ProcedureDialog";
import {
  OdontogramData, ToothStatus, SurfaceName, createEmptyTooth,
  PERMANENT_UPPER_RIGHT, PERMANENT_UPPER_LEFT, PERMANENT_LOWER_LEFT, PERMANENT_LOWER_RIGHT,
  DECIDUOUS_UPPER_RIGHT, DECIDUOUS_UPPER_LEFT, DECIDUOUS_LOWER_LEFT, DECIDUOUS_LOWER_RIGHT,
  STATUS_LABELS,
} from "./types";
import { Switch } from "@/components/ui/switch";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { Copy, CopyCheck } from "lucide-react";

interface OdontogramProps {
  data: OdontogramData;
  onChange: (data: OdontogramData) => void;
}

export function Odontogram({ data, onChange }: OdontogramProps) {
  const [deciduous, setDeciduous] = useState(false);
  const [replicateMode, setReplicateMode] = useState(false);
  const [replicateStatus, setReplicateStatus] = useState<ToothStatus>("carie");

  // Dialog state
  const [dialogOpen, setDialogOpen] = useState(false);
  const [dialogTooth, setDialogTooth] = useState<number>(0);
  const [dialogSurface, setDialogSurface] = useState<SurfaceName | null>(null);

  const upperRight = deciduous ? DECIDUOUS_UPPER_RIGHT : PERMANENT_UPPER_RIGHT;
  const upperLeft = deciduous ? DECIDUOUS_UPPER_LEFT : PERMANENT_UPPER_LEFT;
  const lowerLeft = deciduous ? DECIDUOUS_LOWER_LEFT : PERMANENT_LOWER_LEFT;
  const lowerRight = deciduous ? DECIDUOUS_LOWER_RIGHT : PERMANENT_LOWER_RIGHT;

  const upperRow = [...upperRight, ...upperLeft];
  const lowerRow = [...lowerRight, ...lowerLeft];
  const teethPerRow = upperRow.length;

  const toothSize = 42;
  const gap = 6;
  const centerGap = 18;
  const halfCount = teethPerRow / 2;
  const rowWidth = teethPerRow * toothSize + (teethPerRow - 1) * gap + centerGap;
  const svgWidth = rowWidth + 40;
  
  // Each tooth block height: number(12) + anatomy(size*1.3) + gap(4) + surfaces(size) 
  const toothBlockH = 12 + toothSize * 1.3 + 4 + toothSize;
  const archGap = 24;
  const svgHeight = 2 * toothBlockH + archGap + 40;

  const getTooth = (num: number) => data[num] ?? createEmptyTooth(num);

  const getToothX = (index: number) => {
    const extra = index >= halfCount ? centerGap : 0;
    return 20 + index * (toothSize + gap) + extra;
  };

  // Handlers
  const handleSurfaceClick = (num: number, surface: SurfaceName) => {
    if (replicateMode) {
      const tooth = getTooth(num);
      onChange({
        ...data,
        [num]: {
          ...tooth,
          surfaces: { ...tooth.surfaces, [surface]: { status: replicateStatus } },
        },
      });
    } else {
      setDialogTooth(num);
      setDialogSurface(surface);
      setDialogOpen(true);
    }
  };

  const handleToothClick = (num: number) => {
    if (replicateMode) {
      const tooth = getTooth(num);
      onChange({
        ...data,
        [num]: {
          ...tooth,
          diagnosis: replicateStatus,
          surfaces: Object.fromEntries(
            Object.entries(tooth.surfaces).map(([k]) => [k, { status: replicateStatus }])
          ) as any,
        },
      });
    } else {
      setDialogTooth(num);
      setDialogSurface(null);
      setDialogOpen(true);
    }
  };

  const handleProcedureSelect = (status: ToothStatus) => {
    const tooth = getTooth(dialogTooth);
    if (dialogSurface) {
      onChange({
        ...data,
        [dialogTooth]: {
          ...tooth,
          surfaces: { ...tooth.surfaces, [dialogSurface]: { status } },
        },
      });
    } else {
      onChange({
        ...data,
        [dialogTooth]: { ...tooth, diagnosis: status },
      });
    }
    setDialogOpen(false);
  };

  const replicateOptions: ToothStatus[] = ["carie", "canal", "extraction", "implant", "crown", "adjustment", "treated"];

  const upperY = 16;
  const lowerY = upperY + toothBlockH + archGap;

  return (
    <div className="space-y-4">
      {/* Controls */}
      <div className="flex flex-wrap items-center gap-5">
        <div className="flex items-center gap-2">
          <Switch id="deciduous" checked={deciduous} onCheckedChange={(v) => { setDeciduous(v); }} />
          <Label htmlFor="deciduous" className="text-sm">Dentes Decíduos</Label>
        </div>

        <div className="flex items-center gap-2">
          <Switch id="replicate" checked={replicateMode} onCheckedChange={setReplicateMode} />
          <Label htmlFor="replicate" className="text-sm flex items-center gap-1.5">
            {replicateMode ? <CopyCheck className="h-3.5 w-3.5 text-accent" /> : <Copy className="h-3.5 w-3.5" />}
            Replicar Tratamento
          </Label>
        </div>

        {replicateMode && (
          <div className="flex items-center gap-2 flex-wrap">
            <span className="text-xs text-muted-foreground">Aplicar:</span>
            {replicateOptions.map((s) => (
              <Badge
                key={s}
                variant="outline"
                className={`cursor-pointer text-xs transition-all ${replicateStatus === s ? "ring-2 ring-ring shadow-sm" : ""}`}
                style={{
                  backgroundColor: replicateStatus === s ? `hsl(var(--tooth-${s}))` : undefined,
                  color: replicateStatus === s ? "white" : undefined,
                }}
                onClick={() => setReplicateStatus(s)}
              >
                {STATUS_LABELS[s]}
              </Badge>
            ))}
          </div>
        )}
      </div>

      {/* Legend */}
      <div className="flex flex-wrap gap-3">
        {(["healthy", "carie", "canal", "extraction", "implant", "treated", "crown", "adjustment"] as ToothStatus[]).map((s) => (
          <div key={s} className="flex items-center gap-1.5">
            <div className="h-3 w-3 rounded-sm" style={{ backgroundColor: `hsl(var(--tooth-${s}))` }} />
            <span className="text-[11px] text-muted-foreground">{STATUS_LABELS[s]}</span>
          </div>
        ))}
      </div>

      {/* SVG */}
      <div className="overflow-x-auto rounded-xl border border-border bg-card p-4 shadow-sm">
        <svg
          viewBox={`0 0 ${svgWidth} ${svgHeight}`}
          className="w-full max-w-5xl mx-auto"
          style={{ minWidth: 640 }}
        >
          {/* Midline */}
          <line
            x1={svgWidth / 2} y1={8}
            x2={svgWidth / 2} y2={svgHeight - 4}
            stroke="hsl(var(--border))"
            strokeWidth={1}
            strokeDasharray="4 4"
          />

          {/* Upper arch */}
          {upperRow.map((num, i) => (
            <ToothDiagram
              key={num}
              tooth={getTooth(num)}
              x={getToothX(i)}
              y={upperY}
              size={toothSize}
              isUpper
              onToothClick={handleToothClick}
              onSurfaceClick={handleSurfaceClick}
            />
          ))}

          {/* Lower arch */}
          {lowerRow.map((num, i) => (
            <ToothDiagram
              key={num}
              tooth={getTooth(num)}
              x={getToothX(i)}
              y={lowerY}
              size={toothSize}
              isUpper={false}
              onToothClick={handleToothClick}
              onSurfaceClick={handleSurfaceClick}
            />
          ))}
        </svg>
      </div>

      {/* Procedure dialog */}
      <ProcedureDialog
        open={dialogOpen}
        toothNumber={dialogTooth}
        surfaceName={dialogSurface}
        onSelect={handleProcedureSelect}
        onClose={() => setDialogOpen(false)}
      />
    </div>
  );
}
