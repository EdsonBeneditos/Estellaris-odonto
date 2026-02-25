import { ToothData, SurfaceName, ToothStatus } from "./types";
import { AnatomicalTooth } from "./AnatomicalTooth";

function hslColor(cssVar: string) {
  return `hsl(${cssVar})`;
}

const STATUS_COLORS: Record<ToothStatus, string> = {
  healthy: "var(--tooth-healthy)",
  carie: "var(--tooth-carie)",
  canal: "var(--tooth-canal)",
  extraction: "var(--tooth-extraction)",
  implant: "var(--tooth-implant)",
  treated: "var(--tooth-treated)",
  crown: "var(--tooth-crown)",
  adjustment: "var(--tooth-adjustment)",
};

interface ToothDiagramProps {
  tooth: ToothData;
  x: number;
  y: number;
  size?: number;
  isUpper: boolean;
  selected?: boolean;
  onToothClick: (toothNum: number) => void;
  onSurfaceClick: (toothNum: number, surface: SurfaceName) => void;
}

export function ToothDiagram({ tooth, x, y, size = 40, isUpper, selected, onToothClick, onSurfaceClick }: ToothDiagramProps) {
  const s = size;
  const anatomicalH = s * 1.3;
  const surfaceBlockSize = s;
  const gapBetween = 4;

  // Layout: upper = number → anatomy → surfaces (top to bottom)
  // lower = surfaces → anatomy → number (top to bottom)
  const numberFontSize = 9;
  const numberH = 12;

  let numberY: number, anatomyY: number, surfaceY: number;
  if (isUpper) {
    numberY = y;
    anatomyY = y + numberH;
    surfaceY = anatomyY + anatomicalH + gapBetween;
  } else {
    surfaceY = y;
    anatomyY = y + surfaceBlockSize + gapBetween;
    numberY = anatomyY + anatomicalH;
  }

  // Surface grid
  const inner = surfaceBlockSize * 0.3;
  const outerPad = (surfaceBlockSize - inner * 2) / 2;
  const sx = x;
  const sy = surfaceY;
  const ix = sx + outerPad;
  const iy = sy + outerPad;
  const iw = inner * 2;

  const surfaces: { name: SurfaceName; points: string }[] = [
    { name: "vestibular", points: `${sx},${sy} ${sx + s},${sy} ${ix + iw},${iy} ${ix},${iy}` },
    { name: "lingual", points: `${ix},${iy + iw} ${ix + iw},${iy + iw} ${sx + s},${sy + s} ${sx},${sy + s}` },
    { name: "mesial", points: `${sx},${sy} ${ix},${iy} ${ix},${iy + iw} ${sx},${sy + s}` },
    { name: "distal", points: `${ix + iw},${iy} ${sx + s},${sy} ${sx + s},${sy + s} ${ix + iw},${iy + iw}` },
    { name: "oclusal", points: `${ix},${iy} ${ix + iw},${iy} ${ix + iw},${iy + iw} ${ix},${iy + iw}` },
  ];

  return (
    <g className="cursor-pointer">
      {/* Tooth number */}
      <text
        x={x + s / 2}
        y={isUpper ? numberY + numberFontSize : numberY + numberH}
        textAnchor="middle"
        className="select-none"
        style={{ fontSize: numberFontSize, fontWeight: 600 }}
        fill="hsl(var(--foreground))"
      >
        {tooth.number}
      </text>

      {/* Anatomical silhouette */}
      <AnatomicalTooth
        toothNumber={tooth.number}
        x={x}
        y={anatomyY}
        size={s}
        isUpper={isUpper}
        diagnosis={tooth.diagnosis}
      />

      {/* Selection highlight around surfaces */}
      {selected && (
        <rect
          x={sx - 2}
          y={sy - 2}
          width={s + 4}
          height={s + 4}
          rx={3}
          fill="none"
          stroke="hsl(var(--ring))"
          strokeWidth={2}
          strokeDasharray="4 2"
        />
      )}

      {/* 5 surface polygons */}
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

      {/* Whole-tooth click area (anatomy) */}
      <rect
        x={x}
        y={anatomyY}
        width={s}
        height={anatomicalH}
        fill="transparent"
        onClick={() => onToothClick(tooth.number)}
      />

      {/* Extraction X */}
      {tooth.diagnosis === "extraction" && (
        <>
          <line x1={sx + 4} y1={sy + 4} x2={sx + s - 4} y2={sy + s - 4} stroke="hsl(var(--destructive))" strokeWidth={2.5} />
          <line x1={sx + s - 4} y1={sy + 4} x2={sx + 4} y2={sy + s - 4} stroke="hsl(var(--destructive))" strokeWidth={2.5} />
        </>
      )}
    </g>
  );
}
