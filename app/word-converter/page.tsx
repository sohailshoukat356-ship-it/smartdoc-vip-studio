"use client";
import { useState } from "react";
import Link from "next/link";
import mammoth from "mammoth";
import { jsPDF } from "jspdf";
import {
  ArrowLeft,
  FileType,
  Upload,
  Download,
  RefreshCw,
  CheckCircle2,
  FileText,
} from "lucide-react";

export default function WordConverterPage() {
  const [mode, setMode] = useState<"word-to-pdf" | "pdf-to-word">("word-to-pdf");
  const [fileName, setFileName] = useState<string>("");
  const [extractedText, setExtractedText] = useState<string>("");
  const [loading, setLoading] = useState<boolean>(false);
  const [done, setDone] = useState<boolean>(false);

  // Handle Word (.docx) Upload
  const handleWordUpload = async (file: File) => {
    setLoading(true);
    setDone(false);
    setFileName(file.name.replace(/\.[^/.]+$/, ""));
    try {
      const arrayBuffer = await file.arrayBuffer();
      const result = await mammoth.extractRawText({ arrayBuffer });
      setExtractedText(result.value || "No readable text found in this Word file.");
    } catch {
      alert("Error reading Word file. Please make sure it is a valid .docx document.");
    } finally {
      setLoading(false);
    }
  };

  // Handle PDF (.pdf) Upload
  const handlePdfUpload = async (file: File) => {
    setLoading(true);
    setDone(false);
    setFileName(file.name.replace(/\.[^/.]+$/, ""));
    try {
      const pdfjsLib = await import("pdfjs-dist");
      pdfjsLib.GlobalWorkerOptions.workerSrc = `//unpkg.com/pdfjs-dist@${pdfjsLib.version}/build/pdf.worker.min.mjs`;

      const arrayBuffer = await file.arrayBuffer();
      const pdf = await pdfjsLib.getDocument({ data: arrayBuffer }).promise;
      let fullText = "";

      for (let i = 1; i <= pdf.numPages; i++) {
        const page = await pdf.getPage(i);
        const content = await page.getTextContent();
        const strings = content.items.map((item: unknown) =>
          typeof item === "object" && item !== null && "str" in item
            ? String((item as { str: string }).str)
            : ""
        );
        fullText += `--- Page ${i} ---\n` + strings.join(" ") + "\n\n";
      }

      setExtractedText(fullText.trim() || "No selectable text found in this PDF.");
    } catch {
      alert("Error reading PDF file. Please try another PDF.");
    } finally {
      setLoading(false);
    }
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    if (mode === "word-to-pdf") {
      handleWordUpload(file);
    } else {
      handlePdfUpload(file);
    }
  };

  // Export Result
  const handleDownload = () => {
    if (!extractedText.trim()) return;

    if (mode === "word-to-pdf") {
      const doc = new jsPDF();
      doc.setFont("helvetica", "normal");
      doc.setFontSize(12);
      const lines = doc.splitTextToSize(extractedText, 180);
      doc.text(lines, 15, 20);
      doc.save(`${fileName || "Converted_Document"}.pdf`);
    } else {
      // Export as Microsoft Word (.doc) compatible HTML
      const htmlContent = `
        <html xmlns:o='urn:schemas-microsoft-com:office:office' xmlns:w='urn:schemas-microsoft-com:office:word' xmlns='http://www.w3.org/TR/REC-html40'>
        <head><meta charset='utf-8'><title>${fileName}</title></head>
        <body style="font-family: Calibri, sans-serif; line-height: 1.6;">
          ${extractedText
            .split("\n")
            .map((line) => `<p>${line || "&nbsp;"}</p>`)
            .join("")}
        </body></html>
      `;
      const blob = new Blob(["\ufeff", htmlContent], {
        type: "application/msword",
      });
      const url = URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = url;
      a.download = `${fileName || "Converted_Document"}.doc`;
      a.click();
      URL.revokeObjectURL(url);
    }

    setDone(true);
    setTimeout(() => setDone(false), 3000);
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 via-indigo-50/30 to-purple-50/40 text-slate-800 p-4 sm:p-8">
      <div className="max-w-4xl mx-auto">
        <div className="flex items-center justify-between mb-6">
          <Link
            href="/"
            className="inline-flex items-center gap-2 px-4 py-2 rounded-xl bg-white border border-slate-200 text-slate-700 text-sm font-semibold shadow-sm hover:bg-slate-50 hover:text-indigo-600 transition"
          >
            <ArrowLeft className="w-4 h-4" /> Dashboard
          </Link>
          <span className="text-xs font-bold uppercase tracking-wider px-3 py-1 rounded-full bg-indigo-100 text-indigo-700">
            Office Document Suite
          </span>
        </div>

        <div className="bg-white rounded-3xl shadow-xl shadow-slate-200/60 border border-slate-200/80 overflow-hidden">
          {/* Header */}
          <div className="bg-gradient-to-r from-indigo-600 to-purple-600 p-6 sm:p-8 text-white flex items-center gap-4">
            <div className="w-14 h-14 rounded-2xl bg-white/15 backdrop-blur-sm border border-white/20 flex items-center justify-center">
              <FileType className="w-7 h-7 text-white" />
            </div>
            <div>
              <h1 className="text-2xl font-extrabold tracking-tight">
                Word ↔ PDF Converter
              </h1>
              <p className="text-indigo-100 text-sm mt-0.5">
                Seamlessly convert between Microsoft Word and PDF formats
              </p>
            </div>
          </div>

          <div className="p-6 sm:p-8">
            {/* Mode Switcher Tabs */}
            <div className="grid grid-cols-2 gap-2 bg-slate-100 p-1.5 rounded-2xl mb-6">
              <button
                type="button"
                onClick={() => {
                  setMode("word-to-pdf");
                  setExtractedText("");
                  setFileName("");
                }}
                className={`py-3 rounded-xl text-sm font-bold transition cursor-pointer ${
                  mode === "word-to-pdf"
                    ? "bg-white text-indigo-700 shadow-sm"
                    : "text-slate-600 hover:text-slate-900"
                }`}
              >
                Word (.docx) → PDF
              </button>
              <button
                type="button"
                onClick={() => {
                  setMode("pdf-to-word");
                  setExtractedText("");
                  setFileName("");
                }}
                className={`py-3 rounded-xl text-sm font-bold transition cursor-pointer ${
                  mode === "pdf-to-word"
                    ? "bg-white text-purple-700 shadow-sm"
                    : "text-slate-600 hover:text-slate-900"
                }`}
              >
                PDF → Word (.doc)
              </button>
            </div>

            {/* File Upload Box */}
            <label className="flex flex-col items-center justify-center border-2 border-dashed border-indigo-200 hover:border-indigo-500 rounded-2xl p-8 bg-indigo-50/30 hover:bg-indigo-50/60 transition cursor-pointer mb-6">
              <Upload className="w-10 h-10 text-indigo-600 mb-3" />
              <span className="font-bold text-slate-800 text-base">
                {mode === "word-to-pdf"
                  ? "Click to Upload Word (.docx) File"
                  : "Click to Upload PDF (.pdf) File"}
              </span>
              <span className="text-xs text-slate-500 mt-1">
                100% client-side conversion • Your files never leave your device
              </span>
              <input
                type="file"
                accept={mode === "word-to-pdf" ? ".docx" : ".pdf"}
                onChange={handleFileChange}
                className="hidden"
              />
            </label>

            {loading && (
              <div className="flex items-center justify-center gap-2 text-indigo-600 font-bold py-6">
                <RefreshCw className="w-5 h-5 animate-spin" /> Processing document...
              </div>
            )}

            {/* Editable Preview & Download */}
            {extractedText && !loading && (
              <div>
                <div className="flex items-center justify-between mb-2">
                  <span className="text-xs font-bold uppercase tracking-wider text-slate-500 flex items-center gap-1.5">
                    <FileText className="w-4 h-4 text-indigo-600" /> Preview & Edit Text Before Saving
                  </span>
                  <span className="text-xs font-semibold text-indigo-600">
                    {fileName}
                  </span>
                </div>

                <textarea
                  rows={10}
                  value={extractedText}
                  onChange={(e) => setExtractedText(e.target.value)}
                  className="w-full p-4 bg-slate-50 border border-slate-200 rounded-2xl text-slate-800 text-sm leading-relaxed focus:bg-white focus:outline-none focus:border-indigo-500 mb-6"
                />

                <button
                  type="button"
                  onClick={handleDownload}
                  className="w-full py-4 px-6 rounded-2xl bg-gradient-to-r from-indigo-600 to-purple-600 hover:from-indigo-500 hover:to-purple-500 text-white font-bold text-base shadow-lg shadow-indigo-600/30 flex items-center justify-center gap-2.5 cursor-pointer"
                >
                  {done ? (
                    <>
                      <CheckCircle2 className="w-5 h-5" /> File Converted & Downloaded!
                    </>
                  ) : (
                    <>
                      <Download className="w-5 h-5" />
                      {mode === "word-to-pdf"
                        ? "Download as PDF (.pdf)"
                        : "Download as Word (.doc)"}
                    </>
                  )}
                </button>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}