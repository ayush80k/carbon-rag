# Carbon AI — Carbon Project Intelligence & RAG

Carbon AI is an AI-powered carbon-market intelligence prototype designed
to discover, analyze, compare, and evaluate carbon-credit projects.

The system combines:

- A database of 11,343 carbon-project records
- Carbon-market knowledge retrieved through Pinecone
- Gemini embeddings
- An LLM for generating contextual answers
- An Express API for integration with a web application

## Architecture

User
  ↓
POST /api/chat
  ↓
Carbon AI
  ├── Project database (11,343 records)
  ├── Pinecone carbon knowledge
  └── Gemini LLM
  ↓
AI-generated response

## API

### POST /api/chat

Request:

{
  "question": "What carbon projects are available in India?"
}

Response:

{
  "answer": "...",
  "projectsUsed": 3,
  "knowledgeSourcesUsed": 5
}

## Setup

Install dependencies:

npm install

Create `.env`:

GOOGLE_API_KEY=your_key
PINECONE_API_KEY=your_key
GEMINI_MODEL=gemini-3.6-flash
APP_PORT=3000

Place the supplied Excel dataset in the project root:

Voluntary-Registry-Offsets-Database--v2026-04.xlsx

## Run

Build:

npm run build

Start API:

npm run api

The API runs locally on:

http://localhost:3000

## Important

The Excel database is not included in this repository because it is
approximately 16 MB.

API keys must never be committed to GitHub.

For production, the project database should be provided through an
appropriate database, storage service, or deployment mechanism.

## Integration

The existing website/backend can call:

POST /api/chat

The frontend should not directly access Gemini or Pinecone.

Recommended architecture:

Frontend
   ↓
Main Backend
   ↓
Carbon AI
   ↓
Gemini / Pinecone / Project Data
