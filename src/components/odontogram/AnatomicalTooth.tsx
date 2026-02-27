import { useState } from "react";
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
  const [rootHover, setRootHover] = useState(false);
  const type = getToothType(toothNumber);
  const w = size;
  const crownH = size * 0.55;
  const rootH = size * 0.45;
  const cx = x + w / 2;

  const fillColor = hasConditions ? getPhaseColor(phase) : "hsl(var(--muted))";
  const strokeColor = "hsl(var(--border))";
  const rootColor = rootHover ? "hsl(0, 50%, 35%)" : "hsl(var(--muted))";

  // Crown y and root y depend on upper/lower
  const crownY = isUpper ? y + rootH : y;
  const rootY = isUpper ? y : y + crownH;
  const crownCy = crownY + crownH / 2;

  const crownPath = buildCrownPath(type, cx, crownCy, w, crownH);
  const rootPaths = buildRootPaths(type, cx, rootY, w, rootH, isUpper);

  return (
    <g className="transition-colors duration-200">
      {/* Roots - ultra delicate */}
      {rootPaths.map((rp, i) => (
        <path
          key={i}
          d={rp}
          fill={rootColor}
          stroke={strokeColor}
          strokeWidth={0.5}
          strokeLinejoin="round"
          strokeLinecap="round"
          opacity={0.6}
          onMouseEnter={() => setRootHover(true)}
          onMouseLeave={() => setRootHover(false)}
          className="cursor-pointer transition-all duration-200"
        />
      ))}
      {/* Crown */}
      <path
        d={crownPath}
        fill={fillColor}
        stroke={strokeColor}
        strokeWidth={0.8}
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
      return `M${cx - hw * 0.82},${cy + hh * 0.85}
        Q${cx - hw * 0.92},${cy} ${cx - hw * 0.78},${cy - hh * 0.7}
        Q${cx - hw * 0.5},${cy - hh * 0.95} ${cx},${cy - hh * 0.85}
        Q${cx + hw * 0.5},${cy - hh * 0.95} ${cx + hw * 0.78},${cy - hh * 0.7}
        Q${cx + hw * 0.92},${cy} ${cx + hw * 0.82},${cy + hh * 0.85}
        Q${cx},${cy + hh} ${cx - hw * 0.82},${cy + hh * 0.85}Z`;

    case "premolar":
      return `M${cx - hw * 0.68},${cy + hh * 0.85}
        Q${cx - hw * 0.8},${cy} ${cx - hw * 0.65},${cy - hh * 0.75}
        Q${cx - hw * 0.3},${cy - hh * 0.95} ${cx},${cy - hh * 0.88}
        Q${cx + hw * 0.3},${cy - hh * 0.95} ${cx + hw * 0.65},${cy - hh * 0.75}
        Q${cx + hw * 0.8},${cy} ${cx + hw * 0.68},${cy + hh * 0.85}
        Q${cx},${cy + hh} ${cx - hw * 0.68},${cy + hh * 0.85}Z`;

    case "canine":
      return `M${cx - hw * 0.5},${cy + hh * 0.85}
        Q${cx - hw * 0.65},${cy} ${cx - hw * 0.4},${cy - hh * 0.7}
        Q${cx - hw * 0.15},${cy - hh} ${cx},${cy - hh * 0.95}
        Q${cx + hw * 0.15},${cy - hh} ${cx + hw * 0.4},${cy - hh * 0.7}
        Q${cx + hw * 0.65},${cy} ${cx + hw * 0.5},${cy + hh * 0.85}
        Q${cx},${cy + hh} ${cx - hw * 0.5},${cy + hh * 0.85}Z`;

    default: // incisor
      return `M${cx - hw * 0.45},${cy + hh * 0.85}
        Q${cx - hw * 0.55},${cy} ${cx - hw * 0.4},${cy - hh * 0.7}
        Q${cx - hw * 0.15},${cy - hh * 0.95} ${cx},${cy - hh * 0.9}
        Q${cx + hw * 0.15},${cy - hh * 0.95} ${cx + hw * 0.4},${cy - hh * 0.7}
        Q${cx + hw * 0.55},${cy} ${cx + hw * 0.45},${cy + hh * 0.85}
        Q${cx},${cy + hh} ${cx - hw * 0.45},${cy + hh * 0.85}Z`;
  }
}

function buildRootPaths(type: "molar" | "premolar" | "canine" | "incisor", cx: number, rootY: number, w: number, rootH: number, isUpper: boolean): string[] {
  const hw = w / 2;
  const dir = isUpper ? -1 : 1; // roots go up for upper, down for lower
  const baseY = isUpper ? rootY + rootH : rootY;
  const tipY = isUpper ? rootY : rootY + rootH;

  switch (type) {
    case "molar":
      // 3 roots
      return [
        // Left root
        `M${cx - hw * 0.55},${baseY} Q${cx - hw * 0.7},${baseY + (tipY - baseY) * 0.5} ${cx - hw * 0.5},${tipY * 0.95 + baseY * 0.05} Q${cx - hw * 0.3},${baseY + (tipY - baseY) * 0.5} ${cx - hw * 0.2},${baseY}Z`,
        // Center root
        `M${cx - hw * 0.12},${baseY} Q${cx - hw * 0.1},${baseY + (tipY - baseY) * 0.6} ${cx},${tipY * 0.85 + baseY * 0.15} Q${cx + hw * 0.1},${baseY + (tipY - baseY) * 0.6} ${cx + hw * 0.12},${baseY}Z`,
        // Right root
        `M${cx + hw * 0.2},${baseY} Q${cx + hw * 0.3},${baseY + (tipY - baseY) * 0.5} ${cx + hw * 0.5},${tipY * 0.95 + baseY * 0.05} Q${cx + hw * 0.7},${baseY + (tipY - baseY) * 0.5} ${cx + hw * 0.55},${baseY}Z`,
      ];

    case "premolar":
      // 2 roots
      return [
        `M${cx - hw * 0.35},${baseY} Q${cx - hw * 0.5},${baseY + (tipY - baseY) * 0.5} ${cx - hw * 0.3},${tipY * 0.9 + baseY * 0.1} Q${cx - hw * 0.1},${baseY + (tipY - baseY) * 0.5} ${cx - hw * 0.05},${baseY}Z`,
        `M${cx + hw * 0.05},${baseY} Q${cx + hw * 0.1},${baseY + (tipY - baseY) * 0.5} ${cx + hw * 0.3},${tipY * 0.9 + baseY * 0.1} Q${cx + hw * 0.5},${baseY + (tipY - baseY) * 0.5} ${cx + hw * 0.35},${baseY}Z`,
      ];

    case "canine":
      // 1 long root
      return [
        `M${cx - hw * 0.2},${baseY} Q${cx - hw * 0.25},${baseY + (tipY - baseY) * 0.5} ${cx},${tipY} Q${cx + hw * 0.25},${baseY + (tipY - baseY) * 0.5} ${cx + hw * 0.2},${baseY}Z`,
      ];

    default: // incisor
      // 1 root
      return [
        `M${cx - hw * 0.18},${baseY} Q${cx - hw * 0.2},${baseY + (tipY - baseY) * 0.5} ${cx},${tipY * 0.95 + baseY * 0.05} Q${cx + hw * 0.2},${baseY + (tipY - baseY) * 0.5} ${cx + hw * 0.18},${baseY}Z`,
      ];
  }
}
