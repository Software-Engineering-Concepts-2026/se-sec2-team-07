# Project: Focus Flashcards

เว็บแอปพลิเคชันที่เข้ามาพลิกโฉมการเตรียมสอบ ด้วยการเปลี่ยนการท่องจำเนื้อหาจากหนังสือกองโตหรือชีทเรียนที่หนาเตอะ ให้กลายเป็นการทบทวนผ่าน "บัตรคำศัพท์ดิจิทัล" (Digital Flashcards)

## Team: NEX4

- นางสาวปาริชาติ ขัติยศ, GitHub: `[@Brielle-Chxn]`
- นายณัฐพล อ่อนสี, GitHub: `[@Nattaponao]`
- นายณภัทรชัย ไชยโสภา, GitHub: `[@Nightnay2]`
- นางสาววริศรา วังเทียน, GitHub: `[@SrLiliumBulby]`

---

# Ways of Working — Tools for Modern Learners

> เอกสาร Project Charter สำหรับการทำงานร่วมกันของทีม

---

## สารบัญ

- [1. Meeting Cadence](#1-meeting-cadence)
- [2. Communication Rules](#2-communication-rules)
- [3. Git Workflow](#3-git-workflow)
- [4. Decision Making](#4-decision-making)
- [5. Team Values](#5-team-values)

---

## 1. Meeting Cadence

| การประชุม                     | วัน                       | ระยะเวลา   | รูปแบบ             |
| ----------------------------- | ------------------------- | ---------- | ------------------ |
| Sprint Planning               | ทุกวันจันทร์              | 45–60 นาที | ประชุมพร้อมกัน     |
| Mid-Week Sync                 | ทุกวันพุธ                 | 15–20 นาที | ประชุมพร้อมกัน     |
| Sprint Review & Retrospective | ทุกวันศุกร์               | 45–60 นาที | ประชุมพร้อมกัน     |
| Daily Stand-up                | ก่อน 10:00 น. ทุกวันทำงาน | —          | โพสต์ข้อความ async |

**Sprint Planning** — ทบทวนความคืบหน้า Sprint ก่อนหน้า วางแผนและแบ่งงาน Sprint ถัดไป ระบุความเสี่ยงและอุปสรรค

**Mid-Week Sync** — อัปเดตสถานะงานของแต่ละคน แจ้งปัญหาหรือสิ่งที่ติดขัด ประสานงานข้ามสมาชิก

**Sprint Review & Retrospective** — สาธิตฟีเจอร์ที่เสร็จแล้ว วิเคราะห์สิ่งที่ทำได้ดีและควรปรับปรุง หาแนวทางพัฒนารอบถัดไป

**Daily Stand-up (ข้อความ)** — ตอบ 3 คำถาม: เมื่อวานทำอะไรเสร็จ / วันนี้จะทำอะไร / มีอุปสรรคหรือไม่

---

## 2. Communication Rules

**ช่องทางหลัก:** Discord

| ช่อง       | วัตถุประสงค์                   |
| ---------- | ------------------------------ |
| `#general` | ประกาศและข้อมูลทั่วไปของทีม    |
| `#dev`     | หารือเรื่อง Code และ Technical |
| `#standup` | โพสต์ Stand-up ประจำวัน        |
| `#random`  | บทสนทนานอกงาน                  |

**กฎการสื่อสาร**

- ตอบกลับภายใน **12 ชั่วโมง** ในวันปกติ / **2 ชั่วโมง** กรณีเร่งด่วน
- หากไม่สามารถติดต่อได้เกิน 1 วัน ต้องแจ้งทีมล่วงหน้า
- ใช้ **Thread** แยกตามหัวข้อหรือฟีเจอร์ หลีกเลี่ยงการคุยหลายเรื่องใน Thread เดียวกัน
- การตัดสินใจด้านเทคนิค การออกแบบ และการวางแผนต้องอยู่ใน **Public Channel** เสมอ
- ใช้ **DM** เฉพาะเรื่องส่วนตัวหรือ Feedback รายบุคคล
- หากมีการตัดสินใจใน DM ต้องสรุปผลในช่องสาธารณะด้วย

---

## 3. Git Workflow

### Branching Strategy

```
main       — Production เท่านั้น ห้าม push โดยตรง
develop    — รวม Feature ที่เสร็จแล้ว
feat/xxx   — ฟีเจอร์ใหม่ (แตกจาก develop)
fix/xxx    — แก้ Bug (แตกจาก develop)
docs/xxx   — แก้ไขเอกสาร
refactor/xxx — ปรับโครงสร้าง Code
```

### Commit Message Convention

รูปแบบ: `type: description`

| Type       | ใช้เมื่อ                         | ตัวอย่าง                         |
| ---------- | -------------------------------- | -------------------------------- |
| `feat`     | เพิ่มฟีเจอร์ใหม่                 | `feat: add quiz result page`     |
| `fix`      | แก้ไข Bug                        | `fix: resolve login validation`  |
| `docs`     | แก้ไขเอกสาร                      | `docs: update project charter`   |
| `refactor` | ปรับโครงสร้าง Code               | `refactor: improve auth service` |
| `test`     | เพิ่ม / แก้ Test                 | `test: add unit tests for quiz`  |
| `chore`    | งานอื่น ๆ เช่น อัปเดต dependency | `chore: update npm packages`     |

### Pull Request Process

1. สร้าง Branch จาก `develop` ตามรูปแบบ เช่น `feat/student-dashboard`
2. พัฒนาเสร็จแล้ว Commit และ Push ขึ้น GitHub
3. เปิด PR พร้อมเขียน Description อธิบายสิ่งที่เปลี่ยนและวิธีทดสอบ
4. ต้องได้รับ **Approve อย่างน้อย 1 คน** จากสมาชิกทีมก่อน Merge
5. ผู้รีวิวต้องให้ Feedback ภายใน **24 ชั่วโมง**
6. เจ้าของ PR กด Merge เองหลังได้รับ Approve และลบ Branch ทิ้ง

**ข้อห้าม:** ห้าม Merge PR ของตนเองโดยไม่มี Review / ห้าม push ตรงเข้า `main` หรือ `develop`

### Definition of Done

งานจะถือว่าเสร็จเมื่อ:

- พัฒนาโค้ดเสร็จสมบูรณ์
- Push ขึ้น GitHub แล้ว
- ผ่านการ Review จากทีม
- Merge เข้า Branch หลักแล้ว
- ไม่มี Bug ร้ายแรงคงเหลือ
- อัปเดตเอกสารที่เกี่ยวข้อง

---

## 4. Decision Making

ใช้กระบวนการตามลำดับดังนี้

**ขั้นที่ 1 — Discuss:** เปิดประเด็นใน `#dev` พร้อมระบุตัวเลือกและเหตุผลของแต่ละฝ่าย กำหนดเวลาถกเถียงไม่เกิน 24 ชั่วโมง

**ขั้นที่ 2 — Vote:** โหวตในช่องสาธารณะ ทุกคนมี 1 เสียงเท่ากัน ใช้เสียงข้างมากเป็นผู้ชนะ หากผลเสมอหรือเรื่องซับซ้อนด้านเทคนิค Technical Lead เป็นผู้ตัดสินพร้อมอธิบายเหตุผล

**ขั้นที่ 3 — Commit:** ทุกคนสนับสนุนทิศทางที่ทีมเลือก แม้ไม่ได้เห็นด้วยในตอนแรก นำมาทบทวนได้ใน Sprint Retrospective ถัดไป

> เรื่องที่กระทบ Scope หรือ Architecture ทั้งโปรเจกต์ให้นำเข้าหารือใน Sprint Planning เท่านั้น

---

## 5. Team Values

- Respect Everyone
- Communicate Early
- Deliver Working Software
- Help Each Other
- Learn Continuously
- Improve Through Feedback

---

_เอกสารนี้ทบทวนและปรับปรุงได้ในทุก Sprint Retrospective โดยต้องได้รับความเห็นชอบจากทุกคนในทีม_

## 🚀 Getting Started — Current Application

แอปปัจจุบันใช้ **React + Vite + Plain CSS / Node.js + Express / PostgreSQL / JWT HttpOnly cookies** ตาม [Tech Stack](docs/architecture/tech_stack.md)

```bash
npm ci
npm run db:local
# Leave the database terminal open. In another terminal:
npm run dev
```

เปิด http://127.0.0.1:5173 เพื่อพัฒนา หรือ `npm run build` ตามด้วย `npm start` แล้วเปิด http://127.0.0.1:8000

`db:local` เริ่ม PostgreSQL แยกในโฟลเดอร์ `.local` และสร้าง `.env` หากยังไม่มี หากใช้ PostgreSQL ที่มีอยู่ ให้ตั้งค่าตาม `.env.example` แทน

- สร้างบัญชีและเพิ่มชุดการ์ดจาก PDF/PPTX/TXT/MD หรือข้อความ
- แก้ไขและบันทึกการ์ด ทบทวนตาม SRS และดูสถิติจริง
- AI เปิดใช้เมื่อกำหนด `OPENAI_API_KEY` และ `OPENAI_MODEL` ฝั่งเซิร์ฟเวอร์ โหมดแยกข้อความและเพิ่มเองใช้ได้โดยไม่มีคีย์
- Docker: ตั้ง `POSTGRES_PASSWORD`/`JWT_SECRET` แล้ว `docker compose up --build`
- รายละเอียดการรัน การย้ายข้อมูลเดิม การทดสอบ และ deploy: **[Development guide](docs/development.md)**

---

## 🏛️ Architecture & Design

Key architectural decisions and diagrams are documented in the `/docs/architecture` directory.

- **[C4 Models & Tech Stack](./docs/architecture/README.md)**
- **[Architectural Decision Records (ADRs)](./docs/architecture/adr/)**

## 👥 Requirements

User personas and key scenarios that drive our development are located in the `/docs/requirements` directory.

- **[User Personas](./docs/requirements/personas/)**
- **[Main User Scenario](./docs/requirements/main_scenario.md)**
