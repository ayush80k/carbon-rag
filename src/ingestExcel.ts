import "dotenv/config";
import * as XLSX from "xlsx";
import { Pinecone } from "@pinecone-database/pinecone";
import { GoogleGenerativeAIEmbeddings } from "@langchain/google-genai";

const INDEX_NAME = "carbon-rag";
const NAMESPACE = "projects";
const BATCH_SIZE = 50;
const MAX_RETRIES = 3;

const pc = new Pinecone({
  apiKey: process.env.PINECONE_API_KEY!,
});

const embeddings = new GoogleGenerativeAIEmbeddings({
  model: "gemini-embedding-001",
  apiKey: process.env.GOOGLE_API_KEY!,
});

function clean(value: any): string {
  if (value === undefined || value === null) return "";
  return String(value).trim();
}

function projectToText(p: any): string {
  return `
Project ID: ${clean(p["Project ID"])}
Project Name: ${clean(p["Project Name"])}
Registry: ${clean(p["Voluntary Registry"])}
Status: ${clean(p["Voluntary Status"])}
Scope: ${clean(p["Scope"])}
Type: ${clean(p["Type"])}
Reduction/Removal: ${clean(p["Reduction / Removal"])}
Methodology: ${clean(p["Methodology / Protocol"])}
Methodology Version: ${clean(p["Methodology Version"])}
Region: ${clean(p["Region"])}
Country: ${clean(p["Country"])}
State: ${clean(p["State"])}
Project Location: ${clean(p["Project Site Location"])}
Project Developer: ${clean(p["Project Developer"])}
Total Credits Issued: ${clean(p["Total Credits \\nIssued"])}
Total Credits Retired: ${clean(p["Total Credits \\nRetired"])}
Total Credits Remaining: ${clean(p["Total Credits Remaining"])}
First Vintage Year: ${clean(p["First Year of Project (Vintage)"])}
Project Owner: ${clean(p["Project Owner"])}
Operator: ${clean(p["Offset Project Operator"])}
Verifier: ${clean(p["Verifier"])}
Estimated Annual Emission Reductions: ${clean(p["Estimated Annual Emission Reductions"])}
Certifications: ${clean(p["Certifications"])}
Project Type From Registry: ${clean(p["Project Type From the Registry"])}
Project Description: ${clean(p["Project Description"])}
Registry Notes: ${clean(p["Notes from Registry"])}
Berkeley Notes: ${clean(p["Notes from Berkeley Carbon Trading Project"])}
`.trim();
}

async function embedBatch(texts: string[]): Promise<number[][]> {
  for (let attempt = 1; attempt <= MAX_RETRIES; attempt++) {
    try {
      const vectors = await embeddings.embedDocuments(texts);

      if (
        vectors.length === texts.length &&
        vectors.every((v) => v && v.length === 3072)
      ) {
        return vectors;
      }

      console.log(
        `Invalid embedding response: ${vectors.length}/${texts.length} vectors.`
      );
    } catch (error) {
      console.error(
        `Embedding failed (attempt ${attempt}/${MAX_RETRIES}).`
      );

      if (attempt === MAX_RETRIES) {
        throw error;
      }
    }

    console.log("Retrying in 3 seconds...");
    await new Promise((resolve) => setTimeout(resolve, 3000));
  }

  throw new Error("Failed to generate embeddings.");
}

async function main() {
  const filePath =
    "./Voluntary-Registry-Offsets-Database--v2026-04.xlsx";

  console.log("Reading Excel database...");

  const workbook = XLSX.readFile(filePath);
  const sheet = workbook.Sheets["PROJECTS"];

  if (!sheet) {
    throw new Error("PROJECTS sheet not found.");
  }

  const rows = XLSX.utils.sheet_to_json<any>(sheet, {
    range: 3,
  });

  console.log(`Found ${rows.length} projects.`);

  const index = pc.index(INDEX_NAME);

  let totalStored = 0;

  for (let start = 0; start < rows.length; start += BATCH_SIZE) {
    const batch = rows.slice(start, start + BATCH_SIZE);

    const end = Math.min(start + BATCH_SIZE, rows.length);

    console.log(
      `\nEmbedding projects ${start + 1}-${end}/${rows.length}...`
    );

    const texts = batch.map(projectToText);

    const vectors = await embedBatch(texts);

    const pineconeVectors = batch.map((p, i) => ({
      id: `project-${clean(p["Project ID"]) || start + i}`,
      values: vectors[i],
      metadata: {
        text: texts[i],
        projectId: clean(p["Project ID"]),
        projectName: clean(p["Project Name"]),
        country: clean(p["Country"]),
        type: clean(p["Type"]),
        registry: clean(p["Voluntary Registry"]),
      },
    }));

    await index.namespace(NAMESPACE).upsert(pineconeVectors);

    totalStored += pineconeVectors.length;

    console.log(
      `Stored ${pineconeVectors.length} projects in Pinecone.`
    );

    console.log(
      `Progress: ${totalStored}/${rows.length}`
    );
  }

  console.log(
    `\nSuccessfully indexed ${totalStored}/${rows.length} projects.`
  );
}

main().catch((error) => {
  console.error("\nExcel ingestion failed:", error);
  process.exit(1);
});