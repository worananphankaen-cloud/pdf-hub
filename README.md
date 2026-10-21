# Knowledge Hub (Next.js + Supabase + Vercel)

1. สร้างโปรเจกต์ Supabase (Free) → SQL Editor → รัน `supabase/schema.sql`
2. Authentication → Users → Add user (ติ๊ก Auto Confirm) แล้วรัน SQL ท้ายไฟล์ schema เพื่อตั้งเป็น master
3. `cp .env.example .env.local` แล้วใส่ค่าจาก Settings → API
4. `npm install && npm run dev` → http://localhost:3000
5. Deploy: push GitHub → Import ที่ Vercel → ใส่ env 3 ตัว → ตั้ง Site URL ใน Supabase Auth

ข้อควรระวัง: Vercel Hobby ห้ามใช้เชิงพาณิชย์ / Supabase Free Pause หลังไม่ใช้ 7 วัน
