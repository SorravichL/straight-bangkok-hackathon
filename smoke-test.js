/* ============================================================
   SMOKE TEST — run this the moment you get your credits.

     OPENAI_API_KEY=xxx ELEVENLABS_API_KEY=yyy node smoke-test.js

   Or on Replit: put both in Secrets, then `node smoke-test.js`.

   Takes ~15 seconds. Confirms your keys work, your credits are
   live, and the model IDs are still current. Finding out at
   14:00 that a key is dead costs you the hackathon.

   No dependencies. Node 18+.
   Writes test.mp3 — play it to confirm audio works end to end.
   ============================================================ */

import { writeFileSync } from "node:fs";

const OPENAI = process.env.OPENAI_API_KEY;
const ELEVEN = process.env.ELEVENLABS_API_KEY;

let failures = 0;

function pass(msg) { console.log(`  PASS  ${msg}`); }
function fail(msg) { console.log(`  FAIL  ${msg}`); failures++; }


/* 1. Which OpenAI models can this key actually see?
   Model IDs change fast. Trust this list over any tutorial. */
async function checkOpenAIModels() {
  const res = await fetch("https://api.openai.com/v1/models", {
    headers: { "Authorization": `Bearer ${OPENAI}` },
  });
  if (!res.ok) return fail(`list models — ${res.status} ${await res.text()}`);

  const ids = (await res.json()).data.map(m => m.id);
  const current = ids.filter(id => id.startsWith("gpt-5.6")).sort();
  pass(`key valid, ${ids.length} models visible`);
  console.log(`        gpt-5.6 family: ${current.join(", ") || "none — check docs"}`);
}


/* 2. Text generation. Also proves you have credit. */
async function checkOpenAIText() {
  const res = await fetch("https://api.openai.com/v1/responses", {
    method: "POST",
    headers: {
      "Authorization": `Bearer ${OPENAI}`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify({
      model: "gpt-5.6-terra",
      input: "Reply with exactly one word: working",
    }),
  });
  if (!res.ok) return fail(`text — ${res.status} ${await res.text()}`);

  const data = await res.json();
  let text = data.output_text;
  if (!text) {
    for (const item of data.output || []) {
      if (item.type === "message") {
        text = (item.content || []).find(p => p.type === "output_text")?.text;
      }
    }
  }
  text ? pass(`text — model replied "${text.trim()}"`) : fail("text — empty response");
}


/* 3. Structured Outputs. If this passes, JSON parsing is a
   solved problem for the whole hackathon. */
async function checkStructuredOutput() {
  const res = await fetch("https://api.openai.com/v1/responses", {
    method: "POST",
    headers: {
      "Authorization": `Bearer ${OPENAI}`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify({
      model: "gpt-5.6-terra",
      input: "Rate the risk of this message: 'Your parcel is held at customs, pay 45 THB now.'",
      text: {
        format: {
          type: "json_schema",
          name: "risk",
          strict: true,
          schema: {
            type: "object",
            additionalProperties: false,
            required: ["score", "verdict"],
            properties: {
              score: { type: "integer" },
              verdict: { type: "string" },
            },
          },
        },
      },
    }),
  });
  if (!res.ok) return fail(`structured — ${res.status} ${await res.text()}`);

  const data = await res.json();
  let raw = data.output_text;
  if (!raw) {
    for (const item of data.output || []) {
      if (item.type === "message") {
        raw = (item.content || []).find(p => p.type === "output_text")?.text;
      }
    }
  }
  try {
    const parsed = JSON.parse(raw);
    pass(`structured — score ${parsed.score}, "${parsed.verdict}"`);
  } catch {
    fail(`structured — did not return valid JSON: ${raw}`);
  }
}


/* 4. ElevenLabs auth + voice list.
   Header is xi-api-key. A 401 here usually means you used
   Authorization: Bearer by mistake. */
async function checkElevenVoices() {
  const res = await fetch("https://api.elevenlabs.io/v1/voices", {
    headers: { "xi-api-key": ELEVEN },
  });
  if (!res.ok) return fail(`voices — ${res.status} ${await res.text()}`);

  const voices = (await res.json()).voices || [];
  pass(`key valid, ${voices.length} voices available`);
  voices.slice(0, 3).forEach(v => console.log(`        ${v.voice_id}  ${v.name}`));
}


/* 5. Actual audio. Writes test.mp3 — play it. */
async function checkElevenTTS() {
  const voiceId = "JBFqnCBsd6RMkjVDRZzb";
  const res = await fetch(`https://api.elevenlabs.io/v1/text-to-speech/${voiceId}`, {
    method: "POST",
    headers: {
      "xi-api-key": ELEVEN,
      "Content-Type": "application/json",
    },
    body: JSON.stringify({
      text: "Setup complete. Good luck on Saturday.",
      model_id: "eleven_v3",
      output_format: "mp3_44100_128",
    }),
  });
  if (!res.ok) return fail(`tts — ${res.status} ${await res.text()}`);

  const buf = Buffer.from(await res.arrayBuffer());
  writeFileSync("test.mp3", buf);
  pass(`tts — wrote test.mp3 (${(buf.length / 1024).toFixed(0)} KB) — play it`);
}


async function main() {
  console.log("\nOpenAI");
  if (!OPENAI) {
    fail("OPENAI_API_KEY not set");
  } else {
    await checkOpenAIModels();
    await checkOpenAIText();
    await checkStructuredOutput();
  }

  console.log("\nElevenLabs");
  if (!ELEVEN) {
    fail("ELEVENLABS_API_KEY not set");
  } else {
    await checkElevenVoices();
    await checkElevenTTS();
  }

  console.log(failures === 0
    ? "\nAll good. You are ready to build.\n"
    : `\n${failures} problem(s) above. Fix before the 29th.\n`);
  process.exit(failures === 0 ? 0 : 1);
}

main().catch(e => { console.error("\nCrashed:", e.message, "\n"); process.exit(1); });
