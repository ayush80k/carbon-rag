import * as XLSX from "xlsx";
import * as path from "path";
import { NormalizedProject } from "./types.js";

let cachedProjects: NormalizedProject[] | null = null;

function clean(value: any): string {
    if (value === undefined || value === null) return "";
    return String(value).trim();
}

function numberValue(value: any): number {
    if (value === undefined || value === null || value === "") {
        return 0;
    }

    const parsed = Number(String(value).replace(/,/g, ""));

    return Number.isFinite(parsed) ? parsed : 0;
}

export function loadProjects(): NormalizedProject[] {
    if (cachedProjects) {
        return cachedProjects;
    }

    const dbPath =
        process.env.EXCEL_DB_PATH ||
        "./Voluntary-Registry-Offsets-Database--v2026-04.xlsx";

    const fullPath = path.resolve(process.cwd(), dbPath);

    console.log("Loading project database for analysis...");
    console.log(`Database path: ${fullPath}`);

    try {
        const workbook = XLSX.readFile(fullPath);

        const sheet = workbook.Sheets["PROJECTS"];

        if (!sheet) {
            throw new Error(
                `PROJECTS sheet not found. Available sheets: ${workbook.SheetNames.join(", ")}`
            );
        }

        const rawData = XLSX.utils.sheet_to_json<any>(sheet, {
            range: 3,
        });

        cachedProjects = rawData.map((row: any) => ({
            projectId: clean(row["Project ID"]),
            projectName: clean(row["Project Name"]) || "Unknown",

            registry: clean(row["Voluntary Registry"]),
            voluntaryStatus: clean(row["Voluntary Status"]),

            scope: clean(row["Scope"]),

            type:
                clean(row["Type"]) ||
                clean(row["Project Type From the Registry"]),

            reductionRemoval: clean(row["Reduction / Removal"]),

            methodology: clean(row["Methodology / Protocol"]),

            region: clean(row["Region"]),
            country: clean(row["Country"]),

            vintage: clean(row["First Year of Project (Vintage)"]),

            verifier: clean(row["Verifier"]),

            totalCreditsIssued: numberValue(
                row["Total Credits \r\nIssued"] ??
                row["Total Credits \nIssued"] ??
                row["Total Credits Issued"]
            ),

            totalCreditsRetired: numberValue(
                row["Total Credits \r\nRetired"] ??
                row["Total Credits \nRetired"] ??
                row["Total Credits Retired"]
            ),

            uncoveredReversals: Boolean(
                row["Reversals not covered by buffer"]
            ),

            projectWebsite: clean(row["Project Website"]),

            raw: row,
        }));

        console.log(
            `Loaded ${cachedProjects.length} projects for analysis.`
        );

        return cachedProjects;
    } catch (error) {
        console.error("Failed to load Excel DB:", error);
        throw error;
    }
}

export function findProjectById(
    projectId: string
): NormalizedProject | null {
    const projects = loadProjects();

    const normalizedId = projectId.trim().toLowerCase();

    return (
        projects.find(
            (project) =>
                project.projectId.trim().toLowerCase() === normalizedId
        ) || null
    );
}