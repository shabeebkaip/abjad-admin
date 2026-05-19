import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Abjad Admin – Sign In",
};

const STATS = [
  { value: "12k+", label: "Teachers placed" },
  { value: "800+", label: "Partner schools" },
  { value: "100%", label: "Verified data" },
];

export default function AuthLayout({ children }: { children: React.ReactNode }) {
  return (
    <div className="flex min-h-screen bg-slate-50 relative">
      {/* ── Left brand panel ─────────────────────────────── */}
      <div className="hidden lg:flex lg:w-[52%] relative overflow-hidden flex-col">
        {/* Base gradient */}
        <div
          className="absolute inset-0"
          style={{ background: "linear-gradient(145deg, #071729 0%, #0D2542 40%, #1a1f4e 100%)" }}
        />

        {/* Dot grid */}
        <div
          className="absolute inset-0"
          style={{
            backgroundImage: `radial-gradient(circle, rgba(0,172,211,0.18) 1px, transparent 1px)`,
            backgroundSize: "28px 28px",
            opacity: 0.5,
          }}
        />

        {/* Glows */}
        <div
          className="absolute -top-32 -left-32 w-[500px] h-[500px] rounded-full blur-[120px] pointer-events-none"
          style={{ background: "radial-gradient(circle, rgba(0,172,211,0.18) 0%, transparent 65%)" }}
        />
        <div
          className="absolute -bottom-40 -right-20 w-[420px] h-[420px] rounded-full blur-[100px] pointer-events-none"
          style={{ background: "radial-gradient(circle, rgba(68,72,130,0.45) 0%, transparent 65%)" }}
        />

        {/* Floating rings */}
        <div className="absolute top-16 right-16 w-36 h-36 rounded-full" style={{ border: "1px solid rgba(0,172,211,0.12)" }} />
        <div className="absolute top-24 right-24 w-20 h-20 rounded-full" style={{ border: "1px solid rgba(0,172,211,0.08)" }} />

        {/* Content */}
        <div className="relative z-10 flex flex-col h-full px-14 py-14">
          {/* Logo */}
          <div className="w-fit">
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img
              src="/ABJAD.png"
              alt="Abjad"
              className="h-10 w-auto object-contain"
              style={{ filter: "brightness(0) invert(1)" }}
            />
          </div>

          {/* Centre copy */}
          <div className="flex-1 flex flex-col justify-center max-w-xs">
            <div
              className="inline-flex items-center gap-2 rounded-full px-3 py-1 text-[11px] font-semibold tracking-widest uppercase mb-6 w-fit"
              style={{ background: "rgba(0,172,211,0.12)", color: "rgba(0,172,211,0.9)", border: "1px solid rgba(0,172,211,0.20)" }}
            >
              Admin Console
            </div>

            <h1 className="text-[2.6rem] font-bold text-white leading-[1.1] tracking-tight mb-5">
              Platform<br />
              <span style={{ color: "#00ACD3" }}>Management</span><br />
              Console
            </h1>

            <p className="text-sm leading-relaxed mb-12" style={{ color: "rgba(255,255,255,0.45)" }}>
              Secure access to the Abjad admin panel. Manage teachers, schools, and platform operations across Saudi Arabia.
            </p>

            {/* Stats */}
            <div className="flex items-center gap-8">
              {STATS.map((s) => (
                <div key={s.label}>
                  <p className="text-2xl font-bold text-white tracking-tight">{s.value}</p>
                  <p className="text-xs mt-0.5" style={{ color: "rgba(255,255,255,0.40)" }}>{s.label}</p>
                </div>
              ))}
            </div>
          </div>

          {/* Bottom note */}
          <div className="pb-2">
            <div
              className="h-px mb-6"
              style={{ background: "linear-gradient(90deg, rgba(0,172,211,0.20), transparent)" }}
            />
            <div className="flex items-center gap-3">
              <div
                className="w-7 h-7 rounded-full flex items-center justify-center shrink-0"
                style={{ backgroundColor: "rgba(0,172,211,0.15)", border: "1px solid rgba(0,172,211,0.25)" }}
              >
                <span className="text-xs">🔒</span>
              </div>
              <div>
                <p className="text-white text-xs font-medium">Restricted Access</p>
                <p className="text-xs" style={{ color: "rgba(255,255,255,0.35)" }}>Authorized Abjad team members only</p>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* ── Right form panel ──────────────────────────────── */}
      <div className="flex-1 flex flex-col bg-white overflow-y-auto relative">
        {/* Subtle dot texture */}
        <div
          className="absolute inset-0 opacity-[0.03] pointer-events-none"
          style={{
            backgroundImage: `radial-gradient(circle, #00ACD3 1px, transparent 1px)`,
            backgroundSize: "32px 32px",
          }}
        />
        {/* Top-right accent blob */}
        <div
          className="absolute -top-24 -right-24 w-72 h-72 rounded-full pointer-events-none"
          style={{ background: "radial-gradient(circle, rgba(0,172,211,0.06) 0%, transparent 70%)" }}
        />

        {/* Mobile top bar */}
        <div className="lg:hidden flex items-center px-6 pt-6 pb-2 relative z-10">
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img
            src="/ABJAD.png"
            alt="Abjad"
            className="h-8 w-auto object-contain"
            style={{ filter: "brightness(0)" }}
          />
        </div>

        {/* Form centred */}
        <div className="flex-1 flex items-center justify-center px-6 py-10 relative z-10">
          <div className="w-full max-w-sm">
            {children}
          </div>
        </div>

        {/* Footer */}
        <p className="text-center text-xs text-slate-400 pb-6 px-6 relative z-10">
          © {new Date().getFullYear()} Abjad · Admin Access Only
        </p>
      </div>
    </div>
  );
}
