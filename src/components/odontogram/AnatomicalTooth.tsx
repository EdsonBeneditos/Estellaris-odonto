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

export function AnatomicalTooth({ toothNumber, x, y, size, isUpper, phase, hasConditions }: AnatomicalToothProps) {
  const type = getToothType(toothNumber);
  const w = size;
  const h = size * 0.9; // Crown only - shorter, no roots
  const cx = x + w / 2;
  const cy = y + h / 2;

  const fillColor = hasConditions ? getPhaseColor(phase) : "hsl(var(--muted))";
  const strokeColor = "hsl(var(--border))";

  const crownPath = buildCrownPath(type, cx, cy, w, h);

  return (
    <g className="transition-colors duration-200">
      <path
        d={crownPath}
        fill={fillColor}
        stroke={strokeColor}
        strokeWidth={1}
        strokeLinejoin="round"
        strokeLinecap="round"
        opacity={0.9}
      />
    </g>
  );
}

function buildCrownPath(type: "molar" | "premolar" | "canine" | "incisor", cx: number, cy: number, w: number, h: number): string {
  const hw = w / 2;
  const hh = h / 2;

  switch (type) {
    case "molar":
      // Wide, rounded rectangle with bumpy occlusal surface
      return `M${cx - hw * 0.85},${cy + hh * 0.8}
        Q${cx - hw * 0.95},${cy + hh * 0.3} ${cx - hw * 0.9},${cy - hh * 0.3}
        Q${cx - hw * 0.8},${cy - hh * 0.85} ${cx - hw * 0.4},${cy - hh * 0.9}
        Q${cx - hw * 0.15},${cy - hh * 1.0} ${cx},${cy - hh * 0.88}
        Q${cx + hw * 0.15},${cy - hh * 1.0} ${cx + hw * 0.4},${cy - hh * 0.9}
        Q${cx + hw * 0.8},${cy - hh * 0.85} ${cx + hw * 0.9},${cy - hh * 0.3}
        Q${cx + hw * 0.95},${cy + hh * 0.3} ${cx + hw * 0.85},${cy + hh * 0.8}
        Q${cx + hw * 0.5},${cy + hh * 0.95} ${cx},${cy + hh * 0.9}
        Q${cx - hw * 0.5},${cy + hh * 0.95} ${cx - hw * 0.85},${cy + hh * 0.8}Z`;

    case "premolar":
      // Slightly narrower, rounder
      return `M${cx - hw * 0.7},${cy + hh * 0.8}
        Q${cx - hw * 0.82},${cy + hh * 0.2} ${cx - hw * 0.75},${cy - hh * 0.4}
        Q${cx - hw * 0.6},${cy - hh * 0.9} ${cx - hw * 0.2},${cy - hh * 0.92}
        Q${cx},${cy - hh * 0.85} ${cx + hw * 0.2},${cy - hh * 0.92}
        Q${cx + hw * 0.6},${cy - hh * 0.9} ${cx + hw * 0.75},${cy - hh * 0.4}
        Q${cx + hw * 0.82},${cy + hh * 0.2} ${cx + hw * 0.7},${cy + hh * 0.8}
        Q${cx + hw * 0.35},${cy + hh * 0.95} ${cx},${cy + hh * 0.9}
        Q${cx - hw * 0.35},${cy + hh * 0.95} ${cx - hw * 0.7},${cy + hh * 0.8}Z`;

    case "canine":
      // Pointed but organic, egg-shaped
      return `M${cx - hw * 0.55},${cy + hh * 0.8}
        Q${cx - hw * 0.7},${cy + hh * 0.1} ${cx - hw * 0.55},${cy - hh * 0.5}
        Q${cx - hw * 0.35},${cy - hh * 0.95} ${cx},${cy - hh * 1.0}
        Q${cx + hw * 0.35},${cy - hh * 0.95} ${cx + hw * 0.55},${cy - hh * 0.5}
        Q${cx + hw * 0.7},${cy + hh * 0.1} ${cx + hw * 0.55},${cy + hh * 0.8}
        Q${cx + hw * 0.3},${cy + hh * 0.95} ${cx},${cy + hh * 0.9}
        Q${cx - hw * 0.3},${cy + hh * 0.95} ${cx - hw * 0.55},${cy + hh * 0.8}Z`;

    default: // incisor
      // Narrow, shovel-shaped
      return `M${cx - hw * 0.48},${cy + hh * 0.8}
        Q${cx - hw * 0.6},${cy + hh * 0.1} ${cx - hw * 0.5},${cy - hh * 0.5}
        Q${cx - hw * 0.3},${cy - hh * 0.92} ${cx},${cy - hh * 0.95}
        Q${cx + hw * 0.3},${cy - hh * 0.92} ${cx + hw * 0.5},${cy - hh * 0.5}
        Q${cx + hw * 0.6},${cy + hh * 0.1} ${cx + hw * 0.48},${cy + hh * 0.8}
        Q${cx + hw * 0.25},${cy + hh * 0.95} ${cx},${cy + hh * 0.9}
        Q${cx - hw * 0.25},${cy + hh * 0.95} ${cx - hw * 0.48},${cy + hh * 0.8}Z`;
  }
}
