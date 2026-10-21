'use client'
import { useEffect, useState } from 'react'
import Link from 'next/link'
import { useParams } from 'next/navigation'
import { supabase } from '@/lib/supabase'
import { useAuth } from '@/lib/useAuth'

export default function CategoryPage() {
  const role = useAuth()
  const { id } = useParams<{ id: string }>()
  const [cat, setCat] = useState<any>(null)
  const [manuals, setManuals] = useState<any[]>([])
  const [q, setQ] = useState('')
  const [loaded, setLoaded] = useState(false)

  useEffect(() => {
    if (!role) return
    ;(async () => {
      const c = await supabase.from('categories').select('*').eq('id', id).single()
      setCat(c.data)
      const m = await supabase.from('manuals').select('id,title,created_at')
        .eq('category_id', id).order('title')
      setManuals(m.data ?? [])
      setLoaded(true)
    })()
  }, [role, id])

  if (!role || !loaded) return (
    <div className="min-h-screen bg-[#05070c] flex flex-col items-center justify-center space-y-4">
      <div className="relative w-16 h-16">
        <div className="absolute inset-0 border-4 border-indigo-500/20 rounded-full"></div>
        <div className="absolute inset-0 border-4 border-indigo-500 border-t-transparent rounded-full animate-spin"></div>
      </div>
      <p className="text-slate-400 text-sm font-medium tracking-wide animate-pulse">กำลังโหลดข้อมูลหมวดหมู่...</p>
    </div>
  )

  if (!cat) return (
    <div className="min-h-screen bg-[#05070c] text-slate-100 flex flex-col items-center justify-center p-6">
      <div className="max-w-md w-full bg-slate-900/60 backdrop-blur-3xl border border-white/10 p-8 rounded-3xl text-center space-y-5 shadow-2xl relative overflow-hidden">
        <div className="absolute -top-24 -left-24 w-48 h-48 bg-indigo-500/10 rounded-full blur-3xl pointer-events-none"></div>
        <div className="w-16 h-16 bg-indigo-500/10 border border-indigo-500/20 rounded-2xl mx-auto flex items-center justify-center text-3xl">
          📭
        </div>
        <div className="space-y-1">
          <h2 className="text-lg font-bold text-white">ไม่พบหมวดหมู่นี้ในระบบ</h2>
          <p className="text-xs text-slate-400">หมวดหมู่อาจถูกลบออกไปแล้วหรือลิงก์ไม่ถูกต้อง</p>
        </div>
        <div className="pt-2">
          <Link href="/" className="inline-flex items-center gap-2 px-6 py-3 bg-gradient-to-r from-indigo-600 to-blue-600 hover:from-indigo-500 hover:to-blue-500 text-white rounded-2xl text-xs font-bold transition-all shadow-lg shadow-indigo-600/30">
            <span>←</span> กลับหน้าหลักคลังคู่มือ
          </Link>
        </div>
      </div>
    </div>
  )

  const shown = manuals.filter(m => m.title.toLowerCase().includes(q.toLowerCase()))

  return (
    <main className="min-h-screen bg-[#05070c] text-slate-100 relative overflow-hidden pb-24 selection:bg-indigo-500 selection:text-white font-sans">
      
      {/* Background Decorative Glows */}
      <div className="absolute top-0 left-1/3 w-[600px] h-[600px] bg-indigo-600/10 rounded-full blur-[160px] pointer-events-none"></div>
      <div className="absolute bottom-1/4 right-10 w-[500px] h-[500px] bg-blue-600/10 rounded-full blur-[160px] pointer-events-none"></div>
      
      {/* Subtle Grid Background */}
      <div className="absolute inset-0 bg-[radial-gradient(#1e293b_1px,transparent_1px)] [background-size:32px_32px] opacity-20 pointer-events-none"></div>

      <div className="max-w-5xl mx-auto px-4 sm:px-6 pt-10 space-y-8 relative z-10">
        
        {/* Navigation Breadcrumb / Back Button */}
        <div>
          <Link href="/" className="inline-flex items-center gap-2 px-4 py-2.5 rounded-2xl bg-slate-900/60 backdrop-blur-2xl border border-white/10 text-indigo-300 text-xs font-bold hover:bg-slate-800/80 hover:border-indigo-500/30 transition-all shadow-lg group">
            <span className="transform group-hover:-translate-x-1 transition-transform">←</span> กลับหน้าหลักคลังคู่มือ
          </Link>
        </div>

        {/* Category Header Card */}
        <div className="bg-slate-900/60 backdrop-blur-3xl border border-white/10 rounded-3xl shadow-2xl overflow-hidden relative group">
          {cat.image_url ? (
            <div className="relative h-72 w-full overflow-hidden">
              <img src={cat.image_url} alt={cat.title} className="h-full w-full object-cover group-hover:scale-105 transition-transform duration-700" />
              <div className="absolute inset-0 bg-gradient-to-t from-[#05070c] via-[#05070c]/50 to-transparent"></div>
              <div className="absolute bottom-6 left-6 right-6 space-y-2.5">
                <span className="px-3.5 py-1 rounded-full bg-indigo-500/20 text-indigo-300 border border-indigo-500/30 text-[11px] font-bold backdrop-blur-md">
                  หมวดหมู่คู่มือ
                </span>
                <h1 className="text-2xl sm:text-4xl font-black text-white tracking-tight drop-shadow-lg">{cat.title}</h1>
                {cat.description && <p className="text-sm text-slate-300 max-w-2xl leading-relaxed">{cat.description}</p>}
              </div>
            </div>
          ) : (
            <div className="p-8 sm:p-12 space-y-4 bg-gradient-to-br from-indigo-950/40 via-slate-900/60 to-[#05070c] relative">
              <span className="px-3.5 py-1 rounded-full bg-indigo-500/20 text-indigo-300 border border-indigo-500/30 text-[11px] font-bold">
                หมวดหมู่คู่มือ
              </span>
              <h1 className="text-2xl sm:text-4xl font-black text-white tracking-tight">{cat.title}</h1>
              {cat.description && <p className="text-sm text-slate-300 max-w-2xl leading-relaxed">{cat.description}</p>}
            </div>
          )}
        </div>

        {/* Search Bar for Manuals */}
        {manuals.length > 0 && (
          <div className="relative group">
            <span className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none text-slate-400 group-focus-within:text-indigo-400 transition-colors">🔍</span>
            <input 
              className="w-full bg-slate-900/60 backdrop-blur-3xl border border-white/10 rounded-2xl pl-12 pr-4 py-4 text-xs sm:text-sm text-white placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-indigo-500/80 focus:border-indigo-500/80 transition-all shadow-inner" 
              placeholder="ค้นหาชื่อคู่มือในหมวดนี้..."
              value={q} 
              onChange={e => setQ(e.target.value)} 
            />
          </div>
        )}

        {/* Manuals Section */}
        <div className="space-y-4">
          <div className="flex items-center justify-between px-1">
            <h3 className="text-xs font-bold text-slate-400 uppercase tracking-wider flex items-center gap-2">
              <span>📄</span> รายชื่อคู่มือทั้งหมด ({shown.length})
            </h3>
          </div>

          <div className="grid sm:grid-cols-2 gap-4">
            {shown.map(m => (
              <Link 
                key={m.id} 
                href={`/manual/${m.id}`}
                className="group bg-slate-900/50 backdrop-blur-2xl border border-white/10 rounded-2xl p-5 shadow-xl flex items-center gap-4 hover:border-indigo-500/50 hover:shadow-2xl hover:shadow-indigo-500/15 transition-all duration-300 transform hover:-translate-y-1"
              >
                <div className="w-12 h-12 rounded-2xl bg-indigo-500/10 border border-indigo-500/20 grid place-items-center text-2xl shrink-0 group-hover:scale-110 transition-transform shadow-inner">
                  📕
                </div>
                <div className="min-w-0 flex-grow">
                  <p className="font-bold text-sm text-white group-hover:text-indigo-400 transition-colors truncate">{m.title}</p>
                  <p className="text-xs text-slate-400 mt-1 font-mono">
                    เพิ่มเมื่อ {new Date(m.created_at).toLocaleDateString('th-TH', { year: 'numeric', month: 'short', day: 'numeric' })}
                  </p>
                </div>
                <span className="text-slate-500 group-hover:text-indigo-400 transition-transform group-hover:translate-x-1 shrink-0 text-sm font-bold">→</span>
              </Link>
            ))}
          </div>
        </div>

        {/* Empty States */}
        {manuals.length === 0 && (
          <div className="text-center py-24 bg-slate-900/30 rounded-3xl border border-white/5 backdrop-blur-3xl space-y-3">
            <p className="text-5xl">📁</p>
            <p className="text-slate-300 font-semibold text-base">ยังไม่มีคู่มือในหมวดหมู่นี้</p>
            <p className="text-slate-500 text-xs">สามารถอัปโหลดคู่มือเพิ่มได้ผ่านหน้าแดชบอร์ดแอดมิน</p>
          </div>
        )}

        {manuals.length > 0 && shown.length === 0 && (
          <div className="text-center py-20 bg-slate-900/30 rounded-3xl border border-white/5 backdrop-blur-3xl space-y-2">
            <p className="text-4xl">🔍</p>
            <p className="text-slate-300 font-semibold text-sm">ไม่พบคู่มือที่ตรงกับคำค้นหาของคุณ</p>
            <p className="text-slate-500 text-xs">ลองเปลี่ยนคำค้นหาใหม่อีกครั้ง</p>
          </div>
        )}

      </div>
    </main>
  )
}