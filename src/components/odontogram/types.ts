// ============================
// Clinical Odontogram Type System
// ============================

/** Clinical condition that can be applied to a tooth or surface */
export type ClinicalCondition =
  | "healthy"
  // Column 1 conditions
  | "protese_coronaria"   // Prótese coronária/unitária
  | "pilar"               // Pilar (P)
  | "retracao_gengival"   // Retração gengival (Rg)
  | "selante_indicado"    // Selante indicado (Si)
  | "cariado"             // Cariado (C)
  | "restaurado_carie"    // Restaurado com cárie (Rc)
  | "lesao_furca"         // Possui lesão de furca
  // Column 2 conditions
  | "coroa"               // Coroa (Co)
  | "nucleo_pino"         // Núcleo / Pino
  | "calculo_dental"      // Cálculo dental (Cd)
  | "fratura"             // Fratura (Fr)
  | "restaurado"          // Restaurado (R)
  | "raiz_restaurada"     // Raiz restaurada
  | "endo_realizado";     // Tratamento endodôntico realizado

/** Phase of treatment — drives the color logic */
export type TreatmentPhase = "diagnosis" | "in_progress" | "completed";

export const PHASE_COLORS: Record<TreatmentPhase, string> = {
  diagnosis: "var(--tooth-diagnosis)",     // Red
  in_progress: "var(--tooth-in-progress)", // Yellow
  completed: "var(--tooth-completed)",     // Blue
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
  // Column 1
  { id: "protese_coronaria", label: "Prótese coronária/unitária", abbr: "Pc", column: 1 },
  { id: "pilar", label: "Pilar", abbr: "P", column: 1 },
  { id: "retracao_gengival", label: "Retração gengival", abbr: "Rg", column: 1 },
  { id: "selante_indicado", label: "Selante indicado", abbr: "Si", column: 1 },
  { id: "cariado", label: "Cariado", abbr: "C", column: 1 },
  { id: "restaurado_carie", label: "Restaurado com cárie", abbr: "Rc", column: 1 },
  { id: "lesao_furca", label: "Lesão de furca", abbr: "Lf", column: 1 },
  // Column 2
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

/** Global odontogram metadata stored alongside teeth */
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

export const PERMANENT_UPPER_RIGHT = [18, 17, 16, 15, 14, 13, 12, 11];
export const PERMANENT_UPPER_LEFT = [21, 22, 23, 24, 25, 26, 27, 28];
export const PERMANENT_LOWER_LEFT = [38, 37, 36, 35, 34, 33, 32, 31];
export const PERMANENT_LOWER_RIGHT = [41, 42, 43, 44, 45, 46, 47, 48];

export const DECIDUOUS_UPPER_RIGHT = [55, 54, 53, 52, 51];
export const DECIDUOUS_UPPER_LEFT = [61, 62, 63, 64, 65];
export const DECIDUOUS_LOWER_LEFT = [75, 74, 73, 72, 71];
export const DECIDUOUS_LOWER_RIGHT = [81, 82, 83, 84, 85];

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
