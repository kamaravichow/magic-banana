<p align="center">
  <img src="public/logo.svg" alt="MagicBanana" height="48" />
</p>

<p align="center">
  <a href="https://nextjs.org"><img alt="Next.js" src="https://img.shields.io/badge/Next.js-15-black?logo=next.js" /></a>
  <a href="https://react.dev"><img alt="React" src="https://img.shields.io/badge/React-19-61DAFB?logo=react&logoColor=000" /></a>
  <a href="https://www.typescriptlang.org/"><img alt="TypeScript" src="https://img.shields.io/badge/TypeScript-5-3178C6?logo=typescript&logoColor=white" /></a>
  <a href="https://mantine.dev/"><img alt="Mantine" src="https://img.shields.io/badge/Mantine-8-339AF0" /></a>
  <a href="https://tailwindcss.com/"><img alt="Tailwind" src="https://img.shields.io/badge/Tailwind%20CSS-4-38B2AC?logo=tailwindcss&logoColor=white" /></a>
  <a href="https://ai.google.dev/gemini-api"><img alt="Google Gemini API" src="https://img.shields.io/badge/Google%20Gemini-API-1f6feb?logo=google&logoColor=white" /></a>
  <a href="https://vercel.com"><img alt="Vercel" src="https://img.shields.io/badge/Ready%20for-Vercel-000000?logo=vercel&logoColor=white" /></a>
</p>

## MagicBanana

AI-enhanced image playground built with Next.js App Router, Mantine UI, and Google Gemini. Upload an image, describe the transformation, and receive both AI-generated text and optionally a new image – with a clear per-request cost breakdown.

### Highlights

- **Multimodal prompts**: Send text with an optional image to Gemini.
- **Image generation/transform**: Receives inline image data when the model returns one.
- **AI Image Enhancement**: Restore and enhance image quality using CodeFormer face restoration.
- **Cost transparency**: Detailed token accounting and pricing shown in a modal.
- **Beautiful UI**: Mantine `AppShell`, polished chat and editor panels.
- **Canvas controls**: Zoom in/out, fit-to-screen, and one-click download.
- **TypeScript-first**: Strict types across client and server.

---

## Quick start

### Prerequisites

- Node.js 18+ recommended
- A Google Gemini API key
- A Replicate API key (optional, for image enhancement features)

### Install

```bash
pnpm install
# or
npm install
```

### Configure environment

Create `.env.local` in the project root:

```bash
GEMINI_API_KEY=your_api_key_here
# Optional: For image enhancement features
REPLICATE_API_TOKEN=your_replicate_api_key_here
```

### Run

```bash
pnpm dev
# or
npm run dev
```

Open `http://localhost:3000`.

---

## How it works

- Server route `app/api/generate-image/route.ts` calls `@google/genai` with model `gemini-2.5-flash-image-preview` and streams content.
- The API returns JSON containing:
  - `text`: aggregated streamed text
  - `image`: optional `{ data: base64, mimeType }`
  - `cost`: computed pricing for input/output tokens and image generation
- Client `app/components/ChatInterface.tsx` handles prompt + image upload and displays message history with a cost modal.
- Client `app/components/EditorView.tsx` renders the generated image with zoom and download controls.

---

## API

### POST `/api/generate-image`

- **Content-Type**: `multipart/form-data`
- **Body fields**:
  - `prompt` (string, required)
  - `image` (file, optional)

#### Response 200

```json
{
  "text": "optional text",
  "image": {
    "data": "<base64>",
    "mimeType": "image/png"
  },
  "cost": {
    "inputTokens": 0,
    "outputTokens": 0,
    "inputImageTokens": 0,
    "generatedImages": 0,
    "totalTokens": 0,
    "inputCost": 0,
    "outputCost": 0,
    "imageCost": 0,
    "totalCost": 0,
    "formattedCost": "$0.0000"
  }
}
```

#### Errors

- `400` — Missing `prompt`
- `500` — Upstream or server error

#### cURL

```bash
curl -s -X POST http://localhost:3000/api/generate-image \
  -F 'prompt=Make this photo look like a watercolor painting' \
  -F 'image=@/path/to/photo.png'
```

### POST `/api/enhance-image`

Enhance image quality using AI-powered face restoration via Replicate's CodeFormer.

- **Content-Type**: `multipart/form-data`
- **Body fields**:
  - `image` (file, required) - Image to enhance
  - `fidelity` (string, optional) - Enhancement fidelity (0.1-1.0, default: 0.7)
  - `upscale` (string, optional) - Upscale factor (1-4, default: 2)
  - `customApiKey` (string, optional) - Custom Replicate API key

#### Response 200

```json
{
  "success": true,
  "enhancedImage": {
    "data": "<base64>",
    "mimeType": "image/png"
  },
  "originalImageUrl": "https://..."
}
```

#### Errors

- `400` — Missing `image` or invalid API key
- `408` — Enhancement timeout (> 5 minutes)
- `500` — Upstream or server error

---

## Project structure

```text
app/
  api/generate-image/route.ts    # Gemini streaming route, cost calculation
  api/enhance-image/route.ts     # Replicate CodeFormer enhancement
  components/ChatInterface.tsx   # Chat UI, uploads, cost modal
  components/EditorView.tsx      # Canvas, zoom, download
  components/ImagePreviewModal.tsx # Image preview with enhancement
  components/SettingsModal.tsx   # API key management
  page.tsx                       # Layout wiring with Mantine AppShell
public/
  logo.svg
```

---

## Scripts

- `pnpm dev` — start dev server
- `pnpm build` — build for production
- `pnpm start` — start production server

---

## Security notes

- Keep `GEMINI_API_KEY` and `REPLICATE_API_TOKEN` on the server (`.env.local`); never expose them in client bundles.
- Requests to Gemini and Replicate are proxied via Next.js routes; clients never call these APIs directly.
- Custom API keys are stored locally in browser cookies and sent to server endpoints.

---

## Deploy

- One-click deploy on Vercel. Ensure `GEMINI_API_KEY` and optionally `REPLICATE_API_TOKEN` are set in project environment variables.

---

## Contributing

Issues and pull requests are welcome. Please open an issue to discuss substantial changes.

---

## Acknowledgements

- Next.js App Router
- Mantine UI
- Google Gemini API
