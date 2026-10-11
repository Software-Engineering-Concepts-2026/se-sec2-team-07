# หลักฐานเกณฑ์การส่งงาน Focus Flashcards

ตรวจหลักฐานวันที่ 11/10/2026 14:12 (Asia/Bangkok)

| เกณฑ์ | สถานะ | ผลและหลักฐาน |
| --- | --- | --- |
| Test coverage อย่างน้อย 60% | ผ่าน | CI 89.64% บน commit 3013bf7; backend 89.02%, React 90.60% |
| CI/CD deploy อัตโนมัติและเว็บใช้งานได้ | ผ่านสำหรับ Preview ที่รันจริง | GitHub Actions run #110: test และ Deploy and verify Vercel สำเร็จจาก push |
| Response time ต่ำกว่า 2 วินาที | ยังไม่ผ่านครบ | Node.js Preview มี 8/9 รอบต่ำกว่า 2s แต่หลังพัก 352s เปิดหน้า 2.532s; Docker Production เดิม 5.547s |

## ลิงก์หลักฐาน

- [GitHub Actions run #110](https://github.com/Software-Engineering-Concepts-2026/se-sec2-team-07/actions/runs/38080796632)
- [Coverage artifact](https://github.com/Software-Engineering-Concepts-2026/se-sec2-team-07/actions/runs/38080796632/artifacts/11680158776)
- [เว็บที่ deploy อัตโนมัติจาก CI](https://focus-flashcards-i0hxsu23z-nattapon-aonsris-projects.vercel.app)
- [Production ที่วัดจริง](https://focus-flashcards.vercel.app/)
- [Preview ทดลอง Node.js](https://focus-flashcards-i7xudqra7-nattapon-aonsris-projects.vercel.app)

## แยกเวอร์ชัน

- CI ที่สำเร็จ: commit 3013bf7 / feat/coverage-auto-deploy / coverage รวม 89.64% / 78 source files
- โค้ด Node.js ในเครื่อง: commit ffafe55 / perf/vercel-node-api / coverage รวม 90.68% / backend 90.74% / React 90.60% / 79 source files / 193 tests ผ่าน
- CI run #110 ไม่ได้รันจาก Node.js commit ffafe55 จึงไม่ใช้ run นี้ยืนยัน commit นั้น รุ่น Node.js เป็นการ deploy Preview ด้วย CLI และตรวจ live site แยกกัน
- Production ยังไม่ได้สลับเป็น Node.js ในการทดลองนี้

## ไฟล์แนบ

- focus-submission-evidence.pdf: รายงาน 4 หน้า พร้อมภาพจริงจาก GitHub และเว็บที่ deploy
- evidence/screenshots/: ภาพจริงจาก GitHub Actions, coverage และหน้าเว็บ
- evidence/raw/: JSON coverage และ timings ทุกรอบ รวมรอบเกิน 2s; snapshot ของ CI และผล live check ปัจจุบัน
- evidence/github-coverage-artifact.zip: artifact coverage ที่ดาวน์โหลดจาก GitHub run #110

## วิธีวัดและขอบเขต

วัดเวลารับ HTTP response จนได้ body ครบ และเวลาจากเปิด URL จนช่องอีเมลของหน้า login แสดงโดย Chrome context ใหม่
เก็บผลทุกครั้ง ไม่เลือกเฉพาะรอบที่เร็ว รอบหลังพัก Production=342s และ Node.js Preview=352s
การวัดระหว่างสอง environment ไม่ใช่การรับประกัน Production หลังย้าย runtime
งาน OCR หนึ่งหน้าวัดได้ 3.431s ไม่ทดสอบเวลาผู้ให้บริการ AIหรือ concurrent load
หลักฐาน timings มาจาก 11/10/2026 ช่วง 03:19-03:47 น. ส่วน CI และ live website ตรวจยืนยันอีกครั้งตอนรวบรวมรายงาน
ผู้ตรวจต้องมีสิทธิ์ repository เพื่อเปิด GitHub Actions และ artifact ของ repo ที่เป็น private

## ทำซ้ำการวัด response time

ใช้ Node.js และ Chrome พร้อม dependencies ของโปรเจกต์ รันจากโฟลเดอร์ repository:

```powershell
New-Item -ItemType Directory -Force .local
node output/pdf/evidence/measure-response.mjs initial https://focus-flashcards.vercel.app .local/proof-response.json
```

หลังคำสั่งแรกเสร็จ รออย่างน้อย 5 นาที 30 วินาทีโดยไม่ส่งคำขอทดสอบ แล้วรัน:

```powershell
node output/pdf/evidence/measure-response.mjs idle https://focus-flashcards.vercel.app .local/proof-response.json
```

เปลี่ยน URL เป็น Node.js Preview เพื่อเปรียบเทียบ และใช้ไฟล์ผลคนละไฟล์ คำสั่งนี้อ่านข้อมูลและตรวจหน้า login เท่านั้น ไม่สร้างบัญชีหรือแก้ข้อมูลเรียน
