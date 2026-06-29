import express from "express";
import path from "path";
import dotenv from "dotenv";
import { createServer as createViteServer } from "vite";
import { GoogleGenAI } from "@google/genai";
import {
  buildPrompt,
  buildThreatPrompt,
  parseModelResponse,
  parseThreatAssessment,
  type ActionType,
  type UserContext,
} from "./src/server/imbonix-core";

dotenv.config();

const app = express();
const PORT = 3000;

// Increase JSON size limits to handle image uploads
app.use(express.json({ limit: "50mb" }));
app.use(express.urlencoded({ limit: "50mb", extended: true }));

// ───────────────────────── Provider helpers ─────────────────────────
// ImboniX multi-API strategy: Gemini is PRIMARY for vision; Claude and
// OpenAI GPT-4o act as automatic fallbacks. Each helper returns raw model
// text or throws so the caller can fall through the chain.

const geminiKey = (k?: string) => k || process.env.GEMINI_API_KEY || "";
const claudeKey = (k?: string) => k || process.env.ANTHROPIC_API_KEY || "";
const openaiKey = (k?: string) => k || process.env.OPENAI_API_KEY || "";

const isUsable = (k: string) =>
  !!k && k !== "MY_GEMINI_API_KEY" && k !== "MY_ANTHROPIC_API_KEY" && k.trim() !== "";

async function callGemini(prompt: string, image: string | null, key: string): Promise<string> {
  const ai = new GoogleGenAI({
    apiKey: key,
    httpOptions: { headers: { "User-Agent": "aistudio-build" } },
  });
  const parts: any[] = [];
  if (image) parts.push({ inlineData: { mimeType: "image/png", data: image } });
  parts.push({ text: prompt });
  const response = await ai.models.generateContent({
    model: process.env.GEMINI_MODEL || "gemini-2.0-flash",
    contents: { parts },
  });
  const text = response.text;
  if (!text) throw new Error("Gemini returned empty response");
  return text;
}

async function callClaude(prompt: string, image: string | null, key: string): Promise<string> {
  const content: any[] = [];
  if (image) {
    content.push({
      type: "image",
      source: { type: "base64", media_type: "image/png", data: image },
    });
  }
  content.push({ type: "text", text: prompt });
  const res = await fetch("https://api.anthropic.com/v1/messages", {
    method: "POST",
    headers: {
      "x-api-key": key,
      "anthropic-version": "2023-06-01",
      "content-type": "application/json",
    },
    body: JSON.stringify({
      model: process.env.CLAUDE_MODEL || "claude-3-5-sonnet-latest",
      max_tokens: 1024,
      messages: [{ role: "user", content }],
    }),
  });
  if (!res.ok) throw new Error(`Anthropic ${res.status}: ${await res.text()}`);
  const data: any = await res.json();
  const text = data?.content?.[0]?.text;
  if (!text) throw new Error("Claude returned empty response");
  return text;
}

async function callOpenAIVision(prompt: string, image: string | null, key: string): Promise<string> {
  const content: any[] = [{ type: "text", text: prompt }];
  if (image) {
    content.push({
      type: "image_url",
      image_url: { url: `data:image/png;base64,${image}` },
    });
  }
  const res = await fetch("https://api.openai.com/v1/chat/completions", {
    method: "POST",
    headers: { Authorization: `Bearer ${key}`, "Content-Type": "application/json" },
    body: JSON.stringify({
      model: process.env.OPENAI_MODEL || "gpt-4o",
      max_tokens: 1024,
      messages: [{ role: "user", content }],
    }),
  });
  if (!res.ok) throw new Error(`OpenAI ${res.status}: ${await res.text()}`);
  const data: any = await res.json();
  const text = data?.choices?.[0]?.message?.content;
  if (!text) throw new Error("OpenAI returned empty response");
  return text;
}

/**
 * Run a prompt through the provider fallback chain. `order` lists provider
 * names to try in sequence; the first that succeeds wins. Returns the raw
 * text plus which provider produced it.
 */
