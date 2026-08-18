# starter kit — OpenAI + ElevenLabs บน Replit

Skeleton สำหรับ hackathon: พิมพ์ข้อความ → OpenAI ตอบ → ElevenLabs อ่านออกเสียง
เป้าหมายคือให้ "ท่อ" ทุกเส้นต่อเสร็จก่อนวันงาน วันจริงเหลือแค่เปลี่ยน prompt กับ UI

## ตั้งค่า (ครั้งเดียว ~20 นาที)

1. **สร้าง repo บน GitHub** แล้ว push โฟลเดอร์นี้ขึ้นไป
2. **Replit** → Create App → Import from GitHub → เลือก repo
3. **ใส่ Secrets** ใน Replit (แท็บ Secrets ด้านซ้าย) — อย่าใส่ใน `.env` แล้ว commit
   - `OPENAI_API_KEY`
   - `ELEVENLABS_API_KEY`
4. กด **Run** → เปิด preview → ไฟสถานะสองดวงบนหน้าเว็บต้องเขียวทั้งคู่
5. **Deploy** → Autoscale → ได้ URL `.replit.app` เอาไว้โชว์ตอน pitch
6. **ต่อ Codex** เข้ากับ repo เดียวกัน (chatgpt.com/codex → เลือก repo)

## ทดสอบเร็ว ๆ

```bash
curl -s localhost:3000/api/health
curl -s -X POST localhost:3000/api/chat \
  -H 'Content-Type: application/json' \
  -d '{"message":"สวัสดี"}'
```

`/api/health` บอกว่า key ครบไหมโดยไม่เผยค่า key — ใช้เช็คตอนของพังกลางงาน

## โครงสร้าง

```
server.js           Express: /api/health, /api/chat, /api/speak
public/index.html   หน้าทดสอบหน้าเดียว ไม่มี build step
.replit             config สำหรับรันและ deploy
```

## ปุ่มที่ต้องหมุนวันงาน

| ตัวแปร | ทำอะไร | ค่าเริ่มต้น |
|---|---|---|
| `OPENAI_MODEL` | เปลี่ยนรุ่นโมเดล | `gpt-4o-mini` |
| `ELEVENLABS_VOICE_ID` | เปลี่ยนเสียง | Rachel |
| `ELEVENLABS_MODEL` | เปลี่ยนรุ่นเสียง | `eleven_multilingual_v2` |

เช้าวันงานเช็คชื่อรุ่นโมเดลล่าสุดจาก docs ก่อน แล้วเปลี่ยนที่ Secrets ไม่ต้องแก้โค้ด
ถ้าจะพูดไทย ลองทั้ง `eleven_multilingual_v2` และรุ่นใหม่กว่า แล้วเลือกที่ฟังลื่นกว่า

## หมายเหตุ

- `system` prompt ส่งจาก client ได้ (`POST /api/chat` รับ field `system`) — ใช้ลอง persona เร็ว ๆ ตอน demo
- ยังไม่มี auth, rate limit, chat history — ตั้งใจตัดออก อย่าเพิ่งใส่ถ้าไม่จำเป็นต่อ demo
- ถ้าจะรับเสียงเข้า (speech-to-text) ค่อยเพิ่ม endpoint `/api/listen` วันงาน
