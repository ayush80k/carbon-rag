import "dotenv/config";
import { Pinecone } from "@pinecone-database/pinecone";
import { ChatGoogleGenerativeAI, GoogleGenerativeAIEmbeddings } from "@langchain/google-genai";
import { BhoomiLanguage, detectLanguage, isSupportedLanguage } from "./language.js";

export { detectLanguage } from "./language.js";

const namespace = "bhoomi-carbon-knowledge";
const maxListings = 5;
const maxCompanies = 3;

export interface ChatRequest {
  question: string;
  language?: BhoomiLanguage;
  listings?: Record<string, unknown>[];
  companies?: Record<string, unknown>[];
  context?: Record<string, unknown>;
}

export interface ChatSource {
  type: "knowledge" | "listing" | "company" | "context";
  section?: string;
  lang?: BhoomiLanguage;
  projectId?: string;
  companyId?: string;
  name?: string;
}

export interface ChatResponse {
  answer: string;
  language: BhoomiLanguage;
  sources: ChatSource[];
  knowledgeSourcesUsed: number;
  listingsUsed: number;
  companiesUsed: number;
}

export class ChatRequestError extends Error {}
export class ChatUnavailableError extends Error {}

export function parseChatRequest(input: unknown): ChatRequest {
  if (!input || typeof input !== "object" || Array.isArray(input)) throw new ChatRequestError("Request body must be an object.");
  const body = input as Record<string, unknown>;
  if (typeof body.question !== "string" || !body.question.trim()) throw new ChatRequestError("question must be a non-empty string.");
  if (body.language !== undefined && !isSupportedLanguage(body.language)) throw new ChatRequestError("language must be one of: en, hi, pa, mr.");
  if (body.listings !== undefined && (!Array.isArray(body.listings) || body.listings.some((item) => !item || typeof item !== "object" || Array.isArray(item)))) throw new ChatRequestError("listings must be an array of objects.");
  if (body.companies !== undefined && (!Array.isArray(body.companies) || body.companies.some((item) => !item || typeof item !== "object" || Array.isArray(item)))) throw new ChatRequestError("companies must be an array of objects.");
  if (body.context !== undefined && (!body.context || typeof body.context !== "object" || Array.isArray(body.context))) throw new ChatRequestError("context must be an object.");
  return {
    question: body.question.trim(),
    language: body.language as BhoomiLanguage | undefined,
    listings: body.listings as Record<string, unknown>[] | undefined,
    companies: body.companies as Record<string, unknown>[] | undefined,
    context: body.context as Record<string, unknown> | undefined,
  };
}

function searchableText(record: Record<string, unknown>): string {
  return Object.values(record).filter((value) => typeof value === "string" || typeof value === "number" || typeof value === "boolean").join(" ").toLowerCase();
}

export function selectRelevantRecords(question: string, records: Record<string, unknown>[], limit: number): Record<string, unknown>[] {
  const terms = question.toLowerCase().match(/[\p{L}\p{N}_+-]{3,}/gu) || [];
  return records
    .map((record, index) => ({ record, index, score: terms.reduce((total, term) => total + (searchableText(record).includes(term) ? 1 : 0), 0) }))
    .sort((a, b) => b.score - a.score || a.index - b.index)
    .slice(0, limit)
    .map(({ record }) => record);
}

function compactRecord(record: Record<string, unknown>): Record<string, unknown> {
  const allowed = ["projectId", "projectName", "id", "name", "registry", "projectType", "type", "methodology", "vintage", "creditsIssued", "creditsRemaining", "qualityScore", "integrityScore", "riskLevel", "anomalyStatus", "greenwashingRisk", "fairPrice", "currency", "companyId", "companyName", "creditsHeld", "requiredCredits", "optimizerResult"];
  const compact: Record<string, unknown> = {};
  for (const key of allowed) {
    const value = record[key];
    if (value === undefined || value === null) continue;
    if (typeof value === "string" || typeof value === "number" || typeof value === "boolean") compact[key] = value;
    else if (key === "optimizerResult" || key === "greenwashingRisk") compact[key] = value;
  }
  return compact;
}

function compactContext(context: Record<string, unknown> | undefined): Record<string, unknown> | null {
  if (!context) return null;
  const entries = Object.entries(context).slice(0, 20);
  return Object.fromEntries(entries.map(([key, value]) => [key, typeof value === "string" ? value.slice(0, 1000) : value]));
}

interface KnowledgeChunk {
  source: string;
  section: string;
  lang: BhoomiLanguage;
  text: string;
}

