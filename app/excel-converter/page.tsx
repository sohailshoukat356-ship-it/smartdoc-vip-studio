"use client";
import { useState } from "react";
import Link from "next/link";
import * as XLSX from "xlsx";
import { jsPDF } from "jspdf";
import {
  ArrowLeft,
  FileSpreadsheet,
  Upload,
  Download,
  RefreshCw,
  CheckCircle2,
  Table,
} from "lucide-react";

export default function ExcelConverterPage() {
  const [mode, setMode] = useState<"excel-to-pdf" | "pdf-to-excel">("excel-to-pdf");
  const [fileName, setFileName] = useState<string>("");
  const [rows, setRows] = useState<string[][]>([]);
  const [loading, setLoading] = useState<boolean>(false);
  const [done, setDone] = useState<boolean>(false);

  // Upload Excel (.xlsx, .xls, .csv)
  const handleExcelUpload = async (file: File) => {
    setLoading(true);
    setDone(false);
    setFileName(file.name.replace(/\.[^/.]+$/, ""));
    try {
      const data = await file.arrayBuffer();
      const workbook = XLSX.read(data);
      const firstSheet = workbook.Sheets[workbook.SheetNames[0]];
      const jsonData = XLSX.utils.sheet_to_json<string[]>(firstSheet, {
        header: 1,
        defval: "",
      });
      setRows(jsonData.map((r) => r.map((cell) => String(cell ?? ""))));
    } catch {
      alert("Error reading Excel file. Please upload a valid .xlsx, .xls, or .csv file.");
    } finally {
      setLoading(false);
    }
  };

  // Upload PDF and parse lines into spreadsheet rows
  const handlePdfUpload = async (file: File) => {
    setLoading(true);
    setDone(false);
    setFileName(file.name.replace(/\.[^/.]+$/, ""));
    try {
      const pdfjsLib = await import("pdfjs-dist");
      pdfjsLib.GlobalWorkerOptions.workerSrc = `//unpkg.com/pdfjs-dist@${pdfjsLib.version}/build/pdf.worker.min.mjs`;

      const arrayBuffer = await file.arrayBuffer();
      const pdf = await pdfjsLib.getDocument({ data: arrayBuffer }).promise;
      const extractedRows: string[][] = [];

      for (let i = 1; i <= pdf.numPages; i++) {
        const page = await pdf.getPage(i);
        const content = await page.getTextContent();
        const items = content.items.map((item: unknown) =>
          typeof item === "object" && item !== null && "str" in item
            ? String((item as { str: string }).str).trim()
            : ""
        ).filter(Boolean);

        // Group items into clean rows of up to 5 columns
        for (let j = 0; j < items.length; j += 5) {
          extractedRows.push(items.slice(j, j + 5));
        }
      }

      setRows(extractedRows.length ? extractedRows : [["No table data found in PDF"]]);
    } catch {
      alert("Error extracting data from PDF. Please try another file.");
    } finally {
      setLoading(false);
    }
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    if (mode === "excel-to-pdf") {
      handleExcelUpload(file);
    } else {
      handlePdfUpload(file);
    }
  };

  // Allow live editing of spreadsheet cells
  const updateCell = (rIdx: number, cIdx: number, value: string) => {
    setRows((prev) =>
      prev.map((row, ri) =>
        ri === rIdx ? row.map((cell, ci) => (ci === cIdx ? value : cell)) : row
      )
    );
  };

  // Export Result
  const handleDownload = () => {
    if (rows.length === 0) return;

    if (mode === "excel-to-pdf") {
      const doc = new jsPDF("l", "mm", "a4"); // Landscape for wide tables
      doc.setFont("helvetica", "bold");
      doc.setFontSize(15);
      doc.text(fileName || "Spreadsheet_Export", 14, 16);

      doc.setFont("helvetica", "normal");
      doc.setFontSize(9);
      let y = 26;

      rows.forEach((row, idx) => {
        if (y > 190) {
          doc.addPage();
          y = 20;
        }
        if (idx === 0) doc.setFont("helvetica", "bold");
        else doc.setFont("helvetica", "normal");

        const lineText = row.join("   |   ");
        const wrapped = doc.splitTextToSize(lineText, 265);
        doc.text(wrapped, 14, y);
        y += wrapped.length * 6 + 2;
      });

      doc.save(`${fileName || "Spreadsheet"}.pdf`);
    } else {
      const worksheet = XLSX.utils.aoa_to_sheet(rows);
      const workbook = XLSX.utils.book_new();
      XLSX.utils.book_append_sheet(workbook, worksheet, "ExtractedData");
      XLSX.writeFile(workbook, `${fileName || "Extracted_Table"}.xlsx`);
    }

    setDone(true);
    setTimeout(() => setDone(false), 3000);
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 via-green-50/30 to-emerald-50/40 text-slate-800 p-4 sm:p-8">
      <div className="max-w-5xl mx-auto">
        <div className="flex items-center justify-between mb-6">
          <Link
            href="/"
            className="inline-flex items-center gap-2 px-4 py-2 rounded-xl bg-white border border-slate-200 text-slate-700 text-sm font-semibold shadow-sm hover:bg-slate-50 hover:text-green-600 transition"
          >
            <ArrowLeft className="w-4 h-4" /> Dashboard
          </Link>
          <span className="text-xs font-bold uppercase tracking-wider px-3 py-1 rounded-full bg-green-100 text-green-700">
            Spreadsheet Engine
          </span>
        </div>

        <div className="bg-white rounded-3xl shadow-xl shadow-slate-200/60 border border-slate-200/80 overflow-hidden">
          {/* Header */}
          <div className="bg-gradient-to-r from-green-600 to-emerald-600 p-6 sm:p-8 text-white flex items-center gap-4">
            <div className="w-14 h-14 rounded-2xl bg-white/15 backdrop-blur-sm border border-white/20 flex items-center justify-center">
              <FileSpreadsheet className="w-7 h-7 text-white" />
            </div>
            <div>
              <h1 className="text-2xl font-extrabold tracking-tight">
                Excel ↔ PDF Converter
              </h1>
              <p className="text-green-100 text-sm mt-0.5">
                Convert spreadsheets to PDF or extract PDF tables into editable Excel files
              </p>
            </div>
          </div>

          <div className="p-6 sm:p-8">
            {/* Mode Switcher */}
            <div className="grid grid-cols-2 gap-2 bg-slate-100 p-1.5 rounded-2xl mb-6">
              <button
                type="button"
                onClick={() => {
                  setMode("excel-to-pdf");
                  setRows([]);
                  setFileName("");
                }}
                className={`py-3 rounded-xl text-sm font-bold transition cursor-pointer ${
                  mode === "excel-to-pdf"
                    ? "bg-white text-green-700 shadow-sm"
                    : "text-slate-600 hover:text-slate-900"
                }`}
              >
                Excel (.xlsx / .csv) → PDF
              </button>
              <button
                type="button"
                onClick={() => {
                  setMode("pdf-to-excel");
                  setRows([]);
                  setFileName("");
                }}
                className={`py-3 rounded-xl text-sm font-bold transition cursor-pointer ${
                  mode === "pdf-to-excel"
                    ? "bg-white text-emerald-700 shadow-sm"
                    : "text-slate-600 hover:text-slate-900"
                }`}
              >
                PDF → Excel (.xlsx)
              </button>
            </div>

            {/* Upload Area */}
            <label className="flex flex-col items-center justify-center border-2 border-dashed border-green-200 hover:border-green-500 rounded-2xl p-8 bg-green-50/30 hover:bg-green-50/60 transition cursor-pointer mb-6">
              <Upload className="w-10 h-10 text-green-600 mb-3" />
              <span className="font-bold text-slate-800 text-base">
                {mode === "excel-to-pdf"
                  ? "Click to Upload Excel (.xlsx, .xls, .csv)"
                  : "Click to Upload PDF (.pdf) Document"}
              </span>
              <span className="text-xs text-slate-500 mt-1">
                Edit cells directly in the table preview before exporting
              </span>
              <input
                type="file"
                accept={mode === "excel-to-pdf" ? ".xlsx,.xls,.csv" : ".pdf"}
                onChange={handleFileChange}
                className="hidden"
              />
            </label>

            {loading && (
              <div className="flex items-center justify-center gap-2 text-green-600 font-bold py-6">
                <RefreshCw className="w-5 h-5 animate-spin" /> Parsing spreadsheet data...
              </div>
            )}

            {/* Interactive Spreadsheet Table */}
            {rows.length > 0 && !loading && (
              <div>
                <div className="flex items-center justify-between mb-3">
                  <span className="text-xs font-bold uppercase tracking-wider text-slate-500 flex items-center gap-1.5">
                    <Table className="w-4 h-4 text-green-600" /> Editable Table Preview ({rows.length} rows)
                  </span>
                  <span className="text-xs font-semibold text-green-700">{fileName}</span>
                </div>

                <div className="overflow-x-auto max-h-80 border border-slate-200 rounded-2xl mb-6">
                  <table className="w-full text-left border-collapse text-xs">
                    <tbody>
                      {rows.map((row, rIdx) => (
                        <tr
                          key={rIdx}
                          className={rIdx === 0 ? "bg-green-50 font-bold" : "border-t border-slate-100"}
                        >
                          {row.map((cell, cIdx) => (
                            <td key={cIdx} className="p-1.5 border-r border-slate-100 min-w-[110px]">
                              <input
                                type="text"
                                value={cell}
                                onChange={(e) => updateCell(rIdx, cIdx, e.target.value)}
                                className="w-full bg-transparent px-2 py-1 focus:bg-white focus:outline-none focus:ring-1 focus:ring-green-500 rounded"
                              />
                            </td>
                          ))}
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>

                <button
                  type="button"
                  onClick={handleDownload}
                  className="w-full py-4 px-6 rounded-2xl bg-gradient-to-r from-green-600 to-emerald-600 hover:from-green-500 hover:to-emerald-500 text-white font-bold text-base shadow-lg shadow-green-600/30 flex items-center justify-center gap-2.5 cursor-pointer"
                >
                  {done ? (
                    <>
                      <CheckCircle2 className="w-5 h-5" /> Exported Successfully!
                    </>
                  ) : (
                    <>
                      <Download className="w-5 h-5" />
                      {mode === "excel-to-pdf"
                        ? "Export Table as PDF (.pdf)"
                        : "Download Excel Spreadsheet (.xlsx)"}
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