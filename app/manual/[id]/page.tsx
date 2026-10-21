'use client'
import { useEffect, useState } from 'react'
import Link from 'next/link'
import { useParams } from 'next/navigation'
import { supabase } from '@/lib/supabase'
import { useAuth } from '@/lib/useAuth'

export default function Viewer() {
  const role = useAuth()
  const { id } = useParams<{ id: string }>()
  const [title, setTitle] = useState('')
  const [catId, setCatId] = useState('')
  const [url, setUrl] = useState('')
  const [err, setErr] = useState('')
  const [loading, setLoading] = useState(true)

  const loadPdf = async () => {
    try {
      setLoading(true)
      setErr('')
      const { data: m, error: mErr } = await supabase.from('manuals').select('*').eq('id', id).single()
      if (mErr || !m) return setErr('ไม่พบคู่มือในระบบ')
      setTitle(m.title)
      setCatId(m.category_id)

      const { data: s, error: sErr } = await supabase.storage.from('manuals').createSignedUrl(m.file_path, 7200)
      if (sErr || !s) return setErr('ไม่สามารถเปิดไฟล์ PDF ได้ (ตรวจสอบสิทธิ์ Storage Bucket)')
      setUrl(s.signedUrl)
    } catch (e) {
      console.error('PDF Load Exception:', e)
      setErr('โหลด PDF ไม่สำเร็จ กรุณาลองใหม่อีกครั้ง')
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    if (!role) return
    loadPdf()
  }, [role, id])

  const download = async () => {
    if (!url) return
    const blob = await (await fetch(url)).blob()
    const a = document.createElement('a')
    a.href = URL.createObjectURL(blob)
    a.download = `${title}.pdf`
    a.click()
  }

  return (
    <div className="min-h-screen bg-[#05070c] text-slate-100 flex flex-col font-sans selection:bg-indigo-500 selection:text-white relative">
      <div className="sticky top-0 z-50 bg-slate-900/80 backdrop-blur-2xl border-b border-white/10 px-4 sm:px-6 py-3.5 shadow-2xl flex flex-wrap items-center justify-between gap-3">
        <div className="flex items-center gap-3.5 min-w-0 flex-1">
          <Link href={catId ? `/category/${catId}` : '/'} className="px-3.5 py-2 rounded-xl bg-slate-800 hover:bg-slate-700 border border-white/10 text-indigo-300 text-xs font-bold transition-all shrink-0 flex items-center gap-1.5">
            <span>←</span> กลับ
          </Link>
          <div className="min-w-0 flex items-center gap-2">
            <span className="text-lg">📕</span>
            <b className="font-bold text-sm text-white truncate">{title || 'กำลังโหลดคู่มือ...'}</b>
          </div>
        </div>

        <div className="flex items-center gap-2.5 shrink-0 flex-wrap">
          <button onClick={download} disabled={!url} className="px-3.5 py-2 bg-indigo-600 hover:bg-indigo-500 text-white rounded-xl text-xs font-bold transition-all disabled:opacity-50">⬇ ดาวน์โหลด</button>
        </div>
      </div>

      <div className="flex-1 w-full h-[calc(100vh-80px)] p-4 sm:p-6 relative z-10 flex flex-col">
        {err && (
          <div className="bg-red-500/10 border border-red-500/30 text-red-300 p-8 rounded-3xl backdrop-blur-xl text-center space-y-4 max-w-md w-full shadow-2xl m-auto">
            <p className="text-3xl">⚠️</p>
            <p className="text-sm font-semibold">{err}</p>
            <button onClick={loadPdf} className="px-5 py-2.5 bg-indigo-600 hover:bg-indigo-500 text-white rounded-xl text-xs font-bold shadow-lg transition-all">
              🔄 ลองโหลดใหม่อีกครั้ง
            </button>
          </div>
        )}

        {loading && !err && (
          <div className="flex flex-col items-center justify-center gap-3 m-auto">
            <div className="w-12 h-12 border-4 border-indigo-500/20 border-t-indigo-500 rounded-full animate-spin"></div>
            <p className="text-slate-400 text-sm font-medium animate-pulse">กำลังเตรียมเอกสาร PDF...</p>
          </div>
        )}

        {!loading && url && !err && (
          <iframe 
            src={`${url}#toolbar=1`} 
            className="w-full flex-1 rounded-2xl border border-white/10 shadow-2xl bg-white"
            title={title}
          />
        )}
      </div>
    </div>
  )
}