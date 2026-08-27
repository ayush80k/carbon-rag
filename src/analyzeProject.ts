import { AnalysisRequest, ProjectAnalysisResult } from './types.js';
import { normalizeInput } from './normalizeInput.js';
import { calculateIntegrityScore, evaluateRisk } from './scoring.js';
import { comparePeers } from './comparison.js';
import { assessPrice } from './pricing.js';
import { generateExplanation } from './carbonAI.js';

// Mocking rag.ts import. Replace searchKnowledgeBase with your exact Pinecone function.
// import { searchKnowledgeBase } from './rag.js';
const searchKnowledgeBase = async (query: string) => "Knowledge retrieval operational."; 

export async function analyzeProjectPipeline(request: AnalysisRequest): Promise<ProjectAnalysisResult> {
  const normalizedData = normalizeInput(request);
  const integrityScore = calculateIntegrityScore(normalizedData);
  const riskIndicators = evaluateRisk(normalizedData, integrityScore);
  const peerComparison = comparePeers(normalizedData);
  const priceAssessment = assessPrice(request.askedPrice, request.currency);

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
    const ragContext = await searchKnowledgeBase(request.question || `Quality factors for ${normalizedData.type} carbon projects`);
    aiExplanation = await generateExplanation(baseResult, ragContext, request.question);
  } catch (error) {
    console.warn("Continuing without AI Explanation due to service failure.");
  }

  return { ...baseResult, aiExplanation };
}