# จุดแก้ไขโค้ดหลัก

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

`Dashboard` ดึงข้อมูลครั้งเดียวผ่าน hook เดิม แล้วส่ง props ให้แต่ละส่วนแสดงผล
component ย่อยไม่โหลดข้อมูลซ้ำและไม่เก็บ state สำเนาจาก props
routes คง lazy loading และ key ของหน้าสร้าง/ทบทวนเพื่อไม่เปลี่ยนการ reset state
backend ต้องรักษาลำดับ policy → parser → authentication → routes → error handler

## รูปแบบและการตรวจ

- `npm run format`: จัดรูปแบบไฟล์ที่ refactor ในรอบนี้
- `npm run format:check`: ตรวจรูปแบบโดยไม่แก้ไฟล์
- `npx prettier --write <file>`: จัดรูปแบบไฟล์อื่นที่กำลังแก้ แล้วเพิ่มเข้า scope ของ scripts เมื่อพร้อม
- `npm run build` และ `npm test`: ตรวจ build และ unit tests
- ทดสอบ browser/integration โดยใช้ TEST_DATABASE_URL ของฐานข้อมูลทดสอบแยกเท่านั้น

ยังมีหน้าขนาดใหญ่ เช่น Editor, Review และไฟล์ CSS ที่ควรค่อย ๆ แยกตามหน้าที่ในรอบต่อไป
การจัดรูปแบบรอบนี้จำกัดขอบเขตเพื่อให้ตรวจ diff ได้ ไม่อ้างว่าทั้ง repository refactor เสร็จแล้ว
