import type { Metadata } from "next";
import { Bricolage_Grotesque, Almarai, Cinzel } from "next/font/google";
import "./globals.css";
import { TooltipProvider } from "@/components/ui/tooltip";

const bricolage = Bricolage_Grotesque({
  subsets: ["latin"],
  variable: "--font-bricolage",
  display: "swap",
});

const almarai = Almarai({
  weight: ["300", "400", "700", "800"],
  subsets: ["arabic"],
  variable: "--font-almarai",
  display: "swap",
});

const cinzel = Cinzel({
  subsets: ["latin"],
  variable: "--font-cinzel",
  display: "swap",
  weight: ["400", "700"],
});

export const metadata: Metadata = {
  title: "Abjad Admin",
  description: "Abjad Platform Administration",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html
      lang="en"
      className={`${bricolage.variable} ${almarai.variable} ${cinzel.variable}`}
      suppressHydrationWarning
    >
      <body className="min-h-screen antialiased">
        <TooltipProvider>{children}</TooltipProvider>
      </body>
    </html>
  );
}
