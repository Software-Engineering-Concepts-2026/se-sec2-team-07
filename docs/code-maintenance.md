# จุดแก้ไขโค้ดหลัก

## ผล regression ล่าสุด — 2026-10-07

ข้อจำกัดเรื่อง browser suite ที่ไม่ผ่านในบันทึกวันที่ 2026-10-06 ด้านล่างแก้แล้ว:
Build และ format check ผ่าน; unit 49/49, integration 36/36 และ browser 68/68 ผ่าน
รวม 153 tests ไม่มี fail หรือ skip ในรอบยืนยันสุดท้าย

แก้เฉพาะตัวทดสอบให้ตรง UI ปัจจุบัน: เลือกเขียนเองก่อนเพิ่มการ์ด, กรอกชื่อหลังสร้างการ์ด,
เปิดตัวเลือก AI, ระบุลิงก์ทบทวนแบบ exact, ใช้การซิงค์อัตโนมัติเมื่อไม่มี error,
สร้าง revision conflict ก่อนทดสอบ recovery และเปิดเมนูเพิ่มเติมบนมือถือ
ยังคงตรวจร่างไม่หาย, retry ไม่สร้างซ้ำ, owner isolation, daily budget และ review history
ไม่มีการ skip tests, เพิ่ม timeout มาตรฐาน หรือเปลี่ยน production code เพื่อให้ tests ผ่าน

ใช้ Chrome บน Windows, desktop และ mobile emulation รวม viewport 320/768/844/1024px
ฐานข้อมูลทดสอบ PostgreSQL แยกบน localhost; ไม่เขียน Supabase production
รายงาน browser รอบสุดท้ายอยู่ที่ `.local/regression-full.json` (ไม่ commit)
ผลนี้ไม่ใช่การรับรอง AI/OCR provider จริง, Docker end-to-end หรือ Safari/อุปกรณ์จริง

รันซ้ำ: เปิด `npm run db:test:local` ใน terminal แยก และกำหนด TEST_DATABASE_URL
สำหรับฐานข้อมูลทดสอบ จากนั้นรันตามลำดับ:

```powershell
npm run build
npm run format:check
npm test
npm run test:integration
npm run test:e2e
```

รอแต่ละคำสั่งจบและตรวจผลก่อนคำสั่งถัดไป ห้ามรัน integration กับ browser พร้อมกัน
เพราะ integration มีกรณีทดสอบ migration และการเตรียม schema

รอบนี้แยกหน้าที่โดยคง API, schema, CSS และเส้นทางเดิม ไม่เปลี่ยนระบบ AI หรือฐานข้อมูล

| ต้องการแก้ | ไฟล์ |
| --- | --- |
| เพิ่ม/เปลี่ยนหน้าและ URL | `src/frontend/src/routes.jsx` |
| เริ่ม React และนำเข้า CSS | `src/frontend/src/main.jsx` |
| ข้อมูลและเงื่อนไขภารกิจ Dashboard | `src/frontend/src/pages/Dashboard.jsx` |
| รูปแบบคำทักทาย/ตัวเลข/ภารกิจ/รายสัปดาห์ | `src/frontend/src/components/dashboard/` |
| การประกอบ backend และลำดับ middleware | `src/backend/app.js` |
| Origin, JSON และ cache policy ของ API | `src/backend/middleware/api-policy.js` |
| การแปลง error เป็น HTTP response | `src/backend/middleware/error-handler.js` |
| state, upload, OCR confirmation, save/conflict ของ Editor | `src/frontend/src/hooks/useDeckEditor.js` |
| session, timer, keyboard และ retry ของ Review | `src/frontend/src/hooks/useReviewSession.js` |
| ระดับการประเมินคำตอบบนหน้าทบทวน | `src/frontend/src/components/review/ratings.js` |
| แยกข้อความเป็นการ์ดแบบ local | `src/backend/modules/generation/local.js` |
| ข้อกำหนดและระดับความยากที่ส่งให้ AI | `src/backend/modules/generation/prompt.js` |

`Dashboard` ดึงข้อมูลครั้งเดียวผ่าน hook เดิม แล้วส่ง props ให้แต่ละส่วนแสดงผล
component ย่อยไม่โหลดข้อมูลซ้ำและไม่เก็บ state สำเนาจาก props
routes คง lazy loading และ key ของหน้าสร้าง/ทบทวนเพื่อไม่เปลี่ยนการ reset state
backend ต้องรักษาลำดับ policy → parser → authentication → routes → error handler

## รูปแบบและการตรวจ

- `npm run format`: จัดรูปแบบ JS/JSX/CSS/HTML ใน src, scripts, tests และ config ที่ root
- `npm run format:check`: ตรวจรูปแบบโดยไม่แก้ไฟล์
- `npx prettier --write <file>`: จัดรูปแบบเฉพาะไฟล์ที่กำลังแก้
- `npm run build` และ `npm test`: ตรวจ build และ unit tests
- ทดสอบ browser/integration โดยใช้ TEST_DATABASE_URL ของฐานข้อมูลทดสอบแยกเท่านั้น

Editor และ Review แยกการทำงานออกจาก JSX แล้ว โดย hook ยังเป็นเจ้าของ state เพียงจุดเดียว
คง request ID และ pending payload สำหรับ retry, revision checks และตัวป้องกัน save ซ้ำไว้
generation/service.js ยัง export generateLocal เพื่อรักษาจุดเรียกเดิม

รูปแบบโค้ดครอบคลุมไฟล์ที่ทีมแก้ไขใน application, scripts, tests และ config ทั้งหมด
ไฟล์เล็กที่มีหน้าที่ชัดเจนอยู่แล้วคงโครงสร้างเดิม ไม่สร้าง abstraction เพิ่มโดยไม่มีเหตุผล
CSS จัดรูปแบบให้อ่านได้ แต่ไม่เรียง selector ใหม่ เพราะลำดับ cascade มีผลต่อหน้าตา
SQL migrations เดิมไม่แก้ไขเพราะ Prisma ตรวจ checksum; schema, assets, เอกสารเดิม,
lockfile, generated files, secrets และ AI_USAGE.md ไม่ใช่เป้าหมายของการจัดรูปแบบ source

## ผลตรวจรอบขยายทั้งโปรเจกต์ (2026-10-06)

- Build และ format check ผ่าน
- Unit tests 49 ข้อ และ integration tests 36 ข้อผ่านบนฐานข้อมูลทดสอบแยก
- Browser regression ผ่าน 16 กรณีไม่ซ้ำบน desktop/mobile: issue3, issue4, issue6,
  issue9, issue10-routing และ reference-design (รันแยกเป็นหลายชุด)
- ปรับ selector สมัครบัญชีให้ใช้ tab และปรับ issue4/issue6 ให้ตรงกับการเปิดช่องและสรุปตัวเลขปัจจุบัน
- การลองรัน browser suite ทั้งหมด 68 กรณียังไม่ผ่านครบ และหยุดเพื่อวิเคราะห์:
  account-recovery กรณี logout draft และ app.spec ยังต้องปรับ flow ให้ตรงกับ UI ปัจจุบัน
  อย่าใช้ผล regression เฉพาะชุดข้างต้นอ้างว่าครบทั้ง suite
- ไม่ได้เรียก AI จริงหรือเขียนข้อมูล Supabase production ในการตรวจรอบนี้
