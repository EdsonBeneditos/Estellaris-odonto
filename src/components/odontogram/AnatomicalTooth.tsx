import { getToothType, ToothStatus } from "./types";

interface AnatomicalToothProps {
  toothNumber: number;
  x: number;
  y: number;
  size: number;
  isUpper: boolean;
  diagnosis: ToothStatus;
}

/**
 * Renders an anatomical crown silhouette for a tooth based on its FDI type.
 * Upper teeth have roots pointing up, lower teeth have roots pointing down.
 */
export function AnatomicalTooth({ toothNumber, x, y, size, isUpper, diagnosis }: AnatomicalToothProps) {
  const type = getToothType(toothNumber);
  const w = size;
  const h = size * 1.3;
  const cx = x + w / 2;

  const fillColor = diagnosis !== "healthy"
    ? `hsl(${getStatusVar(diagnosis)})`
    : "hsl(var(--muted))";
  const strokeColor = "hsl(var(--border))";

  // Build path based on tooth type, oriented by arch
  const path = buildToothPath(type, cx, y, w, h, isUpper);

  return (
    <g>
      <path
        d={path}
        fill={fillColor}
        stroke={strokeColor}
        strokeWidth={1.2}
        opacity={0.85}
        className="transition-colors duration-150"
      />
    </g>
  );
}

function getStatusVar(status: ToothStatus): string {
  const map: Record<ToothStatus, string> = {
    healthy: "var(--tooth-healthy)",
    carie: "var(--tooth-carie)",
    canal: "var(--tooth-canal)",
    extraction: "var(--tooth-extraction)",
    implant: "var(--tooth-implant)",
    treated: "var(--tooth-treated)",
    crown: "var(--tooth-crown)",
    adjustment: "var(--tooth-adjustment)",
  };
  return map[status];
}

function buildToothPath(type: "molar" | "premolar" | "canine" | "incisor", cx: number, y: number, w: number, h: number, isUpper: boolean): string {
  const hw = w / 2;
  
  if (isUpper) {
    // Crown at bottom, root(s) going up
    const crownY = y + h * 0.45;
    const crownH = h * 0.55;
    const rootTop = y;

    switch (type) {
      case "molar":
        return `M${cx - hw * 0.9},${crownY + crownH}
          Q${cx - hw},${crownY} ${cx - hw * 0.6},${crownY}
          L${cx - hw * 0.5},${rootTop + h * 0.15}
          Q${cx - hw * 0.35},${rootTop} ${cx - hw * 0.2},${rootTop + h * 0.1}
          L${cx},${crownY + crownH * 0.1}
          L${cx + hw * 0.2},${rootTop + h * 0.1}
          Q${cx + hw * 0.35},${rootTop} ${cx + hw * 0.5},${rootTop + h * 0.15}
          L${cx + hw * 0.6},${crownY}
          Q${cx + hw},${crownY} ${cx + hw * 0.9},${crownY + crownH}
          Q${cx},${crownY + crownH + 4} ${cx - hw * 0.9},${crownY + crownH}Z`;
      case "premolar":
        return `M${cx - hw * 0.75},${crownY + crownH}
          Q${cx - hw * 0.8},${crownY} ${cx - hw * 0.3},${crownY}
          L${cx},${rootTop}
          L${cx + hw * 0.3},${crownY}
          Q${cx + hw * 0.8},${crownY} ${cx + hw * 0.75},${crownY + crownH}
          Q${cx},${crownY + crownH + 3} ${cx - hw * 0.75},${crownY + crownH}Z`;
      case "canine":
        return `M${cx - hw * 0.6},${crownY + crownH}
          Q${cx - hw * 0.7},${crownY + crownH * 0.3} ${cx - hw * 0.25},${crownY}
          L${cx},${rootTop}
          L${cx + hw * 0.25},${crownY}
          Q${cx + hw * 0.7},${crownY + crownH * 0.3} ${cx + hw * 0.6},${crownY + crownH}
          Q${cx},${crownY + crownH + 3} ${cx - hw * 0.6},${crownY + crownH}Z`;
      default: // incisor
        return `M${cx - hw * 0.5},${crownY + crownH}
          Q${cx - hw * 0.6},${crownY + crownH * 0.4} ${cx - hw * 0.2},${crownY}
          L${cx},${rootTop}
          L${cx + hw * 0.2},${crownY}
          Q${cx + hw * 0.6},${crownY + crownH * 0.4} ${cx + hw * 0.5},${crownY + crownH}
          Q${cx},${crownY + crownH + 2} ${cx - hw * 0.5},${crownY + crownH}Z`;
    }
  } else {
    // Crown at top, root(s) going down
    const crownH = h * 0.55;
    const rootBottom = y + h;

    switch (type) {
      case "molar":
        return `M${cx - hw * 0.9},${y}
          Q${cx - hw},${y + crownH} ${cx - hw * 0.6},${y + crownH}
          L${cx - hw * 0.5},${rootBottom - h * 0.15}
          Q${cx - hw * 0.35},${rootBottom} ${cx - hw * 0.2},${rootBottom - h * 0.1}
          L${cx},${y + crownH - crownH * 0.1}
          L${cx + hw * 0.2},${rootBottom - h * 0.1}
          Q${cx + hw * 0.35},${rootBottom} ${cx + hw * 0.5},${rootBottom - h * 0.15}
          L${cx + hw * 0.6},${y + crownH}
          Q${cx + hw},${y + crownH} ${cx + hw * 0.9},${y}
          Q${cx},${y - 4} ${cx - hw * 0.9},${y}Z`;
      case "premolar":
        return `M${cx - hw * 0.75},${y}
          Q${cx - hw * 0.8},${y + crownH} ${cx - hw * 0.3},${y + crownH}
          L${cx},${rootBottom}
          L${cx + hw * 0.3},${y + crownH}
          Q${cx + hw * 0.8},${y + crownH} ${cx + hw * 0.75},${y}
          Q${cx},${y - 3} ${cx - hw * 0.75},${y}Z`;
      case "canine":
        return `M${cx - hw * 0.6},${y}
          Q${cx - hw * 0.7},${y + crownH * 0.7} ${cx - hw * 0.25},${y + crownH}
          L${cx},${rootBottom}
          L${cx + hw * 0.25},${y + crownH}
          Q${cx + hw * 0.7},${y + crownH * 0.7} ${cx + hw * 0.6},${y}
          Q${cx},${y - 3} ${cx - hw * 0.6},${y}Z`;
      default:
        return `M${cx - hw * 0.5},${y}
          Q${cx - hw * 0.6},${y + crownH * 0.6} ${cx - hw * 0.2},${y + crownH}
          L${cx},${rootBottom}
          L${cx + hw * 0.2},${y + crownH}
          Q${cx + hw * 0.6},${y + crownH * 0.6} ${cx + hw * 0.5},${y}
          Q${cx},${y - 2} ${cx - hw * 0.5},${y}Z`;
    }
  }
}
