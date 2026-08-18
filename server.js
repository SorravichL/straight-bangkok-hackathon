import express from "express";
import compression from "compression";
import { Readable } from "node:stream";

/**
 * strAIght Up starter — OpenAI + ElevenLabs.
 *
 * Sections in this file:
 *   1. Config          — every knob lives in env vars, nothing hardcoded per-idea
 *   2. Helpers         — timeouts, error shaping, stream piping
 *   3. /api/health     — are the keys present? (no network, instant)
 *   4. /api/models     — what can this key ACTUALLY use? (live, day-of sanity check)
 *   5. /api/chat       — text in → text out. Streams by default, JSON on demand
 *   6. /api/speak      — text in → mp3 out (ElevenLabs, streamed)
 *   7. /api/listen     — audio in → text out (speech to text)
 *   8. /api/vision     — image + question → text out
 *   9. /api/moderate   — content safety classification
 *
 * Add a new capability by copying the shape of any route below: read body,
 * call `callJSON`, return. Keep it in this file — one file is easier to hand
 * to an AI coding tool and say "add X" without it losing track of the project.
 */

// ---------------------------------------------------------------- 1. config
const OPENAI_KEY = process.env.OPENAI_API_KEY;
const ELEVEN_KEY = process.env.ELEVENLABS_API_KEY;

// NOTE: verify these model names on the morning of the event via GET /api/models.
// Model lineups change; that endpoint reports what your key can really call.
const MODEL = process.env.OPENAI_MODEL || "gpt-4o-mini";
const VISION_MODEL = process.env.OPENAI_VISION_MODEL || MODEL;
const STT_MODEL = process.env.OPENAI_STT_MODEL || "whisper-1";
const MODERATION_MODEL = process.env.OPENAI_MODERATION_MODEL || "omni-moderation-latest";
const VOICE_ID = process.env.ELEVENLABS_VOICE_ID || "21m00Tcm4TlvDq8ikWAM";
const TTS_MODEL = process.env.ELEVENLABS_MODEL || "eleven_multilingual_v2";

// Override to point at a proxy, a regional endpoint, or a local mock.
const OPENAI_BASE = process.env.OPENAI_BASE_URL || "https://api.openai.com/v1";
const ELEVEN_BASE = process.env.ELEVENLABS_BASE_URL || "https://api.elevenlabs.io/v1";

const TIMEOUT_MS = Number(process.env.REQUEST_TIMEOUT_MS || 60_000);
const IS_PROD = process.env.NODE_ENV === "production";

const app = express();
app.disable("x-powered-by");

// Compress static assets only. Compressing a stream buffers it, which is the
// opposite of what we want for live tokens and audio.
app.use(compression({ filter: (req, res) => !req.path.startsWith("/api/") && compression.filter(req, res) }));

// No caching while building — a stale index.html mid-hackathon costs more time
// than the bytes ever save. Real caching only once deployed.
app.use(express.static("public", IS_PROD ? { maxAge: "1h", etag: true } : { etag: false, maxAge: 0 }));

app.use(express.json({ limit: "25mb" }));

// --------------------------------------------------------------- 2. helpers

/** Every upstream call gets a deadline, so one hung API can't freeze a demo. */
function withTimeout() {
  return AbortSignal.timeout(TIMEOUT_MS);
}

const openaiHeaders = () => ({
  "Content-Type": "application/json",
  Authorization: `Bearer ${OPENAI_KEY}`,
});

/** Guard clause for routes that need a given key. Returns true if it responded. */
function missingKey(res, key, name) {
  if (key) return false;
  res.status(500).json({ error: `${name} has not been configured in Secrets.` });
  return true;
}

/**
 * POST JSON to a provider and return the parsed body.
 * Throws an object carrying the upstream status + detail so routes can relay it.
 */
async function callJSON(url, { headers, body }) {
  const r = await fetch(url, {
    method: "POST",
    headers,
    body: JSON.stringify(body),
    signal: withTimeout(),
  });
  if (!r.ok) throw { status: r.status, detail: await r.text() };
  return r.json();
}

/** Turn any thrown value into a clean HTTP response. */
function fail(res, err, label) {
  if (res.headersSent) return res.end();
  const status = err?.status ?? (err?.name === "TimeoutError" ? 504 : 500);
  const detail = err?.detail ?? String(err?.message || err);
  res.status(status).json({ error: label, detail });
}

