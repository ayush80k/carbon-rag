import {
  EvidenceStatus, GreenwashingRiskAssessment, IntegrityFactor, IntegrityFactors,
  IntegrityScore, NormalizedProject, RiskIndicator, RiskLevel, ScoreBreakdown,
} from "./types.js";

const WEIGHTS = {
  verification: 20, additionality: 20, permanence: 15,
  doubleCountingRisk: 15, methodologyQuality: 20, vintage: 10,
} as const;

const clamp = (value: number) => Math.max(0, Math.min(100, Math.round(value)));
const hasText = (value: string | null | undefined) => Boolean(value?.trim() && value.trim().toLowerCase() !== "unknown");
const unique = (values: string[]) => [...new Set(values)];

function factor(score: number | null, evidenceCompleteness: number, rationale: string, evidenceGaps: string[]): IntegrityFactor {
  const normalizedScore = score === null ? null : clamp(score);
  const completeness = clamp(evidenceCompleteness);
  const evidenceStatus: EvidenceStatus = normalizedScore === null
    ? "insufficient"
    : completeness >= 85 && normalizedScore >= 75 && evidenceGaps.length <= 1 ? "strong" : "partial";
  return { score: normalizedScore, evidenceStatus, applicability: "applicable", evidenceCompleteness: completeness, rationale, evidenceGaps: unique(evidenceGaps) };
}

function notApplicable(rationale: string): IntegrityFactor {
  return { score: null, evidenceStatus: "not_applicable", applicability: "not_applicable", evidenceCompleteness: null, rationale, evidenceGaps: [] };
}

function verification(project: NormalizedProject): IntegrityFactor {
  const gaps: string[] = [];
  let score = 0;
  let evidence = 0;
  if (hasText(project.registry)) { score += 25; evidence += 25; } else gaps.push("Registry identity is not available.");
  if (hasText(project.verifier)) { score += 30; evidence += 30; } else gaps.push("Independent verifier is not listed.");
  if (hasText(project.voluntaryStatus)) { score += 15; evidence += 15; } else gaps.push("Project or voluntary status is not available.");
  if (hasText(project.registryDocuments)) { score += 10; evidence += 15; } else gaps.push("Registry documents are not linked in the available record.");
  if (hasText(project.certifications)) { score += 10; evidence += 15; } else gaps.push("Certification or validation evidence is not available.");
  return factor(score || null, evidence, score
    ? "Verification reflects registry, verifier, status, and documentary evidence recorded in the dataset. The backend does not independently verify those records."
    : "Verification cannot be assessed because the record contains no verification-related evidence.", gaps);
}

function additionality(project: NormalizedProject): IntegrityFactor {
  const gaps: string[] = [
    "The available dataset does not include an independent additionality study, baseline analysis, regulatory-surplus assessment, or counterfactual proof.",
  ];
  let score = 0;
  let evidence = 0;
  if (hasText(project.methodology)) { score += 25; evidence += 20; } else gaps.push("No methodology is provided to support an indirect additionality assessment.");
  if (hasText(project.reductionRemoval)) { score += 10; evidence += 10; } else gaps.push("Reduction/removal classification is not provided.");
  if (hasText(project.type) || hasText(project.scope)) { score += 10; evidence += 10; } else gaps.push("Project type or scope is not provided.");
  if (hasText(project.voluntaryStatus)) { score += 10; evidence += 10; } else gaps.push("Project status is not provided.");
  if (hasText(project.registryDocuments)) { score += 10; evidence += 10; } else gaps.push("No registry documents are available for additionality review.");
  if (project.vintage !== null) { score += 5; evidence += 5; } else gaps.push("Project vintage is not provided.");
  if (hasText(project.registry)) { score += 5; evidence += 5; } else gaps.push("Registry association is not provided.");
  return factor(score || null, evidence, score
    ? "Available project design and documentation provide indirect supporting evidence only; this is not a proven additionality determination."
    : "Additionality cannot be assessed from the available project record.", gaps);
}

function permanence(project: NormalizedProject): IntegrityFactor {
  const classification = project.reductionRemoval?.toLowerCase() || "";
  const descriptor = [project.scope, project.type, project.reductionRemoval].filter(hasText).join(" ").toLowerCase();
  const storageRelevant = /forest|land|afforest|reforest|soil|blue carbon|biochar|removal|impermanent/.test(descriptor);
  if (classification.includes("reduction") && project.uncoveredReversals !== true) {
    return notApplicable("This project is classified as a reduction project. Long-term carbon-storage permanence is not directly applicable, so this factor is excluded from the overall weighted denominator rather than treated as positive evidence.");
  }
  const gaps: string[] = [];
  if (!storageRelevant && project.uncoveredReversals !== true) return factor(null, 0, "Permanence cannot be assessed because the project is not clearly classified as either a reduction project or a storage/removal project.", ["Project classification is insufficient to determine permanence applicability."]);
  let score = project.uncoveredReversals === true ? 20 : 45;
  let evidence = project.uncoveredReversals === true ? 35 : 20;
  if (project.uncoveredReversals === false) { score += 15; evidence += 20; } else if (project.uncoveredReversals === null) gaps.push("No explicit uncovered-reversal record is available.");
  if ((project.totalBufferPoolDeposits ?? 0) > 0 || (project.reversalsCoveredByBufferPool ?? 0) > 0) { score += 15; evidence += 25; } else gaps.push("No buffer-pool or covered-reversal evidence is available.");
  if (hasText(project.registryDocuments)) { score += 10; evidence += 15; } else gaps.push("No registry documents are linked for permanence review.");
  if (project.uncoveredReversals === true) gaps.push("Recorded uncovered reversals require independent review.");
  return factor(score, evidence, project.uncoveredReversals === true
    ? "The available record reports reversals not covered by a buffer pool, a material permanence concern."
    : "Permanence reflects available reversal and buffer-pool evidence for a storage/removal project; no recorded uncovered reversal is not proof of zero permanence risk.", gaps);
}

