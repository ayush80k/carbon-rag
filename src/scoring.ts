import { NormalizedProject, IntegrityScore, RiskIndicator, ScoreBreakdown } from './types';

export function calculateIntegrityScore(project: Partial<NormalizedProject>): IntegrityScore {
  let score = 0;
  const breakdown: ScoreBreakdown = {
    registryAndVerification: 0,
    methodologyEvidence: 0,
    permanenceRisk: 0,
    transparency: 0,
    vintage: 0,
    dataCompleteness: 0
  };
  const strengths: string[] = [];
  const concerns: string[] = [];
  const limitations: string[] = [];

  // 1. Registry & Verification (Max 25)
  if (project.registry && project.registry !== 'Unknown') {
    breakdown.registryAndVerification += 10;
    strengths.push(`Registered with recognizable entity: ${project.registry}`);
  } else {
    concerns.push("Missing registry information.");
  }
  
  if (project.verifier && project.verifier !== 'Unknown') {
    breakdown.registryAndVerification += 15;
    strengths.push(`Third-party verifier listed: ${project.verifier}`);
  } else {
    concerns.push("Absence of third-party verification evidence.");
  }

  // 2. Methodology Evidence (Max 20)
  if (project.methodology && project.methodology !== 'Unknown') {
    breakdown.methodologyEvidence += 20;
    strengths.push(`Explicit methodology utilized: ${project.methodology}`);
  } else {
    concerns.push("Missing methodology specification.");
  }

  // 3. Permanence / Reversals (Max 15)
  if (project.uncoveredReversals) {
    breakdown.permanenceRisk += 0;
    concerns.push("Evidence of reversals not covered by buffer pool.");
  } else {
    breakdown.permanenceRisk += 15;
    strengths.push("No dataset evidence of uncovered reversals.");
  }

  // 4. Vintage Profile (Max 15)
  const vintageYear = parseInt(project.vintage || '0', 10);
  if (vintageYear >= 2020) {
    breakdown.vintage += 15;
    strengths.push(`Recent vintage (${vintageYear}).`);
  } else if (vintageYear >= 2015) {
    breakdown.vintage += 10;
    strengths.push(`Moderate vintage (${vintageYear}).`);
  } else if (vintageYear > 0) {
    breakdown.vintage += 5;
    concerns.push(`Older vintage (${vintageYear}) may present additionality risks.`);
  }

  // 5. Transparency / Completeness (Max 25)
  if (project.projectWebsite) breakdown.transparency += 10;
  
  let filledFields = 0;
  const criticalFields = ['type', 'country', 'reductionRemoval', 'totalCreditsIssued'];
  criticalFields.forEach(field => {
    if (project[field as keyof NormalizedProject]) filledFields++;
  });
  breakdown.dataCompleteness += Math.round((filledFields / criticalFields.length) * 15);

  score = Object.values(breakdown).reduce((a, b) => a + b, 0);

  let rating = "Insufficient / Weak Evidence Profile";
  let confidence: "High" | "Medium" | "Low" = "Low";

  if (score >= 80) { rating = "Strong Evidence Profile"; confidence = "High"; }
  else if (score >= 65) { rating = "Moderate-Strong Evidence Profile"; confidence = "Medium"; }
  else if (score >= 50) { rating = "Moderate Evidence Profile"; confidence = "Medium"; }
  else if (score >= 35) { rating = "Limited Evidence Profile"; confidence = "Low"; }

  if (!project.raw) limitations.push("Direct dataset linkage absent; evaluating based on supplied payload.");

  return { totalScore: score, rating, confidence, breakdown, strengths, concerns, limitations };
}

export function evaluateRisk(project: Partial<NormalizedProject>, score: IntegrityScore): RiskIndicator {
  const evidenceGaps: string[] = [];
  let riskLevel: "Low" | "Moderate" | "High" | "Unknown" = "Unknown";

  if (!project.verifier) evidenceGaps.push("Missing independent verifier.");
  if (!project.methodology) evidenceGaps.push("Omitted accounting methodology.");
  if (project.uncoveredReversals) evidenceGaps.push("Historical uncovered reversals detected.");
  if (score.totalScore < 40) evidenceGaps.push("Broad data sparsity across critical fields.");

  if (evidenceGaps.length >= 3 || project.uncoveredReversals) riskLevel = "High";
  else if (evidenceGaps.length === 1 || evidenceGaps.length === 2) riskLevel = "Moderate";
  else riskLevel = "Low";

  return { riskLevel, evidenceGaps };
}