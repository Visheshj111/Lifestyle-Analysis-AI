import { Link, Outlet } from "react-router-dom";
import { cn } from "@/lib/utils";

export default function SiteLayout() {
  if (typeof document !== "undefined") {
    const stored = localStorage.getItem("theme");
    const el = document.documentElement;
    if (stored === "dark") el.classList.add("dark");
  }
  return (
    <div className="min-h-screen flex flex-col bg-gradient-to-br from-teal-50 via-sky-50 to-white dark:from-slate-900 dark:via-slate-900 dark:to-slate-950">
      <header className={cn("sticky top-0 z-30 backdrop-blur supports-[backdrop-filter]:bg-white/60 border-b") }>
        <div className="container mx-auto flex items-center justify-between py-4">
          <Link to="/" className="inline-flex items-center gap-2">
            <span className="relative inline-flex h-6 w-6 items-center justify-center">
              <span className="absolute inset-0 rounded-full bg-gradient-to-br from-teal-400 to-sky-400 animate-pulse" />
              <span className="relative h-4 w-4 rounded-full bg-white" />
            </span>
            <span className="text-lg font-semibold tracking-tight text-teal-900 dark:text-teal-200">Lifestyle Score</span>
          </Link>
          <nav className="flex items-center gap-4 text-sm text-slate-600 dark:text-slate-300">
            <a href="#how-it-works" className="hover:text-teal-700 transition-colors">How it works</a>
            <button
              aria-label="Toggle dark mode"
              onClick={() => {
                const el = document.documentElement;
                const isDark = el.classList.toggle("dark");
                localStorage.setItem("theme", isDark ? "dark" : "light");
              }}
              className="rounded-md border px-2 py-1 text-xs text-slate-600 hover:bg-slate-100 dark:text-slate-300 dark:hover:bg-slate-800 dark:border-slate-700"
            >
              Theme
            </button>
          </nav>
        </div>
      </header>
      <main className="flex-1">
        <Outlet />
      </main>
      <footer className="border-t">
        <div className="container mx-auto py-6 text-center text-sm text-slate-500">
          © {new Date().getFullYear()} Lifestyle Score. Stay well.
        </div>
      </footer>
    </div>
  );
}
