import { getToothType, TreatmentPhase, getPhaseColor } from "./types";

interface AnatomicalToothProps {
  toothNumber: number;
  x: number;
  y: number;
  size: number;
  isUpper: boolean;
  phase: TreatmentPhase;
  hasConditions: boolean;
}

/**
 * Vista oclusal (de cima) do dente — formas anatômicas realistas por tipo.
 */
export function AnatomicalTooth({
  toothNumber,
  x,
  y,
  size,
  isUpper: _isUpper,
  phase,
  hasConditions,
}: AnatomicalToothProps) {
  const type = getToothType(toothNumber);
  const cx = x + size / 2;
  const cy = y + size / 2;
  const hw = size / 2;
  const hh = size / 2;

  const fillColor = hasConditions ? getPhaseColor(phase) : "#F9FAFB";
  const strokeColor = "#374151";
  const grooveColor = "#9CA3AF";

  const outerPath = buildOcclusalPath(type, cx, cy, hw, hh);
  const grooves = buildGrooveLines(type, cx, cy, hw, hh);

  return (
    <g className="pointer-events-none">
      <path
        d={outerPath}
        fill={fillColor}
        stroke={strokeColor}
        strokeWidth={1.5}
        strokeLinejoin="round"
        strokeLinecap="round"
      />
      {grooves.map((d, i) => (
        <path
          key={i}
          d={d}
          fill="none"
          stroke={grooveColor}
          strokeWidth={0.6}
          strokeLinecap="round"
          opacity={0.7}
        />
      ))}
    </g>
  );
}

/* ─────────────────────────────────────────────────────────────────────────
   Outer crown outlines — vista oclusal
───────────────────────────────────────────────────────────────────────── */
function buildOcclusalPath(
  type: "molar" | "premolar" | "canine" | "incisor",
  cx: number,
  cy: number,
  hw: number,
  hh: number,
): string {
  switch (type) {
    case "molar":
      // Quadrado arredondado largo — 4 cúspides visíveis nos cantos
      return [
        `M ${cx - hw * 0.72},${cy - hh * 0.92}`,
        `C ${cx - hw * 0.35},${cy - hh * 1.05} ${cx + hw * 0.35},${cy - hh * 1.05} ${cx + hw * 0.72},${cy - hh * 0.92}`,
        `C ${cx + hw * 1.0},${cy - hh * 0.65} ${cx + hw * 1.0},${cy + hh * 0.65} ${cx + hw * 0.72},${cy + hh * 0.92}`,
        `C ${cx + hw * 0.35},${cy + hh * 1.05} ${cx - hw * 0.35},${cy + hh * 1.05} ${cx - hw * 0.72},${cy + hh * 0.92}`,
        `C ${cx - hw * 1.0},${cy + hh * 0.65} ${cx - hw * 1.0},${cy - hh * 0.65} ${cx - hw * 0.72},${cy - hh * 0.92} Z`,
      ].join(" ");

    case "premolar":
      // Oval com dois bossas: vestibular e lingual
      return [
        `M ${cx - hw * 0.55},${cy - hh * 0.9}`,
        `C ${cx - hw * 0.2},${cy - hh * 1.05} ${cx + hw * 0.2},${cy - hh * 1.05} ${cx + hw * 0.55},${cy - hh * 0.9}`,
        `C ${cx + hw * 0.85},${cy - hh * 0.6} ${cx + hw * 0.85},${cy + hh * 0.6} ${cx + hw * 0.55},${cy + hh * 0.9}`,
        `C ${cx + hw * 0.2},${cy + hh * 1.05} ${cx - hw * 0.2},${cy + hh * 1.05} ${cx - hw * 0.55},${cy + hh * 0.9}`,
        `C ${cx - hw * 0.85},${cy + hh * 0.6} ${cx - hw * 0.85},${cy - hh * 0.6} ${cx - hw * 0.55},${cy - hh * 0.9} Z`,
      ].join(" ");

    case "canine":
      // Formato diamante/pontiagudo — cúspide única
      return [
        `M ${cx},${cy - hh * 0.92}`,
        `C ${cx + hw * 0.45},${cy - hh * 0.65} ${cx + hw * 0.62},${cy - hh * 0.1} ${cx + hw * 0.52},${cy + hh * 0.55}`,
        `C ${cx + hw * 0.3},${cy + hh * 0.95} ${cx - hw * 0.3},${cy + hh * 0.95} ${cx - hw * 0.52},${cy + hh * 0.55}`,
        `C ${cx - hw * 0.62},${cy - hh * 0.1} ${cx - hw * 0.45},${cy - hh * 0.65} ${cx},${cy - hh * 0.92} Z`,
      ].join(" ");

    default:
      // Incisor — trapézio estreito arredondado
      return [
        `M ${cx - hw * 0.38},${cy - hh * 0.88}`,
        `C ${cx - hw * 0.1},${cy - hh * 1.0} ${cx + hw * 0.1},${cy - hh * 1.0} ${cx + hw * 0.38},${cy - hh * 0.88}`,
        `C ${cx + hw * 0.55},${cy - hh * 0.55} ${cx + hw * 0.55},${cy + hh * 0.55} ${cx + hw * 0.38},${cy + hh * 0.88}`,
        `C ${cx + hw * 0.1},${cy + hh * 1.0} ${cx - hw * 0.1},${cy + hh * 1.0} ${cx - hw * 0.38},${cy + hh * 0.88}`,
        `C ${cx - hw * 0.55},${cy + hh * 0.55} ${cx - hw * 0.55},${cy - hh * 0.55} ${cx - hw * 0.38},${cy - hh * 0.88} Z`,
      ].join(" ");
  }
}

/* ─────────────────────────────────────────────────────────────────────────
   Groove lines — sulcos anatômicos internos
───────────────────────────────────────────────────────────────────────── */
function buildGrooveLines(
  type: "molar" | "premolar" | "canine" | "incisor",
  cx: number,
  cy: number,
  hw: number,
  hh: number,
): string[] {
  switch (type) {
    case "molar":
      // Fossa central em cruz + sulcos secundários
      return [
        `M ${cx - hw * 0.35},${cy} Q ${cx},${cy - hh * 0.15} ${cx + hw * 0.35},${cy}`,
        `M ${cx},${cy - hh * 0.45} Q ${cx},${cy} ${cx},${cy + hh * 0.45}`,
        `M ${cx - hw * 0.55},${cy - hh * 0.55} Q ${cx - hw * 0.35},${cy - hh * 0.15} ${cx},${cy - hh * 0.15}`,
        `M ${cx + hw * 0.55},${cy - hh * 0.55} Q ${cx + hw * 0.35},${cy - hh * 0.15} ${cx},${cy - hh * 0.15}`,
      ];

    case "premolar":
      // Sulco central vestíbulo-lingual
      return [
        `M ${cx},${cy - hh * 0.55} Q ${cx + hw * 0.05},${cy} ${cx},${cy + hh * 0.55}`,
        `M ${cx - hw * 0.3},${cy} Q ${cx},${cy - hh * 0.12} ${cx + hw * 0.3},${cy}`,
      ];

    case "canine":
      // Crista central
      return [
        `M ${cx},${cy - hh * 0.55} Q ${cx + hw * 0.05},${cy + hh * 0.1} ${cx},${cy + hh * 0.4}`,
      ];

    default:
      // Incisivo — leve crista central
      return [
        `M ${cx},${cy - hh * 0.4} Q ${cx + hw * 0.04},${cy} ${cx},${cy + hh * 0.4}`,
      ];
  }
}
