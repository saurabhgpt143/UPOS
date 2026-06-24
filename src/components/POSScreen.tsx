import React, { useState, useEffect } from "react";
import { createPortal } from "react-dom";
import {
  RefreshCw,
  QrCode,
  Printer,
  ChevronLeft,
  ChevronRight,
  Maximize2,
  X,
  Plus,
  Clock,
  Ruler,
  Share2,
  Smartphone,
  FileText,
  Image as ImageIcon
} from "lucide-react";
import { ScreenMode, Transaction } from "../types";
import QRCode from "react-qr-code";
import { cn } from "../lib/utils";
import { printReceipt, generateImageFromLines, generateReceiptImage } from "../lib/printer";

interface POSScreenProps {
  mode: ScreenMode;
  expression: string;
  displayValue: string;
  qrAmount: number;
  cashAmount: number;
  pendingTxType: string;
  transactions: Transaction[];
  transactionId: string;
  onTransactionIdChange: (val: string) => void;
  upiId: string;
  onUpiIdChange: (val: string) => void;
  customQrUrls: string[];
  onCustomQrUrlsChange: (val: string[]) => void;
  currentQrIndex: number;
  onCurrentQrIndexChange: (val: number) => void;
  stats: { sales: number; expenses: number; profit: number };
  memory: number;
}

