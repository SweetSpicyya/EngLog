# EngLog — Your Daily English Diary ✍️

A English diary app with AI-powered writing corrections. Write in broken English, and get it polished by your AI with correction notes explaining what changed and why.

---

## Features

- **AI Correction** — paste or type your entry, get back a corrected version with annotated notes
- **Speech-to-Text** — dictate your entry with auto-punctuation via the browser's Web Speech API
- **Google Drive Sync** — entries are saved directly to your Google Drive as JSON files
- **Multi-Provider AI** — supports Gemini, Claude, GPT-4o, and Grok (bring your own API key)
- **PWA** — installable on mobile and desktop, works offline for viewing past entries (**Working on**)

---

## Tech Stack

- React + TypeScript + Vite
- No backend — all API calls are made directly from the browser
- Google Drive REST API (via OAuth 2.0 PKCE flow)

---

## Getting Started

EngLog is designed to be self-hosted. Each person runs their own instance via GitHub Pages with their own API keys. 
There's no shared backend.

### Step 1 — Fork the repo

Click **Fork** at the top right of this page to create your own copy under your GitHub account.


### Step 2 — Enable GitHub Pages

In **your forked repo**:

1. Go to **Settings → Pages**
2. Set Source to **GitHub Actions**
3. Push any commit to `main` to trigger the first deploy

Your app will be live at `https://YOUR_USERNAME.github.io/EngLog/`


### Step 3 — Get your API keys

You'll need:
- An API key from your preferred AI provider (Gemini, Claude, OpenAI, or Grok)
- A Google OAuth Client ID for Drive integration

See the sections below for step-by-step instructions for each.


### Step 4 — Open the app and complete setup

Visit your GitHub Pages URL. The setup screen will prompt you for your API key and Google Client ID. 
These are stored in your browser's `localStorage`. Nothing is sent anywhere except the AI provider you choose.

---

## Local Development (optional)

If you want to run the app locally:

### Prerequisites

- Node.js 18+
- npm 9+

### Install & Run

```bash
# In your forked repo
npm install
npm run dev
```

The app runs at `http://localhost:5173` by default.

> When running locally, make sure `http://localhost:5173` is added to your Google OAuth Client ID's
**Authorized JavaScript origins** (see Google Drive Setup below).

### Build & Preview

```bash
npm run build
npm run preview
```

---

## Configuration (First-Time Setup)

When you open the app for the first time, a setup screen will prompt you for two things:

1. **AI Provider + API Key** — choose your preferred AI and paste your key
2. **Google OAuth Client ID** — for Drive integration

These are stored in `localStorage`. Nothing is sent to any server other than the AI provider you choose.

---

## API Key Setup by Provider

AI Model versions are subject to change depending on the circumstances.
Always check the model.

### Gemini ✅ (fully tested)