async function retrieveKnowledge(question: string, language: BhoomiLanguage): Promise<KnowledgeChunk[]> {
  if (!process.env.GOOGLE_API_KEY || !process.env.PINECONE_API_KEY) throw new ChatUnavailableError("RAG chat requires GOOGLE_API_KEY and PINECONE_API_KEY.");
  const embeddings = new GoogleGenerativeAIEmbeddings({ model: "gemini-embedding-001", apiKey: process.env.GOOGLE_API_KEY });
  const vector = await embeddings.embedQuery(question);
  const index = new Pinecone({ apiKey: process.env.PINECONE_API_KEY }).index(process.env.PINECONE_INDEX || "carbon-rag").namespace(namespace);
  const preferred = await index.query({ vector, topK: 5, includeMetadata: true, filter: { lang: { $eq: language } } });
  const fallback = preferred.matches.length >= 2 ? preferred : await index.query({ vector, topK: 5, includeMetadata: true });
  const seen = new Set<string>();
  return fallback.matches.flatMap((match) => {
    const metadata = match.metadata;
    const section = String(metadata?.section || "");
    const text = String(metadata?.text || "");
    const lang = String(metadata?.lang || "") as BhoomiLanguage;
    if (!section || !text || !isSupportedLanguage(lang) || seen.has(`${section}:${lang}`)) return [];
    seen.add(`${section}:${lang}`);
    return [{ source: String(metadata?.source || "Bhoomi Carbon knowledge base"), section, lang, text }];
  });
}

function listingSource(record: Record<string, unknown>): ChatSource {
  return { type: "listing", projectId: typeof record.projectId === "string" ? record.projectId : undefined, name: typeof record.projectName === "string" ? record.projectName : typeof record.name === "string" ? record.name : undefined };
}

function companySource(record: Record<string, unknown>): ChatSource {
  return { type: "company", companyId: typeof record.companyId === "string" ? record.companyId : typeof record.id === "string" ? record.id : undefined, name: typeof record.companyName === "string" ? record.companyName : typeof record.name === "string" ? record.name : undefined };
}

export async function runBhoomiChat(request: ChatRequest): Promise<ChatResponse> {
  if (!process.env.GOOGLE_API_KEY) throw new ChatUnavailableError("RAG chat requires GOOGLE_API_KEY.");
  const language = request.language || detectLanguage(request.question);
  const knowledge = await retrieveKnowledge(request.question, language);
  const listings = selectRelevantRecords(request.question, request.listings || [], maxListings);
  const companies = selectRelevantRecords(request.question, request.companies || [], maxCompanies);
  const context = compactContext(request.context);
  const sources: ChatSource[] = [
    ...knowledge.map((chunk) => ({ type: "knowledge" as const, section: chunk.section, lang: chunk.lang })),
    ...listings.map(listingSource),
    ...companies.map(companySource),
    ...(context ? [{ type: "context" as const }] : []),
  ];
  const modelContext = {
    knowledge: knowledge.map(({ section, lang, text }) => ({ section, lang, text })),
    listings: listings.map(compactRecord),
    companies: companies.map(compactRecord),
    context,
  };
  const llm = new ChatGoogleGenerativeAI({ model: process.env.GEMINI_MODEL || "gemini-3.6-flash", apiKey: process.env.GOOGLE_API_KEY, temperature: 0.1 });
  const prompt = `You are the assistant for Bhoomi Carbon, a non-blockchain, data-driven carbon-credit platform.

Answer only using: (1) retrieved Bhoomi Carbon knowledge-base context, (2) live listings, companies, and context supplied for this request, and (3) deterministic platform results explicitly supplied in that context. Never use general world knowledge to fill gaps. Do not invent facts, prices, quality scores, integrity scores, methodology details, company data, listing data, or market claims. If sufficient information is unavailable, say so clearly.

Never independently calculate or execute fair-price logic, optimizer logic, quality scoring, integrity scoring, or anomaly detection. You may explain a deterministic result only when it is supplied. Missing information is uncertainty, not proof of fraud, greenwashing, or poor quality. Do not claim a project is fraudulent or illegitimate unless that exact conclusion is supplied. Respond in ${language}; keep the answer concise, friendly, and understandable for non-experts.

CONTEXT:
${JSON.stringify(modelContext, null, 2)}

QUESTION: ${request.question}`;
  const response = await llm.invoke(prompt);
  return { answer: String(response.content), language, sources, knowledgeSourcesUsed: knowledge.length, listingsUsed: listings.length, companiesUsed: companies.length };
}
