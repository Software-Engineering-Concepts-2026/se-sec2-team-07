# Focus Flashcards — การพัฒนาและเปิดใช้งาน

แอปปัจจุบันใช้ React/Vite + Plain CSS, Express, PostgreSQL, JWT ใน HttpOnly cookie และ OpenAI REST API ตาม `docs/architecture/tech_stack.md` โดยไม่ต้องใช้ Python/SQLite สำหรับรันแอป

## เปิดใช้งานในเครื่อง

ต้องมี Node.js 24 LTS พร้อม npm (ขั้นต่ำ 22.12), PostgreSQL 17+ หรือ Docker

```sh
npm ci
```

เลือกการตั้งค่าฐานข้อมูลหนึ่งวิธี:

1. **PostgreSQL ที่มีอยู่:** สร้างฐานข้อมูล `focus` และ `focus_test` แยกกัน คัดลอก `.env.example` เป็น `.env` แล้วตั้ง `DATABASE_URL`, `TEST_DATABASE_URL`, `JWT_SECRET` ให้ถูกต้อง
2. **PostgreSQL แยกสำหรับพัฒนา:** รัน `npm run db:local` แล้วเปิด terminal นี้ทิ้งไว้ สคริปต์จะเริ่ม PostgreSQL จริงใน `.local/postgres` ที่ `127.0.0.1:15432` สร้าง `focus`/`focus_test` และสร้าง `.env` ให้หากยังไม่มี โดยไม่แก้ PostgreSQL เดิมในเครื่อง เก็บค่าการเชื่อมต่อไว้ใน `.local/postgres.json` ซึ่งต้องไม่ commit

สร้าง secret แบบสุ่มด้วย `node -e "console.log(require('node:crypto').randomBytes(48).toString('hex'))"` ใช้ค่าคนละชุดสำหรับ JWT และรหัสผ่านฐานข้อมูล

เปิด terminal อีกหน้าต่าง:

```sh
npm run dev
```

เปิด `http://127.0.0.1:5173` — Vite ส่ง `/api` ต่อไป Express ที่พอร์ต 8000 และ Express รัน SQL migrations เมื่อเริ่มทำงาน

สำหรับเปิดเว็บที่ build แล้ว:

```sh
npm run build
npm start
```

เปิด `http://127.0.0.1:8000` หรือใช้ `./start.ps1` บน Windows (จะ build หากยังไม่มี `dist`) เริ่ม Express ใหม่หลังแก้ environment variables

ในเครื่อง Codex นี้ npm ยังไม่อยู่ใน PATH จึงมี npm เฉพาะ workspace ที่ `.tools/package/bin/npm-cli.js` เช่น `node .tools/package/bin/npm-cli.js run build` เครื่องที่ติดตั้ง Node/npm ปกติไม่ต้องใช้เส้นทางนี้

## Docker Compose

ตั้ง `POSTGRES_USER`, `POSTGRES_PASSWORD` แบบสุ่มที่ใช้ใน URL ได้ เช่น hex, `POSTGRES_DB` และ `JWT_SECRET` ใน `.env` แล้วรัน:

```sh
docker compose up --build
```

เปิด `http://127.0.0.1:8000` ระบบรอ PostgreSQL พร้อมก่อนเริ่ม Express เก็บข้อมูลใน volume `focus-postgres` และไม่เปิดพอร์ตฐานข้อมูลออกสู่เครื่องภายนอก

`docker compose down` เก็บข้อมูลไว้ ส่วน `docker compose down -v` จะลบข้อมูลฐานข้อมูล จึงใช้เฉพาะเมื่อต้องการลบจริง

Compose สำหรับ local ใช้ HTTP และ cookie ที่ไม่มี Secure; Docker image เมื่อนำไปรันเองมีค่าเริ่มต้นเป็น production และต้องมี HTTPS/Secure cookie

## การสร้างการ์ดด้วย AI

เลือก **OpenAI** เป็น provider จากตัวเลือกใน Tech Stack ตั้ง `OPENAI_API_KEY` และ `OPENAI_MODEL` เป็นโมเดลที่บัญชี API ใช้ได้และรองรับ Responses structured outputs คีย์อยู่เฉพาะเซิร์ฟเวอร์ ไม่ส่งไป frontend

เมื่อผู้ใช้เลือกโหมด AI แล้วกดสร้าง ข้อความจะถูกส่งไป OpenAI โดยใช้ `store: false`, JSON schema, validation ผลลัพธ์ และ timeout 90 วินาที หากเรียก API ไม่สำเร็จจะแจ้งข้อผิดพลาด ไม่สลับเป็นการสร้างแบบ local โดยไม่บอก

หากยังไม่ตั้งคีย์ ใช้การเพิ่มเองและโหมดแยกข้อความได้ทันที โหมด local แยก `คำศัพท์: ความหมาย` หรือสร้างการ์ดเติมคำโดยไม่ใช้ AI มีข้อความแยกโหมดชัดเจนใน UI

