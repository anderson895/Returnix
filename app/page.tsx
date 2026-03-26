import Link from 'next/link'
import { Search, Shield, Bell, FileText, Users, CheckCircle } from 'lucide-react'

export default function HomePage() {
  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-900 via-blue-950 to-slate-900">
      <nav className="flex items-center justify-between px-6 py-4 max-w-7xl mx-auto">
        <div className="flex items-center gap-2">
          <div className="w-9 h-9 bg-blue-500 rounded-lg flex items-center justify-center">
            <Search className="w-5 h-5 text-white" />
          </div>
          <span className="text-white font-bold text-lg">Returnix</span>
        </div>
        <div className="flex items-center gap-3">
          <Link href="/login" className="text-slate-300 hover:text-white px-4 py-2 rounded-lg transition-colors text-sm">Sign In</Link>
          <Link href="/register" className="bg-blue-600 hover:bg-blue-500 text-white px-4 py-2 rounded-lg text-sm font-medium transition-colors">Get Started</Link>
        </div>
      </nav>
      <section className="max-w-7xl mx-auto px-6 pt-20 pb-24 text-center">
        <div className="inline-flex items-center gap-2 bg-blue-900/40 border border-blue-700/50 text-blue-300 text-xs font-medium px-4 py-2 rounded-full mb-6">
          <span className="w-2 h-2 bg-blue-400 rounded-full animate-pulse"></span>
          Web-Based Reporting and Recovery System
        </div>
        <h1 className="text-5xl md:text-7xl font-extrabold text-white mb-6 leading-tight">
           A Web-Based System for Reporting and Recovering Lost Items<br />
          <span className="text-transparent bg-clip-text bg-gradient-to-r from-blue-400 to-cyan-400">We'll Help You Find It.</span>
        </h1>
        <p className="text-slate-400 text-lg max-w-2xl mx-auto mb-10">A secure platform connecting users with security personnel for lost item recovery with claim verification and real-time notifications.</p>
        <div className="flex flex-col sm:flex-row items-center justify-center gap-4">
          <Link href="/register" className="bg-blue-600 hover:bg-blue-500 text-white px-8 py-4 rounded-xl font-semibold transition-all shadow-lg">Report a Lost Item</Link>
          <Link href="/login" className="border border-slate-600 hover:border-slate-400 text-slate-300 hover:text-white px-8 py-4 rounded-xl font-semibold transition-all">Track My Claim</Link>
        </div>
      </section>
      <footer className="border-t border-white/10 text-center py-6 text-slate-500 text-sm">
        © {new Date().getFullYear()} Returnix System. Built with Next.js 15, Supabase and Cloudinary.
      </footer>
    </div>
  )
}
