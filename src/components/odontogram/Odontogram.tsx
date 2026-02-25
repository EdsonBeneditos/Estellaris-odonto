import { useState, useMemo } from "react";
import { ToothDiagram } from "./ToothDiagram";
import { DiagnosisMenu } from "./DiagnosisMenu";
import {
  OdontogramData, ToothStatus, SurfaceName, createEmptyTooth,
  PERMANENT_UPPER_RIGHT, PERMANENT_UPPER_LEFT, PERMANENT_LOWER_LEFT, PERMANENT_LOWER_RIGHT,
  DECIDUOUS_UPPER_RIGHT, DECIDUOUS_UPPER_LEFT, DECIDUOUS_LOWER_LEFT, DECIDUOUS_LOWER_RIGHT,
  STATUS_LABELS,
} from "./types";
import { Switch } from "@/components/ui/switch";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Copy } from "lucide-react";
import { Popover, PopoverTrigger, PopoverContent } from "@/components/ui/popover";

interface OdontogramProps {
  data: OdontogramData;
  onChange: (data: OdontogramData) => void;
}

export function Odontogram({ data, onChange }: OdontogramProps) {
  const [deciduous, setDeciduous] = useState(false);
  const [selectedTooth, setSelectedTooth] = useState<number | null>(null);
  const [replicateMode, setReplicateMode] = useState(false);
  const [replicateStatus, setReplicateStatus] = useState<ToothStatus>("carie");

  const upperRight = deciduous ? DECIDUOUS_UPPER_RIGHT : PERMANENT_UPPER_RIGHT;
  const upperLeft = deciduous ? DECIDUOUS_UPPER_LEFT : PERMANENT_UPPER_LEFT;
  const lowerLeft = deciduous ? DECIDUOUS_LOWER_LEFT : PERMANENT_LOWER_LEFT;
  const lowerRight = deciduous ? DECIDUOUS_LOWER_RIGHT : PERMANENT_LOWER_RIGHT;

  const upperRow = [...upperRight, ...upperLeft];
  const lowerRow = [...lowerRight, ...lowerLeft];
  const teethPerRow = upperRow.length;

  const toothSize = 42;
  const gap = 6;
  const centerGap = 16;
  const halfCount = teethPerRow / 2;
  const rowWidth = teethPerRow * toothSize + (teethPerRow - 1) * gap + centerGap;
  const svgWidth = rowWidth + 40;
  const svgHeight = 2 * toothSize + 80;

  const getTooth = (num: number) => data[num] ?? createEmptyTooth(num);

  const updateData = (newData: OdontogramData) => onChange(newData);

  const handleToothClick = (num: number) => {
    if (replicateMode) {
      const tooth = getTooth(num);
      const updated: OdontogramData = {
        ...data,
        [num]: {
          ...tooth,
          diagnosis: replicateStatus,
          surfaces: Object.fromEntries(
            Object.entries(tooth.surfaces).map(([k, v]) => [k, { status: replicateStatus }])
          ) as any,
        },
      };
      updateData(updated);
    } else {
      setSelectedTooth(selectedTooth === num ? null : num);
    }
  };

  const handleSurfaceClick = (num: number, surface: SurfaceName) => {
    if (replicateMode) {
      const tooth = getTooth(num);
      updateData({
        ...data,
        [num]: {
          ...tooth,
          surfaces: { ...tooth.surfaces, [surface]: { status: replicateStatus } },
        },
      });
    }
  };

  const handleDiagnosisChange = (num: number, status: ToothStatus) => {
    const tooth = getTooth(num);
    updateData({ ...data, [num]: { ...tooth, diagnosis: status } });
  };

  const handleSurfaceChange = (num: number, surface: SurfaceName, status: ToothStatus) => {
    const tooth = getTooth(num);
    updateData({
      ...data,
      [num]: { ...tooth, surfaces: { ...tooth.surfaces, [surface]: { status } } },
    });
  };

  const getToothX = (index: number) => {
    const extra = index >= halfCount ? centerGap : 0;
    return 20 + index * (toothSize + gap) + extra;
  };

  return (
    <div className="space-y-4">
      {/* Controls */}
      <div className="flex flex-wrap items-center gap-6">
        <div className="flex items-center gap-2">
          <Switch id="deciduous" checked={deciduous} onCheckedChange={(v) => { setDeciduous(v); setSelectedTooth(null); }} />
          <Label htmlFor="deciduous" className="text-sm">Dentes Decíduos</Label>
        </div>

        <div className="flex items-center gap-2">
          <Switch id="replicate" checked={replicateMode} onCheckedChange={setReplicateMode} />
          <Label htmlFor="replicate" className="text-sm flex items-center gap-1.5">
            <Copy className="h-3.5 w-3.5" /> Replicar Tratamento
          </Label>
        </div>

        {replicateMode && (
          <div className="flex items-center gap-2">
            <span className="text-xs text-muted-foreground">Aplicar:</span>
            {(["carie", "canal", "extraction", "implant", "treated"] as ToothStatus[]).map((s) => (
              <Badge
                key={s}
                variant="outline"
                className={`cursor-pointer text-xs ${replicateStatus === s ? "ring-2 ring-ring" : ""}`}
                style={{ backgroundColor: replicateStatus === s ? `hsl(var(--tooth-${s}))` : undefined, color: replicateStatus === s ? "white" : undefined }}
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
        {(["healthy", "carie", "canal", "extraction", "implant", "treated"] as ToothStatus[]).map((s) => (
          <div key={s} className="flex items-center gap-1.5">
            <div className="h-3 w-3 rounded-sm" style={{ backgroundColor: `hsl(var(--tooth-${s}))` }} />
            <span className="text-[11px] text-muted-foreground">{STATUS_LABELS[s]}</span>
          </div>
        ))}
      </div>

      {/* SVG Odontogram */}
      <div className="overflow-x-auto rounded-lg border border-border bg-card p-4">
        <svg
          viewBox={`0 0 ${svgWidth} ${svgHeight}`}
          className="w-full max-w-4xl mx-auto"
          style={{ minWidth: 600 }}
        >
          {/* Upper arch label */}
          <text x={svgWidth / 2} y={14} textAnchor="middle" className="text-[11px] font-medium" fill="hsl(var(--muted-foreground))">
            Arcada Superior
          </text>

          {/* Upper row */}
          {upperRow.map((num, i) => (
            <ToothDiagram
              key={num}
              tooth={getTooth(num)}
              x={getToothX(i)}
              y={24}
              size={toothSize}
              selected={selectedTooth === num}
              onToothClick={handleToothClick}
              onSurfaceClick={handleSurfaceClick}
            />
          ))}

          {/* Midline */}
          <line
            x1={svgWidth / 2}
            y1={20}
            x2={svgWidth / 2}
            y2={svgHeight - 10}
            stroke="hsl(var(--border))"
            strokeWidth={1}
            strokeDasharray="4 4"
          />

          {/* Lower arch label */}
          <text x={svgWidth / 2} y={toothSize + 52} textAnchor="middle" className="text-[11px] font-medium" fill="hsl(var(--muted-foreground))">
            Arcada Inferior
          </text>

          {/* Lower row */}
          {lowerRow.map((num, i) => (
            <ToothDiagram
              key={num}
              tooth={getTooth(num)}
              x={getToothX(i)}
              y={toothSize + 58}
              size={toothSize}
              selected={selectedTooth === num}
              onToothClick={handleToothClick}
              onSurfaceClick={handleSurfaceClick}
            />
          ))}
        </svg>
      </div>

      {/* Diagnosis panel */}
      {selectedTooth && !replicateMode && (
        <DiagnosisMenu
          toothNumber={selectedTooth}
          currentDiagnosis={getTooth(selectedTooth).diagnosis}
          surfaces={getTooth(selectedTooth).surfaces}
          onDiagnosisChange={handleDiagnosisChange}
          onSurfaceChange={handleSurfaceChange}
          onClose={() => setSelectedTooth(null)}
        />
      )}
    </div>
  );
}
