import express from "express";

const app = express();
app.use(express.json({ limit: "1mb" }));
app.use(express.static("public"));

const OPENAI_KEY = process.env.OPENAI_API_KEY;
const ELEVEN_KEY = process.env.ELEVENLABS_API_KEY;
const MODEL = process.env.OPENAI_MODEL || "gpt-4o-mini";
const VOICE_ID = process.env.ELEVENLABS_VOICE_ID || "21m00Tcm4TlvDq8ikWAM";

// ---- health: เช็คว่า secrets ครบไหม โดยไม่เผย key ----
app.get("/api/health", (_req, res) => {
  res.json({
    ok: true,
    model: MODEL,
    openai: Boolean(OPENAI_KEY),
    elevenlabs: Boolean(ELEVEN_KEY),
  });
});

// ---- text in, text out ----
app.post("/api/chat", async (req, res) => {
  if (!OPENAI_KEY) return res.status(500).json({ error: "ยังไม่ได้ตั้งค่า OPENAI_API_KEY ใน Secrets" });

  const { message, system } = req.body ?? {};
  if (!message) return res.status(400).json({ error: "ต้องส่ง field 'message' มาด้วย" });

  try {
    const r = await fetch("https://api.openai.com/v1/chat/completions", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${OPENAI_KEY}`,
      },
      body: JSON.stringify({
        model: MODEL,
        messages: [
          { role: "system", content: system || "ตอบสั้น กระชับ เป็นภาษาเดียวกับที่ผู้ใช้ถาม ไม่เกิน 3 ประโยค" },
          { role: "user", content: message },
        ],
      }),
    });

    if (!r.ok) {
      const detail = await r.text();
      return res.status(r.status).json({ error: "OpenAI ตอบกลับผิดพลาด", detail });
    }

    const data = await r.json();
    res.json({ reply: data.choices?.[0]?.message?.content ?? "" });
  } catch (err) {
    res.status(500).json({ error: "เรียก OpenAI ไม่สำเร็จ", detail: String(err) });
  }
});

// ---- text in, mp3 out ----
app.post("/api/speak", async (req, res) => {
  if (!ELEVEN_KEY) return res.status(500).json({ error: "ยังไม่ได้ตั้งค่า ELEVENLABS_API_KEY ใน Secrets" });

  const { text, voiceId } = req.body ?? {};
  if (!text) return res.status(400).json({ error: "ต้องส่ง field 'text' มาด้วย" });

  const voice = voiceId || VOICE_ID;

  try {
    const r = await fetch(
      `https://api.elevenlabs.io/v1/text-to-speech/${voice}?output_format=mp3_44100_128`,
      {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "xi-api-key": ELEVEN_KEY,
        },
        body: JSON.stringify({
          text,
          model_id: process.env.ELEVENLABS_MODEL || "eleven_multilingual_v2",
        }),
      }
    );

    if (!r.ok) {
      const detail = await r.text();
      return res.status(r.status).json({ error: "ElevenLabs ตอบกลับผิดพลาด", detail });
    }

    const buf = Buffer.from(await r.arrayBuffer());
    res.set("Content-Type", "audio/mpeg");
    res.send(buf);
  } catch (err) {
    res.status(500).json({ error: "เรียก ElevenLabs ไม่สำเร็จ", detail: String(err) });
  }
});

const PORT = process.env.PORT || 3000;
app.listen(PORT, "0.0.0.0", () => console.log(`listening on ${PORT}`));
