import Link from 'next/link'
import Image from 'next/image'
import { Shield, Bell, FileText, ArrowRight } from 'lucide-react'

export default function HomePage() {
  return (
    <div className="min-h-screen relative overflow-hidden" style={{ fontFamily: "'Georgia', 'Times New Roman', serif" }}>

      {/* Background: MarSU campus image */}
      <div className="absolute inset-0 bg-cover bg-center bg-no-repeat"
        style={{ backgroundImage: "url('/msu-campus.png')" }} />

      {/* Body cream overlay — increased to 0.72 for better readability */}
      <div className="absolute inset-0" style={{ background: 'rgba(242,229,197,0.72)' }} />

      {/* Top accent line */}
      <div className="absolute top-0 left-0 right-0 h-0.5 z-20" style={{ background: '#75162E' }} />

      <div className="relative z-10 min-h-screen flex flex-col">

        {/* NAV — solid burgundy */}
        <nav style={{ background: '#75162E' }}>
          <div className="flex items-center justify-between px-8 py-4 max-w-7xl mx-auto w-full">
            <div className="flex items-center gap-3">
              {/* School logo only in nav */}
              <Image
                src="/school_logo.png"
                alt="Marinduque State University"
                width={40}
                height={40}
                className="rounded-lg object-contain flex-shrink-0"
                style={{ background: 'rgba(242,229,197,0.92)', padding: '3px' }}
              />
              <div>
                <span className="font-bold text-xl" style={{ color: '#F2E5C5', fontFamily: "'Georgia', serif", letterSpacing: '0.05em' }}>Back2U</span>
                <div style={{ color: 'rgba(242,229,197,0.6)', fontSize: '9px', letterSpacing: '0.15em', textTransform: 'uppercase' }}>Lost & Found System</div>
              </div>
            </div>
            <div className="hidden md:block text-sm font-medium" style={{ color: 'rgba(242,229,197,0.8)' }}>Marinduque State University</div>
            <div className="flex items-center gap-3">
              <Link href="/login" className="px-5 py-2 text-sm font-medium rounded-lg transition"
                style={{ color: '#F2E5C5', border: '1px solid rgba(242,229,197,0.4)', background: 'rgba(242,229,197,0.1)' }}>
                Sign In
              </Link>
              <Link href="/register" className="px-5 py-2 text-sm font-semibold rounded-lg shadow"
                style={{ background: '#F2E5C5', color: '#75162E' }}>
                Get Started
              </Link>
            </div>
          </div>
        </nav>

        {/* HERO — campus photo + cream tint shows here */}
        <section className="flex-1 flex flex-col items-center justify-center px-6 py-16 text-center max-w-5xl mx-auto w-full">
          <div className="inline-flex items-center gap-2 mb-8 px-4 py-2 rounded-full text-xs font-medium"
            style={{ background: 'rgba(117,22,46,0.75)', border: '1px solid rgba(117,22,46,0.5)', color: '#F2E5C5', letterSpacing: '0.12em', textTransform: 'uppercase', backdropFilter: 'blur(4px)' }}>
            <span className="w-1.5 h-1.5 rounded-full animate-pulse" style={{ background: '#F2E5C5' }} />
            Marinduque State University · Official System
          </div>

          <h1 className="font-bold mb-6 leading-tight" style={{ fontFamily: "'Georgia', serif" }}>
            {/* System logo in hero */}
            <span className="flex justify-center mb-4">
              <Image
                src="/system_logo.png"
                alt="Back2U System Logo"
                width={96}
                height={96}
                className="object-contain drop-shadow-lg"
              />
            </span>
            <span className="block text-6xl md:text-8xl tracking-tight" style={{ color: '#3A000C', textShadow: '0 2px 12px rgba(242,229,197,0.6)' }}>
              Back2U
            </span>
            <span className="block text-xl md:text-2xl mt-3 font-normal" style={{ color: '#550B18', letterSpacing: '0.08em' }}>
              Lost & Found Reporting and Recovery System
            </span>
          </h1>

          <div className="flex items-center gap-4 mb-8">
            <div className="h-px w-20" style={{ background: 'rgba(117,22,46,0.4)' }} />
            <div className="w-1.5 h-1.5 rounded-full" style={{ background: '#75162E' }} />
            <div className="h-px w-20" style={{ background: 'rgba(117,22,46,0.4)' }} />
          </div>

          <p className="text-base md:text-lg max-w-xl mx-auto mb-12 leading-relaxed" style={{ color: '#3A000C' }}>
            A secure platform connecting students and staff with security personnel for swift lost item recovery — with claim verification and real-time notifications.
          </p>

          <div className="flex flex-col sm:flex-row items-center justify-center gap-4">
            <Link href="/register" className="group flex items-center gap-3 px-8 py-4 rounded-xl font-semibold text-base shadow-lg transition"
              style={{ background: '#75162E', color: '#F2E5C5' }}>
              Report a Lost Item
              <ArrowRight className="w-4 h-4 group-hover:translate-x-1 transition-transform" />
            </Link>
            <Link href="/login" className="flex items-center gap-3 px-8 py-4 rounded-xl font-semibold text-base transition"
              style={{ background: 'rgba(117,22,46,0.12)', border: '2px solid #75162E', color: '#75162E' }}>
              Track My Claim
            </Link>
          </div>
        </section>

        {/* FEATURES — still on cream-tinted body */}
        <section className="px-6 pb-0 max-w-5xl mx-auto w-full">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            {[
              { icon: FileText, title: 'Report Items', desc: 'Quickly report lost or found items with photos and details' },
              { icon: Shield, title: 'Verified Claims', desc: 'Security personnel verify ownership before returning items' },
              { icon: Bell, title: 'Real-time Alerts', desc: 'Instant notifications when matches or updates are found' },
            ].map(({ icon: Icon, title, desc }) => (
              <div key={title} className="p-5 rounded-xl" style={{ background: 'rgba(242,229,197,0.85)', border: '1px solid rgba(117,22,46,0.25)' }}>
                <div className="w-9 h-9 rounded-lg flex items-center justify-center mb-3" style={{ background: '#75162E' }}>
                  <Icon className="w-4 h-4" style={{ color: '#F2E5C5' }} />
                </div>
                <h3 className="font-semibold mb-1" style={{ color: '#3A000C', fontFamily: "'Georgia', serif" }}>{title}</h3>
                <p className="text-sm leading-relaxed" style={{ color: '#550B18' }}>{desc}</p>
              </div>
            ))}
          </div>
        </section>
        {/* FOOTER — solid burgundy */}
        <footer style={{ background: '#75162E', marginTop: '1.5rem' }}>
          <div className="text-center py-5 text-sm border-t" style={{ borderColor: 'rgba(242,229,197,0.15)', color: 'rgba(242,229,197,0.65)' }}>
            © {new Date().getFullYear()} Back2U · Marinduque State University · Built with Next.js 15 & Supabase
          </div>
        </footer>
      </div>
    </div>
  )
}