import {
  AnalysisRequest,
  ProjectAnalysisResult,
} from "./types.js";
import { normalizeInput } from "./normalizeInput.js";
import {
  calculateIntegrityScore,
  evaluateRisk,
} from "./scoring.js";
import { comparePeers } from "./comparison.js";
import { assessPrice } from "./pricing.js";
import {
  generateExplanation,
  getKnowledgeContext,
} from "./carbonAI.js";

export async function analyzeProjectPipeline(
  request: AnalysisRequest
): Promise<ProjectAnalysisResult> {
  const normalizedData = normalizeInput(request);

  const integrityScore = calculateIntegrityScore(normalizedData);

  const riskIndicators = evaluateRisk(
    normalizedData,
    integrityScore
  );

  const peerComparison = comparePeers(normalizedData);

  const priceAssessment = assessPrice(
    request.askedPrice,
    request.currency || "INR"
  );

  const baseResult = {
    summary: "Analysis Complete",
    normalizedData,
    integrityScore,
    riskIndicators,
    peerComparison,
    priceAssessment,
  };

  let aiExplanation: string | null = null;

  try {
    const knowledgeQuery =
      request.question ||
      `Carbon credit quality and integrity factors for ${normalizedData.type || "carbon projects"}`;

    const ragContext = await getKnowledgeContext(knowledgeQuery);

    aiExplanation = await generateExplanation(
      baseResult,
      ragContext,
      request.question
    );
  } catch (error) {
    console.warn(
      "Continuing without AI explanation due to AI or knowledge retrieval failure:",
      error
    );
  }

  return {
    ...baseResult,
    aiExplanation,
  };
}