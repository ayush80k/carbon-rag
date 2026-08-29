import { AnalysisRequest, NormalizedProject, ProjectAnalysisResult } from "./types.js";
import { normalizeInput } from "./normalizeInput.js";
import { assessGreenwashingRisk, calculateIntegrityScore, evaluateRisk } from "./scoring.js";
import { comparePeers } from "./comparison.js";
import { assessPrice } from "./pricing.js";
import { generateExplanation, getKnowledgeContext } from "./carbonAI.js";
import { resolveLanguage } from "./language.js";

export interface AnalysisOptions {
  /** Test seam: avoids Excel loading while production continues to use the cached database. */
  peerProjects?: NormalizedProject[];
  includeAiExplanation?: boolean;
}

export async function analyzeProjectPipeline(request: AnalysisRequest, options: AnalysisOptions = {}): Promise<ProjectAnalysisResult> {
  const language = resolveLanguage(request.language, request.question);
  const normalizedData = normalizeInput(request);
  const integrityScore = calculateIntegrityScore(normalizedData);
  const riskIndicators = evaluateRisk(normalizedData, integrityScore);
  const greenwashingRisk = assessGreenwashingRisk(integrityScore, riskIndicators);
  const peerComparison = comparePeers(normalizedData, options.peerProjects);
  const priceAssessment = assessPrice(request.askedPrice ?? request.askingPrice, request.currency);
  const baseResult = { summary: "Analysis Complete", language, normalizedData, integrityScore, riskIndicators, greenwashingRisk, peerComparison, priceAssessment };

  let aiExplanation: string | null = null;
  if (options.includeAiExplanation !== false) {
    try {
      const knowledgeQuery = request.question || `Carbon credit quality and integrity factors for ${normalizedData.type || "carbon projects"}`;
      aiExplanation = await generateExplanation(baseResult, await getKnowledgeContext(knowledgeQuery), request.question);
    } catch (error) {
      console.warn("Continuing without AI explanation due to AI or knowledge retrieval failure:", error);
    }
  }
  return { ...baseResult, aiExplanation };
}
