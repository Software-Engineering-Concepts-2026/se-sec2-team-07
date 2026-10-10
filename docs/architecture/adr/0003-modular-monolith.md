# ADR 0003: Modular Monolith สำหรับ Focus Flashcards

## Status

Accepted — 2026-08-26

Reviewed — 2026-10-10. เปลี่ยนเลขจาก 0001 เป็น 0003 เพื่อไม่ให้ซ้ำกับ ADR การเลือกเทคโนโลยีเดิม โดยเก็บเหตุผลและวันที่ตัดสินใจไว้

## Context

- ทีมพัฒนามีสมาชิก 4-5 คน ระยะเวลาพัฒนาในภาคการศึกษาจำกัด (8 สัปดาห์)
- ระบบต้องการส่งมอบ Interactive Prototype และ Core Features (Upload $\rightarrow$ AI Extract $\rightarrow$ SRS Review $\rightarrow$ Dashboard) ภายใน Sprint 1 และ 2
- ปริมาณการใช้งานในช่วงเริ่มต้นคาดการณ์อยู่ที่ระดับ ~100 Daily Active Users (ห้องเรียน/มหาวิทยาลัย)
- ทีมไม่มี DevOps Engineer โดยเฉพาะ และต้องการลดความซับซ้อนในการตั้งค่า CI/CD, Network latency และ Distributed transaction

## Decision

ทีมตัดสินใจเลือกใช้สถาปัตยกรรม **Modular Monolith** โดยรวม Backend API (Auth, Flashcard Management, SRS Engine, Statistics Analytics) ไว้ใน Service เดียวกันบน Node.js/Express แต่แบ่งโครงสร้างโค้ดภายในเป็นโมดูลชัดเจน (Controller-Service-Repository Pattern)

## Consequences

- **ข้อดี (Positive):**
  - **พัฒนาและ Deploy ได้รวดเร็ว:** มี Deployment Pipeline เดียว ลดภาระการดูแล Infrastructure
  - **Data Consistency สูง:** สามารถใช้ ACID Transactions บน PostgreSQL ได้โดยตรง ไม่เกิดปัญหา Data Inconsistency ข้าม Service
  - **Debug และทำ Automated Test ง่าย:** ทดสอบระบบ End-to-end ได้ใน Single Runtime
- **ข้อเสียและข้อจำกัด (Negative):**
  - **Scalability แบบแยกส่วนทำไม่ได้ทันที:** หากฟังก์ชัน AI Processing ใช้ CPU/Memory สูง จะกระทบกับ API อื่นในระบบ
  - **Tech Stack ผูกติดกัน:** ทุกโมดูลหลังบ้านต้องรันบน Node.js runtime เดียวกัน

## Alternatives Considered

- **Microservices Architecture:** ถูกปฏิเสธเนื่องจากมี Overhead ในการจัดการ Service Discovery, Inter-service communication และ CI/CD ซับซ้อนเกินไปสำหรับขนาดทีมและเวลาที่มี
- **Serverless Architecture (AWS Lambda):** ถูกปฏิเสธเนื่องจากปัญหา Cold Start อาจกระทบ User Experience ในช่วง Demo และจัดการ Local Development Environment ได้ยากกว่า

## Current implementation

Backend ยังคงเป็น Express service เดียว แยกโมดูลใน `src/backend/modules` ไม่ได้แยกแต่ละฟีเจอร์เป็น microservice
การตัดสินใจเดิมเรื่อง deployment เดียวถูกปรับตาม [ADR 0009](0009-vercel-services.md): frontend เสิร์ฟบน CDN และ API อยู่ใน container โดยใช้ PostgreSQL บน Supabase ตาม [ADR 0008](008-prisma-supabase.md)
Vercel API ยังมี cold start ได้ การปฏิเสธ AWS Lambda ในข้อเสนอเดิมจึงไม่ได้หมายความว่า deployment ปัจจุบันไม่มี cold start
