import "dotenv/config";
import { ChatGoogleGenerativeAI } from "@langchain/google-genai";

async function main() {
  const llm = new ChatGoogleGenerativeAI({
    model: "gemini-3.6-flash",
    apiKey: process.env.GOOGLE_API_KEY,
    temperature: 0.2,
  });

  const response = await llm.invoke(
    "Explain what a carbon credit is in two sentences."
  );

  console.log(response.content);
}

main().catch(console.error);