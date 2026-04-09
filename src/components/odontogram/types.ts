// ============================
// Clinical Odontogram Type System
// ============================

export type ClinicalCondition =
  | "healthy"
  | "protese_coronaria" | "pilar" | "retracao_gengival" | "selante_indicado"
  | "cariado" | "restaurado_carie" | "lesao_furca"
  | "coroa" | "nucleo_pino" | "calculo_dental" | "fratura"
  | "restaurado" | "raiz_restaurada" | "endo_realizado";

export type TreatmentPhase = "diagnosis" | "in_progress" | "completed";

export const PHASE_COLORS: Record<TreatmentPhase, string> = {
  diagnosis: "var(--tooth-diagnosis)",
  in_progress: "var(--tooth-in-progress)",
  completed: "var(--tooth-completed)",
};

export const PHASE_LABELS: Record<TreatmentPhase, string> = {
  diagnosis: "Diagnóstico (necessita tratar)",
  in_progress: "Em andamento",
  completed: "Concluído",
};

export interface ConditionInfo {
  id: ClinicalCondition;
  label: string;
  abbr: string;
  column: 1 | 2;
}

export const CLINICAL_CONDITIONS: ConditionInfo[] = [
  { id: "protese_coronaria", label: "Prótese coronária/unitária", abbr: "Pc", column: 1 },
  { id: "pilar", label: "Pilar", abbr: "P", column: 1 },
  { id: "retracao_gengival", label: "Retração gengival", abbr: "Rg", column: 1 },
  { id: "selante_indicado", label: "Selante indicado", abbr: "Si", column: 1 },
  { id: "cariado", label: "Cariado", abbr: "C", column: 1 },
  { id: "restaurado_carie", label: "Restaurado com cárie", abbr: "Rc", column: 1 },
  { id: "lesao_furca", label: "Lesão de furca", abbr: "Lf", column: 1 },
  { id: "coroa", label: "Coroa", abbr: "Co", column: 2 },
  { id: "nucleo_pino", label: "Núcleo (Pino)", abbr: "Np", column: 2 },
  { id: "calculo_dental", label: "Cálculo dental", abbr: "Cd", column: 2 },
  { id: "fratura", label: "Fratura", abbr: "Fr", column: 2 },
  { id: "restaurado", label: "Restaurado", abbr: "R", column: 2 },
  { id: "raiz_restaurada", label: "Raiz restaurada", abbr: "Rr", column: 2 },
  { id: "endo_realizado", label: "Trat. endodôntico realizado", abbr: "Er", column: 2 },
];

export type SurfaceName = "vestibular" | "lingual" | "mesial" | "distal" | "oclusal";

export interface SurfaceState {
  condition: ClinicalCondition;
  phase: TreatmentPhase;
}

export interface EvolutionEntry {
  date: string;
  professional_id: string;
  professional_name: string;
  condition: ClinicalCondition;
  phase: TreatmentPhase;
  surface?: SurfaceName;
  notes?: string;
}

export interface ToothData {
  number: number;
  conditions: ClinicalCondition[];
  phase: TreatmentPhase;
  surfaces: Record<SurfaceName, SurfaceState>;
  evolution: EvolutionEntry[];
  notes?: string;
}

export type OdontogramData = Record<number, ToothData>;

export interface OdontogramMeta {
  possui_aparelho: boolean;
  possui_contencao: boolean;
  protese_total_superior: boolean;
  protese_total_inferior: boolean;
}

export const DEFAULT_META: OdontogramMeta = {
  possui_aparelho: false,
  possui_contencao: false,
  protese_total_superior: false,
  protese_total_inferior: false,
};

export const SURFACE_NAMES: SurfaceName[] = ["vestibular", "lingual", "mesial", "distal", "oclusal"];

export const SURFACE_LABELS: Record<SurfaceName, string> = {
  vestibular: "V",
  lingual: "L/P",
  mesial: "M",
  distal: "D",
  oclusal: "O/I",
};

/**
 * Returns the context-aware label for a tooth surface:
 * - "lingual" → "P" (Palatina) for upper teeth, "L" (Lingual) for lower
 * - "oclusal" → "I" (Incisal) for incisors/canines (unit ≤ 3), "O" (Oclusal) for others
 */
