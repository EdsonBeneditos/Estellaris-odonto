import { ToothData, SurfaceName, ToothStatus } from "./types";

const STATUS_COLORS: Record<ToothStatus, string> = {
  healthy: "var(--tooth-healthy)",
  carie: "var(--tooth-carie)",
  canal: "var(--tooth-canal)",
  extraction: "var(--tooth-extraction)",
  implant: "var(--tooth-implant)",
  treated: "var(--tooth-treated)",
};

function hslColor(cssVar: string) {
  return `hsl(${cssVar})`;
}

interface ToothDiagramProps {
  tooth: ToothData;
  x: number;
  y: number;
  size?: number;
  selected?: boolean;
  onToothClick: (toothNum: number) => void;
  onSurfaceClick: (toothNum: number, surface: SurfaceName) => void;
}

export function ToothDiagram({ tooth, x, y, size = 40, selected, onToothClick, onSurfaceClick }: ToothDiagramProps) {
  const s = size;
  const inner = s * 0.3;
  const outerPad = (s - inner * 2) / 2; // padding to inner box
  const ix = x + outerPad; // inner box x
  const iy = y + outerPad; // inner box y
  const iw = inner * 2; // inner width

  // Surface polygons (trapezoids around center square)
  const surfaces: { name: SurfaceName; points: string }[] = [
    // Vestibular (top)
    { name: "vestibular", points: `${x},${y} ${x + s},${y} ${ix + iw},${iy} ${ix},${iy}` },
    // Lingual (bottom)
    { name: "lingual", points: `${ix},${iy + iw} ${ix + iw},${iy + iw} ${x + s},${y + s} ${x},${y + s}` },
    // Mesial (left)
    { name: "mesial", points: `${x},${y} ${ix},${iy} ${ix},${iy + iw} ${x},${y + s}` },
    // Distal (right)
    { name: "distal", points: `${ix + iw},${iy} ${x + s},${y} ${x + s},${y + s} ${ix + iw},${iy + iw}` },
    // Oclusal (center)
    { name: "oclusal", points: `${ix},${iy} ${ix + iw},${iy} ${ix + iw},${iy + iw} ${ix},${iy + iw}` },
  ];

  return (
    <g className="cursor-pointer" onClick={() => onToothClick(tooth.number)}>
      {/* Tooth number */}
      <text
        x={x + s / 2}
        y={y - 6}
        textAnchor="middle"
        className="text-[10px] font-medium select-none"
        fill="currentColor"
      >
        {tooth.number}
      </text>

      {/* Selection highlight */}
      {selected && (
        <rect
          x={x - 3}
          y={y - 3}
          width={s + 6}
          height={s + 6}
          rx={4}
          fill="none"
          stroke="hsl(var(--ring))"
          strokeWidth={2}
          strokeDasharray="4 2"
        />
      )}

      {/* Surfaces */}
      {surfaces.map((surf) => (
        <polygon
          key={surf.name}
          points={surf.points}
          fill={hslColor(STATUS_COLORS[tooth.surfaces[surf.name].status])}
          className="tooth-surface"
          onClick={(e) => {
            e.stopPropagation();
            onSurfaceClick(tooth.number, surf.name);
          }}
        >
          <title>{surf.name.charAt(0).toUpperCase() + surf.name.slice(1)}: {tooth.surfaces[surf.name].status}</title>
        </polygon>
      ))}

      {/* Extraction X */}
      {tooth.diagnosis === "extraction" && (
        <>
          <line x1={x + 4} y1={y + 4} x2={x + s - 4} y2={y + s - 4} stroke="hsl(var(--destructive))" strokeWidth={2.5} />
          <line x1={x + s - 4} y1={y + 4} x2={x + 4} y2={y + s - 4} stroke="hsl(var(--destructive))" strokeWidth={2.5} />
        </>
      )}
    </g>
  );
}
