import { ToothData, SurfaceName, getSurfaceColor } from "./types";
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

export function ToothDiagram({ tooth, x, y, size = 40, isUpper, selected, onToothClick, onSurfaceClick }: ToothDiagramProps) {
  const s = size;
  const anatomicalH = s * 1.4;
  const surfaceBlockSize = s;
  const gapBetween = 3;
  const numberFontSize = 9;
  const numberH = 13;

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

  // Surface grid geometry
  const inner = surfaceBlockSize * 0.28;
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

      {/* Anatomical silhouette */}
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
          x={sx - 2} y={sy - 2}
          width={s + 4} height={s + 4}
          rx={3} fill="none"
          stroke="hsl(var(--ring))" strokeWidth={2} strokeDasharray="4 2"
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
          <title>{surf.name}: {tooth.surfaces[surf.name].condition}</title>
        </polygon>
      ))}

      {/* Click area over anatomy */}
      <rect
        x={x} y={anatomyY}
        width={s} height={anatomicalH}
        fill="transparent"
        onClick={() => onToothClick(tooth.number)}
      />

      {/* Condition abbreviations below surfaces */}
      {hasConditions && (
        <text
          x={x + s / 2}
          y={isUpper ? surfaceY + surfaceBlockSize + 10 : surfaceY - 4}
          textAnchor="middle"
          style={{ fontSize: 7, fontWeight: 500 }}
          fill="hsl(var(--muted-foreground))"
          className="select-none"
        >
          {tooth.conditions.length > 2 ? `${tooth.conditions.length} cond.` : ""}
        </text>
      )}
    </g>
  );
}
