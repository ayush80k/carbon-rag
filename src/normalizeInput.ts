import { AnalysisRequest, NormalizedProject } from "./types.js";
import { findProjectById } from "./projectLoader.js";

function text(value: unknown): string | null {
  if (value === undefined || value === null) return null;
  const result = String(value).trim();
  return result && result.toLowerCase() !== "unknown" ? result : null;
}

function numeric(value: unknown): number | null {
  if (value === undefined || value === null || value === "") return null;
  const result = Number(value);
  return Number.isFinite(result) ? result : null;
}

function bool(value: unknown): boolean | null {
  if (value === undefined || value === null || value === "") return null;
  if (typeof value === "boolean") return value;
  if (typeof value === "number") return value !== 0;
  const normalized = String(value).trim().toLowerCase();
  if (["true", "yes", "1"].includes(normalized)) return true;
  if (["false", "no", "0"].includes(normalized)) return false;
  return null;
}

function normalizeManualProject(input: Partial<NormalizedProject>): NormalizedProject {
  return {
    projectId: text(input.projectId), projectName: text(input.projectName), registry: text(input.registry),
    voluntaryStatus: text(input.voluntaryStatus), scope: text(input.scope), type: text(input.type),
    reductionRemoval: text(input.reductionRemoval), methodology: text(input.methodology),
    methodologyVersion: text(input.methodologyVersion), region: text(input.region), country: text(input.country),
    vintage: numeric(input.vintage), verifier: text(input.verifier),
    totalCreditsIssued: numeric(input.totalCreditsIssued), totalCreditsRetired: numeric(input.totalCreditsRetired),
    totalCreditsRemaining: numeric(input.totalCreditsRemaining), totalBufferPoolDeposits: numeric(input.totalBufferPoolDeposits),
    reversalsCoveredByBufferPool: numeric(input.reversalsCoveredByBufferPool),
    uncoveredReversals: bool(input.uncoveredReversals), bufferCreditsReleasedToProject: numeric(input.bufferCreditsReleasedToProject),
    arbWaStatus: text(input.arbWaStatus), certifications: text(input.certifications),
    registryDocuments: text(input.registryDocuments), projectWebsite: text(input.projectWebsite), raw: input,
  };
}

/** Database and seller submissions both leave this function in the same canonical form. */
export function normalizeInput(request: AnalysisRequest): NormalizedProject {
  if (request.projectId?.trim()) {
    const dbProject = findProjectById(request.projectId);
    if (dbProject) return dbProject;
    if (!request.project) throw new Error(`Project ID not found: ${request.projectId}`);
  }
  if (request.project) return normalizeManualProject(request.project);
  throw new Error("Provide a valid projectId or project data.");
}
