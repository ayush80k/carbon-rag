import * as XLSX from "xlsx";
import * as path from "path";
import { NormalizedProject } from "./types.js";

let cachedProjects: NormalizedProject[] | null = null;

function clean(value: unknown): string | null {
  if (value === undefined || value === null) return null;
  const result = String(value).trim();
  return result && result.toLowerCase() !== "unknown" ? result : null;
}

function numberValue(value: unknown): number | null {
  if (value === undefined || value === null || value === "") return null;
  const parsed = Number(String(value).replace(/,/g, ""));
  return Number.isFinite(parsed) ? parsed : null;
}

function booleanValue(value: unknown): boolean | null {
  if (value === undefined || value === null || value === "") return null;
  if (typeof value === "boolean") return value;
  if (typeof value === "number") return value !== 0;
  const normalized = String(value).trim().toLowerCase();
  if (["true", "yes", "y", "1"].includes(normalized)) return true;
  if (["false", "no", "n", "0", "none"].includes(normalized)) return false;
  const numeric = Number(normalized);
  return Number.isFinite(numeric) ? numeric !== 0 : null;
}

/** Load the PROJECTS worksheet once for reuse by lookup and peer comparison. */
export function normalizeProjectRow(row: Record<string, unknown>): NormalizedProject {
  return {
    projectId: clean(row["Project ID"]),
    projectName: clean(row["Project Name"]),
    registry: clean(row["Voluntary Registry"]),
    voluntaryStatus: clean(row["Voluntary Status"]),
    scope: clean(row["Scope"]),
    type: clean(row["Type"]) || clean(row["Project Type From the Registry"]),
    reductionRemoval: clean(row["Reduction / Removal"]),
    methodology: clean(row["Methodology / Protocol"]),
    methodologyVersion: clean(row["Methodology Version"]),
    region: clean(row["Region"]),
    country: clean(row["Country"]),
    vintage: numberValue(row["First Year of Project (Vintage)"]),
    verifier: clean(row["Verifier"]),
    totalCreditsIssued: numberValue(row["Total Credits \r\nIssued"] ?? row["Total Credits \nIssued"] ?? row["Total Credits Issued"]),
    totalCreditsRetired: numberValue(row["Total Credits \r\nRetired"] ?? row["Total Credits \nRetired"] ?? row["Total Credits Retired"]),
    totalCreditsRemaining: numberValue(row["Total Credits Remaining"]),
    totalBufferPoolDeposits: numberValue(row["Total Buffer \r\nPool Deposits"] ?? row["Total Buffer \nPool Deposits"] ?? row["Total Buffer Pool Deposits"]),
    reversalsCoveredByBufferPool: numberValue(row["Reversals Covered by Buffer Pool"]),
    // This exact header is used by the supplied Excel workbook.
    uncoveredReversals: booleanValue(row["Reversals Not Covered by Buffer"]),
    bufferCreditsReleasedToProject: numberValue(row["Buffer Credits Released to Project"]),
    arbWaStatus: clean(row["ARB / WA Status"]),
    certifications: clean(row["Certifications"]),
    registryDocuments: clean(row["Registry Documents"]),
    projectWebsite: clean(row["Project Website"]),
    raw: row,
  };
}

export function loadProjects(): NormalizedProject[] {
  if (cachedProjects) return cachedProjects;

  const dbPath = process.env.EXCEL_DB_PATH || "./Voluntary-Registry-Offsets-Database--v2026-04.xlsx";
  const fullPath = path.resolve(process.cwd(), dbPath);
  // Parse only the project records worksheet; the workbook contains several large chart/report sheets.
  const workbook = XLSX.readFile(fullPath, { sheets: ["PROJECTS"] });
  const sheet = workbook.Sheets["PROJECTS"];
  if (!sheet) throw new Error(`PROJECTS sheet not found. Available sheets: ${workbook.SheetNames.join(", ")}`);

  const rawData = XLSX.utils.sheet_to_json<Record<string, unknown>>(sheet, { range: 3 });
  cachedProjects = rawData.map(normalizeProjectRow);
  return cachedProjects;
}

export function findProjectById(projectId: string): NormalizedProject | null {
  const normalizedId = projectId.trim().toLowerCase();
  return loadProjects().find((project) => project.projectId?.trim().toLowerCase() === normalizedId) || null;
}
