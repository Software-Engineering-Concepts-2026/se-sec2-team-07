# งานตรวจสอบและ deploy อัตโนมัติ

ไฟล์ `ci.yml` รันเมื่อ push และเปิด/อัปเดต Pull Request โดยใช้ Node.js 24
และ PostgreSQL 17 แยกเฉพาะการทดสอบ ไม่มีการใช้ฐานข้อมูล Supabase จริงใน CI

| ชื่อ check | สิ่งที่ตรวจสอบ |
| --- | --- |
| `lint` | ESLint ตรวจ JavaScript/JSX ของแอป สคริปต์ และเทสต์ |
| `Unit tests (Node.js)` | เทสต์ใน `tests/unit/` รวมสถิติ, SRS, authentication, AI และ read cache |
| `Integration tests (PostgreSQL)` | เทสต์ใน `tests/integration/` กับ PostgreSQL จริง รวม Prisma migrations และ API |
| `Build & smoke-test stack` | build Vite แบบ production แล้วตรวจ React HTML, assets, ฐานข้อมูล และ API ผ่าน HTTP ในเครื่อง |
| `E2E tests (browser)` | Playwright ทดสอบ desktop/mobile พร้อมเก็บ frontend/backend coverage |
| `Coverage` | รวมผลจากสามชุดทดสอบ และบังคับ line coverage อย่างน้อย 60% ทั้งรวม, frontend และ backend |

การทดสอบ PostgreSQL เป็น integration test ไม่ใช่ unit test ส่วนสถิติเป็นโมดูล Node.js
ภายในแอปเดียวกัน จึงไม่ตั้งชื่อว่าเป็น Stats Service แยก หรือ JS prototypes ที่ไม่มีในแอปนี้
แบบฝึกหัด Python เดิมไม่ได้อยู่ในขอบเขต workflow ของเว็บปัจจุบัน

## Branch Protection ของ main

เลือก required status checks ทั้งหกชื่อตามตาราง หลัง workflow ใหม่รันและชื่อปรากฏแล้ว
พร้อมบังคับ Pull Request, review อย่างน้อยหนึ่งคน และให้ branch อัปเดตกับ main
หากเคยตั้ง `test` เป็น required ให้เปลี่ยนมาใช้ชื่อใหม่ เพื่อไม่ให้ PR รอ check เก่าที่ไม่มีแล้ว

หากเคยเลือก `Deploy and verify Vercel` เป็น required ให้นำออก เพราะไม่มีงานนี้ใน workflow แล้ว
การแก้ workflow ไม่ได้เปลี่ยน Branch Protection ใน GitHub ให้อัตโนมัติ

## การ deploy

Vercel GitHub App เป็นผู้ deploy โดยตรง ส่วน GitHub Actions ทำ CI ทั้งหก checks เท่านั้น
ไม่มีการใช้ Vercel CLI, token หรือขั้น promote ใน Actions

1. เชื่อม repository `Software-Engineering-Concepts-2026/se-sec2-team-07` กับโปรเจกต์ Vercel เดิม `focus-flashcards` ที่ Settings → Git
2. ตั้ง Production Branch เป็น `main` และใช้ repository root เป็น Root Directory
3. เก็บ Environment Variables ของแอปไว้ใน Vercel ตามเดิม
4. ตั้ง Branch Protection ให้ PR ผ่านทั้งหก checks และ review อย่างน้อยหนึ่งคนก่อน merge
5. เมื่อ merge เข้า `main` แล้ว Vercel จะ build และ deploy Production อัตโนมัติ

`vercel.json` ใช้ `git.deploymentEnabled` โดยปิดทุก branch ด้วย `**: false`
และเปิดเฉพาะ `main: true` จึงไม่สร้าง Git deployments สำหรับ `develop`, feature branches หรือ PRs
ต้องนำการตั้งค่านี้เข้า branches ที่ใช้งานด้วย เพราะ Vercel อ่านไฟล์จาก commit ของ branch นั้น

Vercel ตอบสนองต่อ push เข้า `main` ไม่ได้รอ CI ของ push นั้น จึงต้องใช้ Branch Protection
เป็นตัวบังคับ CI ก่อน merge และไม่ bypass checks หรือ push ตรงเข้า `main`
ไม่มี live verification อัตโนมัติหลัง deploy แล้ว ให้ตรวจเว็บจริงตาม [คู่มือ Vercel](../../docs/vercel.md)
สคริปต์ตรวจเว็บจริงเดิมยังใช้สั่งตรวจด้วยตนเองได้

workflow เก็บ coverage report เป็น artifact `application-coverage` ผลดิบระหว่าง jobs เก็บหนึ่งวัน
ไม่จำเป็นต้องมี `VERCEL_TOKEN` ใน Actions สำหรับวิธีนี้ และ workflow ไม่ได้ลบ secret เดิมให้
หลัง push/merge workflow ใหม่นี้ ให้ดู run ใหม่ การกด Re-run บน run เก่าจะยังใช้ workflow เก่า

ดูรายละเอียดและคำสั่งทดสอบใน [เอกสาร coverage และ CI/CD](../../docs/testing/coverage-ci-cd.md)