/** Pipe an upstream fetch body to the client, cancelling upstream if they leave. */
function pipeStream(upstream, req, res) {
  const node = Readable.fromWeb(upstream.body);
  node.on("error", () => res.end());
  req.on("close", () => {
    node.destroy();
    upstream.body.cancel?.().catch(() => {});
  });
  node.pipe(res);
}

// ---------------------------------------------------------------- 3. health
// Instant, no network: use this to confirm Secrets landed before you demo.
app.get("/api/health", (_req, res) => {
  res.json({
    ok: true,
    openai: Boolean(OPENAI_KEY),
    elevenlabs: Boolean(ELEVEN_KEY),
    models: { chat: MODEL, vision: VISION_MODEL, stt: STT_MODEL, moderation: MODERATION_MODEL },
    voice: { id: VOICE_ID, model: TTS_MODEL },
  });
});

// ---------------------------------------------------------------- 4. models
// Day-of insurance. Asks OpenAI which models THIS key can call, and tells you
// whether your configured OPENAI_MODEL is among them — no guessing from docs.
app.get("/api/models", async (_req, res) => {
  if (missingKey(res, OPENAI_KEY, "OPENAI_API_KEY")) return;
  try {
    const r = await fetch(`${OPENAI_BASE}/models`, {
      headers: openaiHeaders(),
      signal: withTimeout(),
    });
    if (!r.ok) throw { status: r.status, detail: await r.text() };
    const data = await r.json();
    const ids = (data.data ?? []).map((m) => m.id).sort();
    res.json({
      configured: MODEL,
      configuredAvailable: ids.includes(MODEL),
      count: ids.length,
      chatModels: ids.filter((id) => /^(gpt|o\d|chatgpt)/.test(id)),
      all: ids,
    });
  } catch (err) {
    fail(res, err, "Failed to list OpenAI models.");
  }
});

// ------------------------------------------------------------------ 5. chat
/**
 * Body: {
 *   message?, messages?, system?, model?, temperature?,
 *   stream?  — default true (Server-Sent Events); false returns plain JSON
 *   json?    — true forces a valid-JSON reply (great for classify/extract)
 * }
 */
app.post("/api/chat", async (req, res) => {
  if (missingKey(res, OPENAI_KEY, "OPENAI_API_KEY")) return;

  const { message, messages, system, model, temperature, json, stream = true } = req.body ?? {};
  if (!message && !Array.isArray(messages)) {
    return res.status(400).json({ error: "Provide either 'message' or a 'messages' array." });
  }

  // `messages` (full history) wins; `message` is the one-shot convenience form.
  const history = Array.isArray(messages) ? messages : [{ role: "user", content: message }];
  const payload = {
    model: model || MODEL,
    messages: [
      {
        role: "system",
        content:
          system ||
          "Respond briefly and clearly in the same language as the user, using no more than three sentences.",
      },
      ...history,
    ],
    stream: Boolean(stream),
  };
  if (temperature != null) payload.temperature = temperature;
  if (json) payload.response_format = { type: "json_object" };

  try {
    if (!stream) {
      const data = await callJSON(`${OPENAI_BASE}/chat/completions`, {
        headers: openaiHeaders(),
        body: payload,
      });
      const reply = data.choices?.[0]?.message?.content ?? "";
      return res.json({ reply, usage: data.usage, model: data.model });
    }

    const upstream = await fetch(`${OPENAI_BASE}/chat/completions`, {
      method: "POST",
      headers: openaiHeaders(),
      body: JSON.stringify(payload),
      signal: withTimeout(),
    });
    if (!upstream.ok) throw { status: upstream.status, detail: await upstream.text() };

    // Raw OpenAI SSE is relayed as-is; the browser parses `data:` lines.
    res.set({ "Content-Type": "text/event-stream", "Cache-Control": "no-cache", Connection: "keep-alive" });
    res.flushHeaders();
    pipeStream(upstream, req, res);
  } catch (err) {
    fail(res, err, "Failed to call OpenAI.");
  }
});

