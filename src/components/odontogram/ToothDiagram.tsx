import { ToothData, SurfaceName, getSurfaceColor, getSurfaceFullLabel } from "./types";
import { AnatomicalTooth } from "./AnatomicalTooth";

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

export function ToothDiagram({ tooth, x, y, size = 28, isUpper, selected, onToothClick, onSurfaceClick }: ToothDiagramProps) {
  const s = size;
  const toothH = s; // crown + root combined in AnatomicalTooth
  const surfaceBlockSize = s * 0.75;
  const gapBetween = 2;
  const numberFontSize = 7;
  const numberH = 9;

  let numberY: number, anatomyY: number, surfaceY: number;
  if (isUpper) {
    numberY = y;
    anatomyY = y + numberH;
    surfaceY = anatomyY + toothH + gapBetween;
  } else {
    surfaceY = y;
    anatomyY = y + surfaceBlockSize + gapBetween;
    numberY = anatomyY + toothH;
  }

  // Surface grid geometry
  const surfaceOffset = (s - surfaceBlockSize) / 2;
  const inner = surfaceBlockSize * 0.28;
  const outerPad = (surfaceBlockSize - inner * 2) / 2;
  const sx = x + surfaceOffset;
  const sy = surfaceY;
  const ix = sx + outerPad;
  const iy = sy + outerPad;
  const iw = inner * 2;

  const surfaces: { name: SurfaceName; points: string }[] = [
    { name: "vestibular", points: `${sx},${sy} ${sx + surfaceBlockSize},${sy} ${ix + iw},${iy} ${ix},${iy}` },
    { name: "lingual", points: `${ix},${iy + iw} ${ix + iw},${iy + iw} ${sx + surfaceBlockSize},${sy + surfaceBlockSize} ${sx},${sy + surfaceBlockSize}` },
    { name: "mesial", points: `${sx},${sy} ${ix},${iy} ${ix},${iy + iw} ${sx},${sy + surfaceBlockSize}` },
    { name: "distal", points: `${ix + iw},${iy} ${sx + surfaceBlockSize},${sy} ${sx + surfaceBlockSize},${sy + surfaceBlockSize} ${ix + iw},${iy + iw}` },
    { name: "oclusal", points: `${ix},${iy} ${ix + iw},${iy} ${ix + iw},${iy + iw} ${ix},${iy + iw}` },
  ];

  const hasConditions = tooth.conditions.length > 0;

  return (
    <g className="cursor-pointer">
      {/* Tooth number */}
      <text
        x={x + s / 2}
        y={isUpper ? numberY + numberFontSize + 1 : numberY + numberH}
        textAnchor="middle"
        className="select-none"
        style={{ fontSize: numberFontSize, fontWeight: 600, fontFamily: "'Space Grotesk', sans-serif" }}
        fill="hsl(var(--foreground))"
      >
        {tooth.number}
      </text>

      {/* Crown + Root silhouette */}
      <AnatomicalTooth
        toothNumber={tooth.number}
        x={x}
        y={anatomyY}
        size={s}
        isUpper={isUpper}
        phase={tooth.phase}
        hasConditions={hasConditions}
      />

      {/* Selection ring */}
      {selected && (
        <rect
          x={sx - 1} y={sy - 1}
          width={surfaceBlockSize + 2} height={surfaceBlockSize + 2}
          rx={2} fill="none"
          stroke="hsl(var(--ring))" strokeWidth={1.5} strokeDasharray="3 2"
        />
      )}

      {/* 5 surface polygons */}
      {surfaces.map((surf) => (
        <polygon
          key={surf.name}
          points={surf.points}
          fill={getSurfaceColor(tooth.surfaces[surf.name])}
          className="tooth-surface"
          onClick={(e) => { e.stopPropagation(); onSurfaceClick(tooth.number, surf.name); }}
        >
          <title>{getSurfaceFullLabel(surf.name, isUpper, tooth.number)}: {tooth.surfaces[surf.name].condition}</title>
        </polygon>
      ))}

      {/* Click area over crown+root */}
      <rect
        x={x} y={anatomyY}
        width={s} height={toothH}
        fill="transparent"
        onClick={() => onToothClick(tooth.number)}
      />
    </g>
  );
}
