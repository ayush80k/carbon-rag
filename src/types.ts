export interface NormalizedProject {
  projectId: string;
  projectName: string;
  registry: string;
  voluntaryStatus: string;
  scope: string;
  type: string;
  reductionRemoval: string;
  methodology: string;
  region: string;
  country: string;
  vintage: string;
  verifier: string;
  totalCreditsIssued: number;
  totalCreditsRetired: number;
  uncoveredReversals: boolean;
  projectWebsite: string;
  raw: any;
}

export interface AnalysisRequest {
  projectId?: string;
  project?: Partial<NormalizedProject>;
  askedPrice?: number;
  currency?: string;
  question?: string;
}

export interface ScoreBreakdown {
  registryAndVerification: number;
  methodologyEvidence: number;
  permanenceRisk: number;
  transparency: number;
  vintage: number;
  dataCompleteness: number;
}

export interface IntegrityScore {
  totalScore: number;
  rating: string;
  confidence: "High" | "Medium" | "Low";
  breakdown: ScoreBreakdown;
  strengths: string[];
  concerns: string[];
  limitations: string[];
}

export interface RiskIndicator {
  riskLevel: "Low" | "Moderate" | "High" | "Unknown";
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
  peerComparison: PeerComparison;
  priceAssessment: PriceAssessment;
  aiExplanation: string | null;
}