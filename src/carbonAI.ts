import "dotenv/config";
import { ChatGoogleGenerativeAI } from "@langchain/google-genai";
import { ProjectAnalysisResult } from "./types.js";

const llm = new ChatGoogleGenerativeAI({
  model: process.env.GEMINI_MODEL || "gemini-3.6-flash",
  apiKey: process.env.GOOGLE_API_KEY!,
  temperature: 0.1,
});

export async function generateExplanation(
  structuredData: Omit<ProjectAnalysisResult, "aiExplanation">,
  ragContext: string,
  userQuestion?: string
): Promise<string> {
  const prompt = `
You are Carbon AI, an expert assistant for analysing carbon-credit projects.

Your role is to explain the structured project analysis that has already been calculated by the Carbon AI analysis engine.

You may use the retrieved carbon-market knowledge as supporting context, but the calculated project analysis is the primary basis for project-specific conclusions.

IMPORTANT RULES:

1. Do not invent project facts, prices, market data, peer benchmarks, or numerical values.
2. Do not change or contradict the calculated integrity score, rating, confidence, risk level, or peer comparison.
3. Do not claim a project is fraudulent or involved in greenwashing unless the supplied analysis explicitly supports such a risk indicator.
4. Treat the calculated score and risk indicators as the primary project analysis.
5. Use retrieved knowledge only as supporting context or general carbon-market guidance.
6. Clearly distinguish evidence-based concerns from uncertainty, limitations, or missing data.
7. If price data or market comparison data is insufficient, explicitly state that a reliable fair-price conclusion cannot be made.
8. Do not present an opinion or heuristic assessment as a verified fact.
9. Do not make investment or purchasing decisions on behalf of the user.
10. Be concise, structured, and useful.

CALCULATED PROJECT ANALYSIS:

Integrity Score:
${structuredData.integrityScore.totalScore}/100

Rating:
${structuredData.integrityScore.rating}

Confidence:
${structuredData.integrityScore.confidence}

Score Breakdown:
Registry and Verification: ${
    structuredData.integrityScore.breakdown.registryAndVerification
  }
Methodology Evidence: ${
    structuredData.integrityScore.breakdown.methodologyEvidence
  }
Permanence Risk: ${
    structuredData.integrityScore.breakdown.permanenceRisk
  }
Transparency: ${
    structuredData.integrityScore.breakdown.transparency
  }
Vintage: ${
    structuredData.integrityScore.breakdown.vintage
  }
Data Completeness: ${
    structuredData.integrityScore.breakdown.dataCompleteness
  }

Strengths:
${structuredData.integrityScore.strengths.join(", ") || "None identified"}

Concerns:
${structuredData.integrityScore.concerns.join(", ") || "None identified"}

Limitations:
${structuredData.integrityScore.limitations.join(", ") || "None identified"}

Risk Level:
${structuredData.riskIndicators.riskLevel}

Evidence Gaps:
${structuredData.riskIndicators.evidenceGaps.join(", ") || "None identified"}

Peer Comparison:
Peer Count: ${structuredData.peerComparison.peerCount}
Average Peer Score: ${
    structuredData.peerComparison.averageScore ?? "Not available"
  }
Median Peer Score: ${
    structuredData.peerComparison.medianScore ?? "Not available"
  }
Comparison Summary:
${structuredData.peerComparison.comparisonSummary}

Price Assessment:
Asked Price: ${
    structuredData.priceAssessment.askedPrice ?? "Not provided"
  }
Currency: ${
    structuredData.priceAssessment.currency ?? "Not provided"
  }
Assessment Mode:
${structuredData.priceAssessment.mode}

Assessment:
${structuredData.priceAssessment.assessment}

RETRIEVED CARBON-MARKET KNOWLEDGE:
${ragContext || "No relevant knowledge was retrieved."}

USER QUESTION:
${userQuestion || "No additional question was asked."}

Provide a structured analysis covering:

1. Overall Integrity Assessment
   - State the integrity score, rating, confidence, and risk level.
   - Explain the main evidence-based drivers behind the score.

2. Key Strengths
   - Explain the strongest positive factors from the calculated analysis.

3. Risks, Concerns, and Limitations
   - Clearly explain concerns, evidence gaps, older vintage issues, permanence issues, transparency gaps, or other limitations only when supported by the supplied analysis.

4. Peer Comparison
   - Explain how the project performs relative to its available peers.
   - If peer data is unavailable, clearly say so.

5. Asking Price Assessment
   - State the asked price and currency when provided.
   - Use only the supplied price assessment.
   - If there is no verified price benchmark, clearly state that a definitive fair-price judgement cannot currently be made.

6. Final Conclusion
   - Give a concise evidence-based conclusion.
   - Make clear that the integrity score is a heuristic assessment based on available data, not an absolute guarantee of project quality or performance.

Do not output unsupported numerical claims.
`;

  try {
    const response = await llm.invoke(prompt);

    if (typeof response.content === "string") {
      return response.content;
    }

    return JSON.stringify(response.content);
  } catch (error) {
    console.error("Gemini failure:", error);
    throw new Error("AI explanation generation failed.");
  }
}