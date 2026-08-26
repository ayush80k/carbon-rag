import "dotenv/config";
import * as XLSX from "xlsx";
import { Pinecone } from "@pinecone-database/pinecone";
import { GoogleGenerativeAIEmbeddings } from "@langchain/google-genai";
import { ChatGoogleGenerativeAI } from "@langchain/google-genai";

const EXCEL_PATH =
  "./Voluntary-Registry-Offsets-Database--v2026-04.xlsx";

const PROJECT_NAMESPACE = "projects";
const KNOWLEDGE_NAMESPACE = "carbon-knowledge";
const INDEX_NAME = "carbon-rag";

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
  temperature: 0.2,
});

let projects: any[] | null = null;

function clean(value: any): string {
  if (value === undefined || value === null) return "";
  return String(value).trim();
}

function loadProjects() {
  if (projects) return projects;

  console.log("Loading project database...");

  const workbook = XLSX.readFile(EXCEL_PATH);
  const sheet = workbook.Sheets["PROJECTS"];

  if (!sheet) {
    throw new Error("PROJECTS sheet not found");
  }

  projects = XLSX.utils.sheet_to_json<any>(sheet, {
    range: 3,
  });

  console.log(`Loaded ${projects.length} projects.`);

  return projects;
}

/*
 * Find projects relevant to the user's question.
 *
 * This searches the ENTIRE Excel dataset locally.
 * No embedding API is required for project data.
 */
function searchProjects(query: string, limit = 15) {
  const data = loadProjects();

  const words = query
    .toLowerCase()
    .split(/\s+/)
    .filter((word) => word.length >= 3);

  const scored = data.map((project) => {
    const searchable = [
      project["Project ID"],
      project["Project Name"],
      project["Voluntary Registry"],
      project["Voluntary Status"],
      project["Scope"],
      project["Type"],
      project["Reduction / Removal"],
      project["Methodology / Protocol"],
      project["Region"],
      project["Country"],
      project["State"],
      project["Project Site Location"],
      project["Project Developer"],
      project["Project Owner"],
      project["Verifier"],
      project["Project Type From the Registry"],
      project["Project Description"],
      project["Notes from Registry"],
      project["Notes from Berkeley Carbon Trading Project"],
    ]
      .map(clean)
      .join(" ")
      .toLowerCase();

    let score = 0;

    for (const word of words) {
      if (searchable.includes(word)) {
        score++;
      }
    }

    return { project, score };
  });

  return scored
    .filter((item) => item.score > 0)
    .sort((a, b) => b.score - a.score)
    .slice(0, limit)
    .map((item) => item.project);
}

function projectToText(project: any): string {
  return `
Project ID: ${clean(project["Project ID"])}
Project Name: ${clean(project["Project Name"])}
Registry: ${clean(project["Voluntary Registry"])}
Status: ${clean(project["Voluntary Status"])}
Scope: ${clean(project["Scope"])}
Type: ${clean(project["Type"])}
Reduction/Removal: ${clean(project["Reduction / Removal"])}
Methodology: ${clean(project["Methodology / Protocol"])}
Region: ${clean(project["Region"])}
Country: ${clean(project["Country"])}
State: ${clean(project["State"])}
Project Location: ${clean(project["Project Site Location"])}
Developer: ${clean(project["Project Developer"])}
Credits Issued: ${clean(project["Total Credits \\nIssued"])}
Credits Retired: ${clean(project["Total Credits \\nRetired"])}
Credits Remaining: ${clean(project["Total Credits Remaining"])}
Vintage: ${clean(project["First Year of Project (Vintage)"])}
Verifier: ${clean(project["Verifier"])}
Description: ${clean(project["Project Description"])}
Registry Notes: ${clean(project["Notes from Registry"])}
Berkeley Notes: ${clean(project["Notes from Berkeley Carbon Trading Project"])}
`.trim();
}

async function retrieveKnowledge(query: string) {
  const index = pc.index(INDEX_NAME);

  const [queryEmbedding] = await embeddings.embedDocuments([query]);

  const result = await index
    .namespace(KNOWLEDGE_NAMESPACE)
    .query({
      vector: queryEmbedding,
      topK: 5,
      includeMetadata: true,
    });

  return result.matches
    .map((match) => clean(match.metadata?.text))
    .filter(Boolean);
}

export async function askCarbonAI(question: string) {
  const projectResults = searchProjects(question, 15);

  const knowledgeResults = await retrieveKnowledge(question);

  const projectContext = projectResults
    .map(projectToText)
    .join("\n\n---\n\n");

  const knowledgeContext = knowledgeResults.join(
    "\n\n---\n\n"
  );

  const prompt = `
You are Carbon AI, an assistant for evaluating and discovering carbon-credit projects.

Answer the user's question using the supplied project database and carbon-market knowledge.

IMPORTANT RULES:

1. Do not invent project facts.
2. Treat project database information as factual project data.
3. Treat carbon-market guidance as guidance, not as project-specific facts.
4. If the supplied information does not contain the answer, clearly say that the available data is insufficient.
5. When discussing a specific project, use only information supplied in the project context.
6. Do not claim that a project is "high integrity", "low integrity", "best", etc. unless the supplied information supports that conclusion.
7. Be concise but useful.

PROJECT DATABASE RESULTS:
${projectContext || "No directly matching project records found."}

CARBON KNOWLEDGE:
${knowledgeContext || "No relevant knowledge retrieved."}

USER QUESTION:
${question}

ANSWER:
`;

  const response = await llm.invoke(prompt);

  return {
    answer: response.content,
    projectsUsed: projectResults.length,
    knowledgeSourcesUsed: knowledgeResults.length,
  };
}