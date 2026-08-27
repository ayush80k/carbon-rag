# Carbon AI — Carbon Project Intelligence API

Carbon AI is a backend intelligence and analysis system for evaluating carbon-credit projects using structured project data.

It accepts carbon project information, normalizes the available data, evaluates multiple integrity factors, identifies evidence gaps and risks, compares projects with similar projects, and generates an AI-readable explanation of the analysis.

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
- AI-generated explanation of the complete analysis

The output is structured JSON, allowing any frontend or backend to display individual results wherever required.

For example:

- A project card can display the project name, overall score, rating, confidence, and risk level.
- A detailed project page can display all factor scores and evidence gaps.
- A comparison page can use the peer comparison results.
- A chat or AI interface can use the generated explanation.
- A form can submit project data directly for analysis.

The frontend does not need to calculate any integrity scores itself.

---

# Architecture

```text
                    Project Data
                         │
                         ▼
                 Carbon AI Backend
                         │
          ┌──────────────┼──────────────┐
          ▼              ▼              ▼
    Normalization      Scoring      Peer Analysis
          │              │              │
          └──────────────┼──────────────┘
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