function doubleCounting(project: NormalizedProject): IntegrityFactor {
  const gaps: string[] = [
    "Serial-number-level traceability is not available in the dataset.",
    "Cross-registry and cross-market information is not available, so the dataset cannot prove double counting never occurred.",
  ];
  const hasIssued = project.totalCreditsIssued !== null;
  const hasRetired = project.totalCreditsRetired !== null;
  if (hasIssued && hasRetired && project.totalCreditsRetired! > project.totalCreditsIssued!) {
    return factor(20, 50, "Recorded retired credits exceed recorded issued credits, an inconsistency requiring review. This is not proof of double counting.", gaps);
  }
  let score = 0;
  let evidence = 0;
  if (hasText(project.registry)) { score += 25; evidence += 25; } else gaps.push("Registry identity is not available.");
  if (hasText(project.projectId)) { score += 15; evidence += 15; } else gaps.push("Stable project identifier is not available.");
  if (hasIssued && hasRetired) { score += 20; evidence += 20; } else gaps.push("Issued and retired credit records are incomplete.");
  if (hasText(project.voluntaryStatus)) { score += 10; evidence += 10; } else gaps.push("Project status is not available.");
  if (hasText(project.registryDocuments)) { score += 10; evidence += 10; } else gaps.push("Registry documents are not linked in the available record.");
  if (hasText(project.arbWaStatus)) { score += 5; evidence += 5; }
  return factor(score || null, evidence, score
    ? "Higher scores indicate stronger available traceability evidence and lower apparent risk; they cannot prove that double counting has not occurred."
    : "Double-counting risk cannot be assessed because no traceability evidence is available.", gaps);
}

function methodologyQuality(project: NormalizedProject): IntegrityFactor {
  const gaps: string[] = ["The dataset does not provide an independent scientific ranking or validation of methodology quality."];
  let score = 0;
  let evidence = 0;
  if (hasText(project.methodology)) { score += 45; evidence += 40; if (project.methodology!.length >= 25) score += 5; } else gaps.push("Methodology or protocol is not provided.");
  if (hasText(project.methodologyVersion)) { score += 10; evidence += 15; } else gaps.push("Methodology version is not provided.");
  if (hasText(project.registryDocuments)) { score += 15; evidence += 20; } else gaps.push("Methodology-supporting registry documents are not linked.");
  if (hasText(project.registry)) { score += 10; evidence += 10; } else gaps.push("Registry association is not provided.");
  return factor(score || null, evidence, score
    ? "This score reflects completeness and specificity of available methodology evidence, not an external scientific quality ranking."
    : "Methodology quality cannot be assessed because no methodology information is available.", gaps);
}

function vintage(project: NormalizedProject): IntegrityFactor {
  if (project.vintage === null || project.vintage < 1900 || project.vintage > new Date().getFullYear() + 1) return factor(null, 0, "Vintage cannot be assessed because a plausible project vintage is not available.", ["A plausible project vintage is not available."]);
  const age = new Date().getFullYear() - project.vintage;
  const score = age <= 3 ? 90 : age <= 7 ? 80 : age <= 12 ? 65 : age <= 20 ? 50 : 35;
  return factor(score, 100, `Vintage is ${project.vintage}; older vintages can involve more uncertainty about historical baselines and context, but do not by themselves prove poor quality.`, []);
}

/**
 * Overall Integrity is a weighted mean of applicable, scoreable factors: Verification 20%,
 * Additionality 20%, Permanence 15%, Double-counting Risk 15%, Methodology Quality 20%, Vintage 10%.
 * Null factors are not scored as zero. Not-applicable factors (for example storage permanence for
 * reduction projects) are excluded before weights are re-normalized. factorCoverage measures which
 * applicable factors were scoreable; evidenceCoverage measures weighted underlying evidence completeness.
 */
