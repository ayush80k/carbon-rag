# Carbon AI / Carbon-RAG

Carbon AI is a TypeScript/Node.js decision-support backend for reviewing carbon-credit project records. It accepts either a project ID from the supplied voluntary-registry Excel database or a seller's manually submitted project information. Both paths use the same deterministic analysis pipeline.

## Architecture

`POST /api/analyze-project` normalizes the request, calculates deterministic integrity and risk outputs, compares available database peers, assesses the supplied asking price, and then optionally uses Pinecone/Gemini to explain those calculated results. Pinecone and Gemini are never required to calculate a score.

The Excel file is loaded once and cached. Set `EXCEL_DB_PATH` to use another location; otherwise the application expects `Voluntary-Registry-Offsets-Database--v2026-04.xlsx` in the project root.

## Setup and commands

```bash
npm install
npm run build
npm test
npm start
```

Environment variables:

- `EXCEL_DB_PATH` — optional path to the workbook.
- `PORT` — optional API port; defaults to `3000`.
- `GOOGLE_API_KEY`, `PINECONE_API_KEY`, `GEMINI_MODEL` — optional. Without them, deterministic analysis still completes and `aiExplanation` is `null`.

## API

### Analyze a database project

```json
POST /api/analyze-project
{
  "projectId": "ACR138",
  "askedPrice": 500,
  "currency": "INR",
  "question": "Explain the integrity, risks, peers, and price limitation."
}
```

### Seller self-assessment

```json
POST /api/analyze-project
{
  "project": {
    "projectId": "SELLER-001",
    "projectName": "Example Forest Conservation Project",
    "registry": "Verra",
    "voluntaryStatus": "Registered",
    "scope": "Forestry",
    "type": "Improved Forest Management",
    "reductionRemoval": "Removal",
    "methodology": "Example methodology",
    "region": "Asia",
    "country": "India",
    "vintage": 2022,
    "verifier": "Independent Third Party",
    "totalCreditsIssued": 50000,
    "totalCreditsRetired": 10000,
    "uncoveredReversals": false,
    "projectWebsite": "https://example.com"
  },
  "askedPrice": 500,
  "currency": "INR"
}
```

## Integrity model

The response exposes six individual 0–100 factor scores (or `null` where evidence is insufficient or a factor is not applicable), rationale, evidence status (`strong`, `partial`, `insufficient`, or `not_applicable`), and evidence gaps:

- Verification — registry, verifier, status, certification, and documentation signals.
- Additionality — conservative indirect evidence from project design and documentation; it is not a scientific proof.
- Permanence — reversal and buffer evidence where carbon-storage permanence is relevant. It is `not_applicable` for reduction projects unless explicit reversal evidence requires review; it is excluded before composite weights are re-normalized.
- Double-counting risk — registry/identity/issuance/retirement traceability evidence; it cannot prove global absence of double counting.
- Methodology quality — methodology specificity, version, registry association, and documentation.
- Vintage — current-year-relative timing, without treating age as proof of poor quality.

Overall Integrity is a deterministic weighted composite: Verification 20%, Additionality 20%, Permanence 15%, Double-counting Risk 15%, Methodology Quality 20%, and Vintage 10%. Null or not-applicable factors are excluded before the remaining applicable weights are re-normalized; they are never silently scored as zero or 100.

`factorCoverage` is the weighted percentage of applicable factors that could receive a deterministic score. `evidenceCoverage` is separate: it is the weighted completeness/quality of the supporting fields behind applicable factors. Therefore a project can have `factorCoverage: 100` but lower `evidenceCoverage` when documentation, certification, methodology version, serial-level traceability, or other important evidence is missing.

Confidence is deterministic: **High** requires at least 90% factor coverage, at least 90% evidence coverage, at least three strong factors, and no more than two important evidence gaps. **Medium** requires at least 60% factor coverage and 45% evidence coverage. All other cases are **Low**. Additionality uses only indirect available project evidence unless an independent determination is supplied, and registry traceability cannot prove that double counting never occurred.

`greenwashingRisk` is a separate cautious assessment containing a level, concise explanation, actual indicators, and evidence gaps. Missing information is uncertainty rather than proof of greenwashing; high risk requires actual deterministic indicators or serious contradictions. It is not an accusation of fraud or greenwashing.

Peer comparisons use only available Excel records and the same deterministic score. They are integrity comparisons, not price benchmarks.

The integrity score is a deterministic evidence-based heuristic based on available data. It is not an absolute guarantee of environmental integrity, legitimacy, or future performance.

## Price limitation

The supplied database contains no verified transaction or market-price data. `askedPrice` (including `0`) and `currency` are preserved, with INR displayed as `₹500 INR` in AI explanations. The API returns `NO_VERIFIED_PRICE_BENCHMARK` and does not claim an asking price is fair or unfair. Fair-price assessment requires verified benchmark or transaction data.
