import "dotenv/config";
import express from "express";
import cors from "cors";
import { askCarbonAI } from "./carbonAI";

const app = express();

app.use(cors());
app.use(express.json());

app.get("/health", (_req, res) => {
  res.json({
    status: "ok",
    service: "carbon-ai",
  });
});

app.post("/api/chat", async (req, res) => {
  try {
    const { question } = req.body;

    if (!question || typeof question !== "string") {
      res.status(400).json({
        error: "question is required",
      });
      return;
    }

    const result = await askCarbonAI(question);

    res.json(result);
  } catch (error) {
    console.error("Carbon AI error:", error);

    res.status(500).json({
      error: "Failed to generate answer",
    });
  }
});

const PORT = Number(process.env.APP_PORT) || 3000;

app.listen(PORT, () => {
  console.log(`Carbon AI API running on port ${PORT}`);
});