1. Go to [https://aistudio.google.com/app/apikey](https://aistudio.google.com/app/apikey)
2. Click **Create API key**
3. Copy the key —> it starts with `AIza...`
4. Paste it into the setup screen under **Gemini**

> **Model used:** `gemini-3-flash-preview`

---

### Claude (Anthropic)

1. Go to [https://console.anthropic.com/](https://console.anthropic.com/)
2. Navigate to **API Keys** and click **Create Key**
3. Copy the key — it starts with `sk-ant-...`
4. Paste it into the setup screen under **Claude**

> **Model used:** `claude-sonnet-4-20250514`

> **Note:** The app uses the `anthropic-dangerous-direct-browser-access: true` header to allow direct browser requests. This is intentional for a client-only PWA — just be aware your key is stored in `localStorage`.

---

### OpenAI (GPT-4o)

1. Go to [https://platform.openai.com/api-keys](https://platform.openai.com/api-keys)
2. Click **Create new secret key**
3. Copy the key — it starts with `sk-...`
4. Paste it into the setup screen under **GPT-4o**

> **Model used:** `gpt-4o`

> **Note:** Make sure your account has GPT-4o access (requires billing setup).

---

### Grok (xAI)

1. Go to [https://console.x.ai/](https://console.x.ai/)
2. Create or copy an API key — it starts with `xai-...`
3. Paste it into the setup screen under **Grok**

> **Model used:** `grok-3-latest`

---

## Google Drive Setup (OAuth Client ID)

The app saves diary entries to your Google Drive. You need to create an OAuth 2.0 Client ID in Google Cloud Console.

### Steps

1. Go to [https://console.cloud.google.com/](https://console.cloud.google.com/)
2. Create a new project (or select an existing one)
3. Navigate to **APIs & Services → Library**
4. Search for **Google Drive API** and click **Enable**
5. Navigate to **APIs & Services → Credentials**
6. Click **Create Credentials → OAuth 2.0 Client ID**
7. Set Application type to **Web application**
8. Add your domain to **Authorized JavaScript origins**:
   - For local dev: `http://localhost:5173`
   - For GitHub Pages: `https://YOUR_USERNAME.github.io`
9. Click **Create** and copy the Client ID — it ends with `.apps.googleusercontent.com`
10. Paste it into the setup screen under **Google OAuth Client ID**

> If you see a "redirect_uri_mismatch" error, double-check that your current URL is listed under Authorized JavaScript origins.

---

## Adding a New AI Provider

At present, only Gemini is supported. 
If you intend to use other AI providers, please review the documentation below and proceed with testing.

The AI layer is intentionally modular. Adding a new provider takes 3 steps:

### Step 1 — Add the provider type

In `src/types/index.ts`, add your provider to the union type and the `PROVIDERS` map:

```ts
// Before
export type AIProvider = 'claude' | 'openai' | 'gemini' | 'grok';

// After
export type AIProvider = 'claude' | 'openai' | 'gemini' | 'grok' | 'YOUR_PROVIDER';

export const PROVIDERS: Record<AIProvider, { label: string }> = {
  // ...existing providers
  YOUR_PROVIDER: { label: 'Your Provider Name' },
};
```

### Step 2 — Create the service file

Create `src/services/ai/yourprovider.ts`. Every provider file must export two functions with this exact signature:

```ts
// src/services/ai/yourprovider.ts

/**
 * Validates the API key. Called during setup to give the user instant feedback.
 * Return true if the key works, false otherwise.
 */
export async function checkYourProvider(apiKey: string): Promise<boolean> {
  const res = await fetch('https://api.yourprovider.com/v1/models', {
    headers: { Authorization: 'Bearer ' + apiKey },
  });
  return res.ok;
}

/**
 * Sends a prompt to the model and returns the raw text response.
 * @param system - The system prompt (defines the AI's role/behavior)
 * @param user   - The user's diary entry to be corrected
 */
export async function callYourProvider(
  apiKey: string,
  system: string,
  user: string
): Promise<string> {
  const res = await fetch('https://api.yourprovider.com/v1/chat/completions', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      Authorization: 'Bearer ' + apiKey,
    },
    body: JSON.stringify({
      model: 'your-model-id',
      max_tokens: 1000,
      messages: [
        { role: 'system', content: system },
        { role: 'user', content: user },
      ],
    }),
  });
  const data = await res.json();
  if (data.error) throw new Error(data.error.message);
  return data.choices[0].message.content;
}
```

> The system and user prompts are already defined in `src/services/ai/index.ts` as `FIX_SYSTEM` and `PUNCTUATE_SYSTEM`. Your function just needs to forward them correctly.

### Step 3 — Register the provider in the router

In `src/services/ai/index.ts`, import and wire up your new functions:

```ts
import { callYourProvider, checkYourProvider } from './yourprovider';

export async function checkAI(provider: AIProvider, apiKey: string): Promise<boolean> {
  switch (provider) {
    // ...existing cases
    case 'YOUR_PROVIDER': return checkYourProvider(apiKey);
    default: throw new Error('Unknown provider: ' + provider);
  }
}

export async function callAI(...): Promise<string> {
  switch (provider) {
    // ...existing cases
    case 'YOUR_PROVIDER': return callYourProvider(apiKey, system, user);
    default: throw new Error('Unknown provider: ' + provider);
  }
}
```

### Step 4 — Add the setup screen hint (optional but recommended)

In `src/components/Setup/Setup.tsx`, add an entry to `PROVIDER_HINTS` so users see the right placeholder and link:

```ts
const PROVIDER_HINTS: Record<AIProvider, ...> = {
  // ...existing hints
  YOUR_PROVIDER: {
    placeholder: 'your-key-prefix...',
    link: 'https://yourprovider.com/api-keys',
    linkLabel: 'yourprovider.com',
  },
};
```

That's it — the UI will automatically render the new option in the provider dropdown.

---

## Deployment (GitHub Pages)

The repo includes a GitHub Actions workflow at `.github/workflows/deploy.yml` that auto-deploys on every push to `main`. No additional configuration needed — just fork and enable Pages as described in [Getting Started](#getting-started).

> The `base` in `vite.config.ts` is set to `/EngLog/`. If you rename your forked repo, update this value to match: `base: '/YOUR_REPO_NAME/'`

---

## Project Structure

```
src/
├── components/
│   ├── Setup/          # First-time config screen
│   ├── Editor/         # Main diary writing area
│   ├── CorrectionPanel/# AI correction results + notes
│   ├── Sidebar/        # Entry history navigation
│   └── MobileBar/      # Bottom nav for mobile
├── services/
│   ├── ai/
│   │   ├── index.ts    # Router + system prompts
│   │   ├── gemini.ts
│   │   ├── claude.ts
│   │   ├── openai.ts
│   │   └── grok.ts
│   └── drive.ts        # Google Drive read/write
├── hooks/
│   ├── useAI.ts
│   ├── useDrive.ts
│   └── useVoice.ts
└── types/
    └── index.ts        # AIProvider type, PROVIDERS map, shared interfaces
```

---

## License

MIT
