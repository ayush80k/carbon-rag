import "dotenv/config";
import fs from "fs";
import path from "path";
import { PDFParse } from "pdf-parse";
import { Pinecone } from "@pinecone-database/pinecone";
import { GoogleGenerativeAIEmbeddings } from "@langchain/google-genai";

const INDEX_NAME = "carbon-rag";

const embeddings = new GoogleGenerativeAIEmbeddings({
  model: "gemini-embedding-001",
  apiKey: process.env.GOOGLE_API_KEY!,
});

const pc = new Pinecone({
  apiKey: process.env.PINECONE_API_KEY!,
});

async function main() {
  const pdfPath = process.argv[2];

  if (!pdfPath) {
    console.error("Usage: node dist/ingestPdf.js <pdf-path>");
    process.exit(1);
  }

  if (!fs.existsSync(pdfPath)) {
    console.error(`File not found: ${pdfPath}`);
    process.exit(1);
  }

  console.log(`Reading: ${pdfPath}`);

  const buffer = fs.readFileSync(pdfPath);

  const parser = new PDFParse({ data: buffer });
  const data = await parser.getText();
  await parser.destroy();

  console.log(`Extracted ${data.text.length} characters.`);

  const chunks: string[] = data.text
    .split(/\r?\n\s*\r?\n/)
    .map((chunk: string) => chunk.trim())
    .filter((chunk: string) => chunk.length > 0);

  console.log(`Created ${chunks.length} chunks.`);

  const index = pc.index(INDEX_NAME);
  const namespace = "carbon-knowledge";

  for (let i = 0; i < chunks.length; i++) {
    console.log(`Embedding chunk ${i + 1}/${chunks.length}...`);

    const vector = await embeddings.embedQuery(chunks[i]);

    await index.namespace(namespace).upsert([
      {
        id: `chunk-${i}`,
        values: vector,
        metadata: {
          text: chunks[i],
          source: path.basename(pdfPath),
        },
      },
    ]);
  }

  console.log(`Successfully stored ${chunks.length} chunks.`);
  console.log(`Namespace: ${namespace}`);
}

main().catch((error) => {
  console.error("PDF ingestion failed:", error);
});