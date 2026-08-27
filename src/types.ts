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
  currency?: string | null;
  question?: string;
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

export interface PriceAssessment {
  mode: "BENCHMARK_AVAILABLE" | "NO_VERIFIED_PRICE_BENCHMARK";
  askedPrice: number | null;
  currency: string | null;
  assessment: string;
  benchmarkMean?: number;
}

export interface ProjectAnalysisResult {
  summary: string;
  normalizedData: Partial<NormalizedProject>;
  integrityScore: IntegrityScore;
  riskIndicators: RiskIndicator;
  greenwashingRisk: GreenwashingRiskAssessment;
  peerComparison: PeerComparison;
  priceAssessment: PriceAssessment;
  aiExplanation: string | null;
}
