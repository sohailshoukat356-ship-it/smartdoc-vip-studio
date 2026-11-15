"use client";
import { useState } from "react";
import Link from "next/link";
import Tesseract from "tesseract.js";
import { jsPDF } from "jspdf";
import {
  ArrowLeft,
  ScanText,
  Upload,
  Copy,
  Download,
  CheckCircle2,
  RefreshCw,
} from "lucide-react";

export default function OcrPage() {
  const [imagePreview, setImagePreview] = useState<string>("");
  const [extractedText, setExtractedText] = useState<string>("");
  const [progress, setProgress] = useState<number>(0);
  const [scanning, setScanning] = useState<boolean>(false);
  const [copied, setCopied] = useState<boolean>(false);

  const handleImageUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const previewUrl = URL.createObjectURL(file);
    setImagePreview(previewUrl);
    setExtractedText("");
    setScanning(true);
    setProgress(0);

    try {
      const result = await Tesseract.recognize(file, "eng", {
        logger: (m) => {
          if (m.status === "recognizing text") {
            setProgress(Math.round(m.progress * 100));
          }
        },
      });
      setExtractedText(result.data.text || "No readable text detected in this image.");
    } catch {
      alert("OCR failed. Please try a clearer image.");
    } finally {
      setScanning(false);
    }
  };

  const handleCopy = () => {
    if (!extractedText) return;
    navigator.clipboard.writeText(extractedText);
    setCopied(true);
    setTimeout(() => setCopied(false), 2500);
  };

  const handleSavePdf = () => {
    if (!extractedText.trim()) return;
    const doc = new jsPDF();
    doc.setFont("helvetica", "normal");
    doc.setFontSize(12);
    const lines = doc.splitTextToSize(extractedText, 180);
    doc.text(lines, 15, 20);
    doc.save("OCR_Extracted_Text.pdf");
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 via-orange-50/30 to-amber-50/40 text-slate-800 p-4 sm:p-8">
      <div className="max-w-4xl mx-auto">
        <div className="flex items-center justify-between mb-6">
          <Link
            href="/"
            className="inline-flex items-center gap-2 px-4 py-2 rounded-xl bg-white border border-slate-200 text-slate-700 text-sm font-semibold shadow-sm hover:bg-slate-50 hover:text-orange-600 transition"
          >
            <ArrowLeft className="w-4 h-4" /> Dashboard
          </Link>
          <span className="text-xs font-bold uppercase tracking-wider px-3 py-1 rounded-full bg-orange-100 text-orange-700">
            AI Optical Recognition
          </span>
        </div>

        <div className="bg-white rounded-3xl shadow-xl shadow-slate-200/60 border border-slate-200/80 overflow-hidden">
          <div className="bg-gradient-to-r from-orange-500 to-amber-500 p-6 sm:p-8 text-white flex items-center gap-4">
            <div className="w-14 h-14 rounded-2xl bg-white/15 backdrop-blur-sm border border-white/20 flex items-center justify-center">
              <ScanText className="w-7 h-7 text-white" />
            </div>
            <div>
              <h1 className="text-2xl font-extrabold tracking-tight">
                Image to Text (OCR Scanner)
              </h1>
              <p className="text-orange-100 text-sm mt-0.5">
                Extract editable text from photos, receipts, books, and screenshots
              </p>
            </div>
          </div>

          <div className="p-6 sm:p-8">
            <label className="flex flex-col items-center justify-center border-2 border-dashed border-orange-200 hover:border-orange-500 rounded-2xl p-8 bg-orange-50/30 hover:bg-orange-50/60 transition cursor-pointer mb-6">
              <Upload className="w-10 h-10 text-orange-500 mb-3" />
              <span className="font-bold text-slate-800 text-base">
                Click to Upload Image or Screenshot
              </span>
              <span className="text-xs text-slate-500 mt-1">
                Supports JPG, PNG, WEBP, and BMP formats
              </span>
              <input
                type="file"
                accept="image/*"
                onChange={handleImageUpload}
                className="hidden"
              />
            </label>

            {scanning && (
              <div className="bg-orange-50 border border-orange-200 rounded-2xl p-5 mb-6 text-center">
                <div className="flex items-center justify-center gap-2 text-orange-600 font-bold mb-2">
                  <RefreshCw className="w-5 h-5 animate-spin" /> Scanning Image Text... {progress}%
                </div>
                <div className="w-full bg-orange-200 h-2.5 rounded-full overflow-hidden">
                  <div
                    className="bg-orange-500 h-full transition-all duration-200"
                    style={{ width: `${progress}%` }}
                  />
                </div>
              </div>
            )}

            {(imagePreview || extractedText) && !scanning && (
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                {imagePreview && (
                  <div>
                    <span className="block text-xs font-bold uppercase tracking-wider text-slate-500 mb-2">
                      Source Image
                    </span>
                    <div className="rounded-2xl border border-slate-200 bg-slate-50 p-2 overflow-hidden">
                      <img
                        src={imagePreview}
                        alt="Uploaded source"
                        className="w-full max-h-80 object-contain rounded-xl"
                      />
                    </div>
                  </div>
                )}

                <div className="flex flex-col">
                  <div className="flex items-center justify-between mb-2">
                    <span className="text-xs font-bold uppercase tracking-wider text-slate-500">
                      Extracted Editable Text
                    </span>
                    <button
                      type="button"
                      onClick={handleCopy}
                      className="inline-flex items-center gap-1 text-xs font-bold text-orange-600 hover:underline cursor-pointer"
                    >
                      {copied ? (
                        <>
                          <CheckCircle2 className="w-3.5 h-3.5" /> Copied!
                        </>
                      ) : (
                        <>
                          <Copy className="w-3.5 h-3.5" /> Copy Text
                        </>
                      )}
                    </button>
                  </div>

                  <textarea
                    rows={10}
                    value={extractedText}
                    onChange={(e) => setExtractedText(e.target.value)}
                    className="w-full p-4 bg-slate-50 border border-slate-200 rounded-2xl text-slate-800 text-sm leading-relaxed focus:bg-white focus:outline-none focus:border-orange-500 mb-4 flex-1"
                  />

                  <button
                    type="button"
                    onClick={handleSavePdf}
                    className="w-full py-3.5 px-5 rounded-2xl bg-gradient-to-r from-orange-500 to-amber-500 hover:from-orange-400 hover:to-amber-400 text-white font-bold text-sm shadow-lg shadow-orange-500/30 flex items-center justify-center gap-2 cursor-pointer"
                  >
                    <Download className="w-4 h-4" /> Save Extracted Text as PDF
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