'use client'
import { useEffect, useRef, useState } from 'react'
import Link from 'next/link'
import { useParams } from 'next/navigation'
import { supabase } from '@/lib/supabase'
import { useAuth } from '@/lib/useAuth'
import * as pdfjsLib from 'pdfjs-dist'

if (typeof window !== 'undefined') {
  pdfjsLib.GlobalWorkerOptions.workerSrc = `https://cdnjs.cloudflare.com/ajax/libs/pdf.js/${pdfjsLib.version}/pdf.worker.min.js`
}

export default function Viewer() {
  const role = useAuth()
  const { id } = useParams<{ id: string }>()
  const [title, setTitle] = useState('')
  const [catId, setCatId] = useState('')
  const [url, setUrl] = useState('')
  const [pages, setPages] = useState(0)
  const [jump, setJump] = useState('')
  const [err, setErr] = useState('')
  const [scale, setScale] = useState(1.0)
  const [darkModePdf, setDarkModePdf] = useState(false)
  const [loading, setLoading] = useState(true)
  const pdfRef = useRef<any>(null)
  const boxRef = useRef<HTMLDivElement>(null)

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

      const loadingTask = pdfjsLib.getDocument(s.signedUrl)
      const pdf = await loadingTask.promise
      pdfRef.current = pdf
      setPages(pdf.numPages)

      // คำนวณสเกลให้พอดีกับหน้าจออัตโนมัติจากหน้าแรก
      const page = await pdf.getPage(1)
      const unscaledVp = page.getViewport({ scale: 1.0 })
      const containerWidth = Math.min(window.innerWidth - 64, 900)
      setScale(containerWidth / unscaledVp.width)
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

  useEffect(() => {
    if (!pages || !boxRef.current || !pdfRef.current) return
    const io = new IntersectionObserver(async entries => {
      for (const e of entries) {
        const el = e.target as HTMLCanvasElement
        if (!e.isIntersecting) continue
        const page = await pdfRef.current.getPage(Number(el.dataset.p))
        const vp = page.getViewport({ scale })
        el.width = vp.width
        el.height = vp.height
        await page.render({ canvasContext: el.getContext('2d')!, viewport: vp }).promise
      }
    }, { rootMargin: '600px' })
    boxRef.current.querySelectorAll('canvas').forEach(c => io.observe(c))
    return () => io.disconnect()
  }, [pages, scale])

  const goTo = () => {
    const n = Math.min(Math.max(1, Number(jump) || 1), pages)
    document.getElementById(`page-${n}`)?.scrollIntoView({ behavior: 'smooth' })
  }

  const print = async () => {
    const blob = await (await fetch(url)).blob()
    const f = document.createElement('iframe')
    f.style.display = 'none'
    f.src = URL.createObjectURL(blob)
    document.body.appendChild(f)
    f.onload = () => f.contentWindow?.print()
  }

  const download = async () => {
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
          <div className="flex items-center gap-1 bg-slate-950/60 border border-white/10 p-1 rounded-xl">
            <button onClick={() => setScale(s => Math.max(0.5, s - 0.15))} className="px-2.5 py-1 bg-slate-800 hover:bg-slate-700 rounded-lg text-xs font-bold">-</button>
            <span className="text-xs px-2 font-mono">{Math.round(scale * 100)}%</span>
            <button onClick={() => setScale(s => Math.min(2.5, s + 0.15))} className="px-2.5 py-1 bg-slate-800 hover:bg-slate-700 rounded-lg text-xs font-bold">+</button>
          </div>

          <button onClick={() => setDarkModePdf(!darkModePdf)} className={`px-3 py-1.5 rounded-xl text-xs font-bold border transition-all ${darkModePdf ? 'bg-indigo-600 border-indigo-400 text-white' : 'bg-slate-800 border-white/10 text-slate-300'}`}>
            🌙 Dark PDF
          </button>

          <div className="flex items-center gap-2 bg-slate-950/60 border border-white/10 px-3 py-1.5 rounded-xl text-xs">
            <span className="text-slate-400">หน้า</span>
            <input className="bg-slate-900 border border-white/10 rounded-lg w-14 p-1 text-center text-white focus:outline-none" value={jump} onChange={e => setJump(e.target.value)} onKeyDown={e => e.key === 'Enter' && goTo()} placeholder={pages ? `1-${pages}` : ''} />
            <button onClick={goTo} className="px-2 py-1 bg-indigo-600/20 text-indigo-300 rounded-lg font-bold border border-indigo-500/30">ไป</button>
          </div>

          <button onClick={download} disabled={!url} className="px-3.5 py-2 bg-indigo-600 hover:bg-indigo-500 text-white rounded-xl text-xs font-bold transition-all disabled:opacity-50">⬇ ดาวน์โหลด</button>
          <button onClick={print} disabled={!url} className="px-3.5 py-2 bg-slate-800 hover:bg-slate-700 text-slate-200 border border-white/10 rounded-xl text-xs font-bold transition-all disabled:opacity-50">🖨 พิมพ์</button>
        </div>
      </div>

      <div className="flex-1 flex flex-col items-center justify-center p-4 sm:p-6 relative z-10">
        {err && (
          <div className="bg-red-500/10 border border-red-500/30 text-red-300 p-8 rounded-3xl backdrop-blur-xl text-center space-y-4 max-w-md w-full shadow-2xl">
            <p className="text-3xl">⚠️</p>
            <p className="text-sm font-semibold">{err}</p>
            <button onClick={loadPdf} className="px-5 py-2.5 bg-indigo-600 hover:bg-indigo-500 text-white rounded-xl text-xs font-bold shadow-lg transition-all">
              🔄 ลองโหลดใหม่อีกครั้ง
            </button>
          </div>
        )}

        {loading && !err && (
          <div className="flex flex-col items-center gap-3 py-20">
            <div className="w-12 h-12 border-4 border-indigo-500/20 border-t-indigo-500 rounded-full animate-spin"></div>
            <p className="text-slate-400 text-sm font-medium animate-pulse">กำลังดึงข้อมูลเอกสาร PDF...</p>
          </div>
        )}

        <div ref={boxRef} className="flex flex-col items-center gap-6 w-full max-w-4xl py-4 mx-auto">
          {Array.from({ length: pages }, (_, i) => (
            <canvas key={i} id={`page-${i + 1}`} data-p={i + 1} className={`bg-white shadow-2xl rounded-2xl w-full h-auto object-contain transition-transform duration-300 ${darkModePdf ? 'filter invert hue-rotate-180 brightness-95' : ''}`} />
          ))}
        </div>
      </div>
    </div>
  )
}