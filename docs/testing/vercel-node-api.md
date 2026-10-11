# ผลทดลอง API แบบ Node.js บน Vercel

ตรวจเมื่อ 11 ตุลาคม 2026 (เวลาไทย)

Preview ที่ทดสอบ: https://focus-flashcards-i7xudqra7-nattapon-aonsris-projects.vercel.app

Vercel ยืนยัน runtime เป็น Node.js function `services/api/index` ใน `sin1` ขนาดที่ CLI รายงาน 61.64 MB
Production เดิม https://focus-flashcards.vercel.app/ ยังเป็น container และไม่ได้ถูกเปลี่ยนโดยการทดลองนี้

## เวลาเปิดหน้าเข้าสู่ระบบ

| เงื่อนไข | Production เดิม (Docker) | Preview ทดลอง (Node.js) |
| --- | ---: | ---: |
| ค่าสูงสุดจากการเปิดเว็บรอบปกติที่วัด | 5.438 วินาที | 1.225 วินาที |
| เปิดหลังหยุดคำขอทดสอบเกิน 5 นาที | 5.547 วินาที | 2.532 วินาที |
| รอบเกิน 2 วินาที | 3/9 | 1/9 |

ช่วงพักของ Production เดิมคือ 342 วินาที ส่วน Preview Node.js คือ 352 วินาที
นอกจากนี้ Preview รุ่นเดียวกันเปิดหลังพัก 65 วินาทีใน 0.728 วินาที
การเปรียบเทียบนี้เป็นผลสังเกตระหว่างสองสภาพแวดล้อม ไม่ใช่การรับประกันเวลา Production หลังย้าย runtime
ระหว่างช่วงพักไม่ได้ส่งคำขอจากการทดสอบ แต่ไม่สามารถห้ามผู้ใช้อื่นหรือ monitoring เรียกเว็บสาธารณะได้

## การทำงานจริงบน Preview

- สมัครบัญชีทดสอบชั่วคราว เข้าสู่ระบบ ใช้ session cookie เรียก API และออกจากระบบได้
- API ของการ์ด โน้ต รายวิชา เอกสาร ทบทวน และสถิติตอบ HTTP 200 ด้วยข้อมูลของบัญชีทดสอบ
- อ่าน TXT, Markdown, PPTX และ PDF ที่มี text layer ได้
- PDF สแกนหนึ่งหน้าอ่านผ่าน OCR ได้ ใช้เวลา 3.431 วินาที
- สร้างการ์ดแบบ local ได้ โดยไม่ได้ส่งงานไปผู้ให้บริการ AI
- ล้างเฉพาะบัญชีทดสอบของการทดลองแล้ว ไม่แก้บัญชีหรือข้อมูลผู้ใช้เดิม

งาน OCR ใช้เวลาประมวลผลแยกจากการเปิดหน้าทั่วไป จึงยังไม่ควรอ้างว่าทุกคำขอทุกชนิดต่ำกว่า 2 วินาที
บัญชีทดสอบว่างใช้ตรวจการทำงานของ API ไม่แทนข้อมูลขนาดใหญ่หรือ concurrent load test
การเปิดเบราว์เซอร์ใช้ Chrome context ใหม่ทุกครั้งบนเครื่องเดียวกัน มือถือจำลอง viewport 390×844 ไม่ได้จำลองเครือข่ายมือถือที่ช้า

## ชุดทดสอบและ coverage

- Unit: 64 tests ผ่าน
- Integration: 37 tests ผ่าน โดยใช้ฐานข้อมูลทดสอบในเครื่อง
- Browser: 92 tests ผ่าน ทั้ง desktop และ mobile
- รวม 193 tests ผ่าน; ทดสอบ worker/entrypoint เพิ่มหลังปรับ packaging ผ่าน 11 tests
- เก็บ backend coverage ใหม่จากโค้ดรุ่นสุดท้าย และรวมกับ browser coverage ของส่วนหน้าเว็บที่ไม่เปลี่ยน
- Line coverage รวม 90.68%, backend 90.74%, frontend 90.6%
- รวมทุก 79 ไฟล์ JS/JSX ของแอป รวมไฟล์ที่ไม่ได้ถูกทดสอบ เกินเกณฑ์ 60% ทุกส่วน
- Live deployment checks ผ่าน HTML/assets/database/authentication และ Playwright desktop/mobile อีก 2 tests
- Build ที่เหลือใน `dist` เป็น production build ปกติ ไม่มี instrumentation ของ coverage

## ไฟล์และการนำไปใช้

การตั้งค่าอยู่ใน `vercel.json` และ export ของ API อยู่ใน `src/backend/vercel.js`
รายละเอียดการ deploy และกลับไป container อยู่ใน [คู่มือ Vercel](../vercel.md)
การตัดสินใจและขอบเขตอยู่ใน [ADR 0010](../architecture/adr/0010-vercel-node-api.md)
ต้อง deploy/promote Production อย่างชัดเจนจึงจะเปลี่ยน runtime ของโดเมนจริง
ยังต้องตรวจ Production ใหม่และใช้งานด้วยข้อมูลจริงหลังเปลี่ยน ก่อนยืนยันเกณฑ์ 2 วินาทีสำหรับการส่งงาน
