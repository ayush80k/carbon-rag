import "dotenv/config";
import express from "express";
import cors from "cors";
import { analyzeProjectPipeline } from "./analyzeProject.js";
import { AnalysisRequest, ProjectAnalysisResult } from "./types.js";
import {
  ChatRequestError,
  ChatUnavailableError,
  parseChatRequest,
  runBhoomiChat,
} from "./chatRag.js";

type AnalysisHandler = (
  request: AnalysisRequest
) => Promise<ProjectAnalysisResult>;

/**
 * Creates the Express application.
 *
 * The analysis handler can be injected for tests.
 */
export function createApp(
  analyzeProject: AnalysisHandler = analyzeProjectPipeline
): express.Express {
  const app = express();

  app.use(cors());
  app.use(express.json());

  app.post("/api/analyze-project", async (req, res) => {
    try {
      const result = await analyzeProject(req.body);

      res.status(200).json(result);
    } catch (error: any) {
      console.error("Analysis error:", error);

      const message = error?.message || "Internal Analysis Error";

      const isInputError =
        message.startsWith("Provide a valid") ||
        message.startsWith("Project ID not found") ||
        message.startsWith("Invalid language");

      res.status(isInputError ? 400 : 500).json({
        error: message,
      });
    }
  });

  app.post("/api/chat", async (req, res) => {
    try {
      const request = parseChatRequest(req.body);
      const result = await runBhoomiChat(request);

      res.status(200).json(result);
    } catch (error: any) {
      const message = error?.message || "Chat service error";

      if (error instanceof ChatRequestError) {
        res.status(400).json({
          error: message,
        });
        return;
      }

      if (error instanceof ChatUnavailableError) {
        res.status(503).json({
          error: message,
        });
        return;
      }

      console.error("Chat error:", error);

      res.status(502).json({
        error: "Unable to generate a chat response.",
      });
    }
  });

  app.use(
    (
      error: any,
      _req: express.Request,
      res: express.Response,
      next: express.NextFunction
    ) => {
      if (error instanceof SyntaxError && "body" in error) {
        res.status(400).json({
          error: "Invalid JSON request body.",
        });
        return;
      }

      next(error);
    }
  );

  return app;
}

export const app = createApp();

/**
 * Start the production API server.
 *
 * This file is the entry point used by:
 * npm run api
 * -> tsc && node dist/api.js
 */
const port = Number(process.env.APP_PORT || process.env.PORT) || 3001;

app.listen(port, () => {
  console.log(`Carbon AI service live on port ${port}`);
});