async function runChain(
  order: Array<"gemini" | "claude" | "openai">,
  prompt: string,
  image: string | null,
  keys: { gemini: string; claude: string; openai: string }
): Promise<{ text: string; provider: string }> {
  const errors: string[] = [];
  for (const name of order) {
    try {
      if (name === "gemini" && isUsable(keys.gemini)) {
        return { text: await callGemini(prompt, image, keys.gemini), provider: "gemini" };
      }
      if (name === "claude" && isUsable(keys.claude)) {
        return { text: await callClaude(prompt, image, keys.claude), provider: "claude" };
      }
      if (name === "openai" && isUsable(keys.openai)) {
        return { text: await callOpenAIVision(prompt, image, keys.openai), provider: "openai" };
      }
    } catch (e: any) {
      const msg = `${name}: ${e?.message || e}`;
      console.warn("[ImboniX] provider failed, falling back —", msg);
      errors.push(msg);
    }
  }
  throw new Error(
    errors.length
      ? `All providers failed. ${errors.join(" | ")}`
      : "No AI provider is configured. Add a Gemini, Claude, or OpenAI key in ImboniX settings."
  );
}

// ImboniX vision/analysis endpoint — multi-API with automatic fallback.
//   Vision actions:       Gemini → Claude → OpenAI
//   Conversation actions: Claude → OpenAI → Gemini
app.post("/api/analyze", async (req, res) => {
  try {
    const {
      image,
      prompt: clientPrompt,
      action,
      context,
      extraInstruction,
      clientApiKey,
      provider,
      clientClaudeApiKey,
      clientOpenaiApiKey,
    } = req.body;

    // Build the ImboniX prompt server-side from the requested action + user
    // context. Fall back to a raw client-supplied prompt for compatibility.
    let prompt: string = clientPrompt;
    if (action) {
      const ctx: UserContext = context || {};
      prompt = buildPrompt(action as ActionType, ctx, extraInstruction);
    }
    if (!prompt) {
      return res.status(400).json({ error: "Missing prompt or action" });
    }

    const keys = {
      gemini: geminiKey(clientApiKey),
      claude: claudeKey(clientClaudeApiKey),
      openai: openaiKey(clientOpenaiApiKey),
    };

    // Conversation/reasoning prefers Claude; vision prefers Gemini.
    const isConversation = action === "CONVERSATION";
    let order: Array<"gemini" | "claude" | "openai">;
    if (isConversation) {
      order = ["claude", "openai", "gemini"];
    } else {
      order = ["gemini", "claude", "openai"];
    }
    // If the user explicitly forced a provider, try it first.
    if (provider === "claude") order = ["claude", "gemini", "openai"];
    if (provider === "gemini") order = ["gemini", "claude", "openai"];
    if (provider === "openai") order = ["openai", "gemini", "claude"];

    if (!isUsable(keys.gemini) && !isUsable(keys.claude) && !isUsable(keys.openai)) {
      return res.status(400).json({
        error: "NO_API_KEY",
        message: "No AI engine key is available. Add a Gemini, Claude, or OpenAI key in ImboniX settings.",
      });
    }

    const { text, provider: used } = await runChain(order, prompt, image || null, keys);
    const structured = parseModelResponse(text);
    return res.json({ result: structured.response, structured, provider: used });
  } catch (error: any) {
    console.error("ImboniX /api/analyze error:", error);
    return res.status(500).json({
      error: "API_ERROR",
      message: error?.message || "An unexpected error occurred during image analysis.",
    });
  }
});

// ImboniX threat-assessment endpoint — Layer 2. Takes a vision description and
// asks Claude (preferred for reasoning) to decide threat level + action.
app.post("/api/threat", async (req, res) => {
  try {
    const { visionText, clientClaudeApiKey, clientApiKey, clientOpenaiApiKey } = req.body;
    if (!visionText) return res.status(400).json({ error: "Missing visionText" });

    const keys = {
      gemini: geminiKey(clientApiKey),
      claude: claudeKey(clientClaudeApiKey),
      openai: openaiKey(clientOpenaiApiKey),
    };
    if (!isUsable(keys.gemini) && !isUsable(keys.claude) && !isUsable(keys.openai)) {
      return res.status(400).json({ error: "NO_API_KEY", message: "No AI engine key available." });
    }

    const prompt = buildThreatPrompt(visionText);
    // Claude is most reliable for safety decisions; fall back if unavailable.
    const { text, provider } = await runChain(["claude", "openai", "gemini"], prompt, null, keys);
    const assessment = parseThreatAssessment(text);
    return res.json({ assessment, provider });
  } catch (error: any) {
    console.error("ImboniX /api/threat error:", error);
    return res.status(500).json({ error: "THREAT_ERROR", message: error?.message || "Threat assessment failed." });
  }
});

