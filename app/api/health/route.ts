import { NextResponse } from 'next/server'
import dns from 'node:dns'

export const runtime = 'nodejs'
export const dynamic = 'force-dynamic'
try { dns.setDefaultResultOrder('ipv4first') } catch {}

/** หน้าตรวจระบบ: เปิด http://localhost:3000/api/health  (ไม่เปิดเผยค่าคีย์) */
export async function GET() {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL
  const anon = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY
  const service = process.env.SUPABASE_SERVICE_ROLE_KEY?.trim()

  const env = {
    url_set: !!url,
    anon_set: !!anon,
    service_set: !!service,
    service_looks_real: !!service && !service.includes('...') && (service.startsWith('sb_secret_') || (service.startsWith('eyJ') && service.length >= 100)),
    service_same_as_anon: !!service && service === anon?.trim(),
  }

  let connection: any = { ok: false }
  if (url && anon) {
    try {
      const r = await fetch(`${url}/auth/v1/health`, {
        headers: { apikey: anon },
        signal: AbortSignal.timeout(8000),
      })
      connection = { ok: r.ok, status: r.status }
    } catch (e: any) {
      connection = {
        ok: false,
        error: e?.message,
        code: e?.cause?.code ?? e?.cause?.message ?? e?.name,
      }
    }
  }

  return NextResponse.json({ node: process.version, env, connection })
}
