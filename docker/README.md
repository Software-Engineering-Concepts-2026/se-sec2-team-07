# Docker Container Documentation

> The active Dockerfile now builds React/Vite and runs Node.js/Express with PostgreSQL via `compose.yaml`. See [current build/run instructions](../docs/development.md). The Python image details below are historical Sprint 1 prototype documentation and do not describe the current application.

## Image Details

- **Image Name / Tag:** `nattapon5/se-team07-app:v0.1.0`
- **Base Image:** `python:3.12-slim`
- **Image Size:** ประมาณ 150-180 MB
- **Expose Port:** `8000`
- **User:** `nobody` (Non-root user)

## How to Build & Run

### Build Image

```bash
docker build -t nattapon5/se-team07-app:v0.1.0 .
```

## ทำไมเลือก Container

เพื่อให้ Service ทำงานเป็น Stateless, Bootup ได้รวดเร็ว (Fast startup), ประหยัดทรัพยากร และลดความขัดแย้งของ Environment

## ทำไมไม่ใช้ VM

VM มี Overhead สูงเนื่องจากต้องรัน Guest OS เต็มรูปแบบ กินพื้นที่ Disk/RAM มากเกินความจำเป็นสำหรับ Web/API Service ของทีม.
