import "dotenv/config";
import fs from "fs";
import { Pinecone } from "@pinecone-database/pinecone";
import { GoogleGenerativeAIEmbeddings } from "@langchain/google-genai";

const INDEX_NAME = "carbon-rag";
const NAMESPACE = "demo-projects";

const pc = new Pinecone({
  apiKey: process.env.PINECONE_API_KEY!,
});

const embeddings = new GoogleGenerativeAIEmbeddings({
  model: "gemini-embedding-001",
  apiKey: process.env.GOOGLE_API_KEY!,
});

async function main() {
  const text = fs.readFileSync("data.txt", "utf-8");

  const chunks = text
    .split(/\r?\n\s*\r?\n/)
    .map((chunk) => chunk.trim())
    .filter(Boolean);

  console.log(`Found ${chunks.length} chunks.`);

  const index = pc.index(INDEX_NAME);

  for (let i = 0; i < chunks.length; i++) {
    const chunk = chunks[i];

    console.log(`Embedding chunk ${i + 1}/${chunks.length}...`);

    const vector = await embeddings.embedQuery(chunk);

    await index.namespace(NAMESPACE).upsert([
      {
        id: `chunk-${i}`,
        values: vector,
        metadata: {
          text: chunk,
        },
      },
    ]);
  }

  console.log("Document successfully stored in Pinecone.");
}

main().catch(console.error);