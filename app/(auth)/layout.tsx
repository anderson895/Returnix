import Link from 'next/link'
import { MapPin } from 'lucide-react'

export default function AuthLayout({ children }: { children: React.ReactNode }) {
  return (
    <div className="min-h-screen relative flex flex-col" style={{ fontFamily: "'Georgia', 'Times New Roman', serif" }}>

      {/* MSU campus background */}
      <div className="absolute inset-0 bg-cover bg-center bg-no-repeat"
        style={{ backgroundImage: "url('/msu-campus.png')" }} />
      {/* Cream tint over body */}
      <div className="absolute inset-0" style={{ background: 'rgba(242,229,197,0.35)' }} />

      {/* Nav — solid burgundy */}
      <nav className="relative z-10" style={{ background: '#75162E' }}>
        <div className="px-8 py-4">
          <Link href="/" className="flex items-center gap-2 w-fit">
            <div className="w-9 h-9 rounded-lg flex items-center justify-center border" style={{ background: 'rgba(242,229,197,0.15)', borderColor: 'rgba(242,229,197,0.35)' }}>
              <MapPin className="w-4 h-4" style={{ color: '#F2E5C5' }} />
            </div>
            <div>
              <div className="font-bold text-base" style={{ color: '#F2E5C5', letterSpacing: '0.05em' }}>Back2U</div>
              <div style={{ color: 'rgba(242,229,197,0.55)', fontSize: '8px', letterSpacing: '0.15em', textTransform: 'uppercase' }}>MSU Lost & Found</div>
            </div>
          </Link>
        </div>
      </nav>

      {/* Content */}
      <div className="relative z-10 flex-1 flex items-center justify-center px-4 py-12">
        {children}
      </div>

      {/* Footer — solid burgundy */}
      <footer className="relative z-10 text-center py-4 text-xs" style={{ background: '#75162E', color: 'rgba(242,229,197,0.5)' }}>
        © {new Date().getFullYear()} Back2U · Marinduque State University
      </footer>
    </div>
  )
}