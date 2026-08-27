import "dotenv/config";
import express from "express";
import cors from "cors";
import { analyzeProjectPipeline } from "./analyzeProject.js";

const app = express();

app.use(cors());
app.use(express.json());

app.post("/api/analyze-project", async (req, res) => {
  try {
    const result = await analyzeProjectPipeline(req.body);
    res.status(200).json(result);
  } catch (error: any) {
    console.error("Analysis error:", error);
    const message = error.message || "Internal Analysis Error";
    const isInputError = message.startsWith("Provide a valid") || message.startsWith("Project ID not found");
    res.status(isInputError ? 400 : 500).json({
      error: message,
    });
  }
});

const PORT = Number(process.env.PORT) || 3000;

app.listen(PORT, () => {
  console.log(`Carbon AI Analysis Engine live on port ${PORT}`);
});
