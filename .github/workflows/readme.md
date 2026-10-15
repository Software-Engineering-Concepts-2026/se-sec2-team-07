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

ไม่ใช้ `Deploy and verify Vercel` เป็น required สำหรับ PR เพราะงานนี้รันเฉพาะ push
การแก้ workflow ไม่ได้เปลี่ยน Branch Protection ใน GitHub ให้อัตโนมัติ

## การ deploy

`Deploy and verify Vercel` ต้องรอให้ทั้งหก checks ผ่าน ก่อน deploy ด้วย Vercel CLI:

- branch อื่น: Preview
- `main`: staged Production → ตรวจเว็บ/API/ฐานข้อมูลและ browser → promote โดเมน Production

ต้องมี repository secret `VERCEL_TOKEN` ที่เข้าถึงทีมและโปรเจกต์ที่ระบุใน workflow ได้
คำสั่ง deploy และ promote ใช้ `--scope` ของทีม `nattapon-aonsris-projects` เหมือนกัน
เพื่อไม่ให้ขั้น promote ไปค้นหาผู้ใช้/ทีมเริ่มต้นของ CLI

`vercel.json` ปิด Git auto-deploy ด้วย `git.deploymentEnabled: false` ให้ Actions เป็นผู้สั่ง deploy
และเก็บ coverage report เป็น artifact `application-coverage` ผลดิบระหว่าง jobs เก็บหนึ่งวัน

หลัง merge workflow ใหม่นี้ ต้องรันจาก commit ใหม่ การกด Re-run บน run เก่าจะยังใช้ workflow เก่า

ดูรายละเอียดและคำสั่งทดสอบใน [เอกสาร coverage และ CI/CD](../../docs/testing/coverage-ci-cd.md)
