"use client";
import { useState } from "react";
import Link from "next/link";
import { jsPDF } from "jspdf";
import {
  ArrowLeft,
  Download,
  FileText,
  Trash2,
  ClipboardPaste,
  Type,
  CheckCircle2,
} from "lucide-react";

export default function TextToPdfPage() {
  const [title, setTitle] = useState("My_Document");
  const [text, setText] = useState("");
  const [fontSize, setFontSize] = useState<number>(12);
  const [downloaded, setDownloaded] = useState(false);

  const wordCount = text.trim() ? text.trim().split(/\s+/).length : 0;
  const charCount = text.length;

  const handlePaste = async () => {
    try {
      const clipText = await navigator.clipboard.readText();
      setText((prev) => (prev ? prev + "\n" + clipText : clipText));
    } catch {
      alert("Please press Ctrl + V to paste text from your clipboard.");
    }
  };

  const handleDownloadPdf = () => {
    if (!text.trim()) {
      alert("Please enter some text first!");
      return;
    }

    const doc = new jsPDF();

    doc.setFont("helvetica", "bold");
    doc.setFontSize(18);
    doc.setTextColor(30, 41, 59);
    doc.text(title || "Document", 15, 22);

    doc.setDrawColor(203, 213, 225);
    doc.line(15, 26, 195, 26);

    doc.setFont("helvetica", "normal");
    doc.setFontSize(fontSize);
    doc.setTextColor(51, 65, 85);
    const lines = doc.splitTextToSize(text, 180);
    doc.text(lines, 15, 36);

    const fileName = (title.trim() || "document").replace(/\s+/g, "_") + ".pdf";
    doc.save(fileName);

    setDownloaded(true);
    setTimeout(() => setDownloaded(false), 3000);
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 via-emerald-50/30 to-teal-50/40 text-slate-800 p-4 sm:p-8">
      <div className="max-w-4xl mx-auto">
        <div className="flex items-center justify-between mb-6">
          <Link
            href="/"
            className="inline-flex items-center gap-2 px-4 py-2 rounded-xl bg-white border border-slate-200 text-slate-700 text-sm font-semibold shadow-sm hover:bg-slate-50 hover:text-blue-600 transition"
          >
            <ArrowLeft className="w-4 h-4" /> Dashboard
          </Link>

          <span className="text-xs font-bold uppercase tracking-wider px-3 py-1 rounded-full bg-emerald-100 text-emerald-700">
            PDF Creator Studio
          </span>
        </div>

        <div className="bg-white rounded-3xl shadow-xl shadow-slate-200/60 border border-slate-200/80 overflow-hidden">
          <div className="bg-gradient-to-r from-emerald-600 to-teal-600 p-6 sm:p-8 text-white flex flex-col sm:flex-row sm:items-center justify-between gap-4">
            <div className="flex items-center gap-4">
              <div className="w-14 h-14 rounded-2xl bg-white/15 backdrop-blur-sm border border-white/20 flex items-center justify-center shadow-inner">
                <FileText className="w-7 h-7 text-white" />
              </div>
              <div>
                <h1 className="text-2xl font-extrabold tracking-tight">
                  Text to PDF Converter
                </h1>
                <p className="text-emerald-100 text-sm mt-0.5">
                  Turn your notes, articles, and text into a clean PDF document
                </p>
              </div>
            </div>
          </div>

          <div className="p-6 sm:p-8">
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 mb-5">
              <div>
                <label className="block text-xs font-bold uppercase tracking-wider text-slate-500 mb-2">
                  Document Title / File Name
                </label>
                <input
                  type="text"
                  value={title}
                  onChange={(e) => setTitle(e.target.value)}
                  placeholder="e.g., Project_Notes"
                  className="w-full px-4 py-3 bg-slate-50 border border-slate-200 rounded-xl font-medium text-slate-800 focus:bg-white focus:outline-none focus:ring-2 focus:ring-emerald-500/30 focus:border-emerald-500 transition"
                />
              </div>

              <div>
                <label className="block text-xs font-bold uppercase tracking-wider text-slate-500 mb-2 flex items-center gap-1.5">
                  <Type className="w-3.5 h-3.5" /> PDF Font Size
                </label>
                <div className="grid grid-cols-3 gap-2 bg-slate-100 p-1.5 rounded-xl">
                  {[
                    { label: "Small", size: 10 },
                    { label: "Medium", size: 12 },
                    { label: "Large", size: 16 },
                  ].map((item) => (
                    <button
                      key={item.size}
                      type="button"
                      onClick={() => setFontSize(item.size)}
                      className={`py-2 rounded-lg text-xs font-bold transition cursor-pointer ${
                        fontSize === item.size
                          ? "bg-white text-emerald-700 shadow-sm"
                          : "text-slate-600 hover:text-slate-900"
                      }`}
                    >
                      {item.label} ({item.size}pt)
                    </button>
                  ))}
                </div>
              </div>
            </div>

            <div className="flex flex-wrap items-center justify-between gap-2 bg-slate-50 px-4 py-2.5 rounded-t-2xl border border-b-0 border-slate-200">
              <div className="flex items-center gap-2">
                <button
                  type="button"
                  onClick={handlePaste}
                  className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-white border border-slate-200 text-xs font-semibold text-slate-700 hover:text-emerald-600 hover:border-emerald-300 transition cursor-pointer"
                >
                  <ClipboardPaste className="w-3.5 h-3.5" /> Paste Text
                </button>
                <button
                  type="button"
                  onClick={() => setText("")}
                  className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-white border border-slate-200 text-xs font-semibold text-slate-700 hover:text-red-600 hover:border-red-300 transition cursor-pointer"
                >
                  <Trash2 className="w-3.5 h-3.5" /> Clear
                </button>
              </div>

              <div className="text-xs font-medium text-slate-500">
                <span className="font-bold text-slate-700">{wordCount}</span> Words •{" "}
                <span className="font-bold text-slate-700">{charCount}</span> Characters
              </div>
            </div>

            <textarea
              rows={11}
              value={text}
              onChange={(e) => setText(e.target.value)}
              placeholder="Type or paste your text here to generate a PDF..."
              className="w-full p-4 bg-white border border-slate-200 rounded-b-2xl text-slate-800 leading-relaxed focus:outline-none focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-500 transition mb-6"
            />

            <button
              onClick={handleDownloadPdf}
              className="w-full py-4 px-6 rounded-2xl bg-gradient-to-r from-emerald-600 via-teal-600 to-emerald-600 hover:from-emerald-500 hover:to-teal-500 text-white font-bold text-base shadow-lg shadow-emerald-600/30 hover:shadow-xl hover:shadow-emerald-600/40 active:scale-[0.99] transition-all flex items-center justify-center gap-2.5 cursor-pointer"
            >
              {downloaded ? (
                <>
                  <CheckCircle2 className="w-5 h-5" /> PDF Downloaded Successfully!
                </>
              ) : (
                <>
                  <Download className="w-5 h-5" /> Convert & Download PDF
                </>
              )}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}