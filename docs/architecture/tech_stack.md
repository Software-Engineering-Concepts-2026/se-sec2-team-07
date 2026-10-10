# Architectural Tech Stack & Decision Rationale

> Reviewed 2026-10-10 against the active implementation. See [all ADRs](README.md), [development guide](../development.md) and [user guide](../user_guide.md). The original Next.js/Firebase proposal is superseded; planning PNGs still show optional integrations that are not implemented.

## Tech Stack Overview (6 Layers)

| Layer                            | Choice (เทคโนโลยีที่เลือก)                    | Rationale (เหตุผลเชิง Context)                                                                                                                                                                         | Alternative (ทางเลือกอื่นที่พิจารณา)          |
| :------------------------------- | :-------------------------------------------- | :----------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- | :-------------------------------------------- |
| **1. Frontend Layer**            | React (Vite) + Plain CSS                      | • รอบ Sprint สั้น (8 สัปดาห์) ต้องการ Component-based UI ในการจัดการ State ของ Flashcard (SRS) และ Dashboard สถิติ<br>• Vite ให้เวลา Build/HMR ที่รวดเร็ว เหมาะกับนิสิตในทีม                           | Vanilla JS, Next.js, Vue.js                   |
| **2. Backend / API Layer**       | Node.js + Express                             | • เหมาะสำหรับ I/O-intensive operations ในการรับ-ส่งไฟล์ PDF และการประมวลผลข้อความ<br>• เป็น JavaScript ecosystem เดียวกับ Frontend ทำให้ทีมแชร์ Data Schema และ Model interface ร่วมกันได้ง่าย         | Python (FastAPI), Go, NestJS                  |
| **3. Database Layer**            | Supabase PostgreSQL + Prisma 7 / pg           | • Prisma สำหรับ CRUD และ parameterized SQL transactions สำหรับงานที่ต้องล็อกและรักษา snapshot<br>• Schema เปลี่ยนผ่าน Prisma Migrate แยกจาก startup; PostgreSQL ในเครื่องใช้ทดสอบเท่านั้น              | ORM ทั้งระบบ, Supabase client-side access     |
| **4. AI Integration Layer**      | Configurable OpenAI-compatible HTTPS API      | • เลือก Responses หรือ Chat Completions ตาม provider ที่ตั้งค่า<br>• อ่านไฟล์ด้วย worker/OCR ก่อนสร้างการ์ด; เขียนเองและแยกข้อความไม่ต้องใช้ AI<br>• ยังไม่มี integration เฉพาะ Gemini                 | Mandatory AI, local model                     |
| **5. Hosting / Deployment**      | Vercel Services: CDN frontend + API container | • ไฟล์ React/Vite บน CDN ไม่รอ API cold start<br>• API container ใน sin1 ใกล้ Supabase; Docker/Compose และ Docker Hub เป็นอีกเส้นทางที่แยกกัน<br>• CLI deploy; Git auto-deploy ต้องตั้งสิทธิ์เพิ่มเติม | Full website in one container, Render/Railway |
| **6. Authentication & Security** | JWT (JSON Web Tokens) with HTTP-only Cookies  | • Stateless Authentication ช่วยลดภาระ Session State ฝั่ง Server<br>• สามารถตรวจสอบสิทธิ์การเข้าถึงข้อมูล Dashboard และชุดการ์ดของผู้ใช้ได้อย่างรวดเร็ว                                                 | Session-based (Redis), OAuth2 (Auth0)         |

## Storage, consistency and performance

- Document originals and extracted text are stored in PostgreSQL, not Firebase/Supabase Storage. Extracting into a card/note draft does not save the original file.
- Courses link the same originals and review history. Owner checks, transactions and retry receipts protect shared edits and accounting.
- API requests still check user/token version and resource ownership; authentication is not a client-only JWT check.
- Private route snapshots live briefly in account-scoped browser memory. They are not persisted or cached publicly; review queues always load fresh.
- Production uses HTTPS, secure cookies and exact origin checks. The current Vercel PostgreSQL certificate-verification exception and its consequence are recorded in [ADR 0008](adr/008-prisma-supabase.md).
- Static caching reduces navigation waits but does not eliminate API cold starts, database latency or OCR startup. This SPA does not provide Next.js SSR or offline editing.
