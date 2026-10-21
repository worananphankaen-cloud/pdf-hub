'use client'
import { useEffect, useState } from 'react'
import Link from 'next/link'
import { supabase } from '@/lib/supabase'
import { useAuth } from '@/lib/useAuth'

export default function Home() {
  const role = useAuth()
  const [cats, setCats] = useState<any[]>([])
  const [counts, setCounts] = useState<Record<string, number>>({})
  const [notis, setNotis] = useState<any[]>([])
  const [showToast, setShowToast] = useState(false)
  const [searchQuery, setSearchQuery] = useState('')

  useEffect(() => {
    if (!role) return
    supabase.from('categories').select('*').order('title').then(r => setCats(r.data ?? []))
    supabase.from('manuals').select('category_id').then(r => {
      const c: Record<string, number> = {}
      ;(r.data ?? []).forEach((m: any) => { c[m.category_id] = (c[m.category_id] ?? 0) + 1 })
      setCounts(c)
    })
    supabase.from('notifications').select('*').order('created_at', { ascending: false }).limit(5)
      .then(r => {
        setNotis(r.data ?? [])
        if ((r.data ?? []).length > 0) {
          setShowToast(true)
          const timer = setTimeout(() => setShowToast(false), 5000)
          return () => clearTimeout(timer)
        }
      })
  }, [role])

  const filteredCats = cats.filter(c => 
    c.title?.toLowerCase().includes(searchQuery.toLowerCase()) ||
    c.description?.toLowerCase().includes(searchQuery.toLowerCase())
  )

  if (!role) return (
    <div className="min-h-screen bg-[#060913] flex flex-col items-center justify-center space-y-4">
      <div className="relative w-16 h-16">
        <div className="absolute inset-0 border-4 border-indigo-500/20 rounded-full"></div>
        <div className="absolute inset-0 border-4 border-indigo-500 border-t-transparent rounded-full animate-spin"></div>
      </div>
      <p className="text-slate-400 text-sm font-medium tracking-wide animate-pulse">กำลังตรวจสอบสิทธิ์การเข้าใช้งาน...</p>
    </div>
  )

  return (
    <div className="min-h-screen bg-[#060913] text-slate-100 flex selection:bg-indigo-500 selection:text-white font-sans">
      
      {/* Toast Notification Popup มุมขวาบน */}
      {showToast && notis.length > 0 && (
        <div className="fixed top-6 right-6 z-50 max-w-sm w-full bg-slate-900/90 backdrop-blur-2xl border border-indigo-500/30 p-4 rounded-2xl shadow-2xl shadow-indigo-500/20 animate-bounce duration-300">
          <div className="flex items-start gap-3">
            <div className="p-2 bg-indigo-500/20 rounded-xl text-indigo-400 shrink-0">🔔</div>
            <div className="flex-grow">
              <div className="flex items-center justify-between">
                <h4 className="text-xs font-bold text-indigo-300 uppercase tracking-wider">ประกาศแจ้งเตือน</h4>
                <button onClick={() => setShowToast(false)} className="text-slate-400 hover:text-white text-xs">✕</button>
              </div>
              <p className="text-sm font-semibold text-white mt-0.5 line-clamp-1">{notis[0].title}</p>
              <p className="text-[11px] text-slate-400 mt-0.5">
                {new Date(notis[0].created_at).toLocaleDateString('th-TH', { year: 'numeric', month: 'short', day: 'numeric' })}
              </p>
            </div>
          </div>
        </div>
      )}

      {/* Sidebar เมนูด้านข้าง */}
      <aside className="hidden lg:flex flex-col w-72 bg-slate-900/40 backdrop-blur-3xl border-r border-white/5 p-6 sticky top-0 h-screen justify-between">
        <div className="space-y-8">
          <div className="flex items-center gap-3 px-2">
            <div className="w-10 h-10 bg-gradient-to-tr from-indigo-600 to-cyan-400 rounded-xl flex items-center justify-center shadow-lg shadow-indigo-500/30 text-xl">
              📚
            </div>
            <div>
              <h1 className="font-extrabold text-base tracking-tight text-white">ITH Gosoft</h1>
              <p className="text-[10px] text-indigo-300/70 font-medium">Knowledge Hub Portal</p>
            </div>
          </div>

          <nav className="space-y-1.5">
            <a href="#" className="flex items-center gap-3 px-4 py-3 rounded-xl bg-indigo-600/15 text-indigo-300 text-xs font-bold border border-indigo-500/20">
              <span>🏠</span> หน้าแรกคลังคู่มือ
            </a>
            {role !== 'user' && (
              <Link href="/admin" className="flex items-center gap-3 px-4 py-3 rounded-xl text-slate-400 hover:text-white hover:bg-white/5 text-xs font-semibold transition-all">
                <span>⚡</span> แดชบอร์ดแอดมิน
              </Link>
            )}
          </nav>
        </div>

        <div className="space-y-4 pt-4 border-t border-white/5">
          <div className="px-4 py-3 rounded-2xl bg-slate-950/60 border border-white/5 flex items-center justify-between">
            <div>
              <p className="text-[10px] text-slate-400">สถานะผู้ใช้งาน</p>
              <p className="text-xs font-bold text-indigo-300 uppercase">{role}</p>
            </div>
            <div className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse"></div>
          </div>
          <button 
            onClick={() => supabase.auth.signOut().then(() => (location.href = '/login'))}
            className="w-full px-4 py-2.5 rounded-xl bg-red-500/10 hover:bg-red-500/20 border border-red-500/20 text-red-300 text-xs font-bold transition-all flex items-center justify-center gap-2 cursor-pointer"
          >
            <span>🚪</span> ออกจากระบบ
          </button>
        </div>
      </aside>

      {/* Main Content Area */}
      <main className="flex-1 min-w-0 relative overflow-y-auto">
        <div className="absolute top-0 right-1/4 w-[500px] h-[500px] bg-indigo-600/10 rounded-full blur-[140px] pointer-events-none"></div>

        <div className="max-w-6xl mx-auto px-4 sm:px-8 py-8 space-y-8 relative z-10">
          
          {/* Top Mobile Header */}
          <div className="flex lg:hidden items-center justify-between bg-slate-900/60 backdrop-blur-2xl p-4 rounded-2xl border border-white/10">
            <div className="flex items-center gap-3">
              <span className="text-2xl">📚</span>
              <h1 className="font-bold text-sm text-white">ITH Gosoft Hub</h1>
            </div>
            <button 
              onClick={() => supabase.auth.signOut().then(() => (location.href = '/login'))}
              className="px-3 py-1.5 bg-red-500/10 border border-red-500/20 text-red-300 text-xs rounded-xl font-semibold"
            >
              ออกจากระบบ
            </button>
          </div>

          {/* Hero Banner Section */}
          <div className="relative bg-gradient-to-r from-indigo-950/60 via-slate-900/80 to-slate-900/40 backdrop-blur-3xl border border-white/10 p-8 rounded-3xl shadow-2xl overflow-hidden">
            <div className="absolute -right-10 -bottom-10 text-9xl opacity-5 select-none">📖</div>
            <div className="relative z-10 max-w-2xl space-y-3">
              <span className="px-3 py-1 rounded-full bg-indigo-500/20 text-indigo-300 text-xs font-bold border border-indigo-500/30">
                ระบบจัดการความรู้ภายในองค์กร
              </span>
              <h2 className="text-2xl sm:text-3xl font-black text-white tracking-tight">
                ยินดีต้อนรับสู่คลังคู่มือปฏิบัติงาน
              </h2>
              <p className="text-xs sm:text-sm text-slate-400 leading-relaxed">
                ค้นหาคู่มือ ระเบียบปฏิบัติ และข้อมูลสนับสนุนการทำงานทั้งหมดของคุณได้ที่นี่ รวดเร็ว และเป็นระเบียบ
              </p>

              <div className="pt-2">
                <div className="relative">
                  <span className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none text-slate-400">🔍</span>
                  <input 
                    type="text"
                    placeholder="ค้นหาหมวดหมู่คู่มือ..."
                    value={searchQuery}
                    onChange={e => setSearchQuery(e.target.value)}
                    className="w-full bg-slate-950/70 border border-white/10 rounded-2xl pl-11 pr-4 py-3 text-xs sm:text-sm text-white placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-indigo-500 transition-all shadow-inner"
                  />
                </div>
              </div>
            </div>
          </div>

          {/* Categories Grid Section */}
          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <h3 className="text-base font-bold text-white flex items-center gap-2">
                <span>📁</span> หมวดหมู่ทั้งหมด ({filteredCats.length})
              </h3>
            </div>

            <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-6">
              {filteredCats.map(c => (
                <Link 
                  key={c.id} 
                  href={`/category/${c.id}`}
                  className="group bg-slate-900/50 backdrop-blur-2xl border border-white/10 rounded-3xl shadow-xl overflow-hidden hover:border-indigo-500/50 hover:shadow-2xl hover:shadow-indigo-500/15 transition-all duration-300 flex flex-col transform hover:-translate-y-1"
                >
                  {c.image_url ? (
                    <div className="relative h-44 w-full overflow-hidden">
                      <img 
                        src={c.image_url} 
                        alt={c.title} 
                        className="h-full w-full object-cover group-hover:scale-110 transition-transform duration-700" 
                      />
                      <div className="absolute inset-0 bg-gradient-to-t from-slate-950 via-slate-950/20 to-transparent"></div>
                      <div className="absolute top-3 right-3 bg-slate-900/80 backdrop-blur-md px-3 py-1 rounded-full border border-white/10 text-xs font-semibold text-indigo-300">
                        {counts[c.id] ?? 0} คู่มือ
                      </div>
                    </div>
                  ) : (
                    <div className="h-44 bg-gradient-to-br from-slate-800 to-slate-900 grid place-items-center text-5xl border-b border-white/5 relative group-hover:from-indigo-950/40 transition-colors">
                      <span className="transform group-hover:scale-110 transition-transform duration-300">📁</span>
                      <div className="absolute top-3 right-3 bg-slate-900/80 backdrop-blur-md px-3 py-1 rounded-full border border-white/10 text-xs font-semibold text-indigo-300">
                        {counts[c.id] ?? 0} คู่มือ
                      </div>
                    </div>
                  )}
                  
                  <div className="p-6 flex flex-col flex-grow justify-between space-y-4">
                    <div className="space-y-1.5">
                      <h4 className="font-bold text-base text-white group-hover:text-indigo-400 transition-colors line-clamp-1">
                        {c.title}
                      </h4>
                      <p className="text-xs text-slate-400 line-clamp-2 leading-relaxed">
                        {c.description || 'ไม่มีคำอธิบายหมวดหมู่'}
                      </p>
                    </div>

                    <div className="pt-4 border-t border-white/5 flex items-center justify-between text-xs">
                      <span className="text-slate-500 font-medium">เข้าสู่หมวดหมู่</span>
                      <span className="text-indigo-400 group-hover:text-white flex items-center gap-1 font-bold transition-colors">
                        เปิดดูเนื้อหา <span className="transform group-hover:translate-x-1.5 transition-transform">→</span>
                      </span>
                    </div>
                  </div>
                </Link>
              ))}
            </div>

            {filteredCats.length === 0 && (
              <div className="text-center py-20 bg-slate-900/30 rounded-3xl border border-white/5 backdrop-blur-xl">
                <p className="text-4xl mb-2">🔍</p>
                <p className="text-slate-300 font-semibold text-sm">ไม่พบหมวดหมู่ที่คุณค้นหา</p>
                <p className="text-slate-500 text-xs mt-1">ลองเปลี่ยนคำค้นหาใหม่อีกครั้ง</p>
              </div>
            )}
          </div>

        </div>
      </main>
    </div>
  )
}