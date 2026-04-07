import Link from 'next/link'
import Image from 'next/image'

export default function AuthLayout({ children }: { children: React.ReactNode }) {
  return (
    <div className="min-h-screen relative flex flex-col" style={{ fontFamily: "'Georgia', 'Times New Roman', serif" }}>

      {/* MarSU campus background */}
      <div className="absolute inset-0 bg-cover bg-center bg-no-repeat"
        style={{ backgroundImage: "url('/msu-campus.png')" }} />
      {/* Cream tint over body */}
      <div className="absolute inset-0" style={{ background: 'rgba(242,229,197,0.35)' }} />

      {/* Nav — solid burgundy */}
      <nav className="relative z-10" style={{ background: '#75162E' }}>
        <div className="px-8 py-4">
          <Link href="/" className="flex items-center gap-3 w-fit">
            {/* School logo only */}
            <Image
              src="/school_logo.png"
              alt="Marinduque State University"
              width={36}
              height={36}
              className="rounded-lg object-contain flex-shrink-0"
              style={{ background: 'rgba(242,229,197,0.92)', padding: '3px' }}
            />
            <div>
              <div className="font-bold text-base" style={{ color: '#F2E5C5', letterSpacing: '0.05em' }}>Back2U</div>
              <div style={{ color: 'rgba(242,229,197,0.55)', fontSize: '8px', letterSpacing: '0.15em', textTransform: 'uppercase' }}>MarSU Lost & Found</div>
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