import { supabase } from './supabase'

/** เรียก /api/users — คืน object ที่มี error (string) เสมอเมื่อมีปัญหา */
export async function callUsersApi(body: object): Promise<any> {
  const { data: { session } } = await supabase.auth.getSession()
  if (!session) return { error: 'Session หมดอายุ กรุณาเข้าสู่ระบบใหม่' }
  try {
    const res = await fetch('/api/users', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${session.access_token}` },
      body: JSON.stringify(body),
    })
    const json = await res.json().catch(() => ({}))
    if (!res.ok && !json.error) json.error = `เซิร์ฟเวอร์ตอบกลับ ${res.status}`
    return json
  } catch {
    return { error: 'เชื่อมต่อเซิร์ฟเวอร์ไม่ได้' }
  }
}

/** CSV: บรรทัดแรกเป็นหัวตาราง (email,password,role) */
export function parseCsv(text: string) {
  return text.replace(/^\uFEFF/, '').trim().split(/\r?\n/).slice(1).filter(Boolean).map(l => {
    const [email, password, role] = l.split(',').map(s => s.trim())
    return { email, password, role: role || 'user' }
  })
}
