# Exit Ticket (Lab 6)

### B1. Apply — Dockerfile draft

Dockerfile
FROM node:20-alpine AS builder
WORKDIR /app
COPY package\*.json ./
RUN npm ci
COPY . .
RUN npm run build

FROM node:20-alpine AS runner
WORKDIR /app
ENV NODE_ENV=production
RUN addgroup --system --gid 1001 nodejs && adduser --system --uid 1001 appuser
COPY --from=builder /app/package*.json ./
COPY --from=builder /app/dist ./dist
COPY --from=builder /app/node_modules ./node_modules
USER appuser
EXPOSE 3000
CMD ["node", "dist/index.js"]
.dockerignore (5 รายการ):
node_modules, dist, .git, .env*, npm-debug.log

### B2. Connect — Service Decomposition

User Service: จัดการ Auth และ Profile (สื่อสารผ่าน REST)

Flashcard Service: จัดการสำรับการ์ดและบันทึกการเรียน (สื่อสารผ่าน REST + Message Queue)

AI Generation Service: สกัดเอกสารและสร้างคำถาม-คำตอบ (สื่อสารผ่าน Message Queue)

Rule of Twos: แบ่ง 3 Services ทำให้สมาชิกในทีม 2 คนดูแลได้ทั่วถึง ไม่แยกย่อยเกินไปจนระบบซับซ้อน

### B3. Reflect — REST API Endpoint

Endpoint: POST /api/v1/flashcards/generate

Status Codes:

201 Created — สร้างแฟลชการ์ดสำเร็จ

400 Bad Request — ข้อมูลหรือไฟล์ไม่ถูกต้อง

401 Unauthorized — ไม่ได้เข้าสู่ระบบ

422 Unprocessable Entity — ไฟล์อ่านข้อความไม่ออกหรือเนื้อหาไม่พอ

500 Internal Server Error — เซิร์ฟเวอร์หรือโมเดล AI ขัดข้อง
