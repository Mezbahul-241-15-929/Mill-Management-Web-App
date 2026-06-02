import type { Metadata } from "next";
import { Providers } from "./providers";
import "./globals.css";
import Link from "next/link";
import { UtensilsCrossed, CalendarRange } from "lucide-react";

export const metadata: Metadata = {
  title: "Millmaster - Premium Mess Mill Management System",
  description: "Efficiently manage, calculate, and track monthly meals, mess deposits, mill rates, and member balances with real-time analytics.",
  keywords: ["mess management", "mill management", "meal calculator", "roommate expense tracker", "bazar list"],
  authors: [{ name: "Millmaster Team" }],
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" className="dark scroll-smooth" style={{ colorScheme: "dark" }} suppressHydrationWarning>
      <head>
        <link rel="icon" href="/favicon.ico" />
      </head>
      <body className="min-h-screen bg-[#0a0a0c] text-[#f3f4f6] antialiased flex flex-col font-sans selection:bg-indigo-500 selection:text-white">
        <Providers>
          {/* Main sticky glassmorphic navigation header */}
          <header className="sticky top-0 z-50 w-full border-b border-white/5 bg-[#0a0a0c]/80 backdrop-blur-md">
            <div className="mx-auto flex max-w-7xl h-16 items-center justify-between px-4 sm:px-6 lg:px-8">
              <div className="flex items-center gap-3">
                <Link href="/" id="nav-logo-link" className="flex items-center gap-2.5 transition-opacity hover:opacity-90">
                  <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-gradient-to-tr from-indigo-500 to-violet-600 shadow-lg shadow-indigo-500/20">
                    <UtensilsCrossed className="h-5.5 w-5.5 text-white" />
                  </div>
                  <span className="text-xl font-bold tracking-tight bg-gradient-to-r from-white via-slate-200 to-indigo-300 bg-clip-text text-transparent">
                    Millmaster
                  </span>
                </Link>
              </div>

              <div className="flex items-center gap-4">
                <div className="hidden sm:flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-white/5 border border-white/5 text-xs text-slate-400">
                  <CalendarRange className="h-3.5 w-3.5 text-indigo-400" />
                  <span>Real-time Sync</span>
                </div>
              </div>
            </div>
          </header>

          {/* Core main wrapper */}
          <main className="flex-1 mx-auto w-full max-w-7xl px-4 py-8 sm:px-6 lg:px-8">
            {children}
          </main>

          {/* Footer */}
          <footer className="border-t border-white/5 bg-[#08080a] py-8 text-center text-xs text-slate-500">
            <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
              <p>© {new Date().getFullYear()} Millmaster. Designed for visual excellence and premium utility.</p>
            </div>
          </footer>
        </Providers>
      </body>
    </html>
  );
}
