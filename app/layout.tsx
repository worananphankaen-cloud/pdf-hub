import './globals.css'
import type { Metadata } from 'next'

export const metadata: Metadata = { title: 'Knowledge Hub', description: 'ระบบคลังคู่มือ PDF' }

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="th">
      <body>{children}</body>
    </html>
  )
}
