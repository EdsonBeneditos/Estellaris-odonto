import { CONDITION_LABELS, PHASE_LABELS, SURFACE_LABELS } from "@/components/odontogram/types";
import type { Json } from "@/integrations/supabase/types";

export interface ClinicalSummaryEntry {
  tooth: number;
  condition: string;
  conditionLabel: string;
  phase: string;
  phaseLabel: string;
  phaseColor: "destructive" | "warning" | "completed";
  surfaces: { name: string; label: string; condition: string; phase: string }[];
  evolution: { date: string; professional: string; condition: string; phase: string; surface?: string; notes?: string }[];
}

const PHASE_COLOR_MAP: Record<string, "destructive" | "warning" | "completed"> = {
  diagnosis: "destructive",
  in_progress: "warning",
  completed: "completed",
};

/**
 * Parses the estado_bucal JSONB (as saved by OdontogramPage) into
 * a sorted array of clinical summary entries for display in the Prontuário.
 *
 * Expected JSONB shape:
 * {
 *   teeth: {
 *     "17": { number, conditions: [...], phase, surfaces: { vestibular: { condition, phase }, ... }, evolution: [...] },
 *     ...
 *   },
 *   meta: { ... }
 * }
 */
export function generateClinicalSummary(estadoBucal: Json | null | undefined): ClinicalSummaryEntry[] {
  if (!estadoBucal || typeof estadoBucal !== "object" || Array.isArray(estadoBucal)) return [];

  const obj = estadoBucal as Record<string, Json>;
  const teethObj = obj.teeth as Record<string, Json> | undefined;

  // If no "teeth" wrapper, try reading top-level keys as tooth numbers
  const source = teethObj ?? obj;

  const entries: ClinicalSummaryEntry[] = [];

  for (const [key, value] of Object.entries(source)) {
    const toothNum = parseInt(key, 10);
    if (isNaN(toothNum) || !value || typeof value !== "object" || Array.isArray(value)) continue;

    const td = value as Record<string, Json>;
    const conditions = (td.conditions as string[] | undefined) ?? [];
    const phase = (td.phase as string) ?? "diagnosis";

    // Skip teeth with no conditions and all healthy surfaces
    const hasConditions = conditions.length > 0 && !(conditions.length === 1 && conditions[0] === "healthy");

    // Check surfaces
    const surfacesRaw = td.surfaces as Record<string, Json> | undefined;
    const surfaceEntries: ClinicalSummaryEntry["surfaces"] = [];
    let hasNonHealthySurface = false;

    if (surfacesRaw) {
      for (const [sKey, sVal] of Object.entries(surfacesRaw)) {
        if (!sVal || typeof sVal !== "object" || Array.isArray(sVal)) continue;
        const sd = sVal as Record<string, Json>;
        const sCond = (sd.condition as string) ?? "healthy";
        const sPhase = (sd.phase as string) ?? "diagnosis";
        if (sCond !== "healthy") {
          hasNonHealthySurface = true;
          surfaceEntries.push({
            name: sKey,
            label: (SURFACE_LABELS as Record<string, string>)[sKey] ?? sKey,
            condition: (CONDITION_LABELS as Record<string, string>)[sCond] ?? sCond,
            phase: (PHASE_LABELS as Record<string, string>)[sPhase] ?? sPhase,
          });
        }
      }
    }

    // Check evolution
    const evolutionRaw = (td.evolution as Array<Record<string, Json>>) ?? [];
    const evolution = evolutionRaw.map((ev) => ({
      date: (ev.date as string) ?? "",
      professional: (ev.professional_name as string) ?? "",
      condition: (CONDITION_LABELS as Record<string, string>)[(ev.condition as string)] ?? (ev.condition as string) ?? "",
      phase: (PHASE_LABELS as Record<string, string>)[(ev.phase as string)] ?? (ev.phase as string) ?? "",
      surface: ev.surface ? ((SURFACE_LABELS as Record<string, string>)[(ev.surface as string)] ?? (ev.surface as string)) : undefined,
      notes: (ev.notes as string) ?? undefined,
    }));

    if (!hasConditions && !hasNonHealthySurface && evolution.length === 0) continue;

    const primaryCondition = conditions.find(c => c !== "healthy") ?? conditions[0] ?? "healthy";

    entries.push({
      tooth: toothNum,
      condition: primaryCondition,
      conditionLabel: (CONDITION_LABELS as Record<string, string>)[primaryCondition] ?? primaryCondition,
      phase,
      phaseLabel: (PHASE_LABELS as Record<string, string>)[phase] ?? phase,
      phaseColor: PHASE_COLOR_MAP[phase] ?? "destructive",
      surfaces: surfaceEntries,
      evolution,
    });
  }

  return entries.sort((a, b) => a.tooth - b.tooth);
}
