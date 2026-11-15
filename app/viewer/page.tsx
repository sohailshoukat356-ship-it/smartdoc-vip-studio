"use client";
import { useState } from "react";
import Link from "next/link";
import mammoth from "mammoth";
import * as XLSX from "xlsx";
import { jsPDF } from "jspdf";
import {
  ArrowLeft,
  FolderOpen,
  Upload,
  FileText,
  FileType,
  FileSpreadsheet,
  FileCode,
  RefreshCw,
} from "lucide-react";

export default function UniversalViewerPage() {
  const [fileName, setFileName] = useState<string>("");
  const [fileType, setFileType] = useState<string>("");
  const [content, setContent] = useState<string>("");
  const [loading, setLoading] = useState<boolean>(false);

  const handleAnyFile = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setLoading(true);
    const ext = file.name.split(".").pop()?.toLowerCase() || "";
    setFileName(file.name.replace(/\.[^/.]+$/, ""));
    setFileType(ext.toUpperCase());

    try {
      if (ext === "txt" || ext === "md" || ext === "json" || ext === "csv") {
        const text = await file.text();
        setContent(text);
      } else if (ext === "docx") {
        const buffer = await file.arrayBuffer();
        const res = await mammoth.extractRawText({ arrayBuffer: buffer });
        setContent(res.value);
      } else if (ext === "xlsx" || ext === "xls") {
        const buffer = await file.arrayBuffer();
        const wb = XLSX.read(buffer);
        const sheet = wb.Sheets[wb.SheetNames[0]];
        const csv = XLSX.utils.sheet_to_csv(sheet);
        setContent(csv);
      } else if (ext === "pdf") {
        const pdfjsLib = await import("pdfjs-dist");
        pdfjsLib.GlobalWorkerOptions.workerSrc = `//unpkg.com/pdfjs-dist@${pdfjsLib.version}/build/pdf.worker.min.mjs`;
        const buffer = await file.arrayBuffer();
        const pdf = await pdfjsLib.getDocument({ data: buffer }).promise;
        let text = "";
        for (let i = 1; i <= pdf.numPages; i++) {
          const page = await pdf.getPage(i);
          const tc = await page.getTextContent();
          const line = tc.items
            .map((it: unknown) =>
              typeof it === "object" && it !== null && "str" in it
                ? String((it as { str: string }).str)
                : ""
            )
            .join(" ");
          text += line + "\n\n";
        }
        setContent(text.trim());
      } else {
        const fallback = await file.text();
        setContent(fallback);
      }
    } catch {
      alert("Could not parse this file format.");
    } finally {
      setLoading(false);
    }
  };

  const exportAsPdf = () => {
    const doc = new jsPDF();
    doc.setFontSize(12);
    const lines = doc.splitTextToSize(content, 180);
    doc.text(lines, 15, 20);
    doc.save(`${fileName || "Document"}.pdf`);
  };

  const exportAsWord = () => {
    const html = `<html><body>${content
      .split("\n")
      .map((l) => `<p>${l || "&nbsp;"}</p>`)
      .join("")}</body></html>`;
    const blob = new Blob(["\ufeff", html], { type: "application/msword" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `${fileName || "Document"}.doc`;
    a.click();
    URL.revokeObjectURL(url);
  };

  const exportAsExcel = () => {
    const rows = content.split("\n").map((line) => line.split(","));
    const ws = XLSX.utils.aoa_to_sheet(rows);
    const wb = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(wb, ws, "Sheet1");
    XLSX.writeFile(wb, `${fileName || "Spreadsheet"}.xlsx`);
  };

  const exportAsTxt = () => {
    const blob = new Blob([content], { type: "text/plain;charset=utf-8" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `${fileName || "Document"}.txt`;
    a.click();
    URL.revokeObjectURL(url);
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 via-fuchsia-50/30 to-pink-50/40 text-slate-800 p-4 sm:p-8">
      <div className="max-w-5xl mx-auto">
        <div className="flex items-center justify-between mb-6">
          <Link
            href="/"
            className="inline-flex items-center gap-2 px-4 py-2 rounded-xl bg-white border border-slate-200 text-slate-700 text-sm font-semibold shadow-sm hover:bg-slate-50 hover:text-fuchsia-600 transition"
          >
            <ArrowLeft className="w-4 h-4" /> Dashboard
          </Link>
          <span className="text-xs font-bold uppercase tracking-wider px-3 py-1 rounded-full bg-fuchsia-100 text-fuchsia-700">
            Universal File Studio
          </span>
        </div>

        <div className="bg-white rounded-3xl shadow-xl shadow-slate-200/60 border border-slate-200/80 overflow-hidden">
          <div className="bg-gradient-to-r from-fuchsia-600 to-pink-600 p-6 sm:p-8 text-white flex items-center gap-4">
            <div className="w-14 h-14 rounded-2xl bg-white/15 backdrop-blur-sm border border-white/20 flex items-center justify-center">
              <FolderOpen className="w-7 h-7 text-white" />
            </div>
            <div>
              <h1 className="text-2xl font-extrabold tracking-tight">
                Universal File Viewer & Converter
              </h1>
              <p className="text-fuchsia-100 text-sm mt-0.5">
                Open any PDF, Word, Excel, CSV, or Text file, edit its content, and export to any format
              </p>
            </div>
          </div>

          <div className="p-6 sm:p-8">
            <label className="flex flex-col items-center justify-center border-2 border-dashed border-fuchsia-200 hover:border-fuchsia-500 rounded-2xl p-8 bg-fuchsia-50/30 hover:bg-fuchsia-50/60 transition cursor-pointer mb-6">
              <Upload className="w-10 h-10 text-fuchsia-600 mb-3" />
              <span className="font-bold text-slate-800 text-base">
                Open Any File (.pdf, .docx, .xlsx, .csv, .txt)
              </span>
              <span className="text-xs text-slate-500 mt-1">
                Edit content directly in the workspace and convert to your desired format
              </span>
              <input
                type="file"
                accept=".pdf,.docx,.xlsx,.xls,.csv,.txt,.md,.json"
                onChange={handleAnyFile}
                className="hidden"
              />
            </label>

            {loading && (
              <div className="flex items-center justify-center gap-2 text-fuchsia-600 font-bold py-6">
                <RefreshCw className="w-5 h-5 animate-spin" /> Loading file into editor...
              </div>
            )}

            {content && !loading && (
              <div>
                <div className="flex flex-wrap items-center justify-between gap-2 mb-3">
                  <div className="flex items-center gap-2">
                    <span className="px-2.5 py-1 rounded-lg bg-fuchsia-100 text-fuchsia-700 text-xs font-extrabold">
                      {fileType}
                    </span>
                    <input
                      type="text"
                      value={fileName}
                      onChange={(e) => setFileName(e.target.value)}
                      className="px-3 py-1 bg-slate-100 rounded-lg text-sm font-bold text-slate-800 focus:outline-none"
                    />
                  </div>
                  <span className="text-xs text-slate-500 font-medium">
                    Live Document Editor
                  </span>
                </div>

                <textarea
                  rows={12}
                  value={content}
                  onChange={(e) => setContent(e.target.value)}
                  className="w-full p-4 bg-slate-50 border border-slate-200 rounded-2xl text-slate-800 text-sm font-mono leading-relaxed focus:bg-white focus:outline-none focus:border-fuchsia-500 mb-6"
                />

                {/* 4 Format Export Buttons */}
                <p className="text-xs font-bold uppercase tracking-wider text-slate-500 mb-3">
                  Convert & Export As:
                </p>
                <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
                  <button
                    type="button"
                    onClick={exportAsPdf}
                    className="py-3.5 px-4 rounded-xl bg-rose-600 hover:bg-rose-500 text-white font-bold text-xs flex items-center justify-center gap-2 shadow-md shadow-rose-600/20 cursor-pointer"
                  >
                    <FileText className="w-4 h-4" /> Export PDF
                  </button>
                  <button
                    type="button"
                    onClick={exportAsWord}
                    className="py-3.5 px-4 rounded-xl bg-indigo-600 hover:bg-indigo-500 text-white font-bold text-xs flex items-center justify-center gap-2 shadow-md shadow-indigo-600/20 cursor-pointer"
                  >
                    <FileType className="w-4 h-4" /> Export Word
                  </button>
                  <button
                    type="button"
                    onClick={exportAsExcel}
                    className="py-3.5 px-4 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white font-bold text-xs flex items-center justify-center gap-2 shadow-md shadow-emerald-600/20 cursor-pointer"
                  >
                    <FileSpreadsheet className="w-4 h-4" /> Export Excel
                  </button>
                  <button
                    type="button"
                    onClick={exportAsTxt}
                    className="py-3.5 px-4 rounded-xl bg-slate-800 hover:bg-slate-700 text-white font-bold text-xs flex items-center justify-center gap-2 shadow-md shadow-slate-800/20 cursor-pointer"
                  >
                    <FileCode className="w-4 h-4" /> Export TXT
                  </button>
                </div>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}