export function calculateIntegrityScore(project: NormalizedProject): IntegrityScore {
  const factors: IntegrityFactors = { verification: verification(project), additionality: additionality(project), permanence: permanence(project), doubleCountingRisk: doubleCounting(project), methodologyQuality: methodologyQuality(project), vintage: vintage(project) };
  const entries = Object.entries(WEIGHTS) as [keyof IntegrityFactors, number][];
  const applicable = entries.filter(([name]) => factors[name].applicability === "applicable");
  const applicableWeight = applicable.reduce((total, [, weight]) => total + weight, 0);
  const scoreable = applicable.filter(([name]) => factors[name].score !== null);
  const scoreableWeight = scoreable.reduce((total, [, weight]) => total + weight, 0);
  const weightedScore = scoreable.reduce((total, [name, weight]) => total + factors[name].score! * weight, 0);
  const totalScore = scoreableWeight ? clamp(weightedScore / scoreableWeight) : 50;
  const factorCoverage = applicableWeight ? clamp((scoreableWeight / applicableWeight) * 100) : 0;
  const evidenceCoverage = applicableWeight ? clamp(applicable.reduce((total, [name, weight]) => total + (factors[name].evidenceCompleteness ?? 0) * weight, 0) / applicableWeight) : 0;
  const strongCount = Object.values(factors).filter((item) => item.evidenceStatus === "strong").length;
  const partialOrInsufficient = Object.values(factors).filter((item) => item.evidenceStatus === "partial" || item.evidenceStatus === "insufficient").length;
  const importantGapCount = unique(Object.values(factors).flatMap((item) => item.evidenceGaps)).length;
  const confidence: "High" | "Medium" | "Low" = factorCoverage >= 90 && evidenceCoverage >= 90 && strongCount >= 3 && importantGapCount <= 2
    ? "High" : factorCoverage >= 60 && evidenceCoverage >= 45 ? "Medium" : "Low";
  const rating = factorCoverage < 50 ? "Insufficient Evidence Profile" : totalScore >= 80 ? "Strong Evidence Profile" : totalScore >= 65 ? "Moderate-Strong Evidence Profile" : totalScore >= 50 ? "Moderate Evidence Profile" : "Limited Evidence Profile";
  const strengths = entries.filter(([name]) => factors[name].evidenceStatus === "strong").map(([name]) => `${name} has comparatively strong recorded evidence.`);
  const concerns = entries.filter(([name]) => factors[name].score !== null && factors[name].score! < 50).map(([name]) => `${name} has material concerns in the available record.`);
  const limitations = ["Scores are deterministic evidence-based heuristics, not a guarantee of environmental integrity, legitimacy, or future performance."];
  if (factorCoverage < 100) limitations.push("Some applicable factors have insufficient evidence and are excluded from the weighted score.");
  if (evidenceCoverage < 100 || partialOrInsufficient > 0) limitations.push("Evidence coverage reflects incomplete underlying documentation even when all applicable factors can be scored.");
  if (Object.values(factors).some((item) => item.applicability === "not_applicable")) limitations.push("Not-applicable factors are excluded before the remaining composite weights are re-normalized.");
  const breakdown: ScoreBreakdown = { registryAndVerification: factors.verification.score ?? 0, methodologyEvidence: factors.methodologyQuality.score ?? 0, permanenceRisk: factors.permanence.score ?? 0, transparency: factors.doubleCountingRisk.score ?? 0, vintage: factors.vintage.score ?? 0, dataCompleteness: evidenceCoverage };
  return { totalScore, overallIntegrityScore: totalScore, rating, confidence, factorCoverage, evidenceCoverage, factors, breakdown, strengths, concerns, limitations };
}

export function evaluateRisk(project: NormalizedProject, score: IntegrityScore): RiskIndicator {
  const indicators: string[] = [];
  if (project.uncoveredReversals === true) indicators.push("The available record reports reversals not covered by a buffer pool.");
  if (project.totalCreditsIssued !== null && project.totalCreditsRetired !== null && project.totalCreditsRetired > project.totalCreditsIssued) indicators.push("Recorded retired credits exceed recorded issued credits.");
  const evidenceGaps = unique(Object.values(score.factors).flatMap((item) => item.evidenceGaps));
  const riskLevel: RiskLevel = indicators.length >= 2 || project.uncoveredReversals === true ? "High" : indicators.length === 1 ? "Moderate" : score.factorCoverage < 50 || score.evidenceCoverage < 35 ? "Unknown" : evidenceGaps.length >= 5 ? "Moderate" : "Low";
  return { riskLevel, indicators, evidenceGaps };
}

export function assessGreenwashingRisk(score: IntegrityScore, risks: RiskIndicator): GreenwashingRiskAssessment {
  const level = risks.riskLevel;
  const explanation = level === "High" ? "High deterministic risk indicators were identified and should be independently reviewed. This is not a finding that greenwashing or fraud occurred."
    : level === "Moderate" ? "Moderate risk reflects recorded indicators and/or important evidence gaps. Missing information is uncertainty, not proof of misleading claims."
    : level === "Unknown" ? "Risk is unknown because evidence is too limited for a reliable assessment. The record does not establish that misleading claims occurred."
    : "Low risk based on the available dataset, with no material deterministic indicator identified. This does not prove greenwashing or double counting is impossible.";
  return { level, explanation, indicators: risks.indicators, evidenceGaps: risks.evidenceGaps };
}
