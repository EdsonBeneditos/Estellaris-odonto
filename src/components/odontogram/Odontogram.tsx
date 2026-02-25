import { useState } from "react";
import { ToothDiagram } from "./ToothDiagram";
import { ClinicalDialog } from "./ClinicalDialog";
import {
  OdontogramData, OdontogramMeta, DEFAULT_META,
  ClinicalCondition, TreatmentPhase, SurfaceName,
  createEmptyTooth,
  PERMANENT_UPPER_RIGHT, PERMANENT_UPPER_LEFT, PERMANENT_LOWER_LEFT, PERMANENT_LOWER_RIGHT,
  DECIDUOUS_UPPER_RIGHT, DECIDUOUS_UPPER_LEFT, DECIDUOUS_LOWER_LEFT, DECIDUOUS_LOWER_RIGHT,
  PHASE_LABELS, getPhaseColor,
} from "./types";
import { Switch } from "@/components/ui/switch";
import { Label } from "@/components/ui/label";
import { Checkbox } from "@/components/ui/checkbox";
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";

interface OdontogramProps {
  data: OdontogramData;
  meta: OdontogramMeta;
  onChange: (data: OdontogramData) => void;
  onMetaChange: (meta: OdontogramMeta) => void;
  profileId?: string;
  profileName?: string;
}

