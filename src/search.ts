import "dotenv/config";
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
    const question = process.argv.slice(2).join(" ");

    if (!question) {
        console.log("Please provide a question.");
        process.exit(1);
    }

    console.log(`Question: ${question}\n`);

    const queryVector = await embeddings.embedQuery(question);

    const index = pc.index(INDEX_NAME);

    const results = await index.namespace(NAMESPACE).query({
        vector: queryVector,
        topK: 2,
        includeMetadata: true,
    });

    console.log("Retrieved results:\n");

    for (const match of results.matches) {
        console.log(`Score: ${match.score}`);
        console.log(match.metadata?.text);
        console.log("---");
    }
}

main().catch(console.error);