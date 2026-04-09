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

  // Same visual size for permanent and deciduous
  const toothSize = 28;
  const gap = 3;
  const centerGap = 14;
  const halfCount = teethPerRow / 2;
  const rowWidth = teethPerRow * toothSize + (teethPerRow - 1) * gap + centerGap;
  const svgWidth = rowWidth + 30;
  const toothH = toothSize; // crown + root
  const surfaceH = toothSize * 0.75;
  const toothBlockH = 9 + toothH + 2 + surfaceH + 8;
  const archGap = 10;
  const svgHeight = 2 * toothBlockH + archGap + 6;

  const getTooth = (num: number) => data[num] ?? createEmptyTooth(num);

  const getToothX = (index: number) => {
    const extra = index >= halfCount ? centerGap : 0;
    return 15 + index * (toothSize + gap) + extra;
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

  const upperY = 5;
  const lowerY = upperY + toothBlockH + archGap;

  // ── Overlay geometry ──────────────────────────────────────────────────
  // Surface block params (mirrors ToothDiagram internals)
  const surfaceBlockSize = toothSize * 0.75;   // 21
  const inner = surfaceBlockSize * 0.28;        // 5.88
  const outerPad = (surfaceBlockSize - inner * 2) / 2; // 4.62
  const halfBracketH = outerPad * 0.9;          // height of vestibular strip ≈ 4.16

  // Upper vestibular: surface block starts at anatomyY + toothH + 2
  const upperSurfaceY = upperY + 9 + toothSize + 2;       // y=44
  const upperBracketY = upperSurfaceY + outerPad / 2;     // centerY of top strip ≈ 46.3

  // Lower vestibular: surface block starts at lowerY
  const lowerSurfaceY = lowerY;                            // y=83
  const lowerBracketY = lowerSurfaceY + outerPad / 2;     // centerY ≈ 85.3

  // Lower lingual: bottom strip of lower surface grid
  const lowerLingualY = lowerSurfaceY + surfaceBlockSize - outerPad / 2; // ≈ 101.7

  // Bracket half-size
  const bracketW = 3.5;
  const bracketH = halfBracketH;

  // For each tooth index, compute center X
  const toothCenterX = (i: number) => getToothX(i) + toothSize / 2;

  // Contenção: teeth 33–43 in lowerRow
  // lowerRow = [41,42,43, 44,45,46,47,48, 38,37,36,35,34,33, 32,31]
  // indices:     0   1  2   3  4  5  6  7   8  9 10 11 12 13  14 15
  const contenIdx43 = lowerRow.indexOf(43);
  const contenIdx33 = lowerRow.indexOf(33);
  const contenX43 = contenIdx43 >= 0 ? toothCenterX(contenIdx43) : 0;
  const contenX33 = contenIdx33 >= 0 ? toothCenterX(contenIdx33) : 0;

  return (
    <div className="space-y-3">
      {/* Tabs */}
      <Tabs value={activeTab} onValueChange={setActiveTab}>
        <TabsList className="h-8">
          <TabsTrigger value="odontograma" className="text-[11px]">Odontograma</TabsTrigger>
          <TabsTrigger value="tecidos" className="text-[11px]">Tecidos moles e duros</TabsTrigger>
          <TabsTrigger value="periodontia" className="text-[11px]">Periodontia</TabsTrigger>
        </TabsList>
      </Tabs>

      {activeTab === "odontograma" && (
        <>
          {/* Controls bar */}
          <div className="flex flex-wrap items-center gap-x-5 gap-y-2 rounded-lg border border-border bg-card px-3 py-2">
            <div className="flex items-center gap-2">
              <Label className="text-[11px] text-muted-foreground">Período</Label>
              <Select value={periodo} onValueChange={setPeriodo}>
                <SelectTrigger className="h-7 w-24 text-[11px]"><SelectValue /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="atual">Atual</SelectItem>
                  <SelectItem value="historico">Histórico</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div className="flex items-center gap-2">
              <Label className="text-[11px] text-muted-foreground">Visualizar:</Label>
              <RadioGroup value={viewMode} onValueChange={setViewMode} className="flex gap-2">
                {["dentes", "arcadas", "outros"].map(v => (
                  <div key={v} className="flex items-center gap-1">
                    <RadioGroupItem value={v} id={`view-${v}`} className="h-3 w-3" />
                    <Label htmlFor={`view-${v}`} className="text-[11px] capitalize">{v}</Label>
                  </div>
                ))}
              </RadioGroup>
            </div>

            <div className="flex items-center gap-1.5">
              <Switch id="deciduous" checked={deciduous} onCheckedChange={setDeciduous} className="scale-75" />
              <Label htmlFor="deciduous" className="text-[11px]">Decíduos</Label>
            </div>

            <div className="flex items-center gap-1.5">
              <Switch id="aparelho" checked={meta.possui_aparelho} onCheckedChange={v => onMetaChange({ ...meta, possui_aparelho: v })} className="scale-75" />
              <Label htmlFor="aparelho" className="text-[11px]">Aparelho</Label>
            </div>
            <div className="flex items-center gap-1.5">
              <Switch id="contencao" checked={meta.possui_contencao} onCheckedChange={v => onMetaChange({ ...meta, possui_contencao: v })} className="scale-75" />
              <Label htmlFor="contencao" className="text-[11px]">Contenção</Label>
            </div>

            <div className="flex items-center gap-2">
              <span className="text-[11px] text-muted-foreground">Prótese:</span>
              <div className="flex items-center gap-1">
                <Checkbox id="protese-sup" checked={meta.protese_total_superior} onCheckedChange={(v) => onMetaChange({ ...meta, protese_total_superior: !!v })} className="h-3 w-3" />
                <Label htmlFor="protese-sup" className="text-[11px]">Sup.</Label>
              </div>
              <div className="flex items-center gap-1">
                <Checkbox id="protese-inf" checked={meta.protese_total_inferior} onCheckedChange={(v) => onMetaChange({ ...meta, protese_total_inferior: !!v })} className="h-3 w-3" />
                <Label htmlFor="protese-inf" className="text-[11px]">Inf.</Label>
              </div>
            </div>
          </div>

          {/* Legend */}
          <div className="flex flex-wrap gap-3">
            {(["diagnosis", "in_progress", "completed"] as const).map(p => (
              <div key={p} className="flex items-center gap-1">
                <div className="h-2.5 w-2.5 rounded-full" style={{ backgroundColor: getPhaseColor(p) }} />
                <span className="text-[10px] text-muted-foreground">{PHASE_LABELS[p]}</span>
              </div>
            ))}
          </div>

          {/* SVG Odontogram */}
          <div className="overflow-x-auto rounded-xl border border-border bg-card p-3 shadow-sm">
            <svg
              viewBox={`0 0 ${svgWidth} ${svgHeight}`}
              className="w-full max-w-3xl mx-auto"
              style={{ minWidth: 480 }}
            >
              {/* Midline */}
              <line
                x1={svgWidth / 2} y1={2}
                x2={svgWidth / 2} y2={svgHeight - 2}
                stroke="hsl(var(--border))"
                strokeWidth={0.5}
                strokeDasharray="3 3"
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

              {/* ── Aparelho overlay ─────────────────────────────── */}
              {meta.possui_aparelho && (
                <g className="pointer-events-none">
                  {/* Arco superior */}
                  <polyline
                    points={upperRow.map((_, i) => `${toothCenterX(i)},${upperBracketY}`).join(" ")}
                    fill="none"
                    stroke="#9CA3AF"
                    strokeWidth={1.2}
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    opacity={0.85}
                  />
                  {upperRow.map((_, i) => (
                    <rect
                      key={i}
                      x={toothCenterX(i) - bracketW / 2}
                      y={upperBracketY - bracketH / 2}
                      width={bracketW}
                      height={bracketH}
                      rx={0.5}
                      fill="#6B7280"
                      stroke="#374151"
                      strokeWidth={0.4}
                    />
                  ))}

                  {/* Arco inferior */}
                  <polyline
                    points={lowerRow.map((_, i) => `${toothCenterX(i)},${lowerBracketY}`).join(" ")}
                    fill="none"
                    stroke="#9CA3AF"
                    strokeWidth={1.2}
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    opacity={0.85}
                  />
                  {lowerRow.map((_, i) => (
                    <rect
                      key={i}
                      x={toothCenterX(i) - bracketW / 2}
                      y={lowerBracketY - bracketH / 2}
                      width={bracketW}
                      height={bracketH}
                      rx={0.5}
                      fill="#6B7280"
                      stroke="#374151"
                      strokeWidth={0.4}
                    />
                  ))}
                </g>
              )}

              {/* ── Contenção overlay (barra lingual inferior 33–43) ── */}
              {meta.possui_contencao && !deciduous && contenIdx43 >= 0 && contenIdx33 >= 0 && (
                <g className="pointer-events-none">
                  <path
                    d={`M ${contenX43},${lowerLingualY} Q ${(contenX43 + contenX33) / 2},${lowerLingualY + 2} ${contenX33},${lowerLingualY}`}
                    fill="none"
                    stroke="#374151"
                    strokeWidth={2}
                    strokeLinecap="round"
                    opacity={0.75}
                  />
                  {/* Pontos de adesão nos caninos */}
                  <circle cx={contenX43} cy={lowerLingualY} r={1.5} fill="#374151" opacity={0.75} />
                  <circle cx={contenX33} cy={lowerLingualY} r={1.5} fill="#374151" opacity={0.75} />
                </g>
              )}
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