ยังไม่ได้เรียก AI จริงระหว่างพัฒนา เนื่องจากไม่ได้ตั้งค่าคีย์/โมเดล ทดสอบเฉพาะ request/response contract ด้วย transport จำลอง อ้างอิง [OpenAI Responses API](https://developers.openai.com/api/reference/cli/resources/responses/methods/create)

## พฤติกรรมและข้อจำกัด

- สมัครสมาชิก/เข้าสู่ระบบด้วยรหัสผ่าน scrypt ใช้ JWT HS256 ตรวจ issuer/audience, cookie HttpOnly/SameSite=Strict และหมดอายุเมื่อไม่มี API activity 30 นาที แต่ละคำขอที่ยืนยันตัวตนสำเร็จต่ออายุ token ให้ การ logout เพิ่ม token version ของผู้ใช้ ทำให้ token เดิมทุกอุปกรณ์ใช้ไม่ได้ ไม่มีตาราง session และต้องใช้ JWT secret เดียวกันในทุก replica
- สร้าง แก้ ลบ ค้นหา จัดหมวดหมู่ชุดการ์ด และ export JSON ข้อมูลแยกตามบัญชีผ่าน SQL; แก้ไขใน transaction และคงตารางทบทวนของการ์ดเดิม
- อ่าน PDF/PPTX/TXT/MD ไม่เกิน 20 MB; PDF ไม่เกิน 100 หน้า ข้อความไม่เกิน 60,000 ตัวอักษร ประมวลผลใน worker ที่จำกัดเวลา/หน่วยความจำ PDF สแกนต้องวางข้อความเอง (ยังไม่มี OCR)
- ทบทวนการ์ดที่ถึงกำหนด พลิกเฉลย จับเวลา 10 นาที/พักเวลา และบันทึกแบบ idempotent ป้องกันผลซ้ำ
- SRS: จำไม่ได้=10 นาที, ยาก=max(1 วัน, interval เดิม×1.2), จำได้=max(2 วัน, เดิม×2), ง่าย=max(4 วัน, เดิม×2.5) เป็นตัวจัดช่วงเวลาพื้นฐาน ยังไม่ใช่ SM-2/FSRS
- สถิติมาจากประวัติจริง นับวันเวลาไทย ความแม่นยำเป็นสัดส่วน Good/Easy ที่ประเมินเอง การลบการ์ดจะลบประวัติของการ์ดนั้นจากสถิติด้วย
- ยังไม่มี offline sync, reset password/email verification, collaborative editing และ cloud file storage ไฟล์อัปโหลดสกัดในหน่วยความจำและไม่เก็บต้นฉบับ
- Rate limit ปัจจุบันแยกตาม process หาก deploy หลาย replica ต้องเพิ่ม shared store หรือ gateway
- ยังไม่ได้รับรอง NFR ด้าน load 150 ผู้ใช้, uptime, encryption-at-rest หรือเป้าหมาย latency จากการทดสอบฟังก์ชันครั้งนี้

## ย้ายข้อมูล SQLite เดิม

หยุดการเขียนข้อมูลจากแอปเก่า เก็บสำเนา `data/focus.sqlite3` ตั้ง `DATABASE_URL` ไป PostgreSQL ที่ยังไม่มีผู้ใช้ แล้วรัน:

```sh
npm run db:import-sqlite -- data/focus.sqlite3
```

สคริปต์ใช้ Node SQLite reader แบบ read-only คัดลอก users/decks/cards/reviews ใน transaction เดียวและปรับ ID sequences ปฏิเสธการนำเข้าถ้าปลายทางมีผู้ใช้อยู่แล้ว ไม่ลบหรือแก้ต้นฉบับ รหัสผ่านเดิมใช้ได้ แต่ผู้ใช้ต้องเข้าสู่ระบบใหม่เพราะไม่ย้าย session แบบเดิม

## ทดสอบ

```sh
npm test
npm run test:integration
npm run build
npm run test:e2e
```

Integration/browser tests ต้องมี `TEST_DATABASE_URL` แยกจากข้อมูลใช้งานจริง Tests สร้างบัญชีของตัวเองและลบเฉพาะบัญชีเหล่านั้น Browser tests ใช้ Chrome (`npx playwright install chrome` หากยังไม่มี) เริ่ม Express สำหรับทดสอบที่ 8001 และตรวจเว็บ build แล้วบน desktop/mobile ภาพอยู่ใน `.local/` ส่วน trace เมื่อผิดพลาดอยู่ใน `test-results/`

CI ตั้ง PostgreSQL 17, รันทดสอบ, build React และทดสอบ browser การอัปเกรด schema ใช้ PostgreSQL advisory lock และ `schema_migrations` ให้เพิ่ม SQL migration ใหม่แทนแก้ไฟล์ที่ apply ไปแล้ว

## Deploy บน Render / Railway

เลือก Dockerfile ใน repo เป็น build ของ service และสร้าง PostgreSQL จากนั้นตั้ง:

- `DATABASE_URL`: connection string ของฐานข้อมูล hosted
- `JWT_SECRET`: secret สุ่มที่ใช้ร่วมกันทุก deployment/replica
- `NODE_ENV=production`, `HOST=0.0.0.0`, `COOKIE_SECURE=true`
- `PORT`: ค่าที่ platform กำหนด (ค่าเริ่มต้น 8000)
- `APP_ORIGIN`: HTTPS origin ของแอป; `TRUST_PROXY`: จำนวน trusted proxy hops ที่ตรวจสอบแล้วสำหรับ deployment นั้น
- `DATABASE_SSL=true` หากฐานข้อมูลกำหนดให้ใช้ TLS โดยยังตรวจ certificate
- `OPENAI_API_KEY` / `OPENAI_MODEL` หากต้องการเปิด AI

ใช้ `/api/health` เป็น readiness check และ HTTPS ที่ public ingress Express เสิร์ฟ React build และ API จาก origin เดียวกัน ฐานข้อมูลต้องพร้อมก่อนรัน startup migrations งานครั้งนี้ยังไม่ได้ publish ไป cloud
