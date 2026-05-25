# Recipe AI

AI-powered recipe generator that transforms available ingredients into structured recipes and generates dish visuals using FLUX.1 Schnell.

![Recipe AI Preview](docs/images/recipe-ai-preview.png)

---

## Overview

**Recipe AI** is a full-stack personal project focused on real product quality: clean UX, secure AI integrations, resilient error handling, and maintainable architecture.

Users enter ingredients, receive a personalized recipe (title, prep time, servings, difficulty, ingredients, steps, chef tip), and get a generated food image.

---

## Features

- Generate personalized recipes from user ingredients.
- Structured recipe output:
  - title
  - prep time
  - servings
  - difficulty
  - ingredients
  - steps
  - chef tip
- Generate recipe images with **Hugging Face FLUX.1 Schnell**.
- Local fallback image when generation fails.
- Dynamic metadata normalization:
  - cleans LLM-style titles
  - estimates prep time/servings/difficulty when needed
- Defensive parsing and robust error handling.
- Diagnostic API endpoint for fast troubleshooting.
- Responsive premium UI (desktop/tablet/mobile).

---

## Tech Stack

### Frontend
- React
- TypeScript
- Vite
- Custom CSS

### Backend / API
- AWS Amplify (Gen 2)
- GraphQL
- Serverless functions

### AI Services
- Amazon Bedrock (recipe generation)
- Hugging Face Inference Router
- `black-forest-labs/FLUX.1-schnell` (image generation)

### Tooling
- ESLint
- Type-safe contracts

---

## Architecture Highlights

- **Secure token handling**: `HF_TOKEN` stays server-side only.
- **Frontend never exposes secrets**.
- **Structured data contract** between frontend and backend.
- **Fallback strategy** for image failures (`/public/recipes/fallback.jpg`).
- **Observability** via diagnostic endpoint:
  - missing token
  - timeout
  - network failure
  - non-image upstream response
  - model terms not accepted
  - provider/model incompatibility

---

## API Endpoints

- `POST /api/generate-recipe-image`
  - Returns generated image as `data:image/...;base64,...`
- `POST /api/generate-recipe-image-diagnostic`
  - Returns a clear diagnostic status for integration/debugging

---

## Environment Variables

Create a `.env` file in the project root:

```env
HF_TOKEN=hf_your_token_here
```

---

## Local Development

1. Install dependencies:

```bash
npm install
```

2. Run frontend:

```bash
npm run dev
```

3. For local serverless routes (`/api/*`), run:

```bash
vercel dev
```

---

## What I Solved

- Turned free-form AI output into reliable structured recipe data.
- Implemented resilient frontend behavior for real-world API failures.
- Reworked image generation endpoint to use Hugging Face router endpoint.
- Added timeout control and detailed diagnostics for production-like debugging.
- Built a polished, responsive UI with a premium product feel.

---

## Project Status

Active personal project.  
Planned improvements:
- richer recipe personalization
- stronger culinary heuristics
- advanced prompt tuning and style controls

