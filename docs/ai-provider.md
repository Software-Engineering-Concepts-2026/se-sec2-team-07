# AI ผ่าน KKU

โมเดลที่เลือกเมื่อ 2026-10-11: `claude-sonnet-5` แทน `gpt-6-sol-pro` ที่โควตาเต็ม
ใช้ API key เดิมของ KKU โดยไม่ย้าย key ไปยังผู้ให้บริการอื่น

```dotenv
OPENAI_MODEL=claude-sonnet-5
OPENAI_BASE_URL=https://gen.ai.kku.ac.th/upacth/api/v1
OPENAI_API_MODE=chat
```

`OPENAI_API_KEY` เก็บใน `.env` ของเครื่องและ Environment Variables ของ Vercel
อย่าใส่ key ในโค้ด รายงาน หรือ commit

ระบบยังเรียก `POST /chat/completions` โดยใช้ชื่อโมเดลจากการตั้งค่า
จึงไม่ต้องติดตั้ง Anthropic SDK หรือเปลี่ยน endpoint การสร้างการ์ด
ชุดทดสอบตรวจชื่อโมเดลและผล JSON ทั้งแบบตรงและมี code fence

ตรวจโมเดลกับ KKU และทดลองสร้างการ์ดคำศัพท์ไทยสองใบด้วย key เดิมผ่านแล้ว
นี่เป็นผล ณ เวลาตรวจ ไม่ได้รับประกันโควตาหรือความพร้อมใช้งานในอนาคต

หลังเปลี่ยนค่าในเครื่องให้ restart API หากกำลังรันอยู่
บน Vercel ต้อง deploy ใหม่จึงจะใช้ค่าใหม่ URL deployment เก่ายังใช้ค่าที่บันทึกตอน deploy เดิม
Preview และ Production ต้อง deploy สำหรับ environment ของตัวเอง