// ImboniX speech-to-text endpoint — OpenAI Whisper. Receives raw audio bytes
// (audio/webm) and returns the transcript. Front-end falls back to the Web
// Speech API when this is unavailable (no OpenAI key, or request fails).
app.post("/api/transcribe", express.raw({ type: "*/*", limit: "25mb" }), async (req, res) => {
  try {
    const key = openaiKey(req.query.key as string | undefined);
    if (!isUsable(key)) {
      return res.status(400).json({ error: "NO_OPENAI_KEY", message: "OpenAI key not configured for Whisper." });
    }
    const audio = req.body as Buffer;
    if (!audio || !audio.length) {
      return res.status(400).json({ error: "Missing audio data" });
    }
    const form = new FormData();
    form.append("file", new Blob([audio], { type: "audio/webm" }), "audio.webm");
    form.append("model", "whisper-1");
    form.append("language", "en");
    form.append("response_format", "json");

    const r = await fetch("https://api.openai.com/v1/audio/transcriptions", {
      method: "POST",
      headers: { Authorization: `Bearer ${key}` },
      body: form,
    });
    if (!r.ok) throw new Error(`Whisper ${r.status}: ${await r.text()}`);
    const data: any = await r.json();
    return res.json({ text: (data.text || "").trim() });
  } catch (error: any) {
    console.error("ImboniX /api/transcribe error:", error);
    return res.status(500).json({ error: "WHISPER_ERROR", message: error?.message || "Transcription failed." });
  }
});

// ImboniX API status — reports which engines are configured (server-side env
// or per-request client keys), so the settings panel can show live dots.
app.post("/api/status", (req, res) => {
  const { clientApiKey, clientClaudeApiKey, clientOpenaiApiKey } = req.body || {};
  res.json({
    gemini: isUsable(geminiKey(clientApiKey)),
    claude: isUsable(claudeKey(clientClaudeApiKey)),
    openai: isUsable(openaiKey(clientOpenaiApiKey)),
  });
});

// ImboniX emergency SMS proxy — relays to AfricasTalking server-side to
// avoid browser CORS and to keep credentials off the wire where possible.
app.post("/api/sms", async (req, res) => {
  try {
    const { to, message, apiKey, username, sandbox } = req.body;
    const activeKey = apiKey || process.env.AFRICASTALKING_API_KEY;
    const activeUser = username || process.env.AFRICASTALKING_USERNAME || "sandbox";

    if (!to || !message) {
      return res.status(400).json({ error: "Missing recipient or message" });
    }
    if (!activeKey) {
      return res.status(400).json({
        error: "NO_AT_CREDENTIALS",
        message: "AfricasTalking not configured. Add your API key in ImboniX settings.",
      });
    }

    const endpoint = sandbox
      ? "https://api.sandbox.africastalking.com/version1/messaging"
      : "https://api.africastalking.com/version1/messaging";

    const atResponse = await fetch(endpoint, {
      method: "POST",
      headers: {
        apiKey: activeKey,
        "Content-Type": "application/x-www-form-urlencoded",
        Accept: "application/json",
      },
      body: new URLSearchParams({
        username: activeUser,
        to,
        message,
        from: "ImboniX",
      }),
    });

    const text = await atResponse.text();
    let data: any;
    try {
      data = JSON.parse(text);
    } catch {
      data = { raw: text };
    }

    if (!atResponse.ok) {
      return res.status(502).json({ error: "AT_ERROR", message: text });
    }
    return res.json({ success: true, data });
  } catch (error: any) {
    console.error("Error sending ImboniX emergency SMS:", error);
    return res.status(500).json({ error: "SMS_ERROR", message: error?.message || "SMS failed" });
  }
});

// Setup Vite Dev Server / Static Asset serving
const startServer = async () => {
  if (process.env.NODE_ENV !== "production") {
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: "spa",
    });
    app.use(vite.middlewares);
  } else {
    const distPath = path.join(process.cwd(), "dist");
    app.use(express.static(distPath));
    app.get("*", (req, res) => {
      res.sendFile(path.join(distPath, "index.html"));
    });
  }

  app.listen(PORT, "0.0.0.0", () => {
    console.log(`ImboniX Server running at http://0.0.0.0:${PORT}`);
  });
};

startServer().catch((err) => {
  console.error("Failed to start server:", err);
});
