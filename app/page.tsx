"use client";
import Link from "next/link";
import {
  Camera,
  FileText,
  FileSpreadsheet,
  FileType,
  FolderOpen,
  ScanText,
  Minimize2,
  Files,
  Sparkles,
  ArrowUpRight,
  ShieldCheck,
  Zap,
} from "lucide-react";

export default function Home() {
  const tools = [
    {
      title: "Camera Scanner",
      badge: "PRO",
      desc: "Capture photos or import gallery images to create crystal-clear HD PDFs",
      icon: <Camera className="w-7 h-7 text-white" />,
      gradient: "from-blue-500 to-cyan-500",
      shadow: "shadow-blue-500/25",
      href: "/scanner",
    },
    {
      title: "Text to PDF",
      badge: "FAST",
      desc: "Convert plain text, notes, or essays into a cleanly formatted PDF document",
      icon: <FileText className="w-7 h-7 text-white" />,
      gradient: "from-emerald-500 to-teal-500",
      shadow: "shadow-emerald-500/25",
      href: "/text-to-pdf",
    },
    {
      title: "Word ↔ PDF",
      badge: "OFFICE",
      desc: "Convert Word (.docx) documents to PDF and extract text from PDF to Word",
      icon: <FileType className="w-7 h-7 text-white" />,
      gradient: "from-indigo-500 to-purple-600",
      shadow: "shadow-indigo-500/25",
      href: "/word-converter",
    },
    {
      title: "Excel ↔ PDF",
      badge: "SHEETS",
      desc: "Transform Excel (.xlsx) spreadsheets into PDF tables and export PDF to Excel",
      icon: <FileSpreadsheet className="w-7 h-7 text-white" />,
      gradient: "from-green-500 to-emerald-600",
      shadow: "shadow-green-500/25",
      href: "/excel-converter",
    },
    {
      title: "PDF & Image Compressor",
      badge: "SHRINK",
      desc: "Reduce large PDF and image file sizes to KB without losing visual clarity",
      icon: <Minimize2 className="w-7 h-7 text-white" />,
      gradient: "from-rose-500 to-orange-600",
      shadow: "shadow-rose-500/25",
      href: "/compressor",
    },
    {
      title: "Image to Text (OCR)",
      badge: "AI",
      desc: "Extract editable text from any scanned document, photo, or screenshot",
      icon: <ScanText className="w-7 h-7 text-white" />,
      gradient: "from-orange-500 to-amber-500",
      shadow: "shadow-orange-500/25",
      href: "/ocr",
    },
    {
      title: "Universal File Editor",
      badge: "ALL-IN-1",
      desc: "Open, view, edit, and export PDF, Word, Excel, and Text files in one place",
      icon: <FolderOpen className="w-7 h-7 text-white" />,
      gradient: "from-fuchsia-500 to-pink-600",
      shadow: "shadow-fuchsia-500/25",
      href: "/viewer",
    },
    {
      title: "Merge PDF & Word",
      badge: "COMBINE",
      desc: "Combine multiple PDF and Word (.docx) files into a single organized document",
      icon: <Files className="w-7 h-7 text-white" />,
      gradient: "from-sky-500 to-blue-600",
      shadow: "shadow-sky-500/25",
      href: "/merge",
    },
  ];

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 via-blue-50/40 to-indigo-50/50 text-slate-800">
      {/* Top Glass Navbar */}
      <nav className="sticky top-0 z-50 backdrop-blur-md bg-white/80 border-b border-slate-200/70">
        <div className="max-w-5xl mx-auto px-4 sm:px-6 h-16 flex items-center justify-between">
          <div className="flex items-center gap-2.5">
            <div className="w-10 h-10 rounded-xl bg-gradient-to-tr from-blue-600 to-indigo-600 flex items-center justify-center shadow-lg shadow-blue-600/30">
              <Sparkles className="w-5 h-5 text-white" />
            </div>
            <div>
              <span className="font-extrabold text-xl tracking-tight bg-gradient-to-r from-slate-900 to-blue-800 bg-clip-text text-transparent">
                SmartDoc
              </span>
              <span className="ml-1.5 text-[10px] font-bold uppercase tracking-wider px-2 py-0.5 rounded-full bg-blue-100 text-blue-700">
                VIP Studio
              </span>
            </div>
          </div>

          <div className="hidden sm:flex items-center gap-4 text-xs font-semibold text-slate-500">
            <span className="flex items-center gap-1.5 text-emerald-600 bg-emerald-50 px-3 py-1.5 rounded-full">
              <ShieldCheck className="w-4 h-4" /> 100% Offline & Private
            </span>
          </div>
        </div>
      </nav>

      <main className="max-w-5xl mx-auto px-4 sm:px-6 py-8">
        {/* Hero Banner */}
        <section className="relative overflow-hidden rounded-3xl bg-gradient-to-r from-slate-900 via-blue-950 to-indigo-950 text-white p-7 sm:p-10 shadow-2xl shadow-blue-950/20 mb-10">
          <div className="relative z-10 max-w-2xl">
            <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-white/10 border border-white/15 text-blue-200 text-xs font-medium mb-4">
              <Zap className="w-3.5 h-3.5 text-amber-400" /> Fast • Free • No Watermark
            </div>
            <h1 className="text-3xl sm:text-4xl font-extrabold tracking-tight leading-tight">
              Your Complete <span className="text-blue-400">Document Studio</span>
            </h1>
            <p className="text-slate-300 mt-3 text-sm sm:text-base leading-relaxed">
              Scan, compress, convert, and edit all your files effortlessly. Professional tools for PDF, Word, Excel, and Images in one unified workspace.
            </p>
          </div>
          <div className="absolute -right-12 -top-12 w-56 h-56 rounded-full bg-blue-500/20 blur-3xl pointer-events-none" />
          <div className="absolute right-20 -bottom-16 w-48 h-48 rounded-full bg-indigo-500/20 blur-2xl pointer-events-none" />
        </section>

        {/* Section Title */}
        <div className="flex items-center justify-between mb-5">
          <h2 className="text-lg sm:text-xl font-bold text-slate-800">
            All-in-One Smart Tools
          </h2>
          <span className="text-xs font-medium text-slate-500">8 Tools Ready</span>
        </div>

        {/* VIP Cards Grid */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-5">
          {tools.map((tool, index) => (
            <Link
              key={index}
              href={tool.href}
              className="group relative bg-white rounded-2xl p-6 border border-slate-200/80 shadow-sm hover:shadow-xl hover:shadow-slate-200/60 hover:-translate-y-1 transition-all duration-300 flex flex-col justify-between"
            >
              <div>
                <div className="flex items-start justify-between mb-5">
                  <div
                    className={`w-14 h-14 rounded-2xl bg-gradient-to-br ${tool.gradient} flex items-center justify-center shadow-lg ${tool.shadow} group-hover:scale-110 transition-transform duration-300`}
                  >
                    {tool.icon}
                  </div>
                  <span className="text-[10px] font-extrabold tracking-wider px-2.5 py-1 rounded-full bg-slate-100 text-slate-600 group-hover:bg-blue-50 group-hover:text-blue-600 transition-colors">
                    {tool.badge}
                  </span>
                </div>

                <h3 className="font-bold text-lg text-slate-900 group-hover:text-blue-600 transition-colors">
                  {tool.title}
                </h3>
                <p className="text-sm text-slate-500 mt-1.5 leading-relaxed">
                  {tool.desc}
                </p>
              </div>

              <div className="mt-6 pt-4 border-t border-slate-100 flex items-center justify-between text-xs font-bold text-slate-700 group-hover:text-blue-600">
                <span>Launch Tool</span>
                <span className="w-7 h-7 rounded-full bg-slate-100 group-hover:bg-blue-600 group-hover:text-white flex items-center justify-center transition-colors">
                  <ArrowUpRight className="w-4 h-4" />
                </span>
              </div>
            </Link>
          ))}
        </div>
      </main>
    </div>
  );
}