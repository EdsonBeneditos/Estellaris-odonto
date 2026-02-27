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
  const h = size * 1.4;
  const cx = x + w / 2;

  const fillColor = hasConditions ? getPhaseColor(phase) : "hsl(var(--muted))";
  const strokeColor = "hsl(var(--border))";

  const crownPath = buildCrownPath(type, cx, y, w, h, isUpper);
  const rootPaths = buildRootPaths(type, cx, y, w, h, isUpper);

  return (
    <g className="transition-colors duration-200">
      {/* Roots */}
      {rootPaths.map((rp, i) => (
        <path
          key={i}
          d={rp}
          fill={fillColor}
          stroke={strokeColor}
          strokeWidth={0.8}
          opacity={0.7}
        />
      ))}
      {/* Crown - organic rounded shape */}
      <path
        d={crownPath}
        fill={fillColor}
        stroke={strokeColor}
        strokeWidth={1}
        strokeLinejoin="round"
        opacity={0.9}
      />
    </g>
  );
}

function buildCrownPath(type: "molar" | "premolar" | "canine" | "incisor", cx: number, y: number, w: number, h: number, isUpper: boolean): string {
  const hw = w / 2;

  if (isUpper) {
    const crownBottom = y + h;
    const crownTop = y + h * 0.45;
    const ch = crownBottom - crownTop;

    switch (type) {
      case "molar":
        return `M${cx - hw * 0.82},${crownBottom}
          Q${cx - hw * 0.92},${crownBottom - ch * 0.4} ${cx - hw * 0.8},${crownTop + ch * 0.15}
          Q${cx - hw * 0.6},${crownTop} ${cx - hw * 0.2},${crownTop + ch * 0.05}
          Q${cx},${crownTop - ch * 0.02} ${cx + hw * 0.2},${crownTop + ch * 0.05}
          Q${cx + hw * 0.6},${crownTop} ${cx + hw * 0.8},${crownTop + ch * 0.15}
          Q${cx + hw * 0.92},${crownBottom - ch * 0.4} ${cx + hw * 0.82},${crownBottom}
          Q${cx},${crownBottom + 2} ${cx - hw * 0.82},${crownBottom}Z`;
      case "premolar":
        return `M${cx - hw * 0.65},${crownBottom}
          Q${cx - hw * 0.78},${crownBottom - ch * 0.5} ${cx - hw * 0.6},${crownTop + ch * 0.1}
          Q${cx - hw * 0.3},${crownTop} ${cx},${crownTop + ch * 0.03}
          Q${cx + hw * 0.3},${crownTop} ${cx + hw * 0.6},${crownTop + ch * 0.1}
          Q${cx + hw * 0.78},${crownBottom - ch * 0.5} ${cx + hw * 0.65},${crownBottom}
          Q${cx},${crownBottom + 1.5} ${cx - hw * 0.65},${crownBottom}Z`;
      case "canine":
        return `M${cx - hw * 0.5},${crownBottom}
          Q${cx - hw * 0.65},${crownBottom - ch * 0.4} ${cx - hw * 0.5},${crownTop + ch * 0.2}
          Q${cx - hw * 0.25},${crownTop - ch * 0.05} ${cx},${crownTop}
          Q${cx + hw * 0.25},${crownTop - ch * 0.05} ${cx + hw * 0.5},${crownTop + ch * 0.2}
          Q${cx + hw * 0.65},${crownBottom - ch * 0.4} ${cx + hw * 0.5},${crownBottom}
          Q${cx},${crownBottom + 1.5} ${cx - hw * 0.5},${crownBottom}Z`;
      default: // incisor
        return `M${cx - hw * 0.42},${crownBottom}
          Q${cx - hw * 0.55},${crownBottom - ch * 0.5} ${cx - hw * 0.4},${crownTop + ch * 0.1}
          Q${cx - hw * 0.15},${crownTop} ${cx},${crownTop + ch * 0.02}
          Q${cx + hw * 0.15},${crownTop} ${cx + hw * 0.4},${crownTop + ch * 0.1}
          Q${cx + hw * 0.55},${crownBottom - ch * 0.5} ${cx + hw * 0.42},${crownBottom}
          Q${cx},${crownBottom + 1.5} ${cx - hw * 0.42},${crownBottom}Z`;
    }
  } else {
    const crownTop = y;
    const crownBottom = y + h * 0.55;
    const ch = crownBottom - crownTop;

    switch (type) {
      case "molar":
        return `M${cx - hw * 0.82},${crownTop}
          Q${cx - hw * 0.92},${crownTop + ch * 0.4} ${cx - hw * 0.8},${crownBottom - ch * 0.15}
          Q${cx - hw * 0.6},${crownBottom} ${cx - hw * 0.2},${crownBottom - ch * 0.05}
          Q${cx},${crownBottom + ch * 0.02} ${cx + hw * 0.2},${crownBottom - ch * 0.05}
          Q${cx + hw * 0.6},${crownBottom} ${cx + hw * 0.8},${crownBottom - ch * 0.15}
          Q${cx + hw * 0.92},${crownTop + ch * 0.4} ${cx + hw * 0.82},${crownTop}
          Q${cx},${crownTop - 2} ${cx - hw * 0.82},${crownTop}Z`;
      case "premolar":
        return `M${cx - hw * 0.65},${crownTop}
          Q${cx - hw * 0.78},${crownTop + ch * 0.5} ${cx - hw * 0.6},${crownBottom - ch * 0.1}
          Q${cx - hw * 0.3},${crownBottom} ${cx},${crownBottom - ch * 0.03}
          Q${cx + hw * 0.3},${crownBottom} ${cx + hw * 0.6},${crownBottom - ch * 0.1}
          Q${cx + hw * 0.78},${crownTop + ch * 0.5} ${cx + hw * 0.65},${crownTop}
          Q${cx},${crownTop - 1.5} ${cx - hw * 0.65},${crownTop}Z`;
      case "canine":
        return `M${cx - hw * 0.5},${crownTop}
          Q${cx - hw * 0.65},${crownTop + ch * 0.4} ${cx - hw * 0.5},${crownBottom - ch * 0.2}
          Q${cx - hw * 0.25},${crownBottom + ch * 0.05} ${cx},${crownBottom}
          Q${cx + hw * 0.25},${crownBottom + ch * 0.05} ${cx + hw * 0.5},${crownBottom - ch * 0.2}
          Q${cx + hw * 0.65},${crownTop + ch * 0.4} ${cx + hw * 0.5},${crownTop}
          Q${cx},${crownTop - 1.5} ${cx - hw * 0.5},${crownTop}Z`;
      default:
        return `M${cx - hw * 0.42},${crownTop}
          Q${cx - hw * 0.55},${crownTop + ch * 0.5} ${cx - hw * 0.4},${crownBottom - ch * 0.1}
          Q${cx - hw * 0.15},${crownBottom} ${cx},${crownBottom - ch * 0.02}
          Q${cx + hw * 0.15},${crownBottom} ${cx + hw * 0.4},${crownBottom - ch * 0.1}
          Q${cx + hw * 0.55},${crownTop + ch * 0.5} ${cx + hw * 0.42},${crownTop}
          Q${cx},${crownTop - 1.5} ${cx - hw * 0.42},${crownTop}Z`;
    }
  }
}

