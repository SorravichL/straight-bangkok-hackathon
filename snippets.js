/* ============================================================
   REFERENCE SNIPPETS — strAIght up! Bangkok, 29 Aug 2026
   ============================================================

   DO NOT COMMIT THIS FILE INTO YOUR REPLIT PROJECT.

   Keep it open in a separate tab. When you need one thing,
   copy THAT ONE FUNCTION into the agent chat and say:

     "Use exactly this function, don't rewrite it: <paste>"

   Every function below is standalone. No imports, no shared
   state, no file structure. Nothing here tells the agent how
   to build your app, so nothing here can fight it.

   Node 18+ has fetch() built in. No npm install needed.
   Keys live in Replit Secrets. Server-side only — never ship
   a key to the browser.

   Verified against live docs 18 Aug 2026. Re-check model IDs
   on the morning: developers.openai.com/api/docs/models
   ============================================================ */


/* ------------------------------------------------------------
   1. OPENAI — plain text in, text out
   POST https://api.openai.com/v1/responses
   Models: gpt-5.6-terra (default choice), gpt-5.6-sol (smarter,
   slower, pricier), gpt-5.6-luna (fastest, cheapest)
   ------------------------------------------------------------ */
async function askOpenAI(prompt) {
  const res = await fetch("https://api.openai.com/v1/responses", {
    method: "POST",
    headers: {
      "Authorization": `Bearer ${process.env.OPENAI_API_KEY}`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify({
      model: "gpt-5.6-terra",
      input: prompt,
    }),
  });

  if (!res.ok) throw new Error(`OpenAI ${res.status}: ${await res.text()}`);
  return extractText(await res.json());
}

/* The response contains an `output` array that may include
   reasoning items before the actual message, so don't grab
   output[0]. Find the message item. */
function extractText(data) {
  if (typeof data.output_text === "string") return data.output_text;
  for (const item of data.output || []) {
    if (item.type !== "message") continue;
    for (const part of item.content || []) {
      if (part.type === "output_text") return part.text;
    }
  }
  return "";
}


/* ------------------------------------------------------------
   2. OPENAI — Structured Outputs (guaranteed valid JSON)
   Use this for anything scored, classified, or extracted.
   Kills every JSON-parsing bug you would otherwise hit.

   With strict: true, every property must be listed in
   `required` and additionalProperties must be false.
   ------------------------------------------------------------ */
async function classifyWithSchema(text) {
  const res = await fetch("https://api.openai.com/v1/responses", {
    method: "POST",
    headers: {
      "Authorization": `Bearer ${process.env.OPENAI_API_KEY}`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify({
      model: "gpt-5.6-terra",
      input: [
        { role: "system", content: "You assess whether a message is a scam." },
        { role: "user", content: text },
      ],
      text: {
        format: {
          type: "json_schema",
          name: "assessment",
          strict: true,
          schema: {
            type: "object",
            additionalProperties: false,
            required: ["risk_score", "verdict", "tactics", "advice"],
            properties: {
              risk_score: { type: "integer" },
              verdict: { type: "string", enum: ["Safe", "Suspicious", "Likely scam"] },
              tactics: {
                type: "array",
                items: {
                  type: "object",
                  additionalProperties: false,
                  required: ["name", "explanation"],
                  properties: {
                    name: { type: "string" },
                    explanation: { type: "string" },
                  },
                },
              },
              advice: { type: "string" },
            },
          },
        },
      },
    }),
  });

  if (!res.ok) throw new Error(`OpenAI ${res.status}: ${await res.text()}`);
  return JSON.parse(extractText(await res.json()));
}


/* ------------------------------------------------------------
   3. OPENAI — image input
   All current models take images natively. No separate model,
   no separate endpoint. Pass a data URL or a public https URL.
   ------------------------------------------------------------ */
async function askAboutImage(base64Jpeg, question) {
  const res = await fetch("https://api.openai.com/v1/responses", {
    method: "POST",
    headers: {
      "Authorization": `Bearer ${process.env.OPENAI_API_KEY}`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify({
      model: "gpt-5.6-terra",
      input: [{
        role: "user",
        content: [
          { type: "input_text", text: question },
          { type: "input_image", image_url: `data:image/jpeg;base64,${base64Jpeg}` },
        ],
      }],
    }),
  });

  if (!res.ok) throw new Error(`OpenAI ${res.status}: ${await res.text()}`);
  return extractText(await res.json());
}


/* ------------------------------------------------------------
   4. ELEVENLABS — text to speech
   Header is xi-api-key, NOT Bearer. This is the #1 mistake.
   Returns raw MP3 bytes, not JSON.

   Models: eleven_v3 (most expressive, 70+ languages)
           eleven_flash_v2_5 (~75ms, for realtime)
           eleven_multilingual_v2 (the default if omitted)
   Voice IDs: GET /v1/voices. JBFqnCBsd6RMkjVDRZzb works.
   ------------------------------------------------------------ */
async function textToSpeech(text, voiceId = "JBFqnCBsd6RMkjVDRZzb") {
  const res = await fetch(
    `https://api.elevenlabs.io/v1/text-to-speech/${voiceId}`,
    {
      method: "POST",
      headers: {
        "xi-api-key": process.env.ELEVENLABS_API_KEY,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        text,
        model_id: "eleven_v3",
        output_format: "mp3_44100_128",
      }),
    }
  );

  if (!res.ok) throw new Error(`ElevenLabs ${res.status}: ${await res.text()}`);
  return Buffer.from(await res.arrayBuffer()); // send with Content-Type: audio/mpeg
}


/* ------------------------------------------------------------
   5. ELEVENLABS — speech to text (Scribe v2)
   Multipart form. Field name is `file`.
   diarize: true separates speakers — useful if the brief
   involves calls or conversations.
   Returns JSON; the transcript is in .text
   ------------------------------------------------------------ */
async function speechToText(audioBuffer, filename = "audio.webm") {
  const form = new FormData();
  form.append("file", new Blob([audioBuffer]), filename);
  form.append("model_id", "scribe_v2");
  // form.append("language_code", "th");  // omit to auto-detect
  // form.append("diarize", "true");

  const res = await fetch("https://api.elevenlabs.io/v1/speech-to-text", {
    method: "POST",
    headers: { "xi-api-key": process.env.ELEVENLABS_API_KEY },
    body: form,
  });

  if (!res.ok) throw new Error(`ElevenLabs ${res.status}: ${await res.text()}`);
  return (await res.json()).text;
}


/* ------------------------------------------------------------
   6. BROWSER — record from the microphone
   Runs in the page, not the server. Sends the blob to your
   own endpoint, which then calls snippet 5.
   ------------------------------------------------------------ */
const BROWSER_MIC_RECORDER = `
let recorder, chunks = [];

async function startRecording() {
  const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
  recorder = new MediaRecorder(stream);
  chunks = [];
  recorder.ondataavailable = e => chunks.push(e.data);
  recorder.start();
}

async function stopRecording() {
  return new Promise(resolve => {
    recorder.onstop = async () => {
      const blob = new Blob(chunks, { type: "audio/webm" });
      const form = new FormData();
      form.append("audio", blob, "audio.webm");
      const res = await fetch("/api/transcribe", { method: "POST", body: form });
      resolve((await res.json()).text);
    };
    recorder.stop();
    recorder.stream.getTracks().forEach(t => t.stop());
  });
}
`;


/* ------------------------------------------------------------
   7. BROWSER — play MP3 returned by your server
   Your endpoint responds with audio/mpeg bytes from snippet 4.
   ------------------------------------------------------------ */
const BROWSER_AUDIO_PLAYER = `
async function speak(text) {
  const res = await fetch("/api/speak", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ text }),
  });
  const url = URL.createObjectURL(await res.blob());
  new Audio(url).play();
}
`;
