"use client";
import { useState, useRef } from "react";
import Link from "next/link";
import { jsPDF } from "jspdf";
import {
  ArrowLeft,
  Camera,
  ImagePlus,
  Download,
  Trash2,
  Sparkles,
  CheckCircle2,
  FileCheck2,
} from "lucide-react";

interface ScannedPage {
  id: string;
  dataUrl: string;
  filter: "none" | "grayscale(100%) contrast(140%)" | "contrast(125%) saturate(130%)";
}

export default function ScannerPage() {
  const [pages, setPages] = useState<ScannedPage[]>([]);
  const [pdfName, setPdfName] = useState("Scanned_Document");
  const [downloaded, setDownloaded] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const cameraInputRef = useRef<HTMLInputElement>(null);

  const handleFiles = (files: FileList | null) => {
    if (!files) return;
    Array.from(files).forEach((file) => {
      const reader = new FileReader();
      reader.onload = (e) => {
        if (e.target?.result) {
          setPages((prev) => [
            ...prev,
            {
              id: Math.random().toString(36).substring(2, 9),
              dataUrl: e.target!.result as string,
              filter: "contrast(125%) saturate(130%)",
            },
          ]);
        }
      };
      reader.readAsDataURL(file);
    });
  };

  const updateFilter = (
    id: string,
    filter: "none" | "grayscale(100%) contrast(140%)" | "contrast(125%) saturate(130%)"
  ) => {
    setPages((prev) =>
      prev.map((p) => (p.id === id ? { ...p, filter } : p))
    );
  };

  const removePage = (id: string) => {
    setPages((prev) => prev.filter((p) => p.id !== id));
  };

  const generatePdf = async () => {
    if (pages.length === 0) {
      alert("Please capture or upload at least one image first!");
      return;
    }

    const doc = new jsPDF("p", "mm", "a4");
    const pageWidth = doc.internal.pageSize.getWidth();
    const pageHeight = doc.internal.pageSize.getHeight();

    for (let i = 0; i < pages.length; i++) {
      if (i > 0) doc.addPage();

      const img = new Image();
      img.src = pages[i].dataUrl;
      await new Promise((resolve) => {
        img.onload = resolve;
      });

      const canvas = document.createElement("canvas");
      canvas.width = img.width;
      canvas.height = img.height;
      const ctx = canvas.getContext("2d");
      if (ctx) {
        ctx.filter = pages[i].filter;
        ctx.drawImage(img, 0, 0);
      }

      const filteredDataUrl = canvas.toDataURL("image/jpeg", 0.9);
      const ratio = Math.min(
        (pageWidth - 20) / img.width,
        (pageHeight - 20) / img.height
      );
      const w = img.width * ratio;
      const h = img.height * ratio;
      const x = (pageWidth - w) / 2;
      const y = (pageHeight - h) / 2;

      doc.addImage(filteredDataUrl, "JPEG", x, y, w, h);
    }

    const cleanName = (pdfName.trim() || "Scanned_Doc").replace(/\s+/g, "_") + ".pdf";
    doc.save(cleanName);
    setDownloaded(true);
    setTimeout(() => setDownloaded(false), 3000);
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 via-blue-50/30 to-cyan-50/40 text-slate-800 p-4 sm:p-8">
      <div className="max-w-5xl mx-auto">
        <div className="flex items-center justify-between mb-6">
          <Link
            href="/"
            className="inline-flex items-center gap-2 px-4 py-2 rounded-xl bg-white border border-slate-200 text-slate-700 text-sm font-semibold shadow-sm hover:bg-slate-50 hover:text-blue-600 transition"
          >
            <ArrowLeft className="w-4 h-4" /> Dashboard
          </Link>
          <span className="text-xs font-bold uppercase tracking-wider px-3 py-1 rounded-full bg-blue-100 text-blue-700">
            HD Scanner Engine
          </span>
        </div>

        <div className="bg-white rounded-3xl shadow-xl shadow-slate-200/60 border border-slate-200/80 overflow-hidden">
          <div className="bg-gradient-to-r from-blue-600 to-cyan-600 p-6 sm:p-8 text-white flex flex-col sm:flex-row sm:items-center justify-between gap-4">
            <div className="flex items-center gap-4">
              <div className="w-14 h-14 rounded-2xl bg-white/15 backdrop-blur-sm border border-white/20 flex items-center justify-center">
                <Camera className="w-7 h-7 text-white" />
              </div>
              <div>
                <h1 className="text-2xl font-extrabold tracking-tight">
                  Smart Camera & Image Scanner
                </h1>
                <p className="text-blue-100 text-sm mt-0.5">
                  Scan documents, apply Magic Color enhancement, and export multi-page PDFs
                </p>
              </div>
            </div>
          </div>

          <div className="p-6 sm:p-8">
            <input
              ref={cameraInputRef}
              type="file"
              accept="image/*"
              capture="environment"
              onChange={(e) => handleFiles(e.target.files)}
              className="hidden"
            />
            <input
              ref={fileInputRef}
              type="file"
              accept="image/*"
              multiple
              onChange={(e) => handleFiles(e.target.files)}
              className="hidden"
            />

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 mb-8">
              <button
                type="button"
                onClick={() => cameraInputRef.current?.click()}
                className="flex items-center justify-center gap-3 p-5 rounded-2xl bg-gradient-to-r from-blue-600 to-cyan-600 hover:from-blue-500 hover:to-cyan-500 text-white font-bold shadow-lg shadow-blue-500/25 cursor-pointer"
              >
                <Camera className="w-6 h-6" />
                <span>Take Photo (Camera)</span>
              </button>

              <button
                type="button"
                onClick={() => fileInputRef.current?.click()}
                className="flex items-center justify-center gap-3 p-5 rounded-2xl bg-slate-900 hover:bg-slate-800 text-white font-bold shadow-lg shadow-slate-900/20 cursor-pointer"
              >
                <ImagePlus className="w-6 h-6 text-cyan-400" />
                <span>Import from Gallery (Multiple)</span>
              </button>
            </div>

            {pages.length === 0 ? (
              <div className="border-2 border-dashed border-slate-200 rounded-2xl p-12 text-center bg-slate-50/50">
                <FileCheck2 className="w-12 h-12 text-slate-300 mx-auto mb-3" />
                <p className="font-bold text-slate-600">No pages scanned yet</p>
                <p className="text-xs text-slate-400 mt-1">
                  Use the buttons above to open your camera or select images from your gallery
                </p>
              </div>
            ) : (
              <>
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-5">
                  <h2 className="font-bold text-slate-800 flex items-center gap-2">
                    <Sparkles className="w-4 h-4 text-blue-600" /> Scanned Pages ({pages.length})
                  </h2>
                  <input
                    type="text"
                    value={pdfName}
                    onChange={(e) => setPdfName(e.target.value)}
                    placeholder="Enter PDF file name..."
                    className="px-4 py-2 bg-slate-50 border border-slate-200 rounded-xl text-sm font-semibold focus:outline-none focus:border-blue-500"
                  />
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-5 mb-8">
                  {pages.map((page, index) => (
                    <div
                      key={page.id}
                      className="bg-slate-50 rounded-2xl p-3 border border-slate-200 flex flex-col justify-between"
                    >
                      <div className="relative rounded-xl overflow-hidden bg-slate-200 aspect-[3/4] mb-3">
                        <img
                          src={page.dataUrl}
                          alt={`Page ${index + 1}`}
                          style={{ filter: page.filter }}
                          className="w-full h-full object-contain"
                        />
                        <span className="absolute top-2 left-2 bg-slate-900/80 text-white text-xs font-bold px-2.5 py-1 rounded-lg">
                          Page {index + 1}
                        </span>
                        <button
                          type="button"
                          onClick={() => removePage(page.id)}
                          className="absolute top-2 right-2 w-8 h-8 rounded-lg bg-red-500 text-white flex items-center justify-center hover:bg-red-600 cursor-pointer"
                        >
                          <Trash2 className="w-4 h-4" />
                        </button>
                      </div>

                      <div className="grid grid-cols-3 gap-1.5">
                        <button
                          type="button"
                          onClick={() => updateFilter(page.id, "none")}
                          className={`py-1.5 rounded-lg text-[11px] font-bold cursor-pointer ${
                            page.filter === "none"
                              ? "bg-blue-600 text-white"
                              : "bg-white text-slate-600 border border-slate-200"
                          }`}
                        >
                          Original
                        </button>
                        <button
                          type="button"
                          onClick={() =>
                            updateFilter(page.id, "contrast(125%) saturate(130%)")
                          }
                          className={`py-1.5 rounded-lg text-[11px] font-bold cursor-pointer ${
                            page.filter === "contrast(125%) saturate(130%)"
                              ? "bg-blue-600 text-white"
                              : "bg-white text-slate-600 border border-slate-200"
                          }`}
                        >
                          Magic Color
                        </button>
                        <button
                          type="button"
                          onClick={() =>
                            updateFilter(page.id, "grayscale(100%) contrast(140%)")
                          }
                          className={`py-1.5 rounded-lg text-[11px] font-bold cursor-pointer ${
                            page.filter === "grayscale(100%) contrast(140%)"
                              ? "bg-blue-600 text-white"
                              : "bg-white text-slate-600 border border-slate-200"
                          }`}
                        >
                          B&W Scan
                        </button>
                      </div>
                    </div>
                  ))}
                </div>

                <button
                  type="button"
                  onClick={generatePdf}
                  className="w-full py-4 px-6 rounded-2xl bg-gradient-to-r from-blue-600 to-cyan-600 hover:from-blue-500 hover:to-cyan-500 text-white font-bold text-base shadow-lg shadow-blue-600/30 flex items-center justify-center gap-2.5 cursor-pointer"
                >
                  {downloaded ? (
                    <>
                      <CheckCircle2 className="w-5 h-5" /> Multi-Page PDF Saved!
                    </>
                  ) : (
                    <>
                      <Download className="w-5 h-5" /> Export {pages.length} Page(s) as HD PDF
                    </>
                  )}
                </button>
              </>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}