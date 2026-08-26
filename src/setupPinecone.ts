import "dotenv/config";
import { Pinecone } from "@pinecone-database/pinecone";

const pc = new Pinecone({
  apiKey: process.env.PINECONE_API_KEY!,
});

const INDEX_NAME = "carbon-rag";

async function main() {
  const existing = await pc.listIndexes();

  const exists = existing.indexes?.some(
    (index) => index.name === INDEX_NAME
  );

  if (exists) {
    console.log(`Index "${INDEX_NAME}" already exists.`);
    return;
  }

  await pc.createIndex({
    name: INDEX_NAME,
    dimension: 3072,
    metric: "cosine",
    spec: {
      serverless: {
        cloud: "aws",
        region: "us-east-1",
      },
    },
  });

  console.log(`Created index "${INDEX_NAME}".`);
}

main().catch(console.error);