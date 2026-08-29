# Carbon AI — Bhoomi Carbon RAG Service

Carbon AI is a TypeScript backend intelligence and analysis service for evaluating carbon-credit projects using structured project data.

It has two separate responsibilities:

- `POST /api/analyze-project` performs deterministic carbon-project analysis: integrity factors, risks, peer comparison, and benchmark-limited price assessment.
- `POST /api/chat` is the Bhoomi Carbon RAG chatbot. It retrieves static platform knowledge from Pinecone and explains request-scoped live data supplied by the main backend.

The chatbot never calculates or overrides prices, optimizer outputs, quality scores, integrity scores, or anomaly results. It can only explain deterministic values supplied in context. The service does not independently verify carbon credits.

The system is designed to be integrated into an existing website, backend, dashboard, marketplace, or other application.

---

## What Carbon AI Does

For a carbon project, Carbon AI can provide:

- Project data normalization
- Overall integrity score
- Integrity rating
- Confidence level
- Factor coverage
- Evidence coverage
- Verification assessment
- Additionality assessment
- Permanence applicability assessment
- Double-counting risk assessment
- Methodology evidence assessment
- Vintage assessment
- Evidence gaps and limitations
- Risk indicators
- Greenwashing risk assessment
- Comparable project analysis
- Peer average and median scores
- Asking-price assessment when price data is provided
- Multilingual AI-generated explanation of the complete analysis

The output is structured JSON, allowing any frontend or backend to display individual results wherever required.

For example:

- A project card can display the project name, overall score, rating, confidence, and risk level.
- A detailed project page can display all factor scores and evidence gaps.
- A comparison page can use the peer comparison results.
- A chat or AI interface can use the generated explanation.
- A form can submit project data directly for analysis.

The frontend does not need to calculate any integrity scores itself.

---

## Architecture

```text
                         Project Data
                              │
                              ▼
                      Carbon AI Backend
                              │
              ┌───────────────┼───────────────┐
              ▼               ▼               ▼
        Normalization      Scoring      Peer Analysis
              │               │               │
              └───────────────┼───────────────┘
                              ▼
                      Risk Assessment
                              │
                              ▼
                      Price Assessment
                              │
                              ▼
                     AI Explanation Layer
                              │
                              ▼
                    Structured JSON Output
                              │
                              ▼
                 Website / Backend / API Client