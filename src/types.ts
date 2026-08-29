import type { BhoomiLanguage } from "./language.js";

export type EvidenceStatus = "strong" | "partial" | "insufficient" | "not_applicable";
export type RiskLevel = "Low" | "Moderate" | "High" | "Unknown";

export interface NormalizedProject {
  projectId: string | null;
  projectName: string | null;
  registry: string | null;
  voluntaryStatus: string | null;
  scope: string | null;
  type: string | null;
  reductionRemoval: string | null;
  methodology: string | null;
  methodologyVersion: string | null;
  region: string | null;
  country: string | null;
  vintage: number | null;
  verifier: string | null;
  totalCreditsIssued: number | null;
  totalCreditsRetired: number | null;
  totalCreditsRemaining: number | null;
  totalBufferPoolDeposits: number | null;
  reversalsCoveredByBufferPool: number | null;
  uncoveredReversals: boolean | null;
  bufferCreditsReleasedToProject: number | null;
  arbWaStatus: string | null;
  certifications: string | null;
  registryDocuments: string | null;
  projectWebsite: string | null;
  raw: unknown;
}

export interface AnalysisRequest {
  projectId?: string;
  project?: Partial<NormalizedProject>;
  askedPrice?: number | null;
  /** Compatibility alias accepted by the analysis endpoint. */
  askingPrice?: number | null;
  currency?: string | null;
  question?: string;
  language?: BhoomiLanguage;
}

export interface IntegrityFactor {
  score: number | null;
  evidenceStatus: EvidenceStatus;
  /** Whether long-form assessment of this factor is meaningful for this project. */
  applicability: "applicable" | "not_applicable";
  /** Completeness/quality of available evidence for this factor; null when not applicable. */
  evidenceCompleteness: number | null;
  rationale: string;
  evidenceGaps: string[];
}

export interface IntegrityFactors {
  verification: IntegrityFactor;
  additionality: IntegrityFactor;
  permanence: IntegrityFactor;
  doubleCountingRisk: IntegrityFactor;
  methodologyQuality: IntegrityFactor;
  vintage: IntegrityFactor;
}

// Retained for consumers of the previous response format.
export interface ScoreBreakdown {
  registryAndVerification: number;
  methodologyEvidence: number;
  permanenceRisk: number;
  transparency: number;
  vintage: number;
  dataCompleteness: number;
}

export interface IntegrityScore {
  /** Compatibility alias for overallIntegrityScore. */
  totalScore: number;
  overallIntegrityScore: number;
  rating: string;
  confidence: "High" | "Medium" | "Low";
  /** Share of applicable weighted factors with a deterministic score. */
  factorCoverage: number;
  /** Weighted completeness of underlying available evidence, not merely scoreability. */
  evidenceCoverage: number;
  factors: IntegrityFactors;
  breakdown: ScoreBreakdown;
  strengths: string[];
  concerns: string[];
  limitations: string[];
}

export interface RiskIndicator {
  riskLevel: RiskLevel;
  indicators: string[];
  evidenceGaps: string[];
}

export interface GreenwashingRiskAssessment {
  level: RiskLevel;
  explanation: string;
  indicators: string[];
  evidenceGaps: string[];
}

export interface PeerComparison {
  peerCount: number;
  comparableProjects: Partial<NormalizedProject>[];
  averageScore: number | null;
  medianScore: number | null;
  comparisonSummary: string;
}

export interface NoVerifiedPriceBenchmarkAssessment {
  mode: "NO_VERIFIED_PRICE_BENCHMARK";
  status: "NO_ASKING_PRICE" | "BENCHMARK_UNAVAILABLE";
  askedPrice: number | null;
  currency: string | null;
  benchmarkPrice: null;
  qualityTier: null;
  qualityMultiplier: null;
  calculatedFairPrice: null;
  priceDifference: null;
  priceDifferencePercent: null;
  assessment: string;
  limitations: string[];
}

/** Reserved for a future verified benchmark provider; no implementation currently produces this mode. */
export interface BenchmarkAvailablePriceAssessment {
  mode: "BENCHMARK_AVAILABLE";
  status: "BENCHMARK_CALCULATED";
  askedPrice: number | null;
  currency: string;
  benchmarkPrice: number;
  qualityTier: "green" | "yellow" | "red";
  qualityMultiplier: 1 | 0.5 | 0.24;
  calculatedFairPrice: number;
  priceDifference: number | null;
  priceDifferencePercent: number | null;
  assessment: string;
  limitations: string[];
}

export type PriceAssessment = NoVerifiedPriceBenchmarkAssessment | BenchmarkAvailablePriceAssessment;

export interface ProjectAnalysisResult {
  summary: string;
  /** Resolved language used only for aiExplanation. Deterministic fields remain unchanged. */
  language: BhoomiLanguage;
  normalizedData: Partial<NormalizedProject>;
  integrityScore: IntegrityScore;
  riskIndicators: RiskIndicator;
  greenwashingRisk: GreenwashingRiskAssessment;
  peerComparison: PeerComparison;
  priceAssessment: PriceAssessment;
  aiExplanation: string | null;
}
