import "dotenv/config";
import { Pinecone } from "@pinecone-database/pinecone";
import { ChatGoogleGenerativeAI, GoogleGenerativeAIEmbeddings } from "@langchain/google-genai";
import { ProjectAnalysisResult } from "./types.js";
import { languageInstruction } from "./language.js";

const INDEX_NAME = process.env.PINECONE_INDEX || "carbon-rag";
const KNOWLEDGE_NAMESPACE = "carbon-knowledge";

function formatPrice(askedPrice: number | null, currency: string | null): string {
  if (askedPrice === null) return "Not provided";
  const amount = askedPrice.toLocaleString("en-IN", { maximumFractionDigits: 2 });
  if (currency === "INR") return `₹${amount} INR`;
  if (currency === "USD") return `$${amount} USD`;
  return `${amount} ${currency || "currency not specified"}`;
}

async function retrieveKnowledge(query: string): Promise<string> {
  if (!process.env.PINECONE_API_KEY || !process.env.GOOGLE_API_KEY) return "No relevant knowledge retrieved.";
  try {
    const embeddings = new GoogleGenerativeAIEmbeddings({ model: "gemini-embedding-001", apiKey: process.env.GOOGLE_API_KEY });
    const vector = await embeddings.embedQuery(query);
    const pc = new Pinecone({ apiKey: process.env.PINECONE_API_KEY });
    const result = await pc.index(INDEX_NAME).namespace(KNOWLEDGE_NAMESPACE).query({ vector, topK: 5, includeMetadata: true });
    return result.matches.map((match) => String(match.metadata?.text || "").trim()).filter(Boolean).join("\n\n---\n\n");
  } catch (error) {
    console.warn("Knowledge retrieval failed:", error);
    return "No relevant knowledge retrieved.";
  }
}

export async function generateExplanation(structuredData: Omit<ProjectAnalysisResult, "aiExplanation">, ragContext: string, userQuestion?: string): Promise<string> {
  if (!process.env.GOOGLE_API_KEY) throw new Error("GOOGLE_API_KEY is not configured.");
  const llm = new ChatGoogleGenerativeAI({ model: process.env.GEMINI_MODEL || "gemini-3.6-flash", apiKey: process.env.GOOGLE_API_KEY, temperature: 0.1 });
  const prompt = `You are Carbon AI. Explain the deterministic analysis below; do not calculate, alter, or invent any score, project fact, price, market benchmark, or peer result.

The structured analysis is the only source for project-specific conclusions. Retrieved knowledge is general supporting context only. Do not claim fraud, greenwashing, double counting, or project legitimacy as fact. Clearly distinguish recorded indicators from evidence gaps. Respect each factor's evidenceStatus and applicability, especially not_applicable permanence. Explain factorCoverage as scoreability of applicable factors and evidenceCoverage as underlying evidence completeness. Use cautious wording such as "based on the available dataset", "available evidence suggests", and "cannot independently verify" where relevant. Do not describe indirect additionality evidence or registry traceability as proof. The integrity score is a heuristic, not a guarantee. Do not make investment or purchasing decisions. If price mode is NO_VERIFIED_PRICE_BENCHMARK, state that a definitive fair-price judgment cannot be made.

LANGUAGE REQUIREMENT:
${languageInstruction(structuredData.language)}

STRUCTURED ANALYSIS:
${JSON.stringify(structuredData, null, 2)}

ASKED PRICE DISPLAY: ${formatPrice(structuredData.priceAssessment.askedPrice, structuredData.priceAssessment.currency)}
RETRIEVED KNOWLEDGE: ${ragContext || "None"}
USER QUESTION: ${userQuestion || "Provide a complete analysis."}

Use exactly these concise sections:
1. Overall Integrity Assessment
2. Six Integrity Factors
3. Main Strengths
4. Main Risks, Evidence Gaps, and Limitations
5. Greenwashing Risk Assessment
6. Peer Comparison
7. Asking Price Assessment
8. Final Conclusion`;
  const response = await llm.invoke(prompt);
  return String(response.content);
}

export async function getKnowledgeContext(question: string): Promise<string> {
  return retrieveKnowledge(question);
}
