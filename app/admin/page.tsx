'use client'
import { useEffect, useState } from 'react'
import Link from 'next/link'
import { supabase } from '@/lib/supabase'
import { useAuth } from '@/lib/useAuth'
import { callUsersApi, parseCsv } from '@/lib/api'

export default function Admin() {
  const role = useAuth(true)
  const [users, setUsers] = useState<any[]>([])
  const [inactive, setInactive] = useState<any[]>([])
  const [cats, setCats] = useState<any[]>([])
  const [manuals, setManuals] = useState<any[]>([])
  const [q, setQ] = useState('')
  const [msg, setMsg] = useState('')
  const [activeTab, setActiveTab] = useState<'users' | 'categories' | 'manuals'>('users')

  const load = async () => {
    setUsers((await supabase.from('profiles').select('*').order('email')).data ?? [])
    setInactive((await supabase.rpc('inactive_users')).data ?? [])
    setCats((await supabase.from('categories').select('*').order('title')).data ?? [])
    setManuals((await supabase.from('manuals').select('*').order('created_at', { ascending: false })).data ?? [])
  }
  useEffect(() => { if (role) load() }, [role])

  if (!role) return (
    <div className="min-h-screen bg-[#060913] flex flex-col items-center justify-center space-y-4">
      <div className="relative w-16 h-16">
        <div className="absolute inset-0 border-4 border-indigo-500/20 rounded-full"></div>
        <div className="absolute inset-0 border-4 border-indigo-500 border-t-transparent rounded-full animate-spin"></div>
      </div>
      <p className="text-slate-400 text-sm font-medium tracking-wide animate-pulse">กำลังตรวจสอบสิทธิ์ผู้ดูแลระบบ...</p>
    </div>
  )

  async function importCsv(file: File) {
    const rows = parseCsv(await file.text())
    if (rows.length === 0) return setMsg('❌ ไฟล์ CSV ว่าง หรือไม่มีข้อมูลใต้บรรทัดหัวตาราง (email,password,role)')
    const r = await callUsersApi({ action: 'create', users: rows })
    if (r.error) return setMsg(`❌ ${r.error}`)
    const fail = r.results.filter((x: any) => !x.ok)
    setMsg(`${fail.length ? '⚠️' : '✅'} นำเข้าสำเร็จ ${r.results.length - fail.length} / ${r.results.length}` +
      (fail.length ? ` — ผิดพลาด: ${fail.map((f: any) => `${f.email} (${f.error})`).join(', ')}` : ''))
    load()
  }

  async function addUser(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault()
    const form = e.currentTarget
    const f = new FormData(form)
    const r = await callUsersApi({ action: 'create', users: [{
      email: f.get('email'), password: f.get('password'), role: f.get('role') }] })
    const first = r.results?.[0]
    if (r.error) return setMsg(`❌ ${r.error}`)
    if (!first?.ok) return setMsg(`❌ ${first?.error ?? 'เพิ่มผู้ใช้ไม่สำเร็จ'}`)
    setMsg(`✅ เพิ่มผู้ใช้ ${first.email} แล้ว`)
    form.reset()
    load()
  }

  async function editUser(u: any) {
    const password = prompt(`รหัสผ่านใหม่ของ ${u.email} (เว้นว่าง = ไม่เปลี่ยน)`) || undefined
    const newRole = role === 'master'
      ? prompt('Role (user / admin) เว้นว่าง = ไม่เปลี่ยน', u.role) || undefined
      : undefined
    if (!password && (!newRole || newRole === u.role)) return
    const r = await callUsersApi({ action: 'update', id: u.id, password, role: newRole })
    setMsg(r.ok ? '✅ แก้ไขแล้ว' : `❌ ${r.error ?? 'แก้ไขไม่สำเร็จ'}`)
    load()
  }

  async function deleteUser(u: any) {
    if (!confirm(`ลบ ${u.email}?`)) return
    const r = await callUsersApi({ action: 'delete', id: u.id })
    setMsg(r.ok ? `✅ ลบ ${u.email} แล้ว` : `❌ ${r.error ?? 'ลบไม่สำเร็จ'}`)
    load()
  }

  async function uploadManual(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault()
    const form = e.currentTarget
    const f = new FormData(form)
    const file = f.get('file') as File
    const title = String(f.get('title'))
    const path = `${crypto.randomUUID()}.pdf`
    const up = await supabase.storage.from('manuals').upload(path, file, { contentType: 'application/pdf' })
    if (up.error) return setMsg(up.error.message)
    const ins = await supabase.from('manuals').insert({ title, category_id: f.get('category_id'), file_path: path })
    if (ins.error) { await supabase.storage.from('manuals').remove([path]); return setMsg(ins.error.message) }
    await supabase.from('notifications').insert({ title: `คู่มือใหม่: ${title}` })
    setMsg('อัปโหลดและแจ้งเตือนแล้ว'); form.reset(); load()
  }

  async function deleteManual(m: any) {
    if (!confirm(`ลบคู่มือ "${m.title}"?`)) return
    await supabase.storage.from('manuals').remove([m.file_path])
    await supabase.from('manuals').delete().eq('id', m.id)
    load()
  }

  async function addCategory(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault()
    const form = e.currentTarget
    const f = new FormData(form)
    await supabase.from('categories').insert({
      title: f.get('title'), description: f.get('description'), image_url: f.get('image_url') || null })
    form.reset(); load()
  }

  async function editCategory(c: any) {
    const title = prompt('ชื่อหมวด', c.title); if (!title) return
    const description = prompt('คำอธิบาย', c.description ?? '') ?? ''
    const image_url = prompt('ลิงก์รูปภาพ', c.image_url ?? '') ?? ''
    await supabase.from('categories').update({ title, description, image_url: image_url || null }).eq('id', c.id)
    load()
  }

  async function deleteCategory(c: any) {
    if (!confirm('ลบหมวดนี้และคู่มือทั้งหมดในหมวด?')) return
    const files = manuals.filter(m => m.category_id === c.id).map(m => m.file_path)
    if (files.length) await supabase.storage.from('manuals').remove(files)
    await supabase.from('categories').delete().eq('id', c.id)
    load()
  }

  const shown = users.filter(u => u.email.toLowerCase().includes(q.toLowerCase()))

  return (
    <div className="min-h-screen bg-[#060913] text-slate-100 flex selection:bg-indigo-500 selection:text-white font-sans">
      
      {/* Sidebar Navigation */}
      <aside className="hidden lg:flex flex-col w-72 bg-slate-900/40 backdrop-blur-3xl border-r border-white/5 p-6 sticky top-0 h-screen justify-between">
        <div className="space-y-8">
          <div className="flex items-center gap-3 px-2">
            <div className="w-10 h-10 bg-gradient-to-tr from-indigo-600 to-cyan-400 rounded-xl flex items-center justify-center shadow-lg shadow-indigo-500/30 text-xl">
              ⚡
            </div>
            <div>
              <h1 className="font-extrabold text-base tracking-tight text-white">Admin Control</h1>
              <p className="text-[10px] text-indigo-300/70 font-medium">ITH Gosoft Portal</p>
            </div>
          </div>

          <nav className="space-y-1.5">
            <Link href="/" className="flex items-center gap-3 px-4 py-3 rounded-xl text-slate-400 hover:text-white hover:bg-white/5 text-xs font-semibold transition-all">
              <span>🏠</span> กลับหน้าคลังคู่มือ
            </Link>
            <button 
              onClick={() => setActiveTab('users')} 
              className={`w-full flex items-center gap-3 px-4 py-3 rounded-xl text-xs font-bold transition-all ${activeTab === 'users' ? 'bg-indigo-600/20 text-indigo-300 border border-indigo-500/30' : 'text-slate-400 hover:text-white hover:bg-white/5'}`}
            >
              <span>👥</span> จัดการผู้ใช้งาน
            </button>
            <button 
              onClick={() => setActiveTab('categories')} 
              className={`w-full flex items-center gap-3 px-4 py-3 rounded-xl text-xs font-bold transition-all ${activeTab === 'categories' ? 'bg-indigo-600/20 text-indigo-300 border border-indigo-500/30' : 'text-slate-400 hover:text-white hover:bg-white/5'}`}
            >
              <span>🗂️</span> จัดการหมวดหมู่
            </button>
            <button 
              onClick={() => setActiveTab('manuals')} 
              className={`w-full flex items-center gap-3 px-4 py-3 rounded-xl text-xs font-bold transition-all ${activeTab === 'manuals' ? 'bg-indigo-600/20 text-indigo-300 border border-indigo-500/30' : 'text-slate-400 hover:text-white hover:bg-white/5'}`}
            >
              <span>📄</span> จัดการคู่มือ PDF
            </button>
          </nav>
        </div>

        <div className="pt-4 border-t border-white/5">
          <button 
            onClick={() => supabase.auth.signOut().then(() => (location.href = '/login'))}
            className="w-full px-4 py-2.5 rounded-xl bg-red-500/10 hover:bg-red-500/20 border border-red-500/20 text-red-300 text-xs font-bold transition-all flex items-center justify-center gap-2"
          >
            <span>🚪</span> ออกจากระบบ
          </button>
        </div>
      </aside>

      {/* Main Content View */}
      <main className="flex-1 min-w-0 relative overflow-y-auto">
        <div className="max-w-6xl mx-auto px-4 sm:px-8 py-8 space-y-6 relative z-10">
          
          {/* Top Bar for Mobile */}
          <div className="flex lg:hidden items-center justify-between bg-slate-900/60 backdrop-blur-2xl p-4 rounded-2xl border border-white/10 mb-4">
            <Link href="/" className="text-indigo-400 text-xs font-bold">← หน้าหลัก</Link>
            <div className="flex gap-2">
              <button onClick={() => setActiveTab('users')} className={`px-3 py-1 rounded-lg text-xs ${activeTab === 'users' ? 'bg-indigo-600 text-white' : 'bg-slate-800 text-slate-300'}`}>ผู้ใช้</button>
              <button onClick={() => setActiveTab('categories')} className={`px-3 py-1 rounded-lg text-xs ${activeTab === 'categories' ? 'bg-indigo-600 text-white' : 'bg-slate-800 text-slate-300'}`}>หมวด</button>
              <button onClick={() => setActiveTab('manuals')} className={`px-3 py-1 rounded-lg text-xs ${activeTab === 'manuals' ? 'bg-indigo-600 text-white' : 'bg-slate-800 text-slate-300'}`}>คู่มือ</button>
            </div>
          </div>

          {/* Stats Summary Cards */}
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
            <div className="bg-slate-900/60 border border-white/10 p-5 rounded-3xl backdrop-blur-2xl flex items-center justify-between shadow-xl">
              <div>
                <p className="text-xs text-slate-400 font-medium">ผู้ใช้งานทั้งหมด</p>
                <p className="text-2xl font-black text-white mt-1">{users.length} คน</p>
              </div>
              <div className="w-12 h-12 rounded-2xl bg-indigo-500/10 border border-indigo-500/20 grid place-items-center text-xl">👥</div>
            </div>
            <div className="bg-slate-900/60 border border-white/10 p-5 rounded-3xl backdrop-blur-2xl flex items-center justify-between shadow-xl">
              <div>
                <p className="text-xs text-slate-400 font-medium">หมวดหมู่คู่มือ</p>
                <p className="text-2xl font-black text-white mt-1">{cats.length} หมวด</p>
              </div>
              <div className="w-12 h-12 rounded-2xl bg-blue-500/10 border border-blue-500/20 grid place-items-center text-xl">🗂️</div>
            </div>
            <div className="bg-slate-900/60 border border-white/10 p-5 rounded-3xl backdrop-blur-2xl flex items-center justify-between shadow-xl">
              <div>
                <p className="text-xs text-slate-400 font-medium">คู่มือ PDF ทั้งหมด</p>
                <p className="text-2xl font-black text-white mt-1">{manuals.length} ไฟล์</p>
              </div>
              <div className="w-12 h-12 rounded-2xl bg-cyan-500/10 border border-cyan-500/20 grid place-items-center text-xl">📄</div>
            </div>
          </div>

          {/* Global Message Alert */}
          {msg && (
            <div className={`p-4 rounded-2xl backdrop-blur-xl border text-xs sm:text-sm font-medium flex items-center justify-between ${
              msg.startsWith('❌') ? 'bg-red-500/10 border-red-500/30 text-red-300' :
              msg.startsWith('⚠️') ? 'bg-amber-500/10 border-amber-500/30 text-amber-300' :
              'bg-emerald-500/10 border-emerald-500/30 text-emerald-300'
            }`}>
              <span>{msg}</span>
              <button onClick={() => setMsg('')} className="text-slate-400 hover:text-white ml-2">✕</button>
            </div>
          )}

          {/* Inactive Users Warning Alert */}
          {inactive.length > 0 && (
            <div className="bg-red-500/10 border border-red-500/30 backdrop-blur-xl rounded-3xl p-6 space-y-3 shadow-xl">
              <div className="flex items-center gap-2 text-red-300 font-bold text-sm">
                <span>⚠️</span> ผู้ใช้ที่ไม่ได้เข้าสู่ระบบเกิน 90 วัน ({inactive.length} คน)
              </div>
              <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-2">
                {inactive.map(u => (
                  <div key={u.id} className="bg-slate-950/50 border border-white/5 p-3 rounded-xl text-xs flex justify-between items-center">
                    <span className="text-slate-300 truncate">{u.email}</span>
                    <span className="text-slate-500 text-[11px] shrink-0 ml-2">{new Date(u.last_login).toLocaleDateString('th-TH')}</span>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* SECTION 1: USERS MANAGEMENT */}
          {(activeTab === 'users' || typeof window !== 'undefined' && window.innerWidth >= 1024) && (
            <section className="bg-slate-900/50 backdrop-blur-2xl border border-white/10 rounded-3xl p-6 sm:p-8 space-y-6 shadow-xl">
              <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
                <h2 className="text-lg font-bold text-white flex items-center gap-2">
                  <span>👥</span> จัดการผู้ใช้งานระบบ
                </h2>
                <div className="w-full sm:w-72">
                  <input 
                    className="w-full bg-slate-950/70 border border-white/10 rounded-xl px-4 py-2 text-xs text-white placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-indigo-500" 
                    placeholder="ค้นหาอีเมลผู้ใช้งาน..." 
                    value={q} 
                    onChange={e => setQ(e.target.value)} 
                  />
                </div>
              </div>

              {/* Add User Form */}
              <form onSubmit={addUser} className="bg-slate-950/40 border border-white/5 p-4 rounded-2xl flex flex-wrap gap-3 items-center">
                <input name="email" type="email" placeholder="อีเมลผู้ใช้ใหม่" className="bg-slate-900 border border-white/10 rounded-xl px-4 py-2 text-xs text-white placeholder-slate-500 flex-1 min-w-[200px] focus:outline-none focus:ring-2 focus:ring-indigo-500" required />
                <input name="password" type="password" minLength={6} placeholder="รหัสผ่าน (อย่างน้อย 6 ตัว)" className="bg-slate-900 border border-white/10 rounded-xl px-4 py-2 text-xs text-white placeholder-slate-500 w-44 focus:outline-none focus:ring-2 focus:ring-indigo-500" required />
                <select name="role" className="bg-slate-900 border border-white/10 rounded-xl px-3 py-2 text-xs text-white focus:outline-none focus:ring-2 focus:ring-indigo-500">
                  <option value="user">user</option>
                  {role === 'master' && <option value="admin">admin</option>}
                </select>
                <button className="bg-indigo-600 hover:bg-indigo-500 text-white rounded-xl px-5 py-2 text-xs font-bold shadow-lg shadow-indigo-600/30 transition-all cursor-pointer">
                  + เพิ่มผู้ใช้
                </button>
              </form>

              {/* CSV Import */}
              <div className="flex items-center justify-between bg-slate-950/40 border border-white/5 p-4 rounded-2xl text-xs">
                <div>
                  <p className="font-bold text-slate-300">นำเข้าผู้ใช้แบบกลุ่ม (Batch Import CSV)</p>
                  <p className="text-slate-500 text-[11px]">รูปแบบหัวตาราง: email, password, role</p>
                </div>
                <label className="bg-slate-800 hover:bg-slate-700 text-indigo-300 border border-indigo-500/20 px-4 py-2 rounded-xl font-bold cursor-pointer transition-all">
                  เลือกไฟล์ CSV
                  <input type="file" accept=".csv" className="hidden"
                    onChange={e => { const f = e.target.files?.[0]; e.target.value = ''; if (f) importCsv(f) }} />
                </label>
              </div>

              {/* Users Table */}
              <div className="overflow-x-auto rounded-2xl border border-white/5">
                <table className="w-full text-xs text-left">
                  <thead className="bg-slate-950/60 text-slate-400 uppercase tracking-wider border-b border-white/5">
                    <tr>
                      <th className="py-3 px-4">อีเมล</th>
                      <th className="py-3 px-4">สิทธิ์ (Role)</th>
                      <th className="py-3 px-4">เข้าสู่ระบบล่าสุด</th>
                      <th className="py-3 px-4 text-right">จัดการ</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-white/5 bg-slate-950/20">
                    {shown.map(u => (
                      <tr key={u.id} className="hover:bg-white/5 transition-colors">
                        <td className="py-3 px-4 font-medium text-white">{u.email}</td>
                        <td className="py-3 px-4">
                          <span className={`px-2.5 py-1 rounded-full text-[10px] font-bold ${u.role === 'master' ? 'bg-purple-500/10 text-purple-300 border border-purple-500/20' : u.role === 'admin' ? 'bg-indigo-500/10 text-indigo-300 border border-indigo-500/20' : 'bg-slate-800 text-slate-300'}`}>
                            {u.role}
                          </span>
                        </td>
                        <td className="py-3 px-4 text-slate-400 font-mono">{new Date(u.last_login).toLocaleDateString('th-TH')}</td>
                        <td className="py-3 px-4 text-right space-x-2">
                          {(role === 'master' || u.role === 'user') && (
                            <>
                              <button className="px-3 py-1 bg-indigo-500/10 hover:bg-indigo-500/20 text-indigo-300 rounded-lg font-bold transition-all" onClick={() => editUser(u)}>แก้ไข</button>
                              <button className="px-3 py-1 bg-red-500/10 hover:bg-red-500/20 text-red-300 rounded-lg font-bold transition-all" onClick={() => deleteUser(u)}>ลบ</button>
                            </>
                          )}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </section>
          )}

          {/* SECTION 2: CATEGORIES MANAGEMENT */}
          {(activeTab === 'categories' || typeof window !== 'undefined' && window.innerWidth >= 1024) && (
            <section className="bg-slate-900/50 backdrop-blur-2xl border border-white/10 rounded-3xl p-6 sm:p-8 space-y-6 shadow-xl">
              <h2 className="text-lg font-bold text-white flex items-center gap-2">
                <span>🗂️</span> จัดการหมวดหมู่คู่มือ
              </h2>

              <form onSubmit={addCategory} className="bg-slate-950/40 border border-white/5 p-4 rounded-2xl flex flex-wrap gap-3 items-center">
                <input name="title" placeholder="ชื่อหมวดหมู่" className="bg-slate-900 border border-white/10 rounded-xl px-4 py-2 text-xs text-white placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-indigo-500" required />
                <input name="description" placeholder="คำอธิบายหมวดหมู่" className="bg-slate-900 border border-white/10 rounded-xl px-4 py-2 text-xs text-white placeholder-slate-500 flex-1 min-w-[200px] focus:outline-none focus:ring-2 focus:ring-indigo-500" />
                <input name="image_url" placeholder="ลิงก์รูปภาพ (https://...)" className="bg-slate-900 border border-white/10 rounded-xl px-4 py-2 text-xs text-white placeholder-slate-500 flex-1 min-w-[200px] focus:outline-none focus:ring-2 focus:ring-indigo-500" />
                <button className="bg-indigo-600 hover:bg-indigo-500 text-white rounded-xl px-5 py-2 text-xs font-bold shadow-lg shadow-indigo-600/30 transition-all cursor-pointer">
                  + เพิ่มหมวดหมู่
                </button>
              </form>

              <div className="grid sm:grid-cols-2 gap-4">
                {cats.map(c => (
                  <div key={c.id} className="bg-slate-950/40 border border-white/5 p-4 rounded-2xl flex items-center justify-between gap-4">
                    <div className="flex items-center gap-3">
                      <div className="w-10 h-10 rounded-xl bg-indigo-500/10 border border-indigo-500/20 grid place-items-center text-lg shrink-0">
                        📁
                      </div>
                      <div className="min-w-0">
                        <h4 className="font-bold text-sm text-white truncate">{c.title}</h4>
                        <p className="text-xs text-slate-400 truncate">{c.description || 'ไม่มีคำอธิบาย'}</p>
                      </div>
                    </div>
                    <div className="flex items-center gap-2 shrink-0">
                      <button className="px-3 py-1.5 bg-indigo-500/10 hover:bg-indigo-500/20 text-indigo-300 text-xs rounded-xl font-bold transition-all" onClick={() => editCategory(c)}>แก้ไข</button>
                      <button className="px-3 py-1.5 bg-red-500/10 hover:bg-red-500/20 text-red-300 text-xs rounded-xl font-bold transition-all" onClick={() => deleteCategory(c)}>ลบ</button>
                    </div>
                  </div>
                ))}
              </div>
            </section>
          )}

          {/* SECTION 3: MANUALS MANAGEMENT */}
          {(activeTab === 'manuals' || typeof window !== 'undefined' && window.innerWidth >= 1024) && (
            <section className="bg-slate-900/50 backdrop-blur-2xl border border-white/10 rounded-3xl p-6 sm:p-8 space-y-6 shadow-xl">
              <h2 className="text-lg font-bold text-white flex items-center gap-2">
                <span>📄</span> จัดการคู่มือการปฏิบัติงาน (PDF ≤ 50 MB)
              </h2>

              <form onSubmit={uploadManual} className="bg-slate-950/40 border border-white/5 p-4 rounded-2xl flex flex-wrap gap-3 items-center">
                <input name="title" placeholder="ชื่อคู่มือ" className="bg-slate-900 border border-white/10 rounded-xl px-4 py-2 text-xs text-white placeholder-slate-500 flex-1 min-w-[200px] focus:outline-none focus:ring-2 focus:ring-indigo-500" required />
                <select name="category_id" className="bg-slate-900 border border-white/10 rounded-xl px-3 py-2 text-xs text-white focus:outline-none focus:ring-2 focus:ring-indigo-500" required>
                  {cats.map(c => <option key={c.id} value={c.id}>{c.title}</option>)}
                </select>
                <input name="file" type="file" accept="application/pdf" className="text-xs text-slate-400 file:mr-4 file:py-2 file:px-4 file:rounded-xl file:border-0 file:text-xs file:font-semibold file:bg-indigo-600 file:text-white hover:file:bg-indigo-500 cursor-pointer" required />
                <button className="bg-indigo-600 hover:bg-indigo-500 text-white rounded-xl px-5 py-2 text-xs font-bold shadow-lg shadow-indigo-600/30 transition-all cursor-pointer">
                  ↑ อัปโหลดคู่มือ
                </button>
              </form>

              <div className="space-y-3">
                {manuals.map(m => (
                  <div key={m.id} className="bg-slate-950/40 border border-white/5 p-4 rounded-2xl flex items-center justify-between gap-4">
                    <div className="flex items-center gap-3 min-w-0">
                      <span className="text-xl">📕</span>
                      <span className="font-bold text-sm text-white truncate">{m.title}</span>
                    </div>
                    <button className="px-3 py-1.5 bg-red-500/10 hover:bg-red-500/20 text-red-300 text-xs rounded-xl font-bold transition-all shrink-0" onClick={() => deleteManual(m)}>ลบคู่มือ</button>
                  </div>
                ))}
              </div>
            </section>
          )}

        </div>
      </main>
    </div>
  )
}