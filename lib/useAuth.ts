'use client'
import { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import { supabase } from './supabase'

/** คืนค่า role ('user' | 'admin' | 'master') หรือ null ระหว่างโหลด */
export function useAuth(requireStaff = false) {
  const router = useRouter()
  const [role, setRole] = useState<string | null>(null)
  useEffect(() => {
    ;(async () => {
      const { data: { user } } = await supabase.auth.getUser()
      if (!user) return router.replace('/login')
      const { data } = await supabase.from('profiles').select('role').eq('id', user.id).single()
      if (requireStaff && data?.role === 'user') return router.replace('/')
      setRole(data?.role ?? 'user')
    })()
  }, [requireStaff, router])
  return role
}