export function getSurfaceLabel(
  surface: SurfaceName,
  isUpper: boolean,
  toothNum: number,
): string {
  const unit = toothNum % 10;
  const isAnterior = unit >= 1 && unit <= 3; // incisors (1,2) and canines (3)
  if (surface === "lingual") return isUpper ? "P" : "L";
  if (surface === "oclusal") return isAnterior ? "I" : "O";
  return SURFACE_LABELS[surface]; // V, M, D
}

export function getSurfaceFullLabel(
  surface: SurfaceName,
  isUpper: boolean,
  toothNum: number,
): string {
  const unit = toothNum % 10;
  const isAnterior = unit >= 1 && unit <= 3;
  if (surface === "lingual") return isUpper ? "Palatina" : "Lingual";
  if (surface === "oclusal") return isAnterior ? "Incisal" : "Oclusal";
  if (surface === "vestibular") return "Vestibular";
  if (surface === "mesial") return "Mesial";
  return "Distal";
}

export const CONDITION_LABELS: Record<ClinicalCondition, string> = {
  healthy: "Saudável",
  protese_coronaria: "Prótese coronária",
  pilar: "Pilar",
  retracao_gengival: "Retração gengival",
  selante_indicado: "Selante indicado",
  cariado: "Cariado",
  restaurado_carie: "Restaurado c/ cárie",
  lesao_furca: "Lesão de furca",
  coroa: "Coroa",
  nucleo_pino: "Núcleo (Pino)",
  calculo_dental: "Cálculo dental",
  fratura: "Fratura",
  restaurado: "Restaurado",
  raiz_restaurada: "Raiz restaurada",
  endo_realizado: "Trat. endodôntico",
};

// Permanent teeth arrays
export const PERMANENT_UPPER_RIGHT = [18, 17, 16, 15, 14, 13, 12, 11];
export const PERMANENT_UPPER_LEFT = [21, 22, 23, 24, 25, 26, 27, 28];
export const PERMANENT_LOWER_LEFT = [38, 37, 36, 35, 34, 33, 32, 31];
export const PERMANENT_LOWER_RIGHT = [41, 42, 43, 44, 45, 46, 47, 48];

// Deciduous teeth arrays (20 teeth, proper pediatric numbering)
export const DECIDUOUS_UPPER_RIGHT = [55, 54, 53, 52, 51];
export const DECIDUOUS_UPPER_LEFT = [61, 62, 63, 64, 65];
export const DECIDUOUS_LOWER_LEFT = [75, 74, 73, 72, 71];
export const DECIDUOUS_LOWER_RIGHT = [81, 82, 83, 84, 85];

// All teeth sorted for replication menu
export const ALL_PERMANENT_SORTED = [
  11, 12, 13, 14, 15, 16, 17, 18,
  21, 22, 23, 24, 25, 26, 27, 28,
  31, 32, 33, 34, 35, 36, 37, 38,
  41, 42, 43, 44, 45, 46, 47, 48,
];

export const ALL_DECIDUOUS_SORTED = [
  51, 52, 53, 54, 55,
  61, 62, 63, 64, 65,
  71, 72, 73, 74, 75,
  81, 82, 83, 84, 85,
];

export function createEmptySurface(): SurfaceState {
  return { condition: "healthy", phase: "diagnosis" };
}

export function createEmptyTooth(num: number): ToothData {
  return {
    number: num,
    conditions: [],
    phase: "diagnosis",
    surfaces: {
      vestibular: createEmptySurface(),
      lingual: createEmptySurface(),
      mesial: createEmptySurface(),
      distal: createEmptySurface(),
      oclusal: createEmptySurface(),
    },
    evolution: [],
  };
}

export function getToothType(num: number): "molar" | "premolar" | "canine" | "incisor" {
  const unit = num % 10;
  // Deciduous teeth: 1-2 = incisor, 3 = canine, 4-5 = molar
  const decade = Math.floor(num / 10);
  if (decade >= 5) {
    if (unit >= 4) return "molar";
    if (unit === 3) return "canine";
    return "incisor";
  }
  if (unit >= 6) return "molar";
  if (unit >= 4) return "premolar";
  if (unit === 3) return "canine";
  return "incisor";
}

export function getPhaseColor(phase: TreatmentPhase): string {
  return `hsl(${PHASE_COLORS[phase]})`;
}

export function getSurfaceColor(surface: SurfaceState): string {
  if (surface.condition === "healthy") return "hsl(var(--tooth-healthy))";
  return getPhaseColor(surface.phase);
}
