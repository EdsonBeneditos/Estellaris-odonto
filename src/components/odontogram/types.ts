export type ToothStatus = "healthy" | "carie" | "canal" | "extraction" | "implant" | "treated" | "crown" | "adjustment";

export type SurfaceName = "vestibular" | "lingual" | "mesial" | "distal" | "oclusal";

export interface ToothSurface {
  status: ToothStatus;
}

export interface ToothData {
  number: number;
  surfaces: Record<SurfaceName, ToothSurface>;
  diagnosis: ToothStatus;
  notes?: string;
}

export type OdontogramData = Record<number, ToothData>;

export const SURFACE_NAMES: SurfaceName[] = ["vestibular", "lingual", "mesial", "distal", "oclusal"];

export const SURFACE_LABELS: Record<SurfaceName, string> = {
  vestibular: "V",
  lingual: "L/P",
  mesial: "M",
  distal: "D",
  oclusal: "O/I",
};

export const STATUS_LABELS: Record<ToothStatus, string> = {
  healthy: "Saudável",
  carie: "Cárie",
  canal: "Canal",
  extraction: "Extração",
  implant: "Implante",
  treated: "Tratado",
  crown: "Coroa",
  adjustment: "Ajuste",
};

export const STATUS_COLORS: Record<ToothStatus, string> = {
  healthy: "var(--tooth-healthy)",
  carie: "var(--tooth-carie)",
  canal: "var(--tooth-canal)",
  extraction: "var(--tooth-extraction)",
  implant: "var(--tooth-implant)",
  treated: "var(--tooth-treated)",
  crown: "var(--tooth-crown)",
  adjustment: "var(--tooth-adjustment)",
};

export const PERMANENT_UPPER_RIGHT = [18, 17, 16, 15, 14, 13, 12, 11];
export const PERMANENT_UPPER_LEFT = [21, 22, 23, 24, 25, 26, 27, 28];
export const PERMANENT_LOWER_LEFT = [38, 37, 36, 35, 34, 33, 32, 31];
export const PERMANENT_LOWER_RIGHT = [41, 42, 43, 44, 45, 46, 47, 48];

export const DECIDUOUS_UPPER_RIGHT = [55, 54, 53, 52, 51];
export const DECIDUOUS_UPPER_LEFT = [61, 62, 63, 64, 65];
export const DECIDUOUS_LOWER_LEFT = [75, 74, 73, 72, 71];
export const DECIDUOUS_LOWER_RIGHT = [81, 82, 83, 84, 85];

export function createEmptyTooth(num: number): ToothData {
  return {
    number: num,
    diagnosis: "healthy",
    surfaces: {
      vestibular: { status: "healthy" },
      lingual: { status: "healthy" },
      mesial: { status: "healthy" },
      distal: { status: "healthy" },
      oclusal: { status: "healthy" },
    },
  };
}

/** Returns the tooth type based on its FDI number */
export function getToothType(num: number): "molar" | "premolar" | "canine" | "incisor" {
  const unit = num % 10;
  if (unit >= 6) return "molar";
  if (unit >= 4) return "premolar";
  if (unit === 3) return "canine";
  return "incisor";
}
