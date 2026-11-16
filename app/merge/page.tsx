"use client";

import React, { useState } from "react";
import Link from "next/link";
import { PDFDocument, StandardFonts, rgb } from "pdf-lib";
import mammoth from "mammoth";
import { Document, Packer, Paragraph, TextRun } from "docx";
import {
  ArrowLeft,
  Files,
  Upload,
  Trash2,
  ArrowUp,
  ArrowDown,
  Download,
  FileText,
  Loader2,
  CheckCircle2,
} from "lucide-react";

interface MergeItem {
  id: string;
  file: File;
  type: "pdf" | "word";
}

export default function MergeFilesPage() {
  const [items, setItems] = useState<MergeItem[]>([]);
  const [outputFormat, setOutputFormat] = useState<"pdf" | "docx">("pdf");
  const [isMerging, setIsMerging] = useState(false);
  const [doneMessage, setDoneMessage] = useState("");

  const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (!e.target.files) return;
    const selected = Array.from(e.target.files);
    const newItems: MergeItem[] = [];

    selected.forEach((file) => {
      const name = file.name.toLowerCase();
      if (name.endsWith(".pdf")) {
        newItems.push({ id: crypto.randomUUID(), file, type: "pdf" });
      } else if (name.endsWith(".docx")) {
        newItems.push({ id: crypto.randomUUID(), file, type: "word" });
      }
    });

    setItems((prev) => [...prev, ...newItems]);
    setDoneMessage("");
    e.target.value = "";
  };

  const moveItem = (index: number, direction: -1 | 1) => {
    const target = index + direction;
    if (target < 0 || target >= items.length) return;
    const updated = [...items];
    [updated[index], updated[target]] = [updated[target], updated[index]];
    setItems(updated);
  };

  const removeItem = (id: string) => {
    setItems((prev) => prev.filter((item) => item.id !== id));
  };

  // Helper: Add wrapped text pages into a PDFDocument
  const appendTextToPdf = async (pdfDoc: PDFDocument, title: string, rawText: string) => {
    const font = await pdfDoc.embedFont(StandardFonts.Helvetica);
    const boldFont = await pdfDoc.embedFont(StandardFonts.HelveticaBold);
    const fontSize = 11;
    const lineHeight = 16;
    const margin = 50;

    let page = pdfDoc.addPage([595.28, 841.89]); // A4
    let { width, height } = page.getSize();
    let y = height - margin;

    page.drawText(title, {
      x: margin,
      y,
      size: 13,
      font: boldFont,
      color: rgb(0.1, 0.25, 0.55),
    });
    y -= 24;

    const maxWidth = width - margin * 2;
    const paragraphs = rawText.split(/\r?\n/);

    for (const para of paragraphs) {
      if (!para.trim()) {
        y -= lineHeight * 0.7;
        continue;
      }
      const words = para.split(" ");
      let currentLine = "";

      for (const word of words) {
        const testLine = currentLine ? `${currentLine} ${word}` : word;
        const textWidth = font.widthOfTextAtSize(testLine, fontSize);

        if (textWidth > maxWidth && currentLine) {
          if (y < margin + lineHeight) {
            page = pdfDoc.addPage([595.28, 841.89]);
            y = height - margin;
          }
          page.drawText(currentLine, { x: margin, y, size: fontSize, font, color: rgb(0.1, 0.1, 0.1) });
          y -= lineHeight;
          currentLine = word;
        } else {
          currentLine = testLine;
        }
      }

      if (currentLine) {
        if (y < margin + lineHeight) {
          page = pdfDoc.addPage([595.28, 841.89]);
          y = height - margin;
        }
        page.drawText(currentLine, { x: margin, y, size: fontSize, font, color: rgb(0.1, 0.1, 0.1) });
        y -= lineHeight;
      }
    }
  };

  // Helper: Extract text from PDF using pdfjs-dist (CDN worker fallback)
  const extractTextFromPdf = async (buffer: ArrayBuffer): Promise<string> => {
    const pdfjs = await import("pdfjs-dist");
    pdfjs.GlobalWorkerOptions.workerSrc = `//unpkg.com/pdfjs-dist@${pdfjs.version}/build/pdf.worker.min.mjs`;
    const loadingTask = pdfjs.getDocument({ data: buffer });
    const pdf = await loadingTask.promise;
    let fullText = "";

    for (let i = 1; i <= pdf.numPages; i++) {
      const page = await pdf.getPage(i);
      const content = await page.getTextContent();
      const strings = content.items.map((item: any) => item.str || "");
      fullText += strings.join(" ") + "\n\n";
    }
    return fullText.trim();
  };

  const handleMerge = async () => {
    if (items.length < 2) {
      alert("Please add at least 2 PDF or Word (.docx) files to merge.");
      return;
    }

    setIsMerging(true);
    setDoneMessage("");

    try {
      if (outputFormat === "pdf") {
        const mergedPdf = await PDFDocument.create();

        for (const item of items) {
          const buffer = await item.file.arrayBuffer();
          if (item.type === "pdf") {
            const srcDoc = await PDFDocument.load(buffer);
            const copiedPages = await mergedPdf.copyPages(srcDoc, srcDoc.getPageIndices());
            copiedPages.forEach((p) => mergedPdf.addPage(p));
          } else {
            const result = await mammoth.extractRawText({ arrayBuffer: buffer });
            await appendTextToPdf(mergedPdf, item.file.name, result.value || "(Empty Document)");
          }
        }

        const pdfBytes = await mergedPdf.save();
        const blob = new Blob([pdfBytes as BlobPart], { type: "application/pdf" });
        const url = URL.createObjectURL(blob);
        const a = document.createElement("a");
        a.href = url;
        a.download = `SmartDoc_Merged_${Date.now()}.pdf`;
        a.click();
        URL.revokeObjectURL(url);
        setDoneMessage("Merged PDF successfully downloaded!");
      } else {
        const docParagraphs: Paragraph[] = [];

        for (const item of items) {
          const buffer = await item.file.arrayBuffer();
          let text = "";

          if (item.type === "word") {
            const result = await mammoth.extractRawText({ arrayBuffer: buffer });
            text = result.value || "";
          } else {
            text = await extractTextFromPdf(buffer);
          }

          docParagraphs.push(
            new Paragraph({
              children: [new TextRun({ text: `--- ${item.file.name} ---`, bold: true, size: 26 })],
              spacing: { before: 240, after: 120 },
            })
          );

          text.split(/\r?\n/).forEach((line) => {
            docParagraphs.push(
              new Paragraph({
                children: [new TextRun({ text: line, size: 22 })],
                spacing: { after: 100 },
              })
            );
          });
        }

        const wordDoc = new Document({
          sections: [{ children: docParagraphs }],
        });

        const blob = await Packer.toBlob(wordDoc);
        const url = URL.createObjectURL(blob);
        const a = document.createElement("a");
        a.href = url;
        a.download = `SmartDoc_Merged_${Date.now()}.docx`;
        a.click();
        URL.revokeObjectURL(url);
        setDoneMessage("Merged Word (.docx) file successfully downloaded!");
      }
    } catch (err) {
      console.error(err);
      alert("Error merging files. Make sure files are valid and not password-protected.");
    } finally {
      setIsMerging(false);
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 via-blue-50/40 to-indigo-50/50 text-slate-800">
      <nav className="sticky top-0 z-50 backdrop-blur-md bg-white/80 border-b border-slate-200/70">
        <div className="max-w-4xl mx-auto px-4 h-16 flex items-center justify-between">
          <Link
            href="/"
            className="inline-flex items-center gap-2 text-sm font-bold text-slate-600 hover:text-blue-600 transition-colors"
          >
            <ArrowLeft className="w-4 h-4" /> Back to Studio
          </Link>
          <span className="text-xs font-extrabold uppercase tracking-wider px-3 py-1 rounded-full bg-cyan-100 text-cyan-800">
            Merge Tool
          </span>
        </div>
      </nav>

      <main className="max-w-4xl mx-auto px-4 py-8">
        <div className="bg-white rounded-3xl border border-slate-200/80 shadow-xl shadow-slate-200/40 p-6 sm:p-8">
          <div className="flex items-center gap-3 mb-2">
            <div className="w-12 h-12 rounded-2xl bg-gradient-to-br from-sky-500 to-blue-600 flex items-center justify-center text-white shadow-lg shadow-sky-500/25">
              <Files className="w-6 h-6" />
            </div>
            <div>
              <h1 className="text-2xl font-extrabold text-slate-900">Merge PDF & Word Files</h1>
              <p className="text-sm text-slate-500">
                Combine multiple PDF (.pdf) and Word (.docx) files into one document
              </p>
            </div>
          </div>

          {/* Upload Area */}
          <label className="mt-6 flex flex-col items-center justify-center border-2 border-dashed border-blue-300 hover:border-blue-500 bg-blue-50/40 hover:bg-blue-50/80 rounded-2xl p-8 cursor-pointer transition-all">
            <Upload className="w-9 h-9 text-blue-600 mb-2" />
            <span className="font-bold text-slate-800">Click to Add PDF or Word (.docx) Files</span>
            <span className="text-xs text-slate-500 mt-1">Select multiple files at once or add in batches</span>
            <input
              type="file"
              accept=".pdf,.docx,application/pdf,application/vnd.openxmlformats-officedocument.wordprocessingml.document"
              multiple
              onChange={handleFileSelect}
              className="hidden"
            />
          </label>

          {/* File List */}
          {items.length > 0 && (
            <div className="mt-6 space-y-2.5">
              <div className="flex items-center justify-between text-xs font-bold text-slate-500 uppercase tracking-wider px-1">
                <span>Selected Files ({items.length}) — Arrange Order</span>
                <button
                  onClick={() => setItems([])}
                  className="text-rose-600 hover:underline"
                >
                  Clear All
                </button>
              </div>

              {items.map((item, idx) => (
                <div
                  key={item.id}
                  className="flex items-center justify-between gap-3 p-3.5 rounded-xl bg-slate-50 border border-slate-200/80"
                >
                  <div className="flex items-center gap-3 min-w-0">
                    <span className="w-6 h-6 rounded-full bg-slate-200 text-slate-700 text-xs font-bold flex items-center justify-center shrink-0">
                      {idx + 1}
                    </span>
                    <FileText
                      className={`w-5 h-5 shrink-0 ${
                        item.type === "pdf" ? "text-rose-500" : "text-indigo-600"
                      }`}
                    />
                    <div className="truncate">
                      <p className="text-sm font-semibold text-slate-800 truncate">{item.file.name}</p>
                      <p className="text-[11px] text-slate-500 uppercase">
                        {item.type} • {(item.file.size / 1024).toFixed(1)} KB
                      </p>
                    </div>
                  </div>

                  <div className="flex items-center gap-1 shrink-0">
                    <button
                      onClick={() => moveItem(idx, -1)}
                      disabled={idx === 0}
                      className="p-1.5 rounded-lg hover:bg-slate-200 disabled:opacity-30"
                      title="Move Up"
                    >
                      <ArrowUp className="w-4 h-4" />
                    </button>
                    <button
                      onClick={() => moveItem(idx, 1)}
                      disabled={idx === items.length - 1}
                      className="p-1.5 rounded-lg hover:bg-slate-200 disabled:opacity-30"
                      title="Move Down"
                    >
                      <ArrowDown className="w-4 h-4" />
                    </button>
                    <button
                      onClick={() => removeItem(item.id)}
                      className="p-1.5 rounded-lg text-rose-600 hover:bg-rose-100"
                      title="Remove"
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                  </div>
                </div>
              ))}
            </div>
          )}

          {/* Output Format & Action */}
          <div className="mt-6 pt-6 border-t border-slate-100 flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-4">
            <div className="flex items-center gap-2">
              <span className="text-xs font-bold text-slate-600">Output Format:</span>
              <button
                type="button"
                onClick={() => setOutputFormat("pdf")}
                className={`px-3.5 py-1.5 rounded-xl text-xs font-bold transition-all ${
                  outputFormat === "pdf"
                    ? "bg-blue-600 text-white shadow-md shadow-blue-600/25"
                    : "bg-slate-100 text-slate-600 hover:bg-slate-200"
                }`}
              >
                Merged PDF (.pdf)
              </button>
              <button
                type="button"
                onClick={() => setOutputFormat("docx")}
                className={`px-3.5 py-1.5 rounded-xl text-xs font-bold transition-all ${
                  outputFormat === "docx"
                    ? "bg-indigo-600 text-white shadow-md shadow-indigo-600/25"
                    : "bg-slate-100 text-slate-600 hover:bg-slate-200"
                }`}
              >
                Merged Word (.docx)
              </button>
            </div>

            <button
              onClick={handleMerge}
              disabled={isMerging || items.length < 2}
              className="inline-flex items-center justify-center gap-2 px-6 py-3 rounded-xl bg-gradient-to-r from-blue-600 to-indigo-600 text-white font-bold text-sm shadow-lg shadow-blue-600/25 hover:opacity-95 disabled:opacity-50 transition-all"
            >
              {isMerging ? (
                <>
                  <Loader2 className="w-4 h-4 animate-spin" /> Merging Files...
                </>
              ) : (
                <>
                  <Download className="w-4 h-4" /> Merge & Download
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