export function POSScreen({
  mode,
  expression,
  displayValue,
  qrAmount,
  cashAmount,
  pendingTxType,
  transactions,
  transactionId,
  onTransactionIdChange,
  upiId,
  onUpiIdChange,
  customQrUrls,
  onCustomQrUrlsChange,
  currentQrIndex,
  onCurrentQrIndexChange,
  stats,
  memory,
}: POSScreenProps) {
  const [isFullscreenQr, setIsFullscreenQr] = useState(false);
  const [isDisplayExpanded, setIsDisplayExpanded] = useState(false);
  const [previewPrintInfo, setPreviewPrintInfo] = useState<{
    type: "tx" | "cash";
    tx?: Transaction;
    lines?: string[];
  } | null>(null);

  const computedUpiId = (() => {
    if (!upiId) return "saurabhgpt143-2@oksbi";
    if (/^\d{10}$/.test(upiId)) return `${upiId}@ybl`;
    if (!upiId.includes("@")) return `${upiId}@upi`;
    return upiId;
  })();

  const [denominations, setDenominations] = useState<Record<number, number>>({
    500: 0,
    200: 0,
    100: 0,
    50: 0,
    20: 0,
    10: 0,
    5: 0,
    2: 0,
    1: 0,
  });

  const totalCash = Object.keys(denominations).reduce(
    (acc, val) => acc + Number(val) * denominations[Number(val)],
    0,
  );

  const handleDenominationChange = (val: number, delta: number) => {
    setDenominations((prev) => ({
      ...prev,
      [val]: prev[val] + delta,
    }));
  };

  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === "Escape") {
        if (previewPrintInfo) {
          setPreviewPrintInfo(null);
          e.stopImmediatePropagation();
        } else if (isFullscreenQr) {
          setIsFullscreenQr(false);
          e.stopImmediatePropagation();
        }
      }
    };
    
    window.addEventListener("keydown", handleKeyDown, true);
    return () => window.removeEventListener("keydown", handleKeyDown, true);
  }, [previewPrintInfo, isFullscreenQr]);

  return (
    <div
      className={cn(
        "w-full bg-black flex flex-col relative transition-all duration-300",
        mode === "CALC"
          ? "min-h-[160px] flex-1 sm:flex-none sm:h-[260px] md:h-full lg:h-full md:flex-1"
          : "flex-1 sm:h-auto md:h-full lg:h-full",
      )}
    >
      {/* Screen Content Wrapper */}
      <div className="flex-1 w-full bg-black relative flex flex-col">
        {mode === "CALC" && (
          <div className="flex-1 flex flex-col justify-between p-2">
            <div className="flex justify-between items-center text-gray-500 pb-2">
              <div className="flex items-center gap-4">
                <button
                  className="text-gray-400 hover:text-white transition-colors p-1"
                  title="Unit Converter"
                >
                  <Ruler className="w-4 h-4" />
                </button>
                <button
                  className="text-gray-400 hover:text-white transition-colors p-1"
                  title="History"
                >
                  <Clock className="w-4 h-4" />
                </button>
                <div className="w-[1px] h-4 bg-gray-700 mx-1"></div>
                <span className="text-[10px] tracking-widest font-medium opacity-70 border border-gray-700 px-1.5 py-0.5 rounded text-[#3cc366] bg-[#3cc366]/10">
                  {pendingTxType}
                </span>
                {memory !== 0 && (
                  <span className="text-[10px] tracking-widest font-bold opacity-90 border border-gray-700 px-1.5 py-0.5 rounded text-black bg-[#ffcc00]">
                    M
                  </span>
                )}
              </div>
              <div className="flex items-center gap-3">
                <input
                  type="text"
                  placeholder="Tx ID (Opt)"
                  value={transactionId}
                  onChange={(e) => onTransactionIdChange(e.target.value)}
                  className="text-[10px] bg-transparent border-b border-gray-700 text-right outline-none focus:border-[#3cc366] placeholder:text-gray-600 text-gray-300 font-mono w-20"
                />
              </div>
            </div>

            <div
              className="flex flex-col items-end justify-end mt-auto flex-1 overflow-hidden"
              onClick={() => setIsDisplayExpanded(!isDisplayExpanded)}
            >
              <div
                className={cn(
                  "font-light text-gray-400 mb-2 break-all text-right w-full transition-all cursor-pointer",
                  isDisplayExpanded
                    ? "text-xl sm:text-2xl lg:text-3xl max-h-24 lg:max-h-48 overflow-y-auto history-scroll"
                    : "text-2xl lg:text-4xl h-8 lg:h-12 overflow-hidden",
                )}
              >
                {expression || "\u00A0"}
              </div>
              <div
                className={cn(
                  "font-light text-white text-right cursor-pointer transition-all leading-none",
                  isDisplayExpanded
                    ? "text-3xl sm:text-4xl lg:text-5xl xl:text-6xl break-all overflow-y-auto max-h-24 lg:max-h-[60vh] history-scroll"
                    : "text-5xl sm:text-6xl lg:text-[100px] xl:text-[140px] lg:leading-tight xl:leading-none tracking-tight truncate w-full",
                )}
              >
                {displayValue}
              </div>
            </div>
          </div>
        )}

        {mode === "QR" && (
          <div className="flex-1 flex flex-col items-center justify-center p-3 text-center bg-black relative">
            <div className="text-xs font-bold text-gray-400 mb-1 tracking-widest uppercase">
              Scan to Pay UPI
            </div>
            <div className="text-xl font-bold text-white mb-2">₹{qrAmount}</div>
            <div className="relative group w-[85%] max-w-[180px] lg:max-w-[300px] xl:max-w-[360px] mx-auto aspect-square flex items-center justify-center">
              {customQrUrls.length > 0 && (
                <button
                  onClick={(e) => {
                    e.preventDefault();
                    onCurrentQrIndexChange(Math.max(0, currentQrIndex - 1));
                  }}
                  disabled={currentQrIndex === 0}
                  className="absolute -left-6 lg:-left-12 z-10 bg-white shadow rounded-full p-1 lg:p-2 border text-gray-500 disabled:opacity-30 disabled:cursor-not-allowed"
                >
                  <ChevronLeft className="w-4 h-4 lg:w-6 lg:h-6" />
                </button>
              )}

              <div className="w-full h-full relative">
                <div
                  className="w-full h-full relative cursor-pointer"
                  onClick={() => setIsFullscreenQr(true)}
                >
                  {customQrUrls.length > 0 &&
                  currentQrIndex < customQrUrls.length ? (
                    <img
                      src={customQrUrls[currentQrIndex]}
                      alt="Custom QR"
                      className="w-full h-full object-contain bg-white shadow-md rounded-md p-1 border border-gray-700"
                    />
                  ) : (
                    <div className="w-full bg-white shadow-md rounded-md p-2 flex items-center justify-center">
                      <QRCode
                        value={`upi://pay?pn=Merchant&am=${qrAmount}&cu=INR&pa=${computedUpiId}`}
                        size={200}
                        style={{
                          height: "auto",
                          maxWidth: "100%",
                          width: "100%",
                        }}
                      />
                    </div>
                  )}

                  {/* Fullscreen icon hint */}
                  <div className="absolute inset-0 bg-black/20 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity rounded-md pointer-events-none">
                    <Maximize2 className="w-8 h-8 text-white drop-shadow-md" />
                  </div>
                </div>

                <label
                  className="absolute -bottom-2 -right-2 bg-blue-600 text-white p-2 rounded-full cursor-pointer opacity-0 group-hover:opacity-100 transition-opacity shadow-md hover:bg-blue-700 z-20"
                  title="Add New QR"
                  onClick={(e) => e.stopPropagation()}
                >
                  <Plus className="w-4 h-4" />
                  <input
                    type="file"
                    accept="image/*"
                    multiple
                    className="hidden"
                    onChange={(e) => {
                      if (e.target.files && e.target.files.length > 0) {
                        const newUrls = Array.from(e.target.files).map((f) =>
                          URL.createObjectURL(f as File),
                        );
                        const newQrUrls = [...customQrUrls, ...newUrls];
                        onCustomQrUrlsChange(newQrUrls);
                        onCurrentQrIndexChange(newQrUrls.length - 1);
                      }
                    }}
                  />
                </label>

                {customQrUrls.length > 0 &&
                  currentQrIndex < customQrUrls.length && (
                    <button
                      onClick={(e) => {
                        e.preventDefault();
                        e.stopPropagation();
                        const newUrls = customQrUrls.filter(
                          (_, i) => i !== currentQrIndex,
                        );
                        onCustomQrUrlsChange(newUrls);
                        onCurrentQrIndexChange(
                          Math.min(
                            currentQrIndex,
                            Math.max(0, newUrls.length - 1),
                          ),
                        );
                      }}
                      className="absolute -top-2 -right-2 bg-red-500 text-white rounded-full w-5 h-5 flex items-center justify-center text-xs opacity-0 group-hover:opacity-100 transition-opacity shadow-sm z-20"
                      title="Remove custom QR"
                    >
                      ×
                    </button>
                  )}
              </div>

              {customQrUrls.length > 0 && (
                <button
                  onClick={(e) => {
                    e.preventDefault();
                    onCurrentQrIndexChange(
                      Math.min(customQrUrls.length - 1, currentQrIndex + 1),
                    );
                  }}
                  disabled={currentQrIndex === customQrUrls.length - 1}
                  className="absolute -right-6 lg:-right-12 z-10 bg-white shadow rounded-full p-1 lg:p-2 border text-gray-500 disabled:opacity-30 disabled:cursor-not-allowed"
                >
                  <ChevronRight className="w-4 h-4 lg:w-6 lg:h-6" />
                </button>
              )}
            </div>

            {customQrUrls.length > 1 && (
              <div className="flex gap-1 mt-2 justify-center">
                {customQrUrls.map((_, i) => (
                  <div
                    key={i}
                    className={cn(
                      "w-1.5 h-1.5 rounded-full",
                      i === currentQrIndex ? "bg-blue-600" : "bg-blue-200",
                    )}
                  />
                ))}
              </div>
            )}

            <div className="flex flex-col items-center gap-1 mt-6 w-full max-w-[200px]">
              <div className="flex items-center gap-1 text-gray-400 text-[10px] font-bold">
                <QrCode className="w-3 h-3" />
                UPI ID or Mobile No.
              </div>
              <input
                type="text"
                placeholder="saurabhgpt143-2@oksbi"
                value={upiId}
                onChange={(e) => onUpiIdChange(e.target.value)}
                className="w-full text-[10px] bg-transparent border-b border-gray-700 rounded-none px-2 py-1 text-center outline-none focus:border-[#3cc366] placeholder:text-gray-600 text-white transition-colors"
              />
            </div>
          </div>
        )}

        {mode === "CASH" && (
          <div className="flex-1 flex flex-col bg-black p-2 overflow-y-auto">
            <div className="flex justify-between items-center mb-2">
              <div className="text-[10px] font-bold text-gray-400 uppercase tracking-wider flex items-center gap-1.5">
                Cash Calculator
                <button
                  onClick={(e) => {
                    e.stopPropagation();

                      const textLines = [
                        "      DENOMINATION      ",
                        "--------------------------------",
                        `Bill Amt : Rs. ${cashAmount}`,
                        "--------------------------------",
                      ];

                      const received = Object.entries(denominations)
                        .filter(([_, count]: [string, any]) => (count as number) > 0)
                        .sort(([a], [b]) => Number(b) - Number(a));

                      const returned = Object.entries(denominations)
                        .filter(([_, count]: [string, any]) => (count as number) < 0)
                        .sort(([a], [b]) => Number(b) - Number(a));

                      if (received.length > 0) {
                        textLines.push("RECEIVED:");
                        received.forEach(([val, count]: [string, any]) => {
                          const numCount = count as number;
                          const left = ` Rs.${val} x ${numCount}`;
                          const right = `Rs.${Number(val) * numCount}`;
                          const spaces = Math.max(0, 32 - left.length - right.length);
                          textLines.push(`${left}${" ".repeat(spaces)}${right}`);
                        });
                      }

                      if (returned.length > 0) {
                        if (received.length > 0) textLines.push("--------------------------------");
                        textLines.push("RETURNED:");
                        returned.forEach(([val, count]: [string, any]) => {
                          const numCount = Math.abs(count as number);
                          const left = `-Rs.${val} x ${numCount}`;
                          const right = `-Rs.${Number(val) * numCount}`;
                          const spaces = Math.max(0, 32 - left.length - right.length);
                          textLines.push(`${left}${" ".repeat(spaces)}${right}`);
                        });
                      }

                      textLines.push("--------------------------------");
                      textLines.push(`NET CASH : Rs. ${totalCash}`);
                      const changeOrShort = totalCash >= cashAmount ? "CHANGE" : "SHORT";
                      const diffAmt = Math.abs(totalCash - cashAmount);
                      const lastLineLeft = `${changeOrShort}   :`;
                      const lastLineRight = `Rs. ${diffAmt}`;
                      const lastLineSpaces = Math.max(0, 32 - lastLineLeft.length - lastLineRight.length);
                      textLines.push(`${lastLineLeft}${" ".repeat(lastLineSpaces)}${lastLineRight}`);

                      if (totalCash > cashAmount) {
                      textLines.push("--------------------------------");
                      textLines.push("         RETURN CHANGE          ");
                      let remaining = totalCash - cashAmount;
                      const denoms = [500, 200, 100, 50, 20, 10, 5, 2, 1];
                      for (const d of denoms) {
                        if (remaining >= d) {
                          const count = Math.floor(remaining / d);
                          const left = `-Rs.${d} x ${count}`;
                          const right = `-Rs.${d * count}`;
                          const spaces = Math.max(
                            0,
                            32 - left.length - right.length,
                          );
                          textLines.push(
                            `${left}${" ".repeat(spaces)}${right}`,
                          );
                          remaining -= count * d;
                        }
                      }
                    }

                    textLines.push("--------------------------------");
                    textLines.push("           THANK YOU            ");

                    setPreviewPrintInfo({ type: "cash", lines: textLines });
                  }}
                  className="bg-[#2c2c2c] text-white p-1 rounded ml-1 hover:bg-[#333] transition-colors"
                  title="Print Denominations"
                >
                  <Printer className="w-3 h-3" />
                </button>
              </div>
              <div className="text-[10px] bg-[#1e1e1e] text-white px-2 py-0.5 rounded font-bold">
                Bill: ₹{cashAmount}
              </div>
            </div>

            <div className="grid grid-cols-2 gap-x-2 gap-y-1 mb-2 flex-1 overflow-y-auto pr-1">
              {[500, 200, 100, 50, 20, 10, 5, 2, 1].map((val) => (
                <div
                  key={val}
                  className="flex justify-between items-center bg-[#1e1e1e] rounded px-1.5 py-0.5"
                >
                  <div className="flex items-center gap-1.5">
                    {val >= 5 ? (
                      <div className={cn(
                        "w-7 h-4 flex items-center justify-center text-[7px] font-bold shadow-sm border border-black/20 rounded-[2px]",
                        {
                          500: "bg-[#7a817b] text-white",
                          200: "bg-[#f0a92f] text-black",
                          100: "bg-[#7b6b8f] text-white",
                          50: "bg-[#5dbcd2] text-black",
                          20: "bg-[#b0c24a] text-black",
                          10: "bg-[#764b36] text-white",
                          5: "bg-[#5a9354] text-white",
                        }[val]
                      )}>
                        {val}
                      </div>
                    ) : (
                      <div className="bg-[#bcc6cc] text-black rounded-full w-4 h-4 flex items-center justify-center text-[7px] font-bold shadow-sm border border-black/20">
                        {val}
                      </div>
                    )}
                    <span className="text-[10px] font-bold text-white w-6">
                      ₹{val}
                    </span>
                  </div>
                  <div className="flex items-center gap-1.5">
                    <button
                      onClick={() => handleDenominationChange(val, -1)}
                      className="bg-[#2c2c2c] rounded text-white w-4 h-4 flex items-center justify-center text-[10px] active:bg-[#333]"
                    >
                      -
                    </button>
                    <input
                      type="number"
                      value={denominations[val] === 0 ? "" : denominations[val]}
                      onChange={(e) => {
                        const newCount = parseInt(e.target.value) || 0;
                        setDenominations((prev) => ({
                          ...prev,
                          [val]: newCount,
                        }));
                      }}
                      className="text-[10px] font-mono text-white bg-transparent w-8 text-center outline-none border-b border-transparent focus:border-[#3cc366] hide-spin-button"
                      placeholder="0"
                    />
                    <button
                      onClick={() => handleDenominationChange(val, 1)}
                      className="bg-[#3cc366] rounded text-black w-4 h-4 flex items-center justify-center text-[10px] active:bg-[#32a454]"
                    >
                      +
                    </button>
                  </div>
                </div>
              ))}
            </div>

            <div className="bg-[#1e1e1e] p-1.5 rounded flex flex-col gap-1 shrink-0">
              <div className="flex justify-between items-center bg-[#2c2c2c] px-2 py-1 rounded">
                <span className="text-[10px] font-bold text-gray-400">
                  Total Cash
                </span>
                <span className="text-sm font-bold text-[#3cc366]">
                  ₹{totalCash}
                </span>
              </div>
              <div className="flex justify-between items-center px-2">
                <span className="text-[10px] font-bold text-gray-400">
                  Change Due
                </span>
                <span
                  className={cn(
                    "text-xs font-bold",
                    totalCash >= cashAmount ? "text-white" : "text-red-400",
                  )}
                >
                  {totalCash >= cashAmount
                    ? `₹${totalCash - cashAmount}`
                    : `Need ₹${cashAmount - totalCash}`}
                </span>
              </div>
            </div>

            {totalCash > cashAmount && (
              <div className="bg-[#1e1e1e] p-2 rounded mt-2 border border-[#333] shrink-0">
                <div className="text-[10px] font-bold text-gray-500 mb-2 uppercase tracking-wider text-center">
                  Return Denominations
                </div>
                <div className="flex flex-wrap gap-1.5 justify-center">
                  {(() => {
                    let remaining = totalCash - cashAmount;
                    const result: { [key: number]: number } = {};
                    const denoms = [500, 200, 100, 50, 20, 10, 5, 2, 1];
                    for (const d of denoms) {
                      if (remaining >= d) {
                        const count = Math.floor(remaining / d);
                        result[d] = count;
                        remaining -= count * d;
                      }
                    }
                    return Object.entries(result)
                      .filter(([_, count]) => count > 0)
                      .sort(([a], [b]) => Number(b) - Number(a))
                      .map(([val, count]) => (
                        <div
                          key={val}
                          className="bg-[#2c2c2c] text-white px-2 py-1 rounded text-[10px] font-mono border border-gray-700 flex items-center gap-1 shadow-sm"
                        >
                          <span className="text-gray-400">₹{val}</span>
                          <span className="text-[#3cc366]">×</span>
                          <span className="font-bold">{count}</span>
                        </div>
                      ));
                  })()}
                </div>
              </div>
            )}
          </div>
        )}

        {mode === "DASHBOARD" && (
          <div className="flex-1 flex flex-col bg-black p-2 lg:p-6 overflow-y-auto">
            <div className="text-xs lg:text-sm font-bold text-gray-500 mb-2 lg:mb-4 text-center uppercase tracking-wider">
              Business Summary
            </div>

            <div className="grid grid-cols-2 gap-2 lg:gap-4 mb-2 lg:mb-4">
              <div className="bg-[#1e1e1e] p-2 lg:p-4 rounded border border-[#333]">
                <div className="text-[10px] lg:text-xs font-bold text-[#3cc366] mb-1">
                  Total Sales
                </div>
                <div className="text-sm lg:text-2xl font-bold text-white">
                  ₹{stats.sales}
                </div>
              </div>
              <div className="bg-[#1e1e1e] p-2 lg:p-4 rounded border border-[#333]">
                <div className="text-[10px] lg:text-xs font-bold text-red-500 mb-1">
                  Expenses
                </div>
                <div className="text-sm lg:text-2xl font-bold text-white">
                  ₹{stats.expenses}
                </div>
              </div>
            </div>

            <div className="bg-[#1e1e1e] p-2 lg:p-4 rounded border border-[#333] flex justify-between items-center mb-3 lg:mb-6">
              <div className="text-[10px] lg:text-sm font-bold text-blue-400">
                Net Profit
              </div>
              <div
                className={cn(
                  "text-sm lg:text-3xl font-bold",
                  stats.profit >= 0 ? "text-white" : "text-red-400",
                )}
              >
                ₹{stats.profit}
              </div>
            </div>

            <div className="text-[10px] lg:text-sm font-bold text-gray-600 mb-1 lg:mb-3 border-b border-[#333] pb-1 lg:pb-2">
              Recent Transactions
            </div>
            <div className="space-y-1 lg:space-y-2">
              {transactions.slice(0, 3).map((tx) => (
                <div
                  key={tx.id}
                  className="flex justify-between items-center text-[10px] lg:text-sm bg-[#1e1e1e] p-1 lg:p-3 rounded shadow-sm border border-[#333]"
                >
                  <span
                    className={cn(
                      "font-bold px-1 lg:px-2 py-0.5 rounded text-black",
                      tx.type === "SALE" || tx.type === "BILL"
                        ? "bg-[#3cc366]"
                        : "bg-red-400",
                    )}
                  >
                    {tx.type} ({tx.method})
                  </span>
                  <div className="flex items-center gap-2 lg:gap-4">
                    <span className="font-mono font-bold text-gray-300 lg:text-base">
                      ₹{tx.amount}
                    </span>
                    <button
                      onClick={() => setPreviewPrintInfo({ type: "tx", tx })}
                      className="text-gray-400 hover:text-white transition-colors bg-[#2c2c2c] rounded p-1 lg:p-2 active:bg-[#444]"
                      title="Print Preview / Print"
                    >
                      <Printer className="w-3 h-3 lg:w-4 lg:h-4" />
                    </button>
                  </div>
                </div>
              ))}
              {transactions.length === 0 && (
                <div className="text-center text-[10px] lg:text-sm text-gray-600 py-2 lg:py-4">
                  No transactions
                </div>
              )}
            </div>
          </div>
        )}
      </div>

      {/* Fullscreen QR Overlay */}
      {isFullscreenQr && createPortal(
        <div 
          className="fixed inset-0 z-[100] bg-black/95 flex flex-col items-center justify-center p-4"
          onClick={(e) => {
            if (e.target === e.currentTarget) {
              setIsFullscreenQr(false);
            }
          }}
        >
          <button
            onClick={() => setIsFullscreenQr(false)}
            className="absolute top-6 right-6 bg-white/10 text-white p-3 rounded-full hover:bg-white/20 transition cursor-pointer z-10"
          >
            <X className="w-6 h-6" />
          </button>

          <div className="w-full max-w-sm aspect-square bg-white rounded-xl p-4 shadow-2xl relative flex items-center justify-center">
            {customQrUrls.length > 0 && currentQrIndex < customQrUrls.length ? (
              <img
                src={customQrUrls[currentQrIndex]}
                alt="Custom QR"
                className="w-full h-full object-contain"
              />
            ) : (
              <div className="w-full aspect-square bg-white flex items-center justify-center p-4">
                <QRCode
                  value={`upi://pay?pn=Merchant&am=${qrAmount}&cu=INR&pa=${computedUpiId}`}
                  size={500}
                  style={{ height: "100%", width: "100%", maxWidth: "100%" }}
                />
              </div>
            )}

            {customQrUrls.length > 0 && (
              <>
                <button
                  onClick={(e) => {
                    e.stopPropagation();
                    onCurrentQrIndexChange(Math.max(0, currentQrIndex - 1));
                  }}
                  disabled={currentQrIndex === 0}
                  className="absolute left-2 text-white/80 hover:text-white top-1/2 -translate-y-1/2 z-10 bg-black/50 shadow-xl rounded-full p-2 disabled:opacity-0 transition"
                >
                  <ChevronLeft className="w-6 h-6" />
                </button>
                <button
                  onClick={(e) => {
                    e.stopPropagation();
                    onCurrentQrIndexChange(
                      Math.min(customQrUrls.length - 1, currentQrIndex + 1),
                    );
                  }}
                  disabled={currentQrIndex === customQrUrls.length - 1}
                  className="absolute right-2 text-white/80 hover:text-white top-1/2 -translate-y-1/2 z-10 bg-black/50 shadow-xl rounded-full p-2 disabled:opacity-0 transition"
                >
                  <ChevronRight className="w-6 h-6" />
                </button>
              </>
            )}
          </div>

          <div className="mt-8 text-white font-bold text-3xl tracking-wider drop-shadow-md">
            ₹{qrAmount}
          </div>

          {customQrUrls.length > 1 && (
            <div className="flex gap-2 mt-6 justify-center">
              {customQrUrls.map((_, i) => (
                <div
                  key={i}
                  className={cn(
                    "w-2 h-2 rounded-full",
                    i === currentQrIndex ? "bg-white" : "bg-white/30",
                  )}
                />
              ))}
            </div>
          )}
        </div>, document.body
      )}

      {/* Glare effect overlay */}
      <div className="absolute inset-0 bg-gradient-to-bl from-white/[0.08] to-transparent pointer-events-none z-20 mix-blend-screen" />

      {/* Thermal Print Preview Modal */}
      {previewPrintInfo && createPortal(
        <div 
          className="fixed inset-0 z-[110] bg-black/95 flex flex-col items-center justify-center p-4"
          onClick={(e) => {
            if (e.target === e.currentTarget) {
              setPreviewPrintInfo(null);
            }
          }}
        >
          <button
            onClick={() => setPreviewPrintInfo(null)}
            className="absolute top-6 right-6 bg-white/10 text-white p-3 rounded-full hover:bg-white/20 transition cursor-pointer z-10"
          >
            <X className="w-6 h-6" />
          </button>

          <div className="text-white text-xs font-bold tracking-widest mb-4 opacity-70 uppercase">
            Print Preview
          </div>

          <div className="bg-white text-black p-4 pb-6 w-full max-w-[280px] font-mono text-[10px] sm:text-xs overflow-y-auto max-h-[60vh] receipt-edge shadow-2xl flex flex-col gap-1 whitespace-pre-wrap">
            {(() => {
              if (previewPrintInfo.type === "tx" && previewPrintInfo.tx) {
                const tx = previewPrintInfo.tx;
                return [
                  "      UNIVERSAL SMART POS      ",
                  "--------------------------------",
                  `Date: ${new Date(tx.timestamp).toLocaleString()}`,
                  `Type: ${tx.type}`,
                  `Mode: ${tx.method}`,
                  `Tx ID: ${tx.id.toUpperCase()}`,
                  "--------------------------------",
                  `TOTAL: Rs ${tx.amount}`,
                  "--------------------------------",
                  "           THANK YOU            ",
                ].join("\n");
              }
              if (previewPrintInfo.lines) {
                return previewPrintInfo.lines.join("\n");
              }
              return "";
            })()}
          </div>

          <div className="mt-8 flex flex-col gap-3 w-full max-w-[280px]">
            <button
              onClick={() => {
                const lines = previewPrintInfo.lines || [
                  "         UNIVERSE POS         ",
                  "--------------------------------",
                  `Date: ${new Date(previewPrintInfo.tx?.timestamp || Date.now()).toLocaleString()}`,
                  `Type: ${previewPrintInfo.tx?.type || ""}`,
                  `Mode: ${previewPrintInfo.tx?.method || ""}`,
                  `Tx ID: ${previewPrintInfo.tx?.id.toUpperCase() || ""}`,
                  "--------------------------------",
                  `TOTAL: Rs ${previewPrintInfo.tx?.amount || 0}`,
                  "--------------------------------",
                  "           THANK YOU            ",
                  "        Mob: 9752556113         "
                ];
                
                const printWindow = window.open("", "_blank");
                if (printWindow) {
                  const htmlLines = lines
                    .map((l) => l.replace(/ /g, "&nbsp;"))
                    .map(l => {
                      if (l.includes("UNIVERSE&nbsp;POS") || l.includes("TOTAL:")) {
                        return `<strong style="font-size: 16px;">${l}</strong>`;
                      }
                      return l;
                    })
                    .join("<br/>");
                  const printContent = `
                    <html>
                      <head>
                        <style>
                          @page { margin: 0; size: 58mm auto; }
                          body { font-family: monospace; padding: 5mm; margin: 0; color: #000; width: 48mm; font-size: 12px; }
                        </style>
                      </head>
                      <body><div>${htmlLines}</div><script>window.onload=()=>{setTimeout(()=>{window.print();window.close();},250)}</script></body>
                    </html>
                  `;
                  printWindow.document.write(printContent);
                  printWindow.document.close();
                }
                setPreviewPrintInfo(null);
              }}
              className="bg-[#3cc366] text-black px-4 py-3 rounded font-bold uppercase tracking-wider text-xs flex items-center gap-3 hover:bg-[#32a454] transition-transform active:scale-95"
            >
              <Printer className="w-5 h-5 opacity-80" />
              <div className="flex flex-col items-start bg-transparent">
                <span>Print</span>
                <span className="text-[9px] opacity-70 normal-case tracking-normal">System or WiFi Printer</span>
              </div>
            </button>

            <button
              onClick={() => {
                const lines = previewPrintInfo.lines || [
                  "         UNIVERSE POS         ",
                  "--------------------------------",
                  `Date: ${new Date(previewPrintInfo.tx?.timestamp || Date.now()).toLocaleString()}`,
                  `Type: ${previewPrintInfo.tx?.type}`,
                  `Mode: ${previewPrintInfo.tx?.method}`,
                  `Tx ID: ${previewPrintInfo.tx?.id.toUpperCase()}`,
                  "--------------------------------",
                  `TOTAL: Rs ${previewPrintInfo.tx?.amount}`,
                  "--------------------------------",
                  "           THANK YOU            ",
                  "        Mob: 9752556113         "
                ];
                const intentUri = `intent:#Intent;action=android.intent.action.SEND;type=text/plain;S.android.intent.extra.TEXT=${encodeURIComponent(lines.join("\n"))};package=com.phucynwa.mini.portable.cat.printer;end;`;
                window.location.href = intentUri;
                setPreviewPrintInfo(null);
              }}
              className="bg-[#2c2c2c] text-white border border-[#444] px-4 py-3 rounded font-bold uppercase tracking-wider text-xs flex items-center gap-3 hover:bg-[#333] transition-transform active:scale-95"
            >
              <Smartphone className="w-5 h-5 text-blue-400" />
              <div className="flex flex-col items-start bg-transparent">
                <span>Cat Printer</span>
                <span className="text-[9px] opacity-70 normal-case tracking-normal text-gray-400">Mini Portable Thermal App</span>
              </div>
            </button>

            <div className="grid grid-cols-2 gap-3">
               <button
                onClick={async () => {
                  try {
                    let blob: Blob;
                    if (previewPrintInfo.type === "tx" && previewPrintInfo.tx) {
                      blob = await generateReceiptImage(previewPrintInfo.tx);
                    } else if (previewPrintInfo.lines) {
                      blob = await generateImageFromLines(previewPrintInfo.lines);
                    } else {
                      return;
                    }
                    
                    const file = new File([blob], `slip_${Date.now()}.png`, { type: "image/png" });
                    
                    const downloadFallback = () => {
                      const url = URL.createObjectURL(blob);
                      const a = document.createElement("a");
                      a.href = url;
                      a.download = `slip_${Date.now()}.png`;
                      a.click();
                      URL.revokeObjectURL(url);
                    };

                    if (navigator.share && navigator.canShare && navigator.canShare({ files: [file] })) {
                      try {
                        await navigator.share({ title: "Slip", files: [file] });
                      } catch (shareErr: any) {
                        if (shareErr.name === "NotAllowedError") {
                           downloadFallback();
                        } else if (shareErr.name !== "AbortError") {
                           console.error("Failed to share image:", shareErr);
                        }
                      }
                    } else {
                      downloadFallback();
                    }
                  } catch (e) {
                    console.error("Failed to process image:", e);
                  }
                  setPreviewPrintInfo(null);
                }}
                className="bg-[#1e1e1e] text-white border border-[#333] p-3 rounded flex flex-col items-center justify-center gap-2 hover:bg-[#2c2c2c] transition-colors"
                title="Share as Image"
              >
                <ImageIcon className="w-5 h-5 text-purple-400" />
                <span className="text-[10px] font-bold uppercase tracking-wider">Image</span>
              </button>

              <button
                onClick={async () => {
                  const lines = previewPrintInfo.lines || [
                    "         UNIVERSE POS         ",
                    "--------------------------------",
                    `Date: ${new Date(previewPrintInfo.tx?.timestamp || Date.now()).toLocaleString()}`,
                    `Type: ${previewPrintInfo.tx?.type}`,
                    `Mode: ${previewPrintInfo.tx?.method}`,
                    `Tx ID: ${previewPrintInfo.tx?.id.toUpperCase()}`,
                    "--------------------------------",
                    `TOTAL: Rs ${previewPrintInfo.tx?.amount}`,
                    "--------------------------------",
                    "           THANK YOU            ",
                    "        Mob: 9752556113         "
                  ];
                  const text = lines.join("\n");
                  if (navigator.share) {
                    try {
                      await navigator.share({ text });
                    } catch (e: any) {
                      if (e.name !== "AbortError") {
                         console.error("Failed to share text:", e);
                      }
                    }
                  } else {
                    alert("Sharing text is not supported on this device.");
                  }
                  setPreviewPrintInfo(null);
                }}
                className="bg-[#1e1e1e] text-white border border-[#333] p-3 rounded flex flex-col items-center justify-center gap-2 hover:bg-[#2c2c2c] transition-colors"
                title="Share as Text"
              >
                <FileText className="w-5 h-5 text-orange-400" />
                <span className="text-[10px] font-bold uppercase tracking-wider">Text</span>
              </button>
            </div>
          </div>
        </div>, document.body
      )}
    </div>
  );
}
