"use client";

import React, { useState } from "react";
import Link from "next/link";
import PptxGenJS from "pptxgenjs";
import {
  ArrowLeft,
  Presentation,
  Upload,
  Download,
  FileText,
  Loader2,
  CheckCircle2,
  Trash2,
} from "lucide-react";

export default function PdfToPptPage() {
  const [pdfFile, setPdfFile] = useState<File | null>(null);
  const [isConverting, setIsConverting] = useState(false);
  const [progress, setProgress] = useState("");
  const [doneMessage, setDoneMessage] = useState("");

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    if (!file.name.toLowerCase().endsWith(".pdf")) {
      alert("Please select a valid PDF (.pdf) file.");
      return;
    }
    setPdfFile(file);
    setDoneMessage("");
    setProgress("");
    e.target.value = "";
  };

  const handleConvert = async () => {
    if (!pdfFile) return;

    setIsConverting(true);
    setDoneMessage("");
    setProgress("Loading PDF document...");

    try {
      const arrayBuffer = await pdfFile.arrayBuffer();
      const pdfjs = await import("pdfjs-dist");
      pdfjs.GlobalWorkerOptions.workerSrc = `//unpkg.com/pdfjs-dist@${pdfjs.version}/build/pdf.worker.min.mjs`;

      const loadingTask = pdfjs.getDocument({ data: arrayBuffer });
      const pdf = await loadingTask.promise;
      const totalPages = pdf.numPages;

      const pptx = new PptxGenJS();
      pptx.layout = "LAYOUT_16x9";
      pptx.title = pdfFile.name.replace(/\.pdf$/i, "");

      for (let pageNum = 1; pageNum <= totalPages; pageNum++) {
        setProgress(`Converting slide ${pageNum} of ${totalPages}...`);

        const page = await pdf.getPage(pageNum);
        const viewport = page.getViewport({ scale: 2.0 }); // High-res HD render

        const canvas = document.createElement("canvas");
        const context = canvas.getContext("2d");
        if (!context) continue;

        canvas.width = viewport.width;
        canvas.height = viewport.height;

        await page.render({
          canvasContext: context,
          viewport,
          canvas,
        }).promise;

        const imgData = canvas.toDataURL("image/png");

        // Calculate aspect-ratio-safe placement inside 16:9 slide (10 x 5.625 inches)
        const slideW = 10;
        const slideH = 5.625;
        const imgRatio = viewport.width / viewport.height;
        const slideRatio = slideW / slideH;

        let drawW = slideW;
        let drawH = slideH;
        let offsetX = 0;
        let offsetY = 0;

        if (imgRatio > slideRatio) {
          drawH = slideW / imgRatio;
          offsetY = (slideH - drawH) / 2;
        } else {
          drawW = slideH * imgRatio;
          offsetX = (slideW - drawW) / 2;
        }

        const slide = pptx.addSlide();
        slide.background = { color: "FFFFFF" };
        slide.addImage({
          data: imgData,
          x: offsetX,
          y: offsetY,
          w: drawW,
          h: drawH,
        });
      }

      setProgress("Generating PowerPoint (.pptx) file...");
      const baseName = pdfFile.name.replace(/\.pdf$/i, "");
      await pptx.writeFile({ fileName: `${baseName}_SmartDoc.pptx` });

      setDoneMessage(`Successfully converted ${totalPages} page(s) into PowerPoint (.pptx)!`);
    } catch (error) {
      console.error(error);
      alert("Failed to convert PDF to PowerPoint. Please make sure the PDF is not password-protected.");
    } finally {
      setIsConverting(false);
      setProgress("");
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 via-orange-50/30 to-amber-50/40 text-slate-800">
      <nav className="sticky top-0 z-50 backdrop-blur-md bg-white/80 border-b border-slate-200/70">
        <div className="max-w-4xl mx-auto px-4 h-16 flex items-center justify-between">
          <Link
            href="/"
            className="inline-flex items-center gap-2 text-sm font-bold text-slate-600 hover:text-orange-600 transition-colors"
          >
            <ArrowLeft className="w-4 h-4" /> Back to Studio
          </Link>
          <span className="text-xs font-extrabold uppercase tracking-wider px-3 py-1 rounded-full bg-orange-100 text-orange-800">
            Slides Tool
          </span>
        </div>
      </nav>

      <main className="max-w-4xl mx-auto px-4 py-8">
        <div className="bg-white rounded-3xl border border-slate-200/80 shadow-xl shadow-slate-200/40 p-6 sm:p-8">
          <div className="flex items-center gap-3 mb-2">
            <div className="w-12 h-12 rounded-2xl bg-gradient-to-br from-amber-500 to-red-600 flex items-center justify-center text-white shadow-lg shadow-orange-500/25">
              <Presentation className="w-6 h-6" />
            </div>
            <div>
              <h1 className="text-2xl font-extrabold text-slate-900">PDF to PowerPoint (.pptx)</h1>
              <p className="text-sm text-slate-500">
                Turn every PDF page into a crisp HD PowerPoint slide deck instantly
              </p>
            </div>
          </div>

          {!pdfFile ? (
            <label className="mt-6 flex flex-col items-center justify-center border-2 border-dashed border-orange-300 hover:border-orange-500 bg-orange-50/40 hover:bg-orange-50/80 rounded-2xl p-10 cursor-pointer transition-all">
              <Upload className="w-10 h-10 text-orange-600 mb-2" />
              <span className="font-bold text-slate-800">Click to Upload PDF File</span>
              <span className="text-xs text-slate-500 mt-1">
                Each page of your PDF becomes a high-resolution 16:9 slide
              </span>
              <input
                type="file"
                accept=".pdf,application/pdf"
                onChange={handleFileChange}
                className="hidden"
              />
            </label>
          ) : (
            <div className="mt-6 p-4 rounded-2xl bg-slate-50 border border-slate-200/80 flex items-center justify-between gap-4">
              <div className="flex items-center gap-3 min-w-0">
                <div className="w-10 h-10 rounded-xl bg-rose-100 text-rose-600 flex items-center justify-center shrink-0">
                  <FileText className="w-5 h-5" />
                </div>
                <div className="truncate">
                  <p className="text-sm font-bold text-slate-800 truncate">{pdfFile.name}</p>
                  <p className="text-xs text-slate-500">
                    {(pdfFile.size / (1024 * 1024)).toFixed(2)} MB • Ready to convert
                  </p>
                </div>
              </div>

              <button
                onClick={() => {
                  setPdfFile(null);
                  setDoneMessage("");
                }}
                disabled={isConverting}
                className="p-2 rounded-xl text-rose-600 hover:bg-rose-100 disabled:opacity-40"
                title="Remove File"
              >
                <Trash2 className="w-4 h-4" />
              </button>
            </div>
          )}

          <div className="mt-6 pt-6 border-t border-slate-100 flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-4">
            <div className="text-xs font-medium text-slate-500">
              {progress || "Output: Standard 16:9 Widescreen PowerPoint (.pptx)"}
            </div>

            <button
              onClick={handleConvert}
              disabled={!pdfFile || isConverting}
              className="inline-flex items-center justify-center gap-2 px-6 py-3 rounded-xl bg-gradient-to-r from-amber-500 to-red-600 text-white font-bold text-sm shadow-lg shadow-orange-500/25 hover:opacity-95 disabled:opacity-50 transition-all"
            >
              {isConverting ? (
                <>
                  <Loader2 className="w-4 h-4 animate-spin" /> Converting...
                </>
              ) : (
                <>
                  <Download className="w-4 h-4" /> Convert & Download PPTX
                </>
              )}
            </button>
          </div>

          {doneMessage && (
            <div className="mt-4 p-3.5 rounded-xl bg-emerald-50 border border-emerald-200 text-emerald-800 text-sm font-semibold flex items-center gap-2">
              <CheckCircle2 className="w-5 h-5 text-emerald-600 shrink-0" />
              {doneMessage}
            </div>
          )}
        </div>
      </main>
    </div>
  );
}