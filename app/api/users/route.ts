import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@supabase/supabase-js'
import dns from 'node:dns'
import net from 'node:net'

// แก้ปัญหา Node เชื่อมต่อ IPv6/DNS ช้าหรือล้มเหลวบนบางเครือข่าย (อาการ "fetch failed")
try { dns.setDefaultResultOrder('ipv4first') } catch {}
try { (net as any).setDefaultAutoSelectFamilyAttemptTimeout?.(2000) } catch {}

const NET_MSG =
  'เซิร์ฟเวอร์ (Node) เชื่อมต่อ Supabase ไม่ได้ (fetch failed) — เปิด http://localhost:3000/api/health เพื่อดูสาเหตุ ' +
  '(มักเป็น VPN/Proxy/Firewall/Antivirus หรือ DNS)'

export const runtime = 'nodejs'
export const dynamic = 'force-dynamic'

const SB_URL = process.env.NEXT_PUBLIC_SUPABASE_URL
const SB_ANON = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY
const SB_SERVICE = process.env.SUPABASE_SERVICE_ROLE_KEY?.trim()

const fail = (error: string, status = 400) => NextResponse.json({ error }, { status })

// master จัดการได้ทุก role / admin จัดการได้เฉพาะ user
const canManage = (me: string, target: string) => me === 'master' || target === 'user'

/** ตรวจผู้เรียกด้วย token ของเขาเอง (ผ่าน RLS) จึงไม่พึ่ง service key ในขั้นตรวจสิทธิ์ */
async function getCaller(req: NextRequest): Promise<{ id: string; role: string } | { error: string; status: number }> {
  const token = req.headers.get('authorization')?.replace('Bearer ', '').trim()
  if (!token || token === 'undefined') return { error: 'ไม่พบ session กรุณาเข้าสู่ระบบใหม่', status: 401 }

  const userClient = createClient(SB_URL!, SB_ANON!, {
    auth: { persistSession: false },
    global: { headers: { Authorization: `Bearer ${token}` } },
  })
  const { data: { user }, error } = await userClient.auth.getUser(token)
  if (!user) {
    console.error('[api/users] getUser failed:', error, (error as any)?.cause)
    if (/fetch failed|network|ENOTFOUND|ETIMEDOUT/i.test(error?.message ?? '')) return { error: NET_MSG, status: 502 }
    return { error: `session ไม่ถูกต้องหรือหมดอายุ (${error?.message ?? 'unknown'}) กรุณาเข้าสู่ระบบใหม่`, status: 401 }
  }

  const { data, error: pErr } = await userClient.from('profiles').select('role').eq('id', user.id).single()
  if (!data) return { error: `ไม่พบ profile ของบัญชีนี้ (${pErr?.message ?? 'ไม่มีแถว'}) ตรวจว่ารัน schema.sql แล้ว`, status: 403 }
  if (data.role === 'user') return { error: 'บัญชีนี้ไม่มีสิทธิ์ผู้ดูแล', status: 403 }
  return { id: user.id, role: data.role }
}

function friendly(msg?: string) {
  if (!msg) return 'เกิดข้อผิดพลาด'
  if (/fetch failed|ENOTFOUND|ETIMEDOUT/i.test(msg)) return NET_MSG
  if (/already (been )?registered|already exists/i.test(msg)) return 'อีเมลนี้มีอยู่ในระบบแล้ว'
  if (/invalid api key|jwt|apikey/i.test(msg)) return 'SUPABASE_SERVICE_ROLE_KEY ไม่ถูกต้อง ตรวจ .env.local แล้วรีสตาร์ต npm run dev'
  if (/database error/i.test(msg)) return 'บันทึก profile ไม่สำเร็จ (ตรวจว่ารัน schema.sql ครบ และ trigger on_auth_user_created ทำงาน)'
  if (/password/i.test(msg)) return 'รหัสผ่านไม่ผ่านเงื่อนไข (อย่างน้อย 6 ตัวอักษร)'
  return msg
}

