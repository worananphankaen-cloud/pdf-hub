'use client'
import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { supabase } from '@/lib/supabase'

export default function Login() {
  const router = useRouter()
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [err, setErr] = useState('')
  const [busy, setBusy] = useState(false)
  const [showPassword, setShowPassword] = useState(false)
  const [rememberMe, setRememberMe] = useState(false)

  async function submit(e: React.FormEvent) {
    e.preventDefault()
    setBusy(true); setErr('')
    const { error } = await supabase.auth.signInWithPassword({ email, password })
    if (error) { setBusy(false); return setErr('อีเมลหรือรหัสผ่านไม่ถูกต้อง') }
    await supabase.rpc('touch_login')
    router.replace('/')
  }

  return (
    <main className="min-h-screen w-full grid place-items-center bg-[#0a0d14] relative overflow-hidden p-4 select-none font-sans">
      {/* CSS keyframe สำหรับ Animate-shake และ Glow Rotating */}
      <style jsx global>{`
        @keyframes shake {
          0%, 100% { transform: translateX(0); }
          20%, 60% { transform: translateX(-6px); }
          40%, 80% { transform: translateX(6px); }
        }
        @keyframes spinSlow {
          from { transform: rotate(0deg); }
          to { transform: rotate(360deg); }
        }
        .animate-shake {
          animation: shake 0.4s cubic-bezier(.36,.07,.19,.97) both;
        }
        .animate-spin-slow {
          animation: spinSlow 20s linear infinite;
        }
      `}</style>

      {/* Dynamic Background Effects (Circular Radar Grid + Animated Glowing Orbs) */}
      <div className="absolute inset-0 flex items-center justify-center pointer-events-none opacity-40">
        <div className="w-[800px] h-[800px] border border-indigo-500/10 rounded-full animate-ping [animation-duration:8s]"></div>
        <div className="absolute w-[600px] h-[600px] border border-blue-500/20 rounded-full"></div>
        <div className="absolute w-[400px] h-[400px] border border-indigo-500/20 rounded-full"></div>
        <div className="absolute w-[200px] h-[200px] border border-cyan-500/30 rounded-full"></div>
      </div>

      {/* Rotating Background Glows */}
      <div className="absolute w-[500px] h-[500px] bg-gradient-to-tr from-indigo-600/20 to-blue-600/20 rounded-full blur-[140px] pointer-events-none animate-spin-slow"></div>
      <div className="absolute -top-20 -left-20 w-96 h-96 bg-purple-600/15 rounded-full blur-[120px] pointer-events-none animate-pulse"></div>
      <div className="absolute -bottom-20 -right-20 w-96 h-96 bg-cyan-600/15 rounded-full blur-[120px] pointer-events-none animate-pulse"></div>

      {/* Radial Grid Pattern */}
      <div className="absolute inset-0 bg-[radial-gradient(#1e293b_1px,transparent_1px)] [background-size:24px_24px] opacity-40 pointer-events-none"></div>

      {/* Main Container */}
      <div className="relative z-10 w-full max-w-md">
        <form 
          onSubmit={submit} 
          className="relative bg-slate-900/70 backdrop-blur-3xl border border-white/10 p-8 sm:p-10 rounded-3xl shadow-[0_0_60px_-15px_rgba(30,58,138,0.3)] space-y-6 text-white transition-all duration-500 hover:border-indigo-500/30 hover:shadow-[0_0_80px_-15px_rgba(99,102,241,0.4)]"
        >
          {/* Header Section */}
          <div className="text-center space-y-3">
            <div className="relative inline-flex items-center justify-center group">
              {/* Outer Glow Ring */}
              <div className="absolute -inset-1 bg-gradient-to-r from-indigo-500 to-cyan-500 rounded-2xl blur opacity-70 group-hover:opacity-100 transition duration-500 group-hover:duration-200 animate-pulse"></div>
              
              <div className="relative w-16 h-16 bg-gradient-to-br from-indigo-600 via-indigo-500 to-cyan-500 rounded-2xl flex items-center justify-center shadow-2xl transform group-hover:scale-105 group-hover:rotate-3 transition-all duration-300">
                <span className="text-3xl filter drop-shadow">📚</span>
              </div>
            </div>

            <div>
              <h1 className="text-2xl sm:text-3xl font-black tracking-tight bg-gradient-to-r from-white via-indigo-100 to-cyan-200 bg-clip-text text-transparent">
                คู่มือ ITH Gosoft
              </h1>
              <p className="text-xs text-indigo-200/60 mt-1.5 font-medium tracking-wide">
                Creat by Ding woranan
              </p>
            </div>
          </div>

          {/* Form Fields */}
          <div className="space-y-4 pt-1">
            {/* Email Field */}
            <div className="space-y-1.5">
              <label className="text-xs font-semibold text-slate-300 ml-1">อีเมลผู้ใช้งาน</label>
              <div className="relative group">
                <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none text-slate-400 group-focus-within:text-indigo-400 transition-colors">
                  <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="1.8" d="M3 8l7.89 5.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" />
                  </svg>
                </div>
                <input 
                  className="w-full bg-slate-950/60 border border-white/10 rounded-xl pl-11 pr-4 py-3 text-sm text-white placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-indigo-500/80 focus:border-indigo-500/80 transition-all duration-200" 
                  type="email" 
                  placeholder="email"
                  value={email} 
                  onChange={e => setEmail(e.target.value)} 
                  required 
                />
              </div>
            </div>

            {/* Password Field */}
            <div className="space-y-1.5">
              <label className="text-xs font-semibold text-slate-300 ml-1">รหัสผ่าน</label>
              <div className="relative group">
                <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none text-slate-400 group-focus-within:text-indigo-400 transition-colors">
                  <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="1.8" d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z" />
                  </svg>
                </div>
                <input 
                  className="w-full bg-slate-950/60 border border-white/10 rounded-xl pl-11 pr-11 py-3 text-sm text-white placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-indigo-500/80 focus:border-indigo-500/80 transition-all duration-200" 
                  type={showPassword ? 'text' : 'password'} 
                  placeholder="password"
                  value={password} 
                  onChange={e => setPassword(e.target.value)} 
                  required 
                />
                <button 
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute inset-y-0 right-0 pr-3.5 flex items-center text-slate-400 hover:text-white transition-colors focus:outline-none"
                >
                  {showPassword ? (
                    <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="1.8" d="M13.875 18.825A10.05 10.05 0 0112 19c-7 0-10-7-10-7a18.06 18.06 0 015.42-4.42m3.01-1.07A9.957 9.957 0 0112 5c7 0 10 7 10 7a18.06 18.06 0 01-2.13 2.87M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="1.8" d="M3 3l18 18" />
                    </svg>
                  ) : (
                    <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="1.8" d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="1.8" d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" />
                    </svg>
                  )}
                </button>
              </div>
            </div>
          </div>

          {/* Remember Me Toggle */}
          <div className="flex items-center justify-between text-xs pt-1">
            <label className="flex items-center space-x-2.5 cursor-pointer text-slate-300 hover:text-white transition-colors group">
              <input 
                type="checkbox" 
                checked={rememberMe}
                onChange={e => setRememberMe(e.target.checked)}
                className="w-4 h-4 rounded border-slate-700 bg-slate-950 text-indigo-600 focus:ring-indigo-500/50 focus:ring-offset-0 transition-all cursor-pointer"
              />
              <span className="font-medium group-hover:text-indigo-200 transition-colors">จดจำการใช้งาน</span>
            </label>
          </div>

          {/* Error Message Display with Animation */}
          {err && (
            <div className="p-3.5 rounded-xl bg-red-500/10 border border-red-500/30 text-red-300 text-xs text-center font-medium flex items-center justify-center gap-2 animate-shake">
              <svg className="w-4 h-4 shrink-0 text-red-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
              </svg>
              <span>{err}</span>
            </div>
          )}

          {/* Submit Button */}
          <button 
            disabled={busy} 
            className="w-full relative group overflow-hidden rounded-xl p-3.5 font-bold text-sm transition-all duration-300 shadow-xl shadow-indigo-600/30 disabled:opacity-50 bg-gradient-to-r from-indigo-600 via-blue-600 to-cyan-600 hover:from-indigo-500 hover:to-cyan-500 text-white active:scale-[0.98] focus:outline-none focus:ring-2 focus:ring-indigo-400"
          >
            {/* Glossy Overlay Line */}
            <span className="absolute inset-0 w-full h-full bg-white/20 transform -skew-x-12 -translate-x-full group-hover:translate-x-full transition-transform duration-1000"></span>
            
            <span className="relative flex items-center justify-center gap-2">
              {busy ? (
                <>
                  <svg className="animate-spin h-4 w-4 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                    <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                    <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                  </svg>
                  <span>กำลังเข้าสู่ระบบ...</span>
                </>
              ) : (
                <>
                  <span className="tracking-wide">เข้าสู่ระบบ</span>
                  <svg className="w-4 h-4 transform group-hover:translate-x-1 transition-transform duration-200" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M14 5l7 7m0 0l-7 7m7-7H3" />
                  </svg>
                </>
              )}
            </span>
          </button>
        </form>
      </div>
    </main>
  )
}