export function Odontogram({ data, meta, onChange, onMetaChange, profileId, profileName }: OdontogramProps) {
  const [activeTab, setActiveTab] = useState("odontograma");
  const [deciduous, setDeciduous] = useState(false);
  const [viewMode, setViewMode] = useState("dentes");
  const [periodo, setPeriodo] = useState("atual");

  // Dialog
  const [dialogOpen, setDialogOpen] = useState(false);
  const [dialogToothNum, setDialogToothNum] = useState<number>(0);
  const [dialogSurface, setDialogSurface] = useState<SurfaceName | null>(null);

  const upperRight = deciduous ? DECIDUOUS_UPPER_RIGHT : PERMANENT_UPPER_RIGHT;
  const upperLeft = deciduous ? DECIDUOUS_UPPER_LEFT : PERMANENT_UPPER_LEFT;
  const lowerLeft = deciduous ? DECIDUOUS_LOWER_LEFT : PERMANENT_LOWER_LEFT;
  const lowerRight = deciduous ? DECIDUOUS_LOWER_RIGHT : PERMANENT_LOWER_RIGHT;

  const upperRow = [...upperRight, ...upperLeft];
  const lowerRow = [...lowerRight, ...lowerLeft];
  const teethPerRow = upperRow.length;
  const allTeeth = [...upperRow, ...lowerRow];

  const toothSize = 40;
  const gap = 5;
  const centerGap = 20;
  const halfCount = teethPerRow / 2;
  const rowWidth = teethPerRow * toothSize + (teethPerRow - 1) * gap + centerGap;
  const svgWidth = rowWidth + 40;
  const toothBlockH = 13 + toothSize * 1.4 + 3 + toothSize + 12;
  const archGap = 20;
  const svgHeight = 2 * toothBlockH + archGap + 10;

  const getTooth = (num: number) => data[num] ?? createEmptyTooth(num);

  const getToothX = (index: number) => {
    const extra = index >= halfCount ? centerGap : 0;
    return 20 + index * (toothSize + gap) + extra;
  };

  const handleSurfaceClick = (num: number, surface: SurfaceName) => {
    setDialogToothNum(num);
    setDialogSurface(surface);
    setDialogOpen(true);
  };

  const handleToothClick = (num: number) => {
    setDialogToothNum(num);
    setDialogSurface(null);
    setDialogOpen(true);
  };

  const handleApply = (condition: ClinicalCondition, phase: TreatmentPhase, replicateToTeeth: number[]) => {
    const now = new Date().toISOString();
    const entry = {
      date: now,
      professional_id: profileId ?? "unknown",
      professional_name: profileName ?? "Profissional",
      condition,
      phase,
      surface: dialogSurface ?? undefined,
    };

    const applyToTooth = (num: number): typeof data => {
      const tooth = getTooth(num);
      const newConditions = tooth.conditions.includes(condition)
        ? tooth.conditions
        : [...tooth.conditions, condition];

      if (dialogSurface) {
        return {
          ...data,
          [num]: {
            ...tooth,
            conditions: newConditions,
            surfaces: {
              ...tooth.surfaces,
              [dialogSurface]: { condition, phase },
            },
            evolution: [...tooth.evolution, { ...entry, surface: dialogSurface }],
          },
        };
      }
      return {
        ...data,
        [num]: {
          ...tooth,
          conditions: newConditions,
          phase,
          evolution: [...tooth.evolution, entry],
        },
      };
    };

    let newData = applyToTooth(dialogToothNum);
    for (const num of replicateToTeeth) {
      const tooth = newData[num] ?? createEmptyTooth(num);
      const newConditions = tooth.conditions.includes(condition)
        ? tooth.conditions
        : [...tooth.conditions, condition];
      newData = {
        ...newData,
        [num]: {
          ...tooth,
          conditions: newConditions,
          phase,
          surfaces: dialogSurface
            ? { ...tooth.surfaces, [dialogSurface]: { condition, phase } }
            : tooth.surfaces,
          evolution: [...tooth.evolution, { ...entry }],
        },
      };
    }

    onChange(newData);
    setDialogOpen(false);
  };

  const upperY = 8;
  const lowerY = upperY + toothBlockH + archGap;

  return (
    <div className="space-y-4">
      {/* Tabs */}
      <Tabs value={activeTab} onValueChange={setActiveTab}>
        <TabsList className="h-9">
          <TabsTrigger value="odontograma" className="text-xs">Odontograma</TabsTrigger>
          <TabsTrigger value="tecidos" className="text-xs">Tecidos moles e duros</TabsTrigger>
          <TabsTrigger value="periodontia" className="text-xs">Periodontia</TabsTrigger>
        </TabsList>
      </Tabs>

      {activeTab === "odontograma" && (
        <>
          {/* Controls bar */}
          <div className="flex flex-wrap items-center gap-x-6 gap-y-3 rounded-lg border border-border bg-card p-3">
            {/* Período */}
            <div className="flex items-center gap-2">
              <Label className="text-xs text-muted-foreground">Período</Label>
              <Select value={periodo} onValueChange={setPeriodo}>
                <SelectTrigger className="h-8 w-28 text-xs">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="atual">Atual</SelectItem>
                  <SelectItem value="historico">Histórico</SelectItem>
                </SelectContent>
              </Select>
            </div>

            {/* View mode */}
            <div className="flex items-center gap-2">
              <Label className="text-xs text-muted-foreground">Visualizar por:</Label>
              <RadioGroup value={viewMode} onValueChange={setViewMode} className="flex gap-3">
                {["dentes", "arcadas", "outros"].map(v => (
                  <div key={v} className="flex items-center gap-1">
                    <RadioGroupItem value={v} id={`view-${v}`} className="h-3.5 w-3.5" />
                    <Label htmlFor={`view-${v}`} className="text-xs capitalize">{v}</Label>
                  </div>
                ))}
              </RadioGroup>
            </div>

            {/* Deciduous toggle */}
            <div className="flex items-center gap-2">
              <Switch id="deciduous" checked={deciduous} onCheckedChange={setDeciduous} className="scale-90" />
              <Label htmlFor="deciduous" className="text-xs">Decíduos</Label>
            </div>

            {/* Appliance/contention */}
            <div className="flex items-center gap-2">
              <Switch
                id="aparelho"
                checked={meta.possui_aparelho}
                onCheckedChange={v => onMetaChange({ ...meta, possui_aparelho: v })}
                className="scale-90"
              />
              <Label htmlFor="aparelho" className="text-xs">Aparelho</Label>
            </div>
            <div className="flex items-center gap-2">
              <Switch
                id="contencao"
                checked={meta.possui_contencao}
                onCheckedChange={v => onMetaChange({ ...meta, possui_contencao: v })}
                className="scale-90"
              />
              <Label htmlFor="contencao" className="text-xs">Contenção</Label>
            </div>

            {/* Prosthesis */}
            <div className="flex items-center gap-3">
              <span className="text-xs text-muted-foreground">Prótese:</span>
              <div className="flex items-center gap-1.5">
                <Checkbox
                  id="protese-sup"
                  checked={meta.protese_total_superior}
                  onCheckedChange={(v) => onMetaChange({ ...meta, protese_total_superior: !!v })}
                  className="h-3.5 w-3.5"
                />
                <Label htmlFor="protese-sup" className="text-xs">Total sup.</Label>
              </div>
              <div className="flex items-center gap-1.5">
                <Checkbox
                  id="protese-inf"
                  checked={meta.protese_total_inferior}
                  onCheckedChange={(v) => onMetaChange({ ...meta, protese_total_inferior: !!v })}
                  className="h-3.5 w-3.5"
                />
                <Label htmlFor="protese-inf" className="text-xs">Total inf.</Label>
              </div>
            </div>
          </div>

          {/* Legend */}
          <div className="flex flex-wrap gap-4">
            {(["diagnosis", "in_progress", "completed"] as const).map(p => (
              <div key={p} className="flex items-center gap-1.5">
                <div className="h-3 w-3 rounded-full" style={{ backgroundColor: getPhaseColor(p) }} />
                <span className="text-[11px] text-muted-foreground">{PHASE_LABELS[p]}</span>
              </div>
            ))}
          </div>

          {/* SVG Odontogram */}
          <div className="overflow-x-auto rounded-xl border border-border bg-card p-4 shadow-sm">
            <svg
              viewBox={`0 0 ${svgWidth} ${svgHeight}`}
              className="w-full max-w-5xl mx-auto"
              style={{ minWidth: 640 }}
            >
              {/* Midline */}
              <line
                x1={svgWidth / 2} y1={4}
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
        </>
      )}

      {activeTab === "tecidos" && (
        <div className="rounded-xl border border-border bg-card p-8 text-center">
          <p className="text-muted-foreground text-sm">Módulo de Tecidos Moles e Duros — em desenvolvimento.</p>
        </div>
      )}

      {activeTab === "periodontia" && (
        <div className="rounded-xl border border-border bg-card p-8 text-center">
          <p className="text-muted-foreground text-sm">Módulo de Periodontia — em desenvolvimento.</p>
        </div>
      )}

      {/* Clinical dialog */}
      {dialogToothNum > 0 && (
        <ClinicalDialog
          open={dialogOpen}
          tooth={getTooth(dialogToothNum)}
          surfaceName={dialogSurface}
          onApply={handleApply}
          onClose={() => setDialogOpen(false)}
          allToothNumbers={allTeeth}
        />
      )}
    </div>
  );
}