function buildRootPaths(type: "molar" | "premolar" | "canine" | "incisor", cx: number, y: number, w: number, h: number, isUpper: boolean): string[] {
  const hw = w / 2;

  if (isUpper) {
    const rootTop = y;
    const rootBottom = y + h * 0.5;

    switch (type) {
      case "molar":
        return [
          // Left root
          `M${cx - hw * 0.55},${rootBottom} Q${cx - hw * 0.6},${rootTop + h * 0.15} ${cx - hw * 0.4},${rootTop + h * 0.05}
           Q${cx - hw * 0.3},${rootTop + h * 0.12} ${cx - hw * 0.2},${rootBottom}Z`,
          // Center root
          `M${cx - hw * 0.12},${rootBottom} Q${cx - hw * 0.05},${rootTop + h * 0.08} ${cx},${rootTop}
           Q${cx + hw * 0.05},${rootTop + h * 0.08} ${cx + hw * 0.12},${rootBottom}Z`,
          // Right root
          `M${cx + hw * 0.2},${rootBottom} Q${cx + hw * 0.3},${rootTop + h * 0.12} ${cx + hw * 0.4},${rootTop + h * 0.05}
           Q${cx + hw * 0.6},${rootTop + h * 0.15} ${cx + hw * 0.55},${rootBottom}Z`,
        ];
      case "premolar":
        return [
          `M${cx - hw * 0.2},${rootBottom} Q${cx - hw * 0.25},${rootTop + h * 0.1} ${cx - hw * 0.1},${rootTop + h * 0.02}
           Q${cx},${rootTop + h * 0.08} ${cx + hw * 0.1},${rootTop + h * 0.02}
           Q${cx + hw * 0.25},${rootTop + h * 0.1} ${cx + hw * 0.2},${rootBottom}Z`,
        ];
      case "canine":
        return [
          `M${cx - hw * 0.18},${rootBottom} Q${cx - hw * 0.15},${rootTop + h * 0.12} ${cx},${rootTop}
           Q${cx + hw * 0.15},${rootTop + h * 0.12} ${cx + hw * 0.18},${rootBottom}Z`,
        ];
      default:
        return [
          `M${cx - hw * 0.15},${rootBottom} Q${cx - hw * 0.1},${rootTop + h * 0.12} ${cx},${rootTop}
           Q${cx + hw * 0.1},${rootTop + h * 0.12} ${cx + hw * 0.15},${rootBottom}Z`,
        ];
    }
  } else {
    const rootTop = y + h * 0.5;
    const rootBottom = y + h;

    switch (type) {
      case "molar":
        return [
          `M${cx - hw * 0.5},${rootTop} Q${cx - hw * 0.55},${rootBottom - h * 0.15} ${cx - hw * 0.35},${rootBottom - h * 0.05}
           Q${cx - hw * 0.25},${rootBottom - h * 0.12} ${cx - hw * 0.15},${rootTop}Z`,
          `M${cx + hw * 0.15},${rootTop} Q${cx + hw * 0.25},${rootBottom - h * 0.12} ${cx + hw * 0.35},${rootBottom - h * 0.05}
           Q${cx + hw * 0.55},${rootBottom - h * 0.15} ${cx + hw * 0.5},${rootTop}Z`,
        ];
      case "premolar":
        return [
          `M${cx - hw * 0.18},${rootTop} Q${cx - hw * 0.15},${rootBottom - h * 0.1} ${cx},${rootBottom}
           Q${cx + hw * 0.15},${rootBottom - h * 0.1} ${cx + hw * 0.18},${rootTop}Z`,
        ];
      case "canine":
        return [
          `M${cx - hw * 0.16},${rootTop} Q${cx - hw * 0.12},${rootBottom - h * 0.1} ${cx},${rootBottom}
           Q${cx + hw * 0.12},${rootBottom - h * 0.1} ${cx + hw * 0.16},${rootTop}Z`,
        ];
      default:
        return [
          `M${cx - hw * 0.13},${rootTop} Q${cx - hw * 0.08},${rootBottom - h * 0.1} ${cx},${rootBottom}
           Q${cx + hw * 0.08},${rootBottom - h * 0.1} ${cx + hw * 0.13},${rootTop}Z`,
        ];
    }
  }
}
