"use client";
import { useState } from "react";
import Link from "next/link";
import { jsPDF } from "jspdf";
import {
  ArrowLeft,
  Minimize2,
  Upload,
  Download,
  RefreshCw,
  CheckCircle2,
  FileDown,
} from "lucide-react";

export default function CompressorPage() {
  const [mode, setMode] = useState<"pdf" | "image">("pdf");
  const [quality, setQuality] = useState<number>(0.6); // 0.3 (Extreme), 0.6 (Balanced), 0.85 (Light)
  const [originalSize, setOriginalSize] = useState<number>(0);
  const [compressedSize, setCompressedSize] = useState<number>(0);
  const [compressedUrl, setCompressedUrl] = useState<string>("");
  const [outputName, setOutputName] = useState<string>("");
  const [processing, setProcessing] = useState<boolean>(false);

  const formatBytes = (bytes: number) => {
    if (bytes === 0) return "0 KB";
    const k = 1024;
    const sizes = ["Bytes", "KB", "MB"];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + " " + sizes[i];
  };

  // Compress Image
  const handleImageCompress = async (file: File) => {
    setProcessing(true);
    setOriginalSize(file.size);
    setOutputName(file.name.replace(/\.[^/.]+$/, "") + "_compressed.jpg");

    const img = new Image();
    img.src = URL.createObjectURL(file);
    await new Promise((resolve) => {
      img.onload = resolve;
    });

    // Scale down dimensions slightly for stronger compression
    const scale = quality < 0.5 ? 0.7 : quality < 0.8 ? 0.85 : 1;
    const canvas = document.createElement("canvas");
    canvas.width = img.width * scale;
    canvas.height = img.height * scale;

    const ctx = canvas.getContext("2d");
    if (ctx) {
      ctx.drawImage(img, 0, 0, canvas.width, canvas.height);
    }

    canvas.toBlob(
      (blob) => {
        if (blob) {
          setCompressedSize(blob.size);
          setCompressedUrl(URL.createObjectURL(blob));
        }
        setProcessing(false);
      },
      "image/jpeg",
      quality
    );
  };

  // Compress PDF by rendering pages at optimized DPI & JPEG quality
  const handlePdfCompress = async (file: File) => {
    setProcessing(true);
    setOriginalSize(file.size);
    setOutputName(file.name.replace(/\.[^/.]+$/, "") + "_compressed.pdf");

    try {
      const pdfjsLib = await import("pdfjs-dist");
      pdfjsLib.GlobalWorkerOptions.workerSrc = `//unpkg.com/pdfjs-dist@${pdfjsLib.version}/build/pdf.worker.min.mjs`;

      const arrayBuffer = await file.arrayBuffer();
      const pdf = await pdfjsLib.getDocument({ data: arrayBuffer }).promise;

      const doc = new jsPDF("p", "mm", "a4");
      const pageWidth = doc.internal.pageSize.getWidth();
      const pageHeight = doc.internal.pageSize.getHeight();
      const renderScale = quality < 0.5 ? 1.0 : quality < 0.8 ? 1.3 : 1.7;

      for (let i = 1; i <= pdf.numPages; i++) {
        if (i > 1) doc.addPage();
        const page = await pdf.getPage(i);
        const viewport = page.getViewport({ scale: renderScale });

        const canvas = document.createElement("canvas");
        canvas.width = viewport.width;
        canvas.height = viewport.height;
        const ctx = canvas.getContext("2d");

        if (ctx) {
          await page.render({ canvasContext: ctx, viewport, canvas }).promise;
          const imgData = canvas.toDataURL("image/jpeg", quality);
          doc.addImage(imgData, "JPEG", 0, 0, pageWidth, pageHeight, undefined, "FAST");
        }
      }

      const pdfBlob = doc.output("blob");
      setCompressedSize(pdfBlob.size);
      setCompressedUrl(URL.createObjectURL(pdfBlob));
    } catch {
      alert("Unable to compress this PDF. Please try another file.");
    } finally {
      setProcessing(false);
    }
  };

  const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    setCompressedUrl("");
    if (mode === "pdf") {
      handlePdfCompress(file);
    } else {
      handleImageCompress(file);
    }
  };

  const savedPercent =
    originalSize > 0 && compressedSize > 0
      ? Math.max(0, Math.round(((originalSize - compressedSize) / originalSize) * 100))
      : 0;

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 via-rose-50/30 to-orange-50/40 text-slate-800 p-4 sm:p-8">
      <div className="max-w-4xl mx-auto">
        <div className="flex items-center justify-between mb-6">
          <Link
            href="/"
            className="inline-flex items-center gap-2 px-4 py-2 rounded-xl bg-white border border-slate-200 text-slate-700 text-sm font-semibold shadow-sm hover:bg-slate-50 hover:text-rose-600 transition"
          >
            <ArrowLeft className="w-4 h-4" /> Dashboard
          </Link>
          <span className="text-xs font-bold uppercase tracking-wider px-3 py-1 rounded-full bg-rose-100 text-rose-700">
            Smart Size Reducer
          </span>
        </div>

        <div className="bg-white rounded-3xl shadow-xl shadow-slate-200/60 border border-slate-200/80 overflow-hidden">
          {/* Header */}
          <div className="bg-gradient-to-r from-rose-600 to-orange-600 p-6 sm:p-8 text-white flex items-center gap-4">
            <div className="w-14 h-14 rounded-2xl bg-white/15 backdrop-blur-sm border border-white/20 flex items-center justify-center">
              <Minimize2 className="w-7 h-7 text-white" />
            </div>
            <div>
              <h1 className="text-2xl font-extrabold tracking-tight">
                PDF & Image Compressor
              </h1>
              <p className="text-rose-100 text-sm mt-0.5">
                Shrink large PDF documents and photos to KB size without losing readability
              </p>
            </div>
          </div>

          <div className="p-6 sm:p-8">
            {/* Mode Switcher */}
            <div className="grid grid-cols-2 gap-2 bg-slate-100 p-1.5 rounded-2xl mb-6">
              <button
                type="button"
                onClick={() => {
                  setMode("pdf");
                  setCompressedUrl("");
                }}
                className={`py-3 rounded-xl text-sm font-bold transition cursor-pointer ${
                  mode === "pdf"
                    ? "bg-white text-rose-600 shadow-sm"
                    : "text-slate-600 hover:text-slate-900"
                }`}
              >
                Compress PDF (.pdf)
              </button>
              <button
                type="button"
                onClick={() => {
                  setMode("image");
                  setCompressedUrl("");
                }}
                className={`py-3 rounded-xl text-sm font-bold transition cursor-pointer ${
                  mode === "image"
                    ? "bg-white text-orange-600 shadow-sm"
                    : "text-slate-600 hover:text-slate-900"
                }`}
              >
                Compress Image (.jpg / .png)
              </button>
            </div>

            {/* Compression Level Selector */}
            <div className="mb-6">
              <label className="block text-xs font-bold uppercase tracking-wider text-slate-500 mb-2">
                Select Compression Level
              </label>
              <div className="grid grid-cols-3 gap-3">
                {[
                  { label: "Extreme", sub: "Smallest Size", val: 0.35 },
                  { label: "Recommended", sub: "Balanced Quality", val: 0.6 },
                  { label: "Light", sub: "High Quality", val: 0.85 },
                ].map((lvl) => (
                  <button
                    key={lvl.val}
                    type="button"
                    onClick={() => setQuality(lvl.val)}
                    className={`p-3 rounded-2xl border-2 text-left transition cursor-pointer ${
                      quality === lvl.val
                        ? "border-rose-500 bg-rose-50/50"
                        : "border-slate-200 hover:border-slate-300"
                    }`}
                  >
                    <div className="font-bold text-sm text-slate-900">{lvl.label}</div>
                    <div className="text-[11px] text-slate-500">{lvl.sub}</div>
                  </button>
                ))}
              </div>
            </div>

            {/* Upload Area */}
            <label className="flex flex-col items-center justify-center border-2 border-dashed border-rose-200 hover:border-rose-500 rounded-2xl p-8 bg-rose-50/30 hover:bg-rose-50/60 transition cursor-pointer mb-6">
              <Upload className="w-10 h-10 text-rose-600 mb-3" />
              <span className="font-bold text-slate-800 text-base">
                {mode === "pdf"
                  ? "Click to Upload PDF File to Compress"
                  : "Click to Upload Image to Compress"}
              </span>
              <span className="text-xs text-slate-500 mt-1">
                Fast browser-based compression • Zero server upload
              </span>
              <input
                type="file"
                accept={mode === "pdf" ? ".pdf" : "image/*"}
                onChange={handleFileSelect}
                className="hidden"
              />
            </label>

            {processing && (
              <div className="flex items-center justify-center gap-2 text-rose-600 font-bold py-6">
                <RefreshCw className="w-5 h-5 animate-spin" /> Compressing your file...
              </div>
            )}

            {/* Compression Results Card */}
            {compressedUrl && !processing && (
              <div className="bg-slate-50 border border-slate-200 rounded-2xl p-6">
                <div className="flex items-center justify-between mb-4">
                  <span className="inline-flex items-center gap-1.5 text-sm font-bold text-emerald-600">
                    <CheckCircle2 className="w-5 h-5" /> Compression Complete!
                  </span>
                  <span className="px-3 py-1 rounded-full bg-emerald-100 text-emerald-800 text-xs font-extrabold">
                    Saved {savedPercent}%
                  </span>
                </div>

                <div className="grid grid-cols-2 gap-4 bg-white p-4 rounded-xl border border-slate-200 mb-6 text-center">
                  <div>
                    <div className="text-xs text-slate-400 font-semibold">Original Size</div>
                    <div className="text-lg font-extrabold text-slate-700 mt-0.5">
                      {formatBytes(originalSize)}
                    </div>
                  </div>
                  <div className="border-l border-slate-100">
                    <div className="text-xs text-slate-400 font-semibold">Compressed Size</div>
                    <div className="text-lg font-extrabold text-rose-600 mt-0.5">
                      {formatBytes(compressedSize)}
                    </div>
                  </div>
                </div>

                <a
                  href={compressedUrl}
                  download={outputName}
                  className="w-full py-4 px-6 rounded-2xl bg-gradient-to-r from-rose-600 to-orange-600 hover:from-rose-500 hover:to-orange-500 text-white font-bold text-base shadow-lg shadow-rose-600/30 flex items-center justify-center gap-2.5"
                >
                  <Download className="w-5 h-5" /> Download Compressed File ({formatBytes(compressedSize)})
                </a>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}