// ----------------------------------------------------------------- 6. speak
// Body: { text, voiceId?, model? } → streamed audio/mpeg
app.post("/api/speak", async (req, res) => {
  if (missingKey(res, ELEVEN_KEY, "ELEVENLABS_API_KEY")) return;

  const { text, voiceId, model } = req.body ?? {};
  if (!text) return res.status(400).json({ error: "The 'text' field is required." });

  try {
    const upstream = await fetch(
      `${ELEVEN_BASE}/text-to-speech/${voiceId || VOICE_ID}/stream?output_format=mp3_44100_128`,
      {
        method: "POST",
        headers: { "Content-Type": "application/json", "xi-api-key": ELEVEN_KEY },
        body: JSON.stringify({ text, model_id: model || TTS_MODEL }),
        signal: withTimeout(),
      }
    );
    if (!upstream.ok) throw { status: upstream.status, detail: await upstream.text() };

    res.set("Content-Type", "audio/mpeg");
    pipeStream(upstream, req, res);
  } catch (err) {
    fail(res, err, "Failed to call ElevenLabs.");
  }
});

// ---------------------------------------------------------------- 7. listen
// Raw audio bytes in (Content-Type: audio/*) → { text }.
// Pairs with MediaRecorder in the browser: POST the Blob directly.
app.post("/api/listen", express.raw({ type: ["audio/*", "video/webm"], limit: "25mb" }), async (req, res) => {
  if (missingKey(res, OPENAI_KEY, "OPENAI_API_KEY")) return;
  if (!req.body?.length) return res.status(400).json({ error: "Send raw audio bytes with an audio/* Content-Type." });

  try {
    const ext = (req.headers["content-type"] || "audio/webm").split("/")[1].split(";")[0];
    const form = new FormData();
    form.append("file", new Blob([req.body]), `audio.${ext}`);
    form.append("model", req.query.model || STT_MODEL);
    if (req.query.language) form.append("language", req.query.language);

    const r = await fetch(`${OPENAI_BASE}/audio/transcriptions`, {
      method: "POST",
      headers: { Authorization: `Bearer ${OPENAI_KEY}` }, // no Content-Type: FormData sets its own boundary
      body: form,
      signal: withTimeout(),
    });
    if (!r.ok) throw { status: r.status, detail: await r.text() };
    res.json(await r.json());
  } catch (err) {
    fail(res, err, "Failed to transcribe audio.");
  }
});

// ---------------------------------------------------------------- 8. vision
// Body: { image, prompt?, model? } where image is an https URL or a data: URL.
app.post("/api/vision", async (req, res) => {
  if (missingKey(res, OPENAI_KEY, "OPENAI_API_KEY")) return;

  const { image, prompt, model } = req.body ?? {};
  if (!image) return res.status(400).json({ error: "The 'image' field is required (https:// or data: URL)." });

  try {
    const data = await callJSON(`${OPENAI_BASE}/chat/completions`, {
      headers: openaiHeaders(),
      body: {
        model: model || VISION_MODEL,
        messages: [
          {
            role: "user",
            content: [
              { type: "text", text: prompt || "Describe this image in two sentences." },
              { type: "image_url", image_url: { url: image } },
            ],
          },
        ],
      },
    });
    res.json({ reply: data.choices?.[0]?.message?.content ?? "", usage: data.usage });
  } catch (err) {
    fail(res, err, "Failed to analyse image.");
  }
});

// -------------------------------------------------------------- 9. moderate
// Body: { input } → safety categories/scores. Useful for a trust & safety brief.
app.post("/api/moderate", async (req, res) => {
  if (missingKey(res, OPENAI_KEY, "OPENAI_API_KEY")) return;

  const { input, model } = req.body ?? {};
  if (!input) return res.status(400).json({ error: "The 'input' field is required." });

  try {
    const data = await callJSON(`${OPENAI_BASE}/moderations`, {
      headers: openaiHeaders(),
      body: { model: model || MODERATION_MODEL, input },
    });
    const result = data.results?.[0] ?? {};
    res.json({
      flagged: result.flagged ?? false,
      categories: Object.entries(result.categories ?? {})
        .filter(([, hit]) => hit)
        .map(([name]) => name),
      scores: result.category_scores,
    });
  } catch (err) {
    fail(res, err, "Failed to moderate content.");
  }
});

const PORT = process.env.PORT || 3000;
app.listen(PORT, "0.0.0.0", () => {
  console.log(`listening on ${PORT}`);
  if (!OPENAI_KEY) console.warn("!! OPENAI_API_KEY is not set");
  if (!ELEVEN_KEY) console.warn("!! ELEVENLABS_API_KEY is not set");
});
