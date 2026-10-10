# รันด้วย Docker

ใช้ Docker Desktop แบบ Linux containers เปิดจากโฟลเดอร์หลักของโปรเจกต์
ฐานข้อมูลยังอยู่ Supabase และ AI ยังใช้ค่าที่คุณตั้งใน `.env`

## ทดลองในเครื่อง

ต้องมี `.env` ที่เชื่อม Supabase ได้และ deploy schema ไว้แล้ว จากนั้น:

```powershell
docker compose up --build -d
docker compose ps
docker compose logs --tail=50 app
```

เปิด http://localhost:8000 (ใช้ localhost ให้ตรงกับ APP_ORIGIN)
หากพอร์ต 8000 ถูกใช้ ให้หยุดเซิร์ฟเวอร์เดิมก่อน
นี่คือเว็บที่ build แล้ว จึงไม่ต้องเปิด Vite และไม่ hot reload
เมื่อแก้โค้ด ใช้ `docker compose up --build -d` อีกครั้ง
หยุดด้วย `docker compose down` ซึ่งเก็บ OCR cache และไม่แตะข้อมูล Supabase

Compose นี้สำหรับทดลอง HTTP ในเครื่องเท่านั้น จึงกำหนด NODE_ENV=development
เพื่อใช้ cookie บน HTTP แต่ยังเสิร์ฟไฟล์จาก production build
ค่าดังกล่าวไม่เปลี่ยนฐานข้อมูล: แอปยังตรวจ SUPABASE_PROJECT_REF เหมือนเดิม

## Certificate สำหรับ Supabase

การทดสอบ Supabase ของโปรเจกต์นี้ต้องใช้ certificate เพิ่ม ให้รันด้วยไฟล์เสริมที่เตรียมไว้:

```powershell
docker compose -f compose.yaml -f compose.ca.yaml up --build -d
docker compose -f compose.yaml -f compose.ca.yaml ps
```

ถ้าเครื่องเดิมต้องใช้ NODE_EXTRA_CA_CERTS ให้ mount certificate แบบ read-only
และระบุ path ใน Linux container ไม่ใช่ path Windows ตัวอย่างเพิ่มใน compose.override.yaml:

```yaml
services:
  app:
    environment:
      NODE_EXTRA_CA_CERTS: /app/certs/supabase.crt
    volumes:
      - ./.local/prod-ca-2021.crt:/app/certs/supabase.crt:ro
```

ต้องมี certificate ที่ตรวจสอบแหล่งที่มาแล้วก่อนใช้ ไม่ปิดการตรวจ TLS

## นำขึ้นเซิร์ฟเวอร์จริง

Dockerfile เริ่มต้นด้วย NODE_ENV=production และรันด้วยผู้ใช้ node ที่ไม่ใช่ root
ใช้ HTTPS reverse proxy ตั้ง APP_ORIGIN เป็นโดเมน HTTPS จริง และ COOKIE_SECURE=true
ตั้ง TRUST_PROXY ตามจำนวน proxy ที่เชื่อถือได้ของระบบจริง
ส่ง secrets ผ่าน environment ตอนรัน ไม่ผ่าน build args หรือ COPY
Compose ด้านบนไม่ใช่ configuration สำหรับเปิดใช้งานออนไลน์

Image ไม่รวม scripts และ schema สำหรับ deploy จึงใช้คำสั่ง migration จากเครื่องที่มี dependencies ครบ:

```powershell
npm run db:check:supabase
npm run db:deploy:supabase
```

ตรวจปลายทางก่อน deploy ทุกครั้ง การเริ่ม container ไม่รัน migrations หรือ reset ฐานข้อมูล
OCR ดาวน์โหลดภาษาเมื่อใช้งานครั้งแรก จึงต้องเข้าถึงอินเทอร์เน็ต; volume เก็บ cache สำหรับครั้งต่อไป

แนวทาง multi-stage และ build context: https://docs.docker.com/guides/nodejs/

## ผลตรวจ 2026-10-06

- Docker build บน Linux/amd64 และ Compose config ผ่าน
- ตรวจผู้ใช้ non-root, ไม่มี .env ใน image, เขียน OCR cache ได้, import Prisma/PDF/OCR ได้ และเสิร์ฟหน้าเว็บ/health route ผ่าน (health ใช้ฐานข้อมูลจำลองใน smoke check)
- Prisma อ่าน Supabase จริงผ่านเมื่อ mount certificate เดิม ไม่มีการแก้ข้อมูลหรือ migration
- ยังไม่ได้ทดสอบ workflow ล็อกอิน/อัปโหลด/OCR/AI ครบผ่าน Docker หรือ deploy HTTPS จริง
- npm audit ระหว่าง build ยังรายงานช่องโหว่ dependencies เดิม ควรตรวจและอัปเดตแยกก่อนเปิด production; งานนี้ไม่ได้ force-upgrade dependencies
