export default function AuthLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <div
      className="flex min-h-screen items-center justify-center p-4"
      style={{
        background:
          "radial-gradient(ellipse at 65% 0%, rgba(0,172,211,0.07) 0%, transparent 55%), radial-gradient(ellipse at 20% 100%, rgba(13,37,66,0.06) 0%, transparent 55%), #f8fafc",
      }}
    >
      {/* Decorative blobs */}
      <div
        className="pointer-events-none fixed inset-0 overflow-hidden"
        aria-hidden
      >
        <div
          className="absolute -top-32 -right-32 h-[500px] w-[500px] rounded-full opacity-30"
          style={{
            background:
              "radial-gradient(circle, rgba(0,172,211,0.12) 0%, transparent 70%)",
          }}
        />
        <div
          className="absolute -bottom-24 -left-24 h-[400px] w-[400px] rounded-full opacity-20"
          style={{
            background:
              "radial-gradient(circle, rgba(13,37,66,0.15) 0%, transparent 70%)",
          }}
        />
      </div>

      <div className="relative z-10 w-full flex items-center justify-center">
        {children}
      </div>
    </div>
  );
}
