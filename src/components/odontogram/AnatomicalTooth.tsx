import { getToothType, TreatmentPhase, ClinicalCondition, getPhaseColor } from "./types";

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

  const path = buildToothPath(type, cx, y, w, h, isUpper);

  return (
    <path
      d={path}
      fill={fillColor}
      stroke={strokeColor}
      strokeWidth={1}
      opacity={0.9}
      className="transition-colors duration-200"
    />
  );
}

function buildToothPath(type: "molar" | "premolar" | "canine" | "incisor", cx: number, y: number, w: number, h: number, isUpper: boolean): string {
  const hw = w / 2;

  if (isUpper) {
    const crownY = y + h * 0.5;
    const crownH = h * 0.5;
    const rootTop = y;

    switch (type) {
      case "molar":
        return [
          `M${cx - hw * 0.85},${crownY + crownH}`,
          `C${cx - hw * 0.95},${crownY + crownH * 0.3} ${cx - hw * 0.8},${crownY - crownH * 0.1} ${cx - hw * 0.55},${crownY}`,
          `L${cx - hw * 0.45},${rootTop + h * 0.2}`,
          `C${cx - hw * 0.4},${rootTop + h * 0.05} ${cx - hw * 0.25},${rootTop} ${cx - hw * 0.15},${rootTop + h * 0.12}`,
          `L${cx - hw * 0.05},${crownY - crownH * 0.15}`,
          `L${cx + hw * 0.05},${crownY - crownH * 0.15}`,
          `L${cx + hw * 0.15},${rootTop + h * 0.12}`,
          `C${cx + hw * 0.25},${rootTop} ${cx + hw * 0.4},${rootTop + h * 0.05} ${cx + hw * 0.45},${rootTop + h * 0.2}`,
          `L${cx + hw * 0.55},${crownY}`,
          `C${cx + hw * 0.8},${crownY - crownH * 0.1} ${cx + hw * 0.95},${crownY + crownH * 0.3} ${cx + hw * 0.85},${crownY + crownH}`,
          `Q${cx},${crownY + crownH + 3} ${cx - hw * 0.85},${crownY + crownH}Z`
        ].join(" ");
      case "premolar":
        return [
          `M${cx - hw * 0.7},${crownY + crownH}`,
          `C${cx - hw * 0.8},${crownY + crownH * 0.2} ${cx - hw * 0.6},${crownY - crownH * 0.1} ${cx - hw * 0.25},${crownY}`,
          `L${cx},${rootTop}`,
          `L${cx + hw * 0.25},${crownY}`,
          `C${cx + hw * 0.6},${crownY - crownH * 0.1} ${cx + hw * 0.8},${crownY + crownH * 0.2} ${cx + hw * 0.7},${crownY + crownH}`,
          `Q${cx},${crownY + crownH + 2} ${cx - hw * 0.7},${crownY + crownH}Z`
        ].join(" ");
      case "canine":
        return [
          `M${cx - hw * 0.55},${crownY + crownH}`,
          `C${cx - hw * 0.65},${crownY + crownH * 0.3} ${cx - hw * 0.5},${crownY} ${cx - hw * 0.2},${crownY - crownH * 0.1}`,
          `L${cx},${rootTop}`,
          `L${cx + hw * 0.2},${crownY - crownH * 0.1}`,
          `C${cx + hw * 0.5},${crownY} ${cx + hw * 0.65},${crownY + crownH * 0.3} ${cx + hw * 0.55},${crownY + crownH}`,
          `Q${cx},${crownY + crownH + 2} ${cx - hw * 0.55},${crownY + crownH}Z`
        ].join(" ");
      default: // incisor
        return [
          `M${cx - hw * 0.45},${crownY + crownH}`,
          `C${cx - hw * 0.55},${crownY + crownH * 0.4} ${cx - hw * 0.4},${crownY} ${cx - hw * 0.15},${crownY - crownH * 0.05}`,
          `L${cx},${rootTop}`,
          `L${cx + hw * 0.15},${crownY - crownH * 0.05}`,
          `C${cx + hw * 0.4},${crownY} ${cx + hw * 0.55},${crownY + crownH * 0.4} ${cx + hw * 0.45},${crownY + crownH}`,
          `Q${cx},${crownY + crownH + 2} ${cx - hw * 0.45},${crownY + crownH}Z`
        ].join(" ");
    }
  } else {
    const crownH = h * 0.5;
    const rootBottom = y + h;

    switch (type) {
      case "molar":
        return [
          `M${cx - hw * 0.85},${y}`,
          `C${cx - hw * 0.95},${y + crownH * 0.7} ${cx - hw * 0.8},${y + crownH * 1.1} ${cx - hw * 0.55},${y + crownH}`,
          `L${cx - hw * 0.45},${rootBottom - h * 0.2}`,
          `C${cx - hw * 0.4},${rootBottom - h * 0.05} ${cx - hw * 0.25},${rootBottom} ${cx - hw * 0.15},${rootBottom - h * 0.12}`,
          `L${cx - hw * 0.05},${y + crownH + crownH * 0.15}`,
          `L${cx + hw * 0.05},${y + crownH + crownH * 0.15}`,
          `L${cx + hw * 0.15},${rootBottom - h * 0.12}`,
          `C${cx + hw * 0.25},${rootBottom} ${cx + hw * 0.4},${rootBottom - h * 0.05} ${cx + hw * 0.45},${rootBottom - h * 0.2}`,
          `L${cx + hw * 0.55},${y + crownH}`,
          `C${cx + hw * 0.8},${y + crownH * 1.1} ${cx + hw * 0.95},${y + crownH * 0.7} ${cx + hw * 0.85},${y}`,
          `Q${cx},${y - 3} ${cx - hw * 0.85},${y}Z`
        ].join(" ");
      case "premolar":
        return [
          `M${cx - hw * 0.7},${y}`,
          `C${cx - hw * 0.8},${y + crownH * 0.8} ${cx - hw * 0.6},${y + crownH * 1.1} ${cx - hw * 0.25},${y + crownH}`,
          `L${cx},${rootBottom}`,
          `L${cx + hw * 0.25},${y + crownH}`,
          `C${cx + hw * 0.6},${y + crownH * 1.1} ${cx + hw * 0.8},${y + crownH * 0.8} ${cx + hw * 0.7},${y}`,
          `Q${cx},${y - 2} ${cx - hw * 0.7},${y}Z`
        ].join(" ");
      case "canine":
        return [
          `M${cx - hw * 0.55},${y}`,
          `C${cx - hw * 0.65},${y + crownH * 0.7} ${cx - hw * 0.5},${y + crownH} ${cx - hw * 0.2},${y + crownH * 1.1}`,
          `L${cx},${rootBottom}`,
          `L${cx + hw * 0.2},${y + crownH * 1.1}`,
          `C${cx + hw * 0.5},${y + crownH} ${cx + hw * 0.65},${y + crownH * 0.7} ${cx + hw * 0.55},${y}`,
          `Q${cx},${y - 2} ${cx - hw * 0.55},${y}Z`
        ].join(" ");
      default:
        return [
          `M${cx - hw * 0.45},${y}`,
          `C${cx - hw * 0.55},${y + crownH * 0.6} ${cx - hw * 0.4},${y + crownH} ${cx - hw * 0.15},${y + crownH * 1.05}`,
          `L${cx},${rootBottom}`,
          `L${cx + hw * 0.15},${y + crownH * 1.05}`,
          `C${cx + hw * 0.4},${y + crownH} ${cx + hw * 0.55},${y + crownH * 0.6} ${cx + hw * 0.45},${y}`,
          `Q${cx},${y - 2} ${cx - hw * 0.45},${y}Z`
        ].join(" ");
    }
  }
}
