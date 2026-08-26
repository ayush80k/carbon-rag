import "dotenv/config";
import { Pinecone } from "@pinecone-database/pinecone";
import {
  GoogleGenerativeAIEmbeddings,
  ChatGoogleGenerativeAI,
} from "@langchain/google-genai";

const INDEX_NAME = "carbon-rag";

const pc = new Pinecone({
  apiKey: process.env.PINECONE_API_KEY!,
});

const embeddings = new GoogleGenerativeAIEmbeddings({
  model: "gemini-embedding-001",
  apiKey: process.env.GOOGLE_API_KEY!,
});

const llm = new ChatGoogleGenerativeAI({
  model: "gemini-3.6-flash",
  apiKey: process.env.GOOGLE_API_KEY!,
  temperature: 0.2,
});

async function searchNamespace(
  question: string,
  namespace: string,
  topK = 3
) {
  const queryVector = await embeddings.embedQuery(question);

  const index = pc.index(INDEX_NAME);

  const results = await index.namespace(namespace).query({
    vector: queryVector,
    topK,
    includeMetadata: true,
  });

  return results.matches;
}

async function main() {
  const question = process.argv.slice(2).join(" ");

  if (!question) {
    console.log(
      'Usage: node dist/rag.js "Your question here"'
    );
    process.exit(1);
  }

  console.log(`\nQuestion: ${question}\n`);

  // Search project database
  const projectResults = await searchNamespace(
    question,
    "projects",
    3
  );

  // Search carbon knowledge
  const knowledgeResults = await searchNamespace(
    question,
    "carbon-knowledge",
    3
  );

  const projectContext = projectResults
    .map((match) => match.metadata?.text)
    .filter(Boolean)
    .join("\n\n---\n\n");

  const knowledgeContext = knowledgeResults
    .map((match) => match.metadata?.text)
    .filter(Boolean)
    .join("\n\n---\n\n");

  const prompt = `
You are a Carbon Intelligence Assistant.

Answer the user's question using the provided project data
and carbon-credit knowledge.

PROJECT DATA:
${projectContext || "No relevant project data found."}

CARBON KNOWLEDGE:
${knowledgeContext || "No relevant knowledge found."}

USER QUESTION:
${question}

Rules:
1. Use the provided information as your primary source.
2. Do not invent project facts.
3. If the provided information is insufficient, clearly say so.
4. Distinguish factual project data from general carbon-credit guidance.
5. Give a concise, useful answer.
`;

  const response = await llm.invoke(prompt);

  console.log("AI ANSWER:\n");
  console.log(response.content);

  console.log("\n--- SOURCES USED ---");

  if (projectResults.length > 0) {
    console.log("Project database:");
    projectResults.forEach((result, i) => {
      console.log(
        `${i + 1}. ${result.metadata?.projectName || "Project record"}`
      );
    });
  }

  if (knowledgeResults.length > 0) {
    console.log("Carbon knowledge:");
    knowledgeResults.forEach((result, i) => {
      console.log(
        `${i + 1}. ${result.metadata?.source || "Knowledge document"}`
      );
    });
  }
}

main().catch(console.error);