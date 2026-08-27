import "dotenv/config";
import { Pinecone } from "@pinecone-database/pinecone";
import {
  GoogleGenerativeAIEmbeddings,
  ChatGoogleGenerativeAI,
} from "@langchain/google-genai";
import { ProjectAnalysisResult } from "./types.js";

const INDEX_NAME = "carbon-rag";
const KNOWLEDGE_NAMESPACE = "carbon-knowledge";

const pc = new Pinecone({
  apiKey: process.env.PINECONE_API_KEY!,
});

const embeddings = new GoogleGenerativeAIEmbeddings({
  model: "gemini-embedding-001",
  apiKey: process.env.GOOGLE_API_KEY!,
});

const llm = new ChatGoogleGenerativeAI({
  model: process.env.GEMINI_MODEL || "gemini-3.6-flash",
  apiKey: process.env.GOOGLE_API_KEY!,
  temperature: 0.1,
});

async function retrieveKnowledge(query: string): Promise<string> {
  try {
    const queryVector = await embeddings.embedQuery(query);

    const index = pc.index(INDEX_NAME);

    const result = await index
      .namespace(KNOWLEDGE_NAMESPACE)
      .query({
        vector: queryVector,
        topK: 5,
        includeMetadata: true,
      });

    return result.matches
      .map((match) => String(match.metadata?.text || "").trim())
      .filter(Boolean)
      .join("\n\n---\n\n");
  } catch (error) {
    console.warn("Knowledge retrieval failed:", error);
    return "No relevant knowledge retrieved.";
  }
}

function formatPrice(
  askedPrice: number | null,
  currency: string | null
): string {
  if (askedPrice === null || askedPrice === undefined) {
    return "Not provided";
  }

  const amount = Number(askedPrice).toLocaleString("en-IN", {
    minimumFractionDigits: 0,
    maximumFractionDigits: 2,
  });

  const normalizedCurrency = (currency || "INR").toUpperCase();

  if (normalizedCurrency === "INR") {
    return `₹${amount} INR`;
  }

  if (normalizedCurrency === "USD") {
    return `$${amount} USD`;
  }

  return `${amount} ${normalizedCurrency}`;
}

export async function generateExplanation(
  structuredData: Omit<ProjectAnalysisResult, "aiExplanation">,
  ragContext: string,
  userQuestion?: string
): Promise<string> {
  const priceDisplay = formatPrice(
    structuredData.priceAssessment.askedPrice,
    structuredData.priceAssessment.currency
  );

  const prompt = `
You are Carbon AI, an AI-powered assistant for analyzing carbon-credit projects.

Your role is to explain the structured project analysis that has already been calculated by the Carbon AI analysis engine.

The calculated project analysis is the PRIMARY basis for project-specific conclusions.
Retrieved carbon-market knowledge may be used only as supporting context or general guidance.

IMPORTANT RULES:

1. Do not invent project facts, prices, market data, peer benchmarks, or numerical values.
2. Do not change or contradict the calculated integrity score, rating, confidence, risk level, score breakdown, or peer comparison.
3. Do not claim a project is fraudulent, involved in greenwashing, or engaged in misconduct unless the supplied analysis explicitly provides evidence supporting that conclusion.
4. Treat the calculated integrity score and risk indicators as an evidence-based heuristic assessment based on available data, not an absolute guarantee of project quality, legitimacy, or performance.
5. Clearly distinguish evidence-based concerns from uncertainty, limitations, evidence gaps, or missing data.
6. Use retrieved carbon-market knowledge only as supporting context. Do not treat general knowledge as project-specific evidence unless it directly applies to the supplied project data.
7. If priceAssessment.mode is NO_VERIFIED_PRICE_BENCHMARK, clearly state that a definitive fair-price judgment cannot currently be made.
8. Do not make investment, purchasing, or financial decisions on behalf of the user.
9. Do not present an opinion or heuristic assessment as a verified fact.
10. Be concise, structured, and useful.

### CALCULATED PROJECT ANALYSIS

Project:
${structuredData.normalizedData.projectName || "Unknown"}

Project ID:
${structuredData.normalizedData.projectId || "Unknown"}

Registry:
${structuredData.normalizedData.registry || "Unknown"}

Project Type:
${structuredData.normalizedData.type || "Unknown"}

Country:
${structuredData.normalizedData.country || "Unknown"}

Vintage:
${structuredData.normalizedData.vintage || "Unknown"}

Integrity Score:
${structuredData.integrityScore.totalScore}/100

Rating:
${structuredData.integrityScore.rating}

Confidence:
${structuredData.integrityScore.confidence}

Risk Level:
${structuredData.riskIndicators.riskLevel}

### SCORE BREAKDOWN

Registry and Verification:
${structuredData.integrityScore.breakdown.registryAndVerification}

Methodology Evidence:
${structuredData.integrityScore.breakdown.methodologyEvidence}

Permanence Risk:
${structuredData.integrityScore.breakdown.permanenceRisk}

Transparency:
${structuredData.integrityScore.breakdown.transparency}

Vintage:
${structuredData.integrityScore.breakdown.vintage}

Data Completeness:
${structuredData.integrityScore.breakdown.dataCompleteness}

### STRENGTHS

${
  structuredData.integrityScore.strengths.length > 0
    ? structuredData.integrityScore.strengths
        .map((strength) => `- ${strength}`)
        .join("\n")
    : "- None identified from available data."
}

### CONCERNS

${
  structuredData.integrityScore.concerns.length > 0
    ? structuredData.integrityScore.concerns
        .map((concern) => `- ${concern}`)
        .join("\n")
    : "- None identified from available data."
}

### LIMITATIONS

${
  structuredData.integrityScore.limitations.length > 0
    ? structuredData.integrityScore.limitations
        .map((limitation) => `- ${limitation}`)
        .join("\n")
    : "- No additional limitations recorded."
}

### EVIDENCE GAPS

${
  structuredData.riskIndicators.evidenceGaps.length > 0
    ? structuredData.riskIndicators.evidenceGaps
        .map((gap) => `- ${gap}`)
        .join("\n")
    : "- No major evidence gaps recorded by the current framework."
}

### PEER COMPARISON

Comparable Projects Found:
${structuredData.peerComparison.peerCount}

Average Peer Score:
${structuredData.peerComparison.averageScore ?? "Not available"}

Median Peer Score:
${structuredData.peerComparison.medianScore ?? "Not available"}

Comparison Summary:
${structuredData.peerComparison.comparisonSummary}

### PRICE ASSESSMENT

Asked Price:
${priceDisplay}

Currency:
${structuredData.priceAssessment.currency || "INR"}

Assessment Mode:
${structuredData.priceAssessment.mode}

Assessment:
${structuredData.priceAssessment.assessment}

### RETRIEVED CARBON-MARKET KNOWLEDGE

${ragContext || "No relevant knowledge retrieved."}

### USER QUESTION

${userQuestion || "Provide a complete analysis of this project."}

Now provide a clear executive analysis with exactly these sections:

1. Overall Integrity Assessment
   - State the integrity score, rating, confidence, and risk level.
   - Explain the main evidence-based drivers behind the score.

2. Main Strengths
   - Explain the strongest positive factors supported by the calculated analysis.

3. Main Risks, Concerns, and Limitations
   - Clearly explain concerns, evidence gaps, vintage issues, permanence issues, transparency gaps, or limitations only when supported by the supplied analysis.

4. Peer Comparison
   - Explain how the project performs relative to available peers.
   - If peer data is unavailable, clearly say so.

5. Asking Price Assessment
   - State the asked price using the supplied currency.
   - Use only the supplied price assessment.
   - If there is no verified price benchmark, clearly state that a definitive fair-price judgment cannot currently be made.

6. Final Conclusion
   - Give a concise evidence-based conclusion.
   - Make clear that the integrity score is a heuristic assessment based on available data, not an absolute guarantee.

Answer the user's specific question where relevant.
Do not output unsupported numerical claims.
`;

  try {
    const response = await llm.invoke(prompt);
    return String(response.content);
  } catch (error) {
    console.error("Gemini Failure:", error);
    throw new Error("AI Explanation generation failed.");
  }
}

export async function getKnowledgeContext(
  question: string
): Promise<string> {
  return retrieveKnowledge(question);
}