export async function POST(req: NextRequest) {
  if (!SB_URL || !SB_ANON) return fail('ยังไม่ได้ตั้ง NEXT_PUBLIC_SUPABASE_URL / ANON_KEY ใน .env.local', 500)
  if (!SB_SERVICE) return fail('ยังไม่ได้ตั้ง SUPABASE_SERVICE_ROLE_KEY ใน .env.local (ตั้งแล้วต้องรีสตาร์ต npm run dev)', 500)
  const validService = SB_SERVICE.startsWith('sb_secret_') || (SB_SERVICE.startsWith('eyJ') && SB_SERVICE.length >= 100)
  if (!validService || SB_SERVICE.includes('...'))
    return fail('SUPABASE_SERVICE_ROLE_KEY ยังเป็นค่าตัวอย่าง (eyJ...) ให้ใส่คีย์ service_role จริงจาก Supabase → Settings → API แล้วรีสตาร์ต npm run dev', 500)
  if (SB_SERVICE === SB_ANON?.trim()) return fail('SUPABASE_SERVICE_ROLE_KEY เหมือนกับ ANON key ให้คัดลอกคีย์ service_role (secret) ใหม่', 500)

  const me = await getCaller(req)
  if ('error' in me) return fail(me.error, me.status)

  let body: any
  try { body = await req.json() } catch { return fail('ข้อมูลที่ส่งมาไม่ถูกต้อง') }
  const { action, users, id, role, password } = body

  const admin = createClient(SB_URL, SB_SERVICE, { auth: { persistSession: false, autoRefreshToken: false } })

  // ---------- เพิ่มผู้ใช้ (ทีละคนหรือ Batch) ----------
  if (action === 'create') {
    if (!Array.isArray(users) || users.length === 0) return fail('ไม่มีรายชื่อผู้ใช้ที่จะเพิ่ม')
    const results: { email: string; ok: boolean; error?: string }[] = []

    for (const u of users as { email?: string; password?: string; role?: string }[]) {
      const email = String(u.email ?? '').trim().toLowerCase()
      const pass = String(u.password ?? '')
      const r = String(u.role ?? 'user').trim() || 'user'

      if (!/^\S+@\S+\.\S+$/.test(email)) { results.push({ email, ok: false, error: 'รูปแบบอีเมลไม่ถูกต้อง' }); continue }
      if (pass.length < 6) { results.push({ email, ok: false, error: 'รหัสผ่านต้องมีอย่างน้อย 6 ตัวอักษร' }); continue }
      if (!['user', 'admin', 'master'].includes(r)) { results.push({ email, ok: false, error: `role "${r}" ไม่ถูกต้อง` }); continue }
      if (!canManage(me.role, r)) { results.push({ email, ok: false, error: 'ไม่มีสิทธิ์สร้าง role นี้' }); continue }

      const { data, error } = await admin.auth.admin.createUser({
        email, password: pass, email_confirm: true, user_metadata: { role: r },
      })
      if (error || !data.user) { results.push({ email, ok: false, error: friendly(error?.message) }); continue }

      // ให้แน่ใจว่ามีแถวใน profiles พร้อม role ที่ถูกต้อง (แม้ trigger ไม่ทำงาน)
      const { error: pErr } = await admin.from('profiles').upsert({ id: data.user.id, email, role: r })
      results.push(pErr
        ? { email, ok: false, error: `สร้างบัญชีแล้วแต่บันทึก profile ไม่สำเร็จ: ${pErr.message}` }
        : { email, ok: true })
    }
    return NextResponse.json({ results })
  }

  // ---------- แก้ไข / ลบ ----------
  if (!id) return fail('ไม่ได้ระบุผู้ใช้')
  const { data: target } = await admin.from('profiles').select('role').eq('id', id).single()
  if (!target) return fail('ไม่พบผู้ใช้นี้', 404)
  if (id === me.id) return fail('ไม่สามารถแก้ไขหรือลบบัญชีของตัวเองได้', 403)
  if (!canManage(me.role, target.role)) return fail('ไม่มีสิทธิ์จัดการผู้ใช้ระดับนี้', 403)

  if (action === 'delete') {
    const { error } = await admin.auth.admin.deleteUser(id)
    if (error) return fail(friendly(error.message), 500)
    return NextResponse.json({ ok: true })
  }

  if (action === 'update') {
    if (password) {
      if (String(password).length < 6) return fail('รหัสผ่านต้องมีอย่างน้อย 6 ตัวอักษร')
      const { error } = await admin.auth.admin.updateUserById(id, { password })
      if (error) return fail(friendly(error.message), 500)
    }
    if (role && role !== target.role) {
      if (!['user', 'admin'].includes(role) || !canManage(me.role, role)) return fail('ไม่มีสิทธิ์ตั้ง role นี้', 403)
      const { error } = await admin.from('profiles').update({ role }).eq('id', id)
      if (error) return fail(error.message, 500)
    }
    return NextResponse.json({ ok: true })
  }

  return fail('action ไม่ถูกต้อง')
}
