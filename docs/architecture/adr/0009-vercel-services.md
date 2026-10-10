# ADR 0009: ส่วนแสดงผลบน CDN และ API container บน Vercel

สถานะ: นำมาใช้ใน Production เมื่อ 2026-10-10; การทดลองเปลี่ยน API บน Preview เป็น Node.js บันทึกใน [ADR 0010](0010-vercel-node-api.md)

## บริบทและปัญหา

การเสิร์ฟทั้งเว็บผ่าน container ที่หยุดพักเมื่อไม่มีผู้ใช้ทำให้การเปิดหน้าครั้งแรกต้องรอ API เริ่มทำงาน
นอกจากนี้ cookie บน HTTPS และการตรวจต้นทางของคำขอต้องรองรับทั้ง URL Preview ที่สร้างใหม่และโดเมน Production ที่คงเดิม

## การตัดสินใจ

- ใช้ Vercel Services (Beta) ภายในโปรเจกต์เดียวและต้นทางเว็บเดียวกัน
- `web` build React/Vite ไปยัง `dist` โดยเสิร์ฟ HTML, JavaScript, CSS, ฟอนต์ และภาพจาก CDN
- ส่ง `/api` และ `/api/*` ไปยัง `api` ที่ใช้ `Dockerfile.vercel` ส่วนคำขออื่นไปยัง `web`
- รวมโมดูลธุรกิจของ API ใน Express แบบ Modular Monolith เดียว ไม่แยกแต่ละฟีเจอร์เป็น microservice
- รัน API ใน `sin1` ให้ตรงกับภูมิภาคของ Supabase pooler ปัจจุบัน โดยสถานที่ build เป็นอีกค่าหนึ่งที่แยกกัน
- ข้ามการตรวจฐานข้อมูลที่ทำให้ startup ต้องรอเฉพาะบน Vercel ไม่รัน migrations ตอนเริ่มแอป การตรวจสุขภาพระบบและคำขอที่ยืนยันตัวตนยังใช้ฐานข้อมูลจริง
- กำหนด `Cache-Control: no-store` ให้คำตอบ API ที่เป็นข้อมูลส่วนตัว ใช้แคช CDN ระยะยาวเฉพาะไฟล์เว็บ
- ใช้ secure HttpOnly cookies และตรวจต้นทางแบบตรงตัว URL ของ deployment และ branch มาจากตัวแปรระบบ ยอมรับโดเมน Production แบบ `vercel.app` จาก `VERCEL_PROJECT_PRODUCTION_URL` เฉพาะเมื่อ `VERCEL_ENV=production` ส่วนโดเมนกำหนดเองใช้ `APP_ORIGIN`
- ใช้ CLI deploy ตามขั้นตอนปัจจุบัน การขึ้น Production ต้องระบุ `deploy --prod` ส่วนการ deploy อัตโนมัติจาก Git ต้องตั้งค่าการเชื่อมต่อและสิทธิ์แยกต่างหาก
- การออกเวอร์ชัน Docker/Compose และ Docker Hub ปกติแยกจากการ deploy บน Vercel

## ผลที่ตามมา

ไฟล์เว็บโหลดได้โดยไม่ต้องรอ API เริ่มทำงาน แต่การสมัคร เข้าสู่ระบบ และอ่านข้อมูลยังอาจต้องรอ container เริ่มใหม่หรือ cold start
Services ยังเป็น Beta และมีข้อจำกัดของแพลตฟอร์ม ขนาดไฟล์ 20 MB ที่แอปอนุญาตไม่ได้เปลี่ยนข้อจำกัดขนาดคำขอของ Vercel
แคช OCR อยู่ชั่วคราวใต้ `/tmp` จึงอาจต้องดาวน์โหลดโมเดลภาษาใหม่เมื่อเปลี่ยน container
ข้อยกเว้นการตรวจ certificate ของ PostgreSQL บันทึกใน [ADR 0008](008-prisma-supabase.md)

Production และ Preview ใช้ environment variables คนละกลุ่ม การเปิด Preview ได้ไม่ได้ยืนยันว่าข้อมูลเชื่อมต่อหรือ `APP_ORIGIN` ของ Production ถูกต้อง
HTTP 403 จากนโยบายตรวจต้นทางเป็นปัญหาการตั้งค่าหรือสิทธิ์ ไม่ใช่หลักฐานว่าการเริ่มฐานข้อมูลล้มเหลว

## ทางเลือกที่พิจารณา

- เสิร์ฟ SPA ทั้งหมดผ่าน API container: ไม่เลือก เพราะไฟล์เว็บจะต้องรอ container เริ่มทำงานด้วย
- Deploy เฉพาะ Vite: ไม่เพียงพอ เพราะการบันทึกข้อมูล อ่านไฟล์ และสร้างการ์ดต้องมี API
- อนุญาตทุกโดเมน `*.vercel.app` หรือเชื่อ header ระบุต้นทางที่ส่งต่อมาโดยไม่ตรวจสอบ: ไม่เลือก เพราะเว็บไซต์อื่นต้องไม่ส่งคำขอแก้ข้อมูลโดยใช้สิทธิ์ผู้ใช้ได้
- รัน migrations ตอน cold start: ไม่เลือก เพราะการเริ่มแอปต้องไม่เปลี่ยน schema

## เอกสารอ้างอิง

- [การแบ่งเส้นทางคำขอ](../../../vercel.json)
- [การ build container](../../../Dockerfile.vercel)
- [นโยบายตรวจต้นทาง](../../../src/backend/middleware/api-policy.js)
- [คู่มือ Vercel](../../vercel.md)
- [คู่มือ Docker](../../docker.md)
