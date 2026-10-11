# AI ผ่าน KKU

โมเดลที่เลือกเมื่อ 2026-10-11: เปลี่ยนกลับเป็น `gpt-6-sol-pro` ตามคำขอของผู้ใช้
ใช้ API key เดิมของ KKU โดยไม่ย้าย key ไปยังผู้ให้บริการอื่น

```dotenv
OPENAI_MODEL=gpt-6-sol-pro
OPENAI_BASE_URL=https://gen.ai.kku.ac.th/upacth/api/v1
OPENAI_API_MODE=chat
```

`OPENAI_API_KEY` เก็บใน `.env` ของเครื่องและ Environment Variables ของ Vercel
อย่าใส่ key ในโค้ด รายงาน หรือ commit

ระบบยังเรียก `POST /chat/completions` โดยใช้ชื่อโมเดลจากการตั้งค่า
จึงไม่ต้องเปลี่ยน SDK หรือ endpoint การสร้างการ์ดเมื่อเปลี่ยนโมเดล
ชุดทดสอบตรวจชื่อโมเดลและผล JSON ทั้งแบบตรงและมี code fence

การเปลี่ยนกลับครั้งนี้ตรวจด้วยชุดทดสอบจำลองการตอบกลับของ KKU โดยไม่เรียก AI จริง
ผู้ใช้แจ้งว่าโควตายังหมดและต้องรอวันใหม่ การเปลี่ยนโมเดลไม่ได้รีเซ็ตโควตา
ยังไม่ยืนยันเวลาที่ KKU จะคืนโควตาหรือความพร้อมใช้งานจริงของโมเดล

หลังเปลี่ยนค่าในเครื่องให้ restart API หากกำลังรันอยู่
บน Vercel ต้อง deploy ใหม่จึงจะใช้ค่าใหม่ URL deployment เก่ายังใช้ค่าที่บันทึกตอน deploy เดิม
Preview และ Production ต้อง deploy สำหรับ environment ของตัวเอง
