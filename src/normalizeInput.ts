import { AnalysisRequest, NormalizedProject } from "./types.js";
import { findProjectById } from "./projectLoader.js";

export function normalizeInput(request: AnalysisRequest): Partial<NormalizedProject> {
  if (request.projectId) {
    const dbProject = findProjectById(request.projectId);
    if (dbProject) return dbProject;
  }
  
  if (request.project) {
    return {
      projectId: request.project.projectId || 'UNKNOWN',
      projectName: request.project.projectName || 'Unknown',
      registry: request.project.registry || 'Unknown',
      type: request.project.type || 'Unknown',
      methodology: request.project.methodology || 'Unknown',
      region: request.project.region || 'Unknown',
      country: request.project.country || 'Unknown',
      vintage: request.project.vintage || 'Unknown',
      verifier: request.project.verifier || 'Unknown',
      totalCreditsIssued: request.project.totalCreditsIssued || 0,
      totalCreditsRetired: request.project.totalCreditsRetired || 0,
      uncoveredReversals: request.project.uncoveredReversals || false,
      projectWebsite: request.project.projectWebsite || '',
      raw: request.project
    };
  }
  throw new Error("No valid project ID or project data provided.");
}