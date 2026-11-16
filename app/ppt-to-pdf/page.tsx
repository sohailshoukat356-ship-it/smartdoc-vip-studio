"use client";

import React, { useState } from "react";
import Link from "next/link";
import JSZip from "jszip";
import { PDFDocument, StandardFonts, rgb } from "pdf-lib";
import {
  ArrowLeft,
  FileOutput,
  Upload,
  Download,
  FileText,
  Loader2,
  CheckCircle2,
  Trash2,
} from "lucide-react";

export default function PptToPdfPage() {
  const [pptFile, setPptFile] = useState<File | null>(null);
  const [isConverting, setIsConverting] = useState(false);
  const [progress, setProgress] = useState("");
  const [doneMessage, setDoneMessage] = useState("");

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    if (!file.name.toLowerCase().endsWith(".pptx")) {
      alert("Please select a valid PowerPoint (.pptx) file.");
      return;
    }
    setPptFile(file);
    setDoneMessage("");
    setProgress("");
    e.target.value = "";
  };

  // Helper: Sanitize text so Helvetica font in pdf-lib never throws encoding errors
  const sanitizeForWinAnsi = (str: string) =>
    str.replace(/[^\x20-\x7E\xA0-\xFF]/g, " ").replace(/\s+/g, " ").trim();

  const handleConvert = async () => {
    if (!pptFile) return;

    setIsConverting(true);
    setDoneMessage("");
    setProgress("Reading PowerPoint (.pptx) slides...");

    try {
      const arrayBuffer = await pptFile.arrayBuffer();
      const zip = await JSZip.loadAsync(arrayBuffer);

      // Find and numerically sort slide XML files (slide1.xml, slide2.xml, ...)
      const slideFiles = Object.keys(zip.files)
        .filter((name) => /^ppt\/slides\/slide\d+\.xml$/i.test(name))
        .sort((a, b) => {
          const numA = parseInt(a.match(/slide(\d+)\.xml/i)?.[1] || "0", 10);
          const numB = parseInt(b.match(/slide(\d+)\.xml/i)?.[1] || "0", 10);
          return numA - numB;
        });

      if (slideFiles.length === 0) {
        alert("No slides found inside this PowerPoint file.");
        setIsConverting(false);
        return;
      }

      const pdfDoc = await PDFDocument.create();
      const regularFont = await pdfDoc.embedFont(StandardFonts.Helvetica);
      const boldFont = await pdfDoc.embedFont(StandardFonts.HelveticaBold);

      // Widescreen 16:9 Landscape PDF dimensions (points)
      const pageWidth = 841.89;
      const pageHeight = 473.56;
      const margin = 45;

      for (let i = 0; i < slideFiles.length; i++) {
        setProgress(`Converting slide ${i + 1} of ${slideFiles.length}...`);

        const xmlString = await zip.files[slideFiles[i]].async("string");
        const parser = new DOMParser();
        const xmlDoc = parser.parseFromString(xmlString, "application/xml");

        // Extract paragraphs (<a:p>) and text runs (<a:t>)
        const pNodes = Array.from(xmlDoc.getElementsByTagName("a:p"));
        const lines: string[] = [];

        pNodes.forEach((p) => {
          const tNodes = Array.from(p.getElementsByTagName("a:t"));
          const rawLine = tNodes.map((t) => t.textContent || "").join("");
          const cleanLine = sanitizeForWinAnsi(rawLine);
          if (cleanLine) lines.push(cleanLine);
        });

        let page = pdfDoc.addPage([pageWidth, pageHeight]);

        // Header bar on each slide page
        page.drawRectangle({
          x: 0,
          y: pageHeight - 36,
          width: pageWidth,
          height: 36,
          color: rgb(0.95, 0.96, 0.99),
        });

        page.drawText(`Slide ${i + 1} of ${slideFiles.length}`, {
          x: margin,
          y: pageHeight - 23,
          size: 10,
          font: boldFont,
          color: rgb(0.25, 0.35, 0.55),
        });

        let y = pageHeight - 70;
        const maxWidth = pageWidth - margin * 2;

        if (lines.length === 0) {
          page.drawText("(Visual / Empty Slide)", {
            x: margin,
            y,
            size: 13,
            font: regularFont,
            color: rgb(0.5, 0.5, 0.5),
          });
        } else {
          lines.forEach((line, lineIdx) => {
            const isTitle = lineIdx === 0;
            const font = isTitle ? boldFont : regularFont;
            const fontSize = isTitle ? 18 : 13;
            const lineHeight = isTitle ? 26 : 20;
            const textColor = isTitle ? rgb(0.08, 0.15, 0.35) : rgb(0.15, 0.15, 0.18);

            const words = line.split(" ");
            let currentLine = "";

            for (const word of words) {
              const testLine = currentLine ? `${currentLine} ${word}` : word;
              const textWidth = font.widthOfTextAtSize(testLine, fontSize);

              if (textWidth > maxWidth && currentLine) {
                if (y < margin) {
                  page = pdfDoc.addPage([pageWidth, pageHeight]);
                  y = pageHeight - margin;
                }
                page.drawText(currentLine, { x: margin, y, size: fontSize, font, color: textColor });
                y -= lineHeight;
                currentLine = word;
              } else {
                currentLine = testLine;
              }
            }

            if (currentLine) {
              if (y < margin) {
                page = pdfDoc.addPage([pageWidth, pageHeight]);
                y = pageHeight - margin;
              }
              page.drawText(currentLine, { x: margin, y, size: fontSize, font, color: textColor });
              y -= lineHeight + (isTitle ? 8 : 4);
            }
          });
        }
      }

      setProgress("Saving PDF document...");
      const pdfBytes = await pdfDoc.save();
      const blob = new Blob([pdfBytes as BlobPart], { type: "application/pdf" });
      const url = URL.createObjectURL(blob);
      const a = document.createElement("a");
      const baseName = pptFile.name.replace(/\.pptx$/i, "");
      a.href = url;
      a.download = `${baseName}_SmartDoc.pdf`;
      a.click();
      URL.revokeObjectURL(url);

      setDoneMessage(`Successfully converted ${slideFiles.length} slide(s) to PDF!`);
    } catch (error) {
      console.error(error);
      alert("Error converting PowerPoint to PDF. Please ensure it is a valid .pptx file.");
    } finally {
      setIsConverting(false);
      setProgress("");
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 via-rose-50/30 to-orange-50/40 text-slate-800">
      <nav className="sticky top-0 z-50 backdrop-blur-md bg-white/80 border-b border-slate-200/70">
        <div className="max-w-4xl mx-auto px-4 h-16 flex items-center justify-between">
          <Link
            href="/"
            className="inline-flex items-center gap-2 text-sm font-bold text-slate-600 hover:text-rose-600 transition-colors"
          >
            <ArrowLeft className="w-4 h-4" /> Back to Studio
          </Link>
          <span className="text-xs font-extrabold uppercase tracking-wider px-3 py-1 rounded-full bg-rose-100 text-rose-800">
            PPT to PDF
          </span>
        </div>
      </nav>

      <main className="max-w-4xl mx-auto px-4 py-8">
        <div className="bg-white rounded-3xl border border-slate-200/80 shadow-xl shadow-slate-200/40 p-6 sm:p-8">
          <div className="flex items-center gap-3 mb-2">
            <div className="w-12 h-12 rounded-2xl bg-gradient-to-br from-red-500 to-rose-600 flex items-center justify-center text-white shadow-lg shadow-rose-500/25">
              <FileOutput className="w-6 h-6" />
            </div>
            <div>
              <h1 className="text-2xl font-extrabold text-slate-900">PowerPoint to PDF (.pdf)</h1>
              <p className="text-sm text-slate-500">
                Convert PowerPoint (.pptx) presentations into clean, shareable PDF documents
              </p>
            </div>
          </div>

          {!pptFile ? (
            <label className="mt-6 flex flex-col items-center justify-center border-2 border-dashed border-rose-300 hover:border-rose-500 bg-rose-50/40 hover:bg-rose-50/80 rounded-2xl p-10 cursor-pointer transition-all">
              <Upload className="w-10 h-10 text-rose-600 mb-2" />
              <span className="font-bold text-slate-800">Click to Upload PowerPoint (.pptx) File</span>
              <span className="text-xs text-slate-500 mt-1">
                Extracts all slides into landscape widescreen PDF pages
              </span>
              <input
                type="file"
                accept=".pptx,application/vnd.openxmlformats-officedocument.presentationml.presentation"
                onChange={handleFileChange}
                className="hidden"
              />
            </label>
          ) : (
            <div className="mt-6 p-4 rounded-2xl bg-slate-50 border border-slate-200/80 flex items-center justify-between gap-4">
              <div className="flex items-center gap-3 min-w-0">
                <div className="w-10 h-10 rounded-xl bg-orange-100 text-orange-600 flex items-center justify-center shrink-0">
                  <FileText className="w-5 h-5" />
                </div>
                <div className="truncate">
                  <p className="text-sm font-bold text-slate-800 truncate">{pptFile.name}</p>
                  <p className="text-xs text-slate-500">
                    {(pptFile.size / (1024 * 1024)).toFixed(2)} MB • Ready to convert
                  </p>
                </div>
              </div>

              <button
                onClick={() => {
                  setPptFile(null);
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
              {progress || "Output: 16:9 Widescreen Landscape PDF (.pdf)"}
            </div>

            <button
              onClick={handleConvert}
              disabled={!pptFile || isConverting}
              className="inline-flex items-center justify-center gap-2 px-6 py-3 rounded-xl bg-gradient-to-r from-red-500 to-rose-600 text-white font-bold text-sm shadow-lg shadow-rose-500/25 hover:opacity-95 disabled:opacity-50 transition-all"
            >
              {isConverting ? (
                <>
                  <Loader2 className="w-4 h-4 animate-spin" /> Converting...
                </>
              ) : (
                <>
                  <Download className="w-4 h-4" /> Convert & Download PDF
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