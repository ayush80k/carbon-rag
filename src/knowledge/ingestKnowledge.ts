import "dotenv/config";
import { Pinecone } from "@pinecone-database/pinecone";
import { GoogleGenerativeAIEmbeddings } from "@langchain/google-genai";
import { bhoomiKnowledge } from "./bhoomiKnowledge.js";

const namespace = "bhoomi-carbon-knowledge";

async function main(): Promise<void> {
  if (!process.env.GOOGLE_API_KEY || !process.env.PINECONE_API_KEY) {
    throw new Error("GOOGLE_API_KEY and PINECONE_API_KEY are required for knowledge ingestion.");
  }
  const indexName = process.env.PINECONE_INDEX || "carbon-rag";
  const embeddings = new GoogleGenerativeAIEmbeddings({ model: "gemini-embedding-001", apiKey: process.env.GOOGLE_API_KEY });
  const pinecone = new Pinecone({ apiKey: process.env.PINECONE_API_KEY });
  const index = pinecone.index(indexName).namespace(namespace);

  // Stable IDs make this command idempotent: a rerun overwrites each existing chunk.
  for (const document of bhoomiKnowledge) {
    const values = await embeddings.embedQuery(document.text);
    await index.upsert([{
      id: document.id,
      values,
      metadata: { source: document.source, section: document.section, lang: document.lang, text: document.text },
    }]);
  }
  console.log(`Upserted ${bhoomiKnowledge.length} Bhoomi Carbon knowledge chunks into ${indexName}/${namespace}.`);
}

main().catch((error) => {
  console.error("Knowledge ingestion failed:", error);
  process.exitCode = 1;
});
