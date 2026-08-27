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

    res.status(500).json({
      error: error.message || "Internal Analysis Error",
    });
  }
});

const PORT = Number(process.env.PORT) || 3000;

app.listen(PORT, () => {
  console.log(`Carbon AI Analysis Engine live on port ${PORT}`);
});