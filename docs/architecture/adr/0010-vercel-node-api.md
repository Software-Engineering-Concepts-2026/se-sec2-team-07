# ADR 0010: ทดลอง API แบบ Node.js บน Vercel

สถานะ: ทดลองบน Preview เมื่อ 2026-10-11; ยังไม่เปลี่ยน Production

## ปัญหา

การวัด Production แบบ container พบว่าหน้าเข้าสู่ระบบบางรอบใช้เวลา 5.41–5.55 วินาที
โดย `/api/me` ใช้ประมาณ 4.5–4.7 วินาที แม้ไฟล์เว็บบน CDN ตอบเร็ว
จึงทดลอง runtime ที่รองรับ Express โดยตรงเพื่อเปรียบเทียบ โดยยังต้องรักษาฟีเจอร์เดิม

## การตัดสินใจ

- ส่วนเว็บยังเป็น Vite/CDN และเส้นทาง `/api/*` ยังอยู่บนต้นทางเดียวกัน
- เปลี่ยน service `api` เป็น framework `express` และ entrypoint `src/backend/vercel.js`
- export แอปเดิม ไม่เรียก `listen`, startup query หรือ migrations ในฟังก์ชัน
- ใช้ pool เดียวต่อ warm instance และคงการตรวจ JWT, revocation, owner และ origin
- รักษาค่า TLS ของฐานข้อมูลที่ผู้ใช้เลือกไว้จาก Docker โดยไม่เปลี่ยน `.env`
- เก็บ worker อ่านเอกสารเป็นโปรเซสแยก ใช้ `require.resolve` เพื่อให้ tracing รวม dependencies
- รวม native canvas, PDF assets และ OCR/WASM ใน bundle อย่างชัดเจน เพราะ worker ใช้ไฟล์เหล่านี้ตอนรับงาน
- ใช้ `/tmp` สำหรับแคช OCR บน Vercel และรักษาพาธ local/Docker เดิม
- ทดสอบ Preview ทั้งความเร็วและฟีเจอร์ก่อนพิจารณา Production

## ขอบเขตและผลตามมา

Native Node.js ยังอาจมี cold start และไม่มีการรับประกันว่าทุกคำขอจะต่ำกว่า 2 วินาที
ต้องวัดเวลารอหน้าเว็บ/API จริง ไม่ใช้เวลาโหลด HTML เพียงอย่างเดียว
การอ่าน PDF/OCR และการสร้างการ์ดด้วย AI เป็นงานประมวลผลที่แยกจากเกณฑ์ response time ของการเปิดหน้าปกติ

ข้อจำกัด payload ของ Vercel ยังคงมีผลกับไฟล์ที่ส่งแบบ base64 JSON
บัญชีทดสอบว่างใช้ยืนยันการทำงานและเวลาของ API ได้ แต่ไม่แทนข้อมูลขนาดใหญ่หรือ load test
Dockerfile/Compose และการส่ง image ไป Docker Hub ยังใช้ได้ตามเดิม

## อ้างอิง

- [คู่มือ deploy และวิธีกลับไป container](../../vercel.md)
- [สถาปัตยกรรมก่อนหน้า](0009-vercel-services.md)
- [Express บน Vercel](https://vercel.com/docs/frameworks/backend/express)
