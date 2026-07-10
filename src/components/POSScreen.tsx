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
  IndianRupee,
  Ruler,
  Share2,
  Smartphone,
  FileText,
  Trash2,
  Edit2,
  User,
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
  upiNote: string;
  onUpiNoteChange: (val: string) => void;
  customQrUrls: string[];
  onCustomQrUrlsChange: (val: string[]) => void;
  currentQrIndex: number;
  onCurrentQrIndexChange: (val: number) => void;
  stats: { sales: number; expenses: number; profit: number };
  memory: number;
  paymentBillAmount: number;
  otherBillAmount: number;
  customerName: string;
  setCustomerName: (val: string) => void;
  customerMobile: string;
  setCustomerMobile: (val: string) => void;
  customerAddress: string;
  setCustomerAddress: (val: string) => void;
  vehicleNumber: string;
  setVehicleNumber: (val: string) => void;
  pertinentRemarks: string;
  setPertinentRemarks: (val: string) => void;
  onConfirmPayment: (paymentDetails: { cash: number; upi: number; other: number }, otherMode?: string, remarks?: string, denominations?: Record<number, number>, remainingBalance?: number) => void;
  onConfirmOtherPayment: (otherMode: string, remarks: string) => void;
  onUpdateTransactionDenominations: (denoms: Record<number, number>, changeReturnedVia?: "CASH" | "UPI", customerUpiId?: string, upiReturnAmount?: number) => void;
  onHandlePayment?: (method: "CASH" | "UPI" | "OTHER" | "UDHAAR" | "PAYMENT REQUIRED" | "PAYMENT") => void;
  setScreenMode: (mode: ScreenMode) => void;
  onDeleteTransaction: (id: string) => void;
  onUpdateTransaction: (id: string, updatedTx: Partial<Transaction>) => void;
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
  upiNote,
  onUpiNoteChange,
  customQrUrls,
  onCustomQrUrlsChange,
  currentQrIndex,
  onCurrentQrIndexChange,
  stats,
  memory,
  paymentBillAmount,
  otherBillAmount,
  customerName,
  setCustomerName,
  customerMobile,
  setCustomerMobile,
  customerAddress,
  setCustomerAddress,
  vehicleNumber,
  setVehicleNumber,
  pertinentRemarks,
  setPertinentRemarks,
  onConfirmPayment,
  onConfirmOtherPayment,
  onUpdateTransactionDenominations,
  onHandlePayment,
  setScreenMode,
  onDeleteTransaction,
  onUpdateTransaction,
}: POSScreenProps) {
  const [showCustomerDetails, setShowCustomerDetails] = useState(false);
  const [isFullscreenQr, setIsFullscreenQr] = useState(false);
  const [shareStatus, setShareStatus] = useState<string | null>(null);
  const [isDisplayExpanded, setIsDisplayExpanded] = useState(false);
  const [deletingId, setDeletingId] = useState<string | null>(null);
  const isHistoryActive = (mode as string) === "HISTORY";
  const [previewPrintInfo, setPreviewPrintInfo] = useState<{
    type: "tx" | "cash";
    tx?: Transaction;
    lines?: string[];
  } | null>(null);

  const [paymentSubMode, setPaymentSubMode] = useState<"menu" | "split">("menu");
  const [paymentCash, setPaymentCash] = useState<number | "">("");
  const [paymentUpi, setPaymentUpi] = useState<number | "">("");
  const [paymentOther, setPaymentOther] = useState<number | "">("");

  const [activeSplitSection, setActiveSplitSection] = useState<"CASH" | "UPI" | "OTHER" | null>(null);
  const [splitCashAmount, setSplitCashAmount] = useState<number>(0);
  const [splitUpiAmount, setSplitUpiAmount] = useState<number>(0);
  const [splitOtherAmount, setSplitOtherAmount] = useState<number>(0);

  const [otherModeInput, setOtherModeInput] = useState("");
  const [otherRemarksInput, setOtherRemarksInput] = useState("");

  const [editingTransaction, setEditingTransaction] = useState<Transaction | null>(null);
  const [editTxId, setEditTxId] = useState<string>("");
  const [editType, setEditType] = useState<"SALE" | "EXPENSE" | "BILL" | "ESTIMATE">("SALE");
  const [editMethod, setEditMethod] = useState<"CASH" | "UPI" | "OTHER" | "UDHAAR" | "PAYMENT REQUIRED" | "PAYMENT">("CASH");
  const [editAmount, setEditAmount] = useState<string>("");
  const [editRemarks, setEditRemarks] = useState<string>("");
  const [editRemainingBalance, setEditRemainingBalance] = useState<string>("");
  const [editOtherMode, setEditOtherMode] = useState<string>("");
  const [editCustomerName, setEditCustomerName] = useState<string>("");
  const [editCustomerMobile, setEditCustomerMobile] = useState<string>("");
  const [editCustomerAddress, setEditCustomerAddress] = useState<string>("");
  const [editVehicleNumber, setEditVehicleNumber] = useState<string>("");

  useEffect(() => {
    if (editingTransaction) {
      setEditTxId(editingTransaction.id);
      setEditType(editingTransaction.type);
      setEditMethod(editingTransaction.method);
      setEditAmount(String(editingTransaction.amount));
      setEditRemarks(editingTransaction.remarks || "");
      setEditRemainingBalance(editingTransaction.remainingBalance ? String(editingTransaction.remainingBalance) : "");
      setEditOtherMode(editingTransaction.otherMode || "");
      setEditCustomerName(editingTransaction.customerName || "");
      setEditCustomerMobile(editingTransaction.customerMobile || "");
      setEditCustomerAddress(editingTransaction.customerAddress || "");
      setEditVehicleNumber(editingTransaction.vehicleNumber || "");
    }
  }, [editingTransaction]);

  const activateCashPortion = () => {
    const currentVal = paymentCash !== "" ? Number(paymentCash) : 0;
    const remaining = Math.max(0, paymentBillAmount - (Number(paymentUpi) || 0) - (Number(paymentOther) || 0));
    const target = currentVal > 0 ? currentVal : remaining;
    setSplitCashAmount(target);
    setActiveSplitSection("CASH");
  };

  const activateUpiPortion = () => {
    const currentVal = paymentUpi !== "" ? Number(paymentUpi) : 0;
    const remaining = Math.max(0, paymentBillAmount - (Number(paymentCash) || 0) - (Number(paymentOther) || 0));
    const target = currentVal > 0 ? currentVal : remaining;
    setSplitUpiAmount(target);
    setActiveSplitSection("UPI");
  };

  const activateOtherPortion = () => {
    const currentVal = paymentOther !== "" ? Number(paymentOther) : 0;
    const remaining = Math.max(0, paymentBillAmount - (Number(paymentCash) || 0) - (Number(paymentUpi) || 0));
    const target = currentVal > 0 ? currentVal : remaining;
    setSplitOtherAmount(target);
    setActiveSplitSection("OTHER");
  };

  const computedUpiId = (() => {
    if (!upiId) return "saurabhgpt143-2@oksbi";
    if (/^\d{10}$/.test(upiId)) return `${upiId}@ybl`;
    if (!upiId.includes("@")) return `${upiId}@upi`;
    return upiId;
  })();

  const retrievedName = (() => {
    if (!upiId) return "Saurabh Gupta";
    const handle = upiId.split("@")[0].toLowerCase();
    if (handle === "saurabhgpt143-2" || handle === "saurabhgpt143") return "Saurabh Gupta";
    if (handle === "saurabh") return "Saurabh";
    
    // Convert john.doe123 -> John Doe
    return handle
      .split(/[\._\-]/)
      .map(word => word.replace(/\d+/g, ""))
      .filter(Boolean)
      .map(word => word.charAt(0).toUpperCase() + word.slice(1))
      .join(" ");
  })();

  const getUpiUrl = (amount: number) => {
    let url = `upi://pay?pn=${encodeURIComponent(retrievedName)}&am=${amount}&cu=INR&pa=${computedUpiId}`;
    if (upiNote) {
      url += `&tn=${encodeURIComponent(upiNote)}`;
    }
    return url;
  };

  const handleShareQr = async (amount: number) => {
    const upiUrl = getUpiUrl(amount);
    try {
      setShareStatus("Preparing...");

      const isCustom = customQrUrls.length > 0 && currentQrIndex < customQrUrls.length;
      
      if (navigator.share) {
        let fileToShare: File | null = null;

        if (isCustom) {
          const customUrl = customQrUrls[currentQrIndex];
          const response = await fetch(customUrl);
          const blob = await response.blob();
          fileToShare = new File([blob], "upi_qr.png", { type: blob.type });
        } else {
          const svgEl = document.querySelector(".upi-qr-wrapper svg") || document.querySelector("svg[value*='upi://']");
          if (svgEl) {
            const svgString = new XMLSerializer().serializeToString(svgEl);
            const svgBlob = new Blob([svgString], { type: "image/svg+xml;charset=utf-8" });
            const blobURL = URL.createObjectURL(svgBlob);
            
            await new Promise<void>((resolve, reject) => {
              const image = new Image();
              image.onload = () => {
                try {
                  const canvas = document.createElement("canvas");
                  canvas.width = 512;
                  canvas.height = 512;
                  const context = canvas.getContext("2d");
                  if (context) {
                    context.fillStyle = "#ffffff";
                    context.fillRect(0, 0, 512, 512);
                    context.drawImage(image, 32, 32, 448, 448);
                    
                    context.fillStyle = "#000000";
                    context.font = "bold 24px sans-serif";
                    context.textAlign = "center";
                    context.fillText(`UPI Pay: ₹${amount}`, 256, 495);

                    canvas.toBlob((blob) => {
                      if (blob) {
                        fileToShare = new File([blob], `upi_qr_${amount}.png`, { type: "image/png" });
                        resolve();
                      } else {
                        reject(new Error("Blob generation failed"));
                      }
                    }, "image/png");
                  } else {
                    reject(new Error("Canvas context is null"));
                  }
                } catch (err) {
                  reject(err);
                }
              };
              image.onerror = (err) => reject(err);
              image.src = blobURL;
            });
          }
        }

        const shareData: ShareData = {
          title: "UPI QR Code",
          text: `Scan to pay ₹${amount} via UPI`,
        };

        if (fileToShare && navigator.canShare && navigator.canShare({ files: [fileToShare] })) {
          shareData.files = [fileToShare];
        } else {
          shareData.url = upiUrl;
        }

        await navigator.share(shareData);
        setShareStatus("Shared!");
      } else {
        await navigator.clipboard.writeText(upiUrl);
        setShareStatus("Copied Link!");
      }
    } catch (err: any) {
      const name = (err?.name || "").toLowerCase();
      const message = (err?.message || "").toLowerCase();
      const isCancel =
        name === "aborterror" ||
        name === "notallowederror" ||
        message.includes("cancel") ||
        message.includes("cancelled") ||
        message.includes("abort");

      if (isCancel) {
        setShareStatus(null);
      } else {
        console.error("Error sharing QR:", err);
        try {
          await navigator.clipboard.writeText(upiUrl);
          setShareStatus("Copied Link!");
        } catch {
          setShareStatus("Failed");
        }
      }
    }

    setTimeout(() => {
      setShareStatus(null);
    }, 3000);
  };

  const handlePrintQr = async (amount: number) => {
    try {
      const isCustom = customQrUrls.length > 0 && currentQrIndex < customQrUrls.length;
      let qrImgSrc = "";

      if (isCustom) {
        qrImgSrc = customQrUrls[currentQrIndex];
      } else {
        const svgEl = document.querySelector(".upi-qr-wrapper svg") || document.querySelector("svg[value*='upi://']");
        if (svgEl) {
          const svgString = new XMLSerializer().serializeToString(svgEl);
          const svgBlob = new Blob([svgString], { type: "image/svg+xml;charset=utf-8" });
          qrImgSrc = URL.createObjectURL(svgBlob);
        }
      }

      if (!qrImgSrc) {
        const upiUrl = getUpiUrl(amount);
        console.error("QR Code image source not found, fallback to link copy");
        await navigator.clipboard.writeText(upiUrl);
        setShareStatus("Copied Link!");
        setTimeout(() => setShareStatus(null), 2000);
        return;
      }

      const printWindow = window.open("", "_blank");
      if (printWindow) {
        const printContent = `
          <html>
            <head>
              <title>Print QR Code - ₹${amount}</title>
              <style>
                @page { margin: 0; size: 58mm auto; }
                body {
                  font-family: monospace;
                  padding: 10px;
                  margin: 0 auto;
                  color: #000;
                  width: 48mm;
                  font-size: 11px;
                  text-align: center;
                  display: flex;
                  flex-direction: column;
                  align-items: center;
                  justify-content: center;
                }
                .header {
                  font-weight: bold;
                  font-size: 14px;
                  margin-bottom: 2px;
                  text-transform: uppercase;
                }
                .subtitle {
                  font-size: 9px;
                  color: #333;
                  margin-bottom: 5px;
                }
                .divider {
                  border-top: 1px dashed #000;
                  width: 100%;
                  margin: 5px 0 10px 0;
                }
                .qr-container {
                  background: white;
                  padding: 4px;
                  border: 1px solid #ddd;
                  display: inline-block;
                }
                .qr-img {
                  width: 150px;
                  height: 150px;
                  display: block;
                }
                .amount-label {
                  font-size: 10px;
                  margin-top: 8px;
                  color: #444;
                }
                .amount-val {
                  font-weight: bold;
                  font-size: 18px;
                  margin-top: 2px;
                  margin-bottom: 5px;
                }
                .footer {
                  font-size: 8px;
                  color: #666;
                  margin-top: 4px;
                }
              </style>
            </head>
            <body>
              <div class="header">UNIVERSE POS</div>
              <div class="subtitle">UPI PAYMENT QR</div>
              <div class="divider"></div>
              <div class="qr-container">
                <img class="qr-img" src="${qrImgSrc}" />
              </div>
              <div class="amount-label">Verified Payee: <strong>${retrievedName}</strong></div>
              <div class="amount-val">₹${amount}</div>
              <div class="divider" style="margin-top: 5px;"></div>
              <div class="footer">Thank You!</div>
              <script>
                window.onload = () => {
                  setTimeout(() => {
                    window.print();
                    window.close();
                  }, 350);
                };
              </script>
            </body>
          </html>
        `;
        printWindow.document.write(printContent);
        printWindow.document.close();
      }
    } catch (err) {
      console.error("Failed to print QR code:", err);
    }
  };

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

  const [changeReturnedVia, setChangeReturnedVia] = useState<"CASH" | "UPI">("CASH");
  const [customerUpiId, setCustomerUpiId] = useState<string>("");
  const [upiReturnAmount, setUpiReturnAmount] = useState<string>("");
  const [upiReceivedAmount, setUpiReceivedAmount] = useState<string>("");
  const [showManualReturn, setShowManualReturn] = useState<boolean>(false);

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
    if (mode === "CASH") {
      setChangeReturnedVia("CASH");
      setCustomerUpiId("");
      setUpiReturnAmount("");
      setUpiReceivedAmount("");
      setShowManualReturn(false);
      setDenominations({
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
    }
    if (mode === "QR") {
      setChangeReturnedVia("CASH");
      setCustomerUpiId("");
      setUpiReturnAmount("");
      setUpiReceivedAmount("");
      setShowManualReturn(false);
      setDenominations({
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
    }
    if (mode === "PAYMENT") {
      setPaymentSubMode("menu");
      setPaymentCash("");
      setPaymentUpi("");
      setPaymentOther("");
      setActiveSplitSection(null);
      setChangeReturnedVia("CASH");
      setCustomerUpiId("");
      setUpiReturnAmount("");
      setUpiReceivedAmount("");
      setShowManualReturn(false);
      setDenominations({
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
    }
    if (mode === "OTHER") {
      setOtherModeInput("");
      setOtherRemarksInput("");
    }
  }, [mode]);

  useEffect(() => {
    if (mode === "CASH" || mode === "QR") {
      const calculatedQrChange = upiReceivedAmount !== "" ? Math.max(0, (Number(upiReceivedAmount) || qrAmount) - qrAmount) : 0;
      const parsedAmount = upiReturnAmount !== "" 
        ? Number(upiReturnAmount) 
        : (mode === "QR" && calculatedQrChange > 0 ? calculatedQrChange : undefined);

      onUpdateTransactionDenominations(
        mode === "CASH" ? denominations : {
          500: 0,
          200: 0,
          100: 0,
          50: 0,
          20: 0,
          10: 0,
          5: 0,
          2: 0,
          1: 0,
        },
        changeReturnedVia,
        customerUpiId,
        parsedAmount
      );
    }
  }, [denominations, mode, changeReturnedVia, customerUpiId, upiReturnAmount, upiReceivedAmount, qrAmount, onUpdateTransactionDenominations]);

  const getTxLines = (tx: Transaction): string[] => {
    const lines = [
      "         UNIVERSE POS         ",
      "--------------------------------",
      `Date: ${new Date(tx.timestamp).toLocaleString()}`,
      `Type: ${tx.type}`,
    ];
    if (tx.customerName) lines.push(`Cust: ${tx.customerName}`);
    if (tx.customerMobile) lines.push(`Mob:  ${tx.customerMobile}`);
    if (tx.customerAddress) lines.push(`Addr: ${tx.customerAddress}`);
    if (tx.vehicleNumber) lines.push(`Veh:  ${tx.vehicleNumber}`);
    if (tx.method === "PAYMENT") {
      lines.push(`Mode: PAYMENT`);
      if (tx.paymentDetails?.cash) lines.push(`  Cash: Rs ${tx.paymentDetails.cash}`);
      if (tx.paymentDetails?.upi) lines.push(`  UPI:  Rs ${tx.paymentDetails.upi}`);
      if (tx.paymentDetails?.other) lines.push(`  Other: Rs ${tx.paymentDetails.other}`);
      if (tx.remarks) lines.push(`  Note: ${tx.remarks}`);
    } else if (tx.method === "OTHER") {
      lines.push(`Mode: OTHER`);
      if (tx.otherMode) lines.push(`  Type: ${tx.otherMode}`);
      if (tx.remarks) lines.push(`  Note: ${tx.remarks}`);
    } else {
      lines.push(`Mode: ${tx.method}`);
      if (tx.remarks) lines.push(`  Note: ${tx.remarks}`);
    }
    lines.push(`Tx ID: ${tx.id.toUpperCase()}`);
    
    const received = tx.denominations
      ? Object.entries(tx.denominations).filter(([_, count]) => count > 0)
      : [];
    const returned = tx.denominations
      ? Object.entries(tx.denominations).filter(([_, count]) => count < 0)
      : [];

    if (received.length > 0) {
      lines.push("DENOMINATIONS:");
      received
        .sort(([a], [b]) => Number(b) - Number(a))
        .forEach(([val, count]) => {
          const left = `  Rs.${val} x ${count}`;
          const right = `Rs.${Number(val) * count}`;
          const spaces = Math.max(0, 32 - left.length - right.length);
          lines.push(`${left}${" ".repeat(spaces)}${right}`);
        });
    }

    const paidCash = received.reduce((acc, [val, count]) => acc + Number(val) * count, 0);
    const targetCash = (tx.method === "PAYMENT" && tx.paymentDetails)
      ? tx.paymentDetails.cash
      : (tx.method === "CASH" ? tx.amount : 0);

    const baseChangeAmount = (returned.length > 0)
      ? returned.reduce((acc, [val, count]) => acc + Number(val) * Math.abs(count), 0)
      : (paidCash > targetCash && targetCash > 0 ? paidCash - targetCash : 0);

    const changeAmount = (tx.upiReturnAmount !== undefined)
      ? tx.upiReturnAmount
      : baseChangeAmount;

    if (changeAmount > 0) {
      lines.push("--------------------------------");
      lines.push(`CHANGE DUE: Rs ${changeAmount}`);
      if (tx.changeReturnedVia === "UPI") {
        lines.push("RETURNED VIA UPI:");
        if (tx.customerUpiId) {
          lines.push(`  UPI: ${tx.customerUpiId}`);
        } else {
          lines.push("  UPI Status: Paid/Refunded");
        }
      } else {
        lines.push("RETURN DENOMINATIONS:");
        if (returned.length > 0) {
          returned
            .sort(([a], [b]) => Number(b) - Number(a))
            .forEach(([val, count]) => {
              const numCount = Math.abs(count);
              const left = `  Rs.${val} x ${numCount}`;
              const right = `Rs.${Number(val) * numCount}`;
              const spaces = Math.max(0, 32 - left.length - right.length);
              lines.push(`${left}${" ".repeat(spaces)}${right}`);
            });
        } else {
          let remainingChange = changeAmount;
          const denoms = [500, 200, 100, 50, 20, 10, 5, 2, 1];
          for (const d of denoms) {
            if (remainingChange >= d) {
              const count = Math.floor(remainingChange / d);
              if (count > 0) {
                const left = `  Rs.${d} x ${count}`;
                const right = `Rs.${d * count}`;
                const spaces = Math.max(0, 32 - left.length - right.length);
                lines.push(`${left}${" ".repeat(spaces)}${right}`);
              }
              remainingChange -= count * d;
            }
          }
        }
      }
    }
    lines.push("--------------------------------");
    lines.push(`TOTAL: Rs ${tx.amount}`);
    if (tx.remainingBalance && tx.remainingBalance > 0) {
      lines.push("--------------------------------");
      lines.push(`PAID AMOUNT: Rs ${tx.amount - tx.remainingBalance}`);
      lines.push(`BALANCE DUE: Rs ${tx.remainingBalance}`);
      lines.push("================================");
    } else {
      lines.push("--------------------------------");
    }
    lines.push("           THANK YOU            ");
    lines.push("        Mob: 9752556113         ");
    return lines;
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
                  onClick={() => setScreenMode(isHistoryActive ? "CALC" : "HISTORY")}
                  className={cn(
                    "transition-colors p-1 rounded",
                    isHistoryActive ? "text-[#3cc366] bg-[#3cc366]/10" : "text-gray-400 hover:text-white"
                  )}
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

            {/* Customer & Vehicle Details Form */}
            <div className="mt-1 mb-2 bg-[#0d0d0d]/90 border border-[#222] rounded-lg overflow-hidden transition-all duration-300">
              <button
                type="button"
                onClick={() => setShowCustomerDetails(!showCustomerDetails)}
                className="w-full px-3 py-2 flex items-center justify-between text-gray-400 hover:text-white transition-colors bg-white/5 cursor-pointer text-[10px] font-bold uppercase tracking-wider"
              >
                <div className="flex items-center gap-2">
                  <User className="w-3.5 h-3.5 text-[#3cc366]" />
                  <span>
                    {customerName || customerMobile || vehicleNumber ? (
                      <span className="text-[#3cc366]">
                        Customer: {customerName || "Walk-in"} {customerMobile ? `(${customerMobile})` : ""}
                      </span>
                    ) : (
                      "Customer & Vehicle Info"
                    )}
                  </span>
                </div>
                <div className="text-[9px] text-[#3cc366] font-semibold bg-[#3cc366]/10 px-1.5 py-0.5 rounded border border-[#3cc366]/20">
                  {showCustomerDetails ? "COLLAPSE ▴" : "ADD/EDIT ▾"}
                </div>
              </button>

              {showCustomerDetails && (
                <div className="p-3 bg-black border-t border-[#1a1a1a] flex flex-col gap-3">
                  <div className="grid grid-cols-2 gap-2">
                    <div>
                      <label className="text-[9px] font-bold text-gray-500 uppercase tracking-widest block mb-1">
                        Customer Name
                      </label>
                      <input
                        type="text"
                        placeholder="e.g. Rahul Sharma"
                        value={customerName}
                        onChange={(e) => setCustomerName(e.target.value)}
                        className="w-full bg-[#111] border border-[#222] rounded text-xs text-white px-2 py-1.5 outline-none focus:border-[#3cc366] transition-colors font-sans"
                      />
                    </div>

                    <div>
                      <label className="text-[9px] font-bold text-gray-500 uppercase tracking-widest block mb-1">
                        Mobile Number
                      </label>
                      <input
                        type="tel"
                        placeholder="e.g. 9876543210"
                        value={customerMobile}
                        onChange={(e) => setCustomerMobile(e.target.value)}
                        className="w-full bg-[#111] border border-[#222] rounded text-xs text-white px-2 py-1.5 outline-none focus:border-[#3cc366] transition-colors font-mono"
                      />
                    </div>
                  </div>

                  <div className="grid grid-cols-2 gap-2">
                    <div>
                      <label className="text-[9px] font-bold text-gray-500 uppercase tracking-widest block mb-1">
                        Address
                      </label>
                      <input
                        type="text"
                        placeholder="e.g. Sector 15, Noida"
                        value={customerAddress}
                        onChange={(e) => setCustomerAddress(e.target.value)}
                        className="w-full bg-[#111] border border-[#222] rounded text-xs text-white px-2 py-1.5 outline-none focus:border-[#3cc366] transition-colors font-sans"
                      />
                    </div>

                    <div>
                      <label className="text-[9px] font-bold text-gray-500 uppercase tracking-widest block mb-1">
                        Vehicle Number
                      </label>
                      <input
                        type="text"
                        placeholder="e.g. DL-3C-AB-1234"
                        value={vehicleNumber}
                        onChange={(e) => setVehicleNumber(e.target.value.toUpperCase())}
                        className="w-full bg-[#111] border border-[#222] rounded text-xs text-white px-2 py-1.5 outline-none focus:border-[#3cc366] transition-colors font-mono uppercase"
                      />
                    </div>
                  </div>

                  <div>
                    <label className="text-[9px] font-bold text-gray-500 uppercase tracking-widest block mb-1">
                      Pertinent Remarks / Notes
                    </label>
                    <textarea
                      placeholder="e.g. Fast delivery, priority customer"
                      value={pertinentRemarks}
                      onChange={(e) => setPertinentRemarks(e.target.value)}
                      rows={2}
                      className="w-full bg-[#111] border border-[#222] rounded text-xs text-white px-2.5 py-1.5 outline-none focus:border-[#3cc366] transition-colors font-sans resize-none"
                    />
                  </div>
                </div>
              )}
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

        {(mode === "QR" || (mode === "PAYMENT" && paymentSubMode === "split" && activeSplitSection === "UPI")) && (() => {
          const isSplitUpi = mode === "PAYMENT" && paymentSubMode === "split" && activeSplitSection === "UPI";
          const displayQrAmount = isSplitUpi ? splitUpiAmount : qrAmount;

          return (
            <div className="flex-1 flex flex-col items-center justify-center p-3 text-center bg-black relative">
              {isSplitUpi ? (
                <div className="w-full flex items-center justify-between mb-2 pb-1.5 border-b border-gray-800">
                  <button
                    onClick={() => setActiveSplitSection(null)}
                    className="text-gray-400 hover:text-white transition-colors flex items-center gap-1 text-[11px] font-bold"
                  >
                    <ChevronLeft className="w-4 h-4" />
                    Back to Split
                  </button>
                  <span className="text-[10px] font-bold text-gray-500 tracking-wider uppercase">
                    Split UPI Portion
                  </span>
                  <div className="w-12"></div>
                </div>
              ) : (
                <div className="text-xs font-bold text-gray-400 mb-1 tracking-widest uppercase">
                  Scan to Pay UPI
                </div>
              )}

              {isSplitUpi ? (
                <div className="bg-[#111] border border-gray-800 rounded-lg p-2 flex justify-between items-center mb-2 w-full max-w-[240px] mx-auto shrink-0">
                  <span className="text-[10px] font-bold text-gray-400">UPI Amount:</span>
                  <div className="relative flex items-center bg-black border border-gray-800 rounded overflow-hidden">
                    <span className="absolute left-2 text-[10px] text-gray-500 font-bold">₹</span>
                    <input
                      type="number"
                      value={splitUpiAmount === 0 ? "" : splitUpiAmount}
                      onChange={(e) => setSplitUpiAmount(parseFloat(e.target.value) || 0)}
                      placeholder="0"
                      className="w-24 bg-transparent text-xs text-[#3cc366] pl-5 pr-1.5 py-0.5 outline-none font-mono font-bold"
                    />
                  </div>
                </div>
              ) : (
                <div className="text-xl font-bold text-white mb-2">₹{displayQrAmount}</div>
              )}

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
                      <div className="w-full bg-white shadow-md rounded-md p-3 flex flex-col items-center justify-center upi-qr-wrapper gap-2 border border-gray-200">
                        <QRCode
                          value={getUpiUrl(displayQrAmount)}
                          size={200}
                          style={{
                            height: "auto",
                            maxWidth: "100%",
                            width: "100%",
                          }}
                        />
                        <div className="text-[11px] font-bold text-gray-800 flex items-center gap-1.5 mt-1 bg-transparent">
                          <span className="w-2 h-2 rounded-full bg-[#3cc366] animate-pulse shrink-0"></span>
                          <span className="truncate max-w-[180px]">{retrievedName}</span>
                        </div>
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

              <div className="mt-4 w-full max-w-[180px] lg:max-w-[240px] grid grid-cols-2 gap-2">
                <button
                  onClick={() => handleShareQr(displayQrAmount)}
                  className="flex items-center justify-center gap-1.5 bg-[#1c1c1e] hover:bg-[#2c2c2e] active:bg-[#3a3a3c] border border-gray-800 text-gray-200 hover:text-white py-1.5 px-2 rounded-lg text-[11px] font-bold transition-all shadow-md cursor-pointer"
                  title="Share UPI QR Code"
                >
                  <Share2 className="w-3.5 h-3.5 text-[#3cc366] shrink-0" />
                  <span>{shareStatus || "Share"}</span>
                </button>
                <button
                  onClick={() => handlePrintQr(displayQrAmount)}
                  className="flex items-center justify-center gap-1.5 bg-[#1c1c1e] hover:bg-[#2c2c2e] active:bg-[#3a3a3c] border border-gray-800 text-gray-200 hover:text-white py-1.5 px-2 rounded-lg text-[11px] font-bold transition-all shadow-md cursor-pointer"
                  title="Print UPI QR Code"
                >
                  <Printer className="w-3.5 h-3.5 text-blue-400 shrink-0" />
                  <span>Print</span>
                </button>
              </div>

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

              <div className="flex flex-col items-center gap-1 mt-4 w-full max-w-[200px]">
                <div className="flex items-center gap-1 text-gray-400 text-[10px] font-bold">
                  <FileText className="w-3 h-3 text-blue-400" />
                  Optional Note / Remarks
                </div>
                <input
                  type="text"
                  placeholder="e.g. Universe POS"
                  value={upiNote}
                  onChange={(e) => onUpiNoteChange(e.target.value)}
                  className="w-full text-[10px] bg-transparent border-b border-gray-700 rounded-none px-2 py-1 text-center outline-none focus:border-[#3cc366] placeholder:text-gray-600 text-white transition-colors"
                />
              </div>

              {/* UPI Change / Return section */}
              <div className="w-full max-w-[200px] border-t border-gray-800/60 mt-4 pt-4">
                <div className="flex flex-col items-center gap-1 w-full">
                  <div className="flex items-center gap-1 text-gray-400 text-[10px] font-bold">
                    <IndianRupee className="w-3 h-3 text-[#3cc366]" />
                    UPI Received Amount (₹)
                  </div>
                  <input
                    type="number"
                    placeholder={String(displayQrAmount)}
                    value={upiReceivedAmount}
                    onChange={(e) => setUpiReceivedAmount(e.target.value)}
                    className="w-full text-[10px] bg-transparent border-b border-gray-700 rounded-none px-2 py-1 text-center outline-none focus:border-[#3cc366] placeholder:text-gray-600 text-white transition-colors"
                  />
                </div>

                {(() => {
                  const calculatedChange = Math.max(0, (Number(upiReceivedAmount) || displayQrAmount) - displayQrAmount);
                  const isReturnActive = calculatedChange > 0 || showManualReturn;

                  return (
                    <div className="mt-3 w-full">
                      {!isReturnActive ? (
                        <button
                          type="button"
                          onClick={() => setShowManualReturn(true)}
                          className="w-full text-[9px] font-bold text-gray-400 hover:text-white uppercase tracking-wider bg-gray-900 border border-gray-800 rounded py-1 transition-all cursor-pointer flex items-center justify-center gap-1"
                        >
                          🔄 Record Return / Refund
                        </button>
                      ) : (
                        <div className="flex flex-col gap-2">
                          <div className="flex justify-between items-center bg-transparent">
                            <span className="text-[9px] font-bold text-gray-500 uppercase">Return Details</span>
                            <button
                              type="button"
                              onClick={() => {
                                setShowManualReturn(false);
                                setUpiReceivedAmount("");
                                setUpiReturnAmount("");
                                setCustomerUpiId("");
                              }}
                              className="text-[9px] font-bold text-red-400 hover:text-red-300 uppercase cursor-pointer"
                            >
                              Reset
                            </button>
                          </div>

                          {/* Selector for Return Method */}
                          <div className="flex bg-[#1e1e1e] p-0.5 rounded border border-[#333] gap-0.5 w-full">
                            <button
                              type="button"
                              onClick={() => setChangeReturnedVia("CASH")}
                              className={cn(
                                "flex-1 py-1 px-1 text-[8px] font-bold rounded transition-all cursor-pointer flex items-center justify-center gap-0.5",
                                changeReturnedVia === "CASH"
                                  ? "bg-[#3cc366] text-black shadow"
                                  : "text-gray-400 hover:text-white"
                              )}
                            >
                              💵 Cash Return
                            </button>
                            <button
                              type="button"
                              onClick={() => setChangeReturnedVia("UPI")}
                              className={cn(
                                "flex-1 py-1 px-1 text-[8px] font-bold rounded transition-all cursor-pointer flex items-center justify-center gap-0.5",
                                changeReturnedVia === "UPI"
                                  ? "bg-[#3cc366] text-black shadow"
                                  : "text-gray-400 hover:text-white"
                              )}
                            >
                              📱 UPI Return
                            </button>
                          </div>

                          {changeReturnedVia === "CASH" ? (
                            <div className="bg-[#1e1e1e]/60 p-2 rounded border border-[#333]/60 w-full">
                              <div className="text-[8px] font-bold text-gray-500 mb-1.5 uppercase tracking-wider text-center">
                                Suggested Denominations
                              </div>
                              <div className="flex flex-wrap gap-1 justify-center">
                                {(() => {
                                  let remaining = upiReturnAmount !== "" ? Number(upiReturnAmount) : calculatedChange;
                                  if (remaining <= 0) return <span className="text-[8px] text-gray-600 font-bold uppercase">No Change Due</span>;
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
                                        className="bg-[#2c2c2c] text-white px-1.5 py-0.5 rounded text-[8px] font-mono border border-gray-700 flex items-center gap-0.5 shadow-sm"
                                      >
                                        <span className="text-gray-400">₹{val}</span>
                                        <span className="text-[#3cc366]">×</span>
                                        <span className="font-bold">{count}</span>
                                      </div>
                                    ));
                                })()}
                              </div>
                            </div>
                          ) : (
                            <div className="bg-[#1e1e1e]/60 p-2 rounded border border-[#333]/60 w-full flex flex-col gap-1.5 animate-fade-in">
                              <div>
                                <label className="text-[8px] font-bold text-gray-500 uppercase tracking-wider block mb-0.5">
                                  UPI Return Amount (₹)
                                </label>
                                <div className="relative">
                                  <input
                                    type="number"
                                    value={upiReturnAmount}
                                    onChange={(e) => setUpiReturnAmount(e.target.value)}
                                    placeholder={String(calculatedChange)}
                                    className="w-full bg-[#111] border border-gray-800 focus:border-[#3cc366]/50 rounded px-1.5 py-1 text-[9px] text-white placeholder-gray-500 focus:outline-none transition-colors"
                                  />
                                  {upiReturnAmount !== "" && (
                                    <button
                                      type="button"
                                      onClick={() => setUpiReturnAmount("")}
                                      className="absolute right-1 top-1/2 -translate-y-1/2 text-gray-400 hover:text-white text-[7px] uppercase tracking-wider font-bold bg-[#222] border border-gray-700 rounded px-0.5 cursor-pointer"
                                    >
                                      Auto
                                    </button>
                                  )}
                                </div>
                              </div>

                              <div>
                                <label className="text-[8px] font-bold text-gray-500 uppercase tracking-wider block mb-0.5">
                                  Customer UPI ID / Mobile
                                </label>
                                <input
                                  type="text"
                                  value={customerUpiId}
                                  onChange={(e) => setCustomerUpiId(e.target.value)}
                                  placeholder="e.g. customer@okaxis"
                                  className="w-full bg-[#111] border border-gray-800 focus:border-[#3cc366]/50 rounded px-1.5 py-1 text-[9px] text-white placeholder-gray-500 focus:outline-none transition-colors"
                                />
                              </div>
                            </div>
                          )}
                        </div>
                      )}
                    </div>
                  );
                })()}
              </div>

              {isSplitUpi && (
                <button
                  onClick={() => {
                    setPaymentUpi(splitUpiAmount);
                    setActiveSplitSection(null);
                  }}
                  className="w-full max-w-[240px] mx-auto bg-[#3cc366] text-black font-bold py-2 rounded text-xs hover:bg-[#32a454] mt-3 transition-colors cursor-pointer"
                >
                  Apply ₹{splitUpiAmount} to UPI Portion
                </button>
              )}
            </div>
          );
        })()}

        {(mode === "CASH" || (mode === "PAYMENT" && paymentSubMode === "split" && activeSplitSection === "CASH")) && (() => {
          const isSplitCash = mode === "PAYMENT" && paymentSubMode === "split" && activeSplitSection === "CASH";
          const displayCashAmount = isSplitCash ? splitCashAmount : cashAmount;

          return (
            <div className="flex-1 flex flex-col bg-black p-2 overflow-y-auto">
              {isSplitCash ? (
                <div className="flex items-center justify-between mb-2 pb-1.5 border-b border-gray-800">
                  <button
                    onClick={() => setActiveSplitSection(null)}
                    className="text-gray-400 hover:text-white transition-colors flex items-center gap-1 text-[11px] font-bold"
                  >
                    <ChevronLeft className="w-4 h-4" />
                    Back to Split
                  </button>
                  <span className="text-[10px] font-bold text-gray-500 tracking-wider uppercase">
                    Split Cash Portion
                  </span>
                  <div className="w-12"></div>
                </div>
              ) : (
                <div className="flex justify-between items-center mb-2 pb-1 border-b border-gray-800">
                  <button
                    onClick={() => setScreenMode("CALC")}
                    className="text-gray-400 hover:text-white transition-colors flex items-center gap-1 text-[11px] font-bold"
                  >
                    <ChevronLeft className="w-4 h-4" />
                    Back
                  </button>
                  <div className="text-[10px] font-bold text-gray-400 uppercase tracking-wider flex items-center gap-1.5">
                    Cash Calculator
                    <button
                      onClick={(e) => {
                        e.stopPropagation();

                        const textLines = [
                          "      DENOMINATION      ",
                          "--------------------------------",
                          `Bill Amt : Rs. ${displayCashAmount}`,
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
                        const changeOrShort = totalCash >= displayCashAmount ? "CHANGE" : "SHORT";
                        const diffAmt = Math.abs(totalCash - displayCashAmount);
                        const lastLineLeft = `${changeOrShort}   :`;
                        const lastLineRight = `Rs. ${diffAmt}`;
                        const lastLineSpaces = Math.max(0, 32 - lastLineLeft.length - lastLineRight.length);
                        textLines.push(`${lastLineLeft}${" ".repeat(lastLineSpaces)}${lastLineRight}`);

                        if (totalCash > displayCashAmount) {
                          textLines.push("--------------------------------");
                          if (changeReturnedVia === "UPI") {
                            textLines.push("      RETURNED VIA UPI          ");
                            const actualReturnVal = upiReturnAmount !== "" ? Number(upiReturnAmount) : (totalCash - displayCashAmount);
                            textLines.push(`  Amount: Rs ${actualReturnVal}`);
                            if (customerUpiId) {
                              textLines.push(`  UPI ID: ${customerUpiId}`);
                            } else {
                              textLines.push("  UPI Status: Paid/Refunded");
                            }
                          } else {
                            textLines.push("         RETURN CHANGE          ");
                            let remaining = totalCash - displayCashAmount;
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
                    Bill: ₹{displayCashAmount}
                  </div>
                </div>
              )}

              {isSplitCash && (
                <div className="bg-[#111] border border-gray-800 rounded-lg p-2 flex justify-between items-center mb-2 shrink-0">
                  <span className="text-[10px] font-bold text-gray-400">Target Cash Portion:</span>
                  <div className="relative flex items-center bg-black border border-gray-800 rounded overflow-hidden">
                    <span className="absolute left-2 text-[10px] text-gray-500 font-bold">₹</span>
                    <input
                      type="number"
                      value={splitCashAmount === 0 ? "" : splitCashAmount}
                      onChange={(e) => setSplitCashAmount(parseFloat(e.target.value) || 0)}
                      placeholder="0"
                      className="w-24 bg-transparent text-xs text-[#3cc366] pl-5 pr-1.5 py-0.5 outline-none font-mono font-bold"
                    />
                  </div>
                </div>
              )}

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
                      totalCash >= displayCashAmount ? "text-white" : "text-red-400",
                    )}
                  >
                    {totalCash >= displayCashAmount
                      ? `₹${totalCash - displayCashAmount}`
                      : `Need ₹${displayCashAmount - totalCash}`}
                  </span>
                </div>
              </div>

              {totalCash > displayCashAmount && (
                <>
                  {/* Selector for Return Method */}
                  <div className="flex bg-[#1e1e1e] p-1 rounded border border-[#333] gap-1 shrink-0 mt-2">
                    <button
                      onClick={() => setChangeReturnedVia("CASH")}
                      className={cn(
                        "flex-1 py-1 px-2 text-[9px] font-bold rounded transition-all cursor-pointer flex items-center justify-center gap-1",
                        changeReturnedVia === "CASH"
                          ? "bg-[#3cc366] text-black shadow"
                          : "text-gray-400 hover:text-white"
                      )}
                    >
                      💵 Cash Return
                    </button>
                    <button
                      onClick={() => setChangeReturnedVia("UPI")}
                      className={cn(
                        "flex-1 py-1 px-2 text-[9px] font-bold rounded transition-all cursor-pointer flex items-center justify-center gap-1",
                        changeReturnedVia === "UPI"
                          ? "bg-[#3cc366] text-black shadow"
                          : "text-gray-400 hover:text-white"
                      )}
                    >
                      📱 UPI Return
                    </button>
                  </div>

                  {changeReturnedVia === "CASH" ? (
                    <div className="bg-[#1e1e1e] p-2 rounded mt-2 border border-[#333] shrink-0">
                      <div className="text-[10px] font-bold text-gray-500 mb-2 uppercase tracking-wider text-center">
                        Return Denominations
                      </div>
                      <div className="flex flex-wrap gap-1.5 justify-center">
                        {(() => {
                          let remaining = totalCash - displayCashAmount;
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
                  ) : (
                    <div className="bg-[#1e1e1e] p-3 rounded mt-2 border border-[#333] shrink-0 flex flex-col gap-2.5 animate-fade-in">
                      <div className="text-[10px] font-bold text-gray-500 uppercase tracking-wider text-center">
                        Return via UPI Details
                      </div>

                      <div className="flex gap-2">
                        <div className="flex-1">
                          <label className="text-[9px] font-bold text-gray-500 uppercase tracking-wider block mb-1">
                            UPI Return Amount (₹)
                          </label>
                          <div className="relative">
                            <input
                              type="number"
                              value={upiReturnAmount}
                              onChange={(e) => setUpiReturnAmount(e.target.value)}
                              placeholder={String(totalCash - displayCashAmount)}
                              className="w-full bg-[#111] border border-gray-800 focus:border-[#3cc366]/50 rounded px-2.5 py-1.5 text-[10px] text-white placeholder-gray-500 focus:outline-none transition-colors"
                            />
                            {upiReturnAmount !== "" && (
                              <button
                                type="button"
                                onClick={() => setUpiReturnAmount("")}
                                className="absolute right-2 top-1/2 -translate-y-1/2 text-gray-400 hover:text-white text-[8px] uppercase tracking-wider font-bold bg-[#222] border border-gray-700 rounded px-1 cursor-pointer"
                              >
                                Auto
                              </button>
                            )}
                          </div>
                        </div>
                        <div className="w-[85px] bg-black/40 border border-gray-800/60 rounded p-1.5 text-center flex flex-col justify-center shrink-0">
                          <span className="text-[8px] text-gray-400 block uppercase tracking-wide leading-none mb-1">Calculated</span>
                          <span className="text-xs font-extrabold text-[#3cc366] leading-none">₹{totalCash - displayCashAmount}</span>
                        </div>
                      </div>

                      <div>
                        <label className="text-[9px] font-bold text-gray-500 uppercase tracking-wider block mb-1">
                          Customer UPI ID / Mobile
                        </label>
                        <input
                          type="text"
                          value={customerUpiId}
                          onChange={(e) => setCustomerUpiId(e.target.value)}
                          placeholder="customer@upi or mobile number"
                          className="w-full bg-[#111] border border-gray-800 focus:border-[#3cc366]/50 rounded px-2.5 py-1.5 text-[10px] text-white placeholder-gray-600 focus:outline-none transition-colors"
                        />
                      </div>
                      <div className="text-[9px] text-center text-gray-500 font-medium">
                        Recording UPI return of <strong className="text-[#3cc366] font-mono">₹{upiReturnAmount !== "" ? upiReturnAmount : totalCash - displayCashAmount}</strong>
                        {customerUpiId ? (
                          <span> to <strong className="font-mono text-white">{customerUpiId}</strong></span>
                        ) : (
                          <span> (UPI ID not specified)</span>
                        )}
                      </div>
                    </div>
                  )}
                </>
              )}

              {isSplitCash && (
                <div className="mt-2 flex flex-col gap-1.5 shrink-0">
                  <button
                    onClick={() => {
                      setPaymentCash(splitCashAmount);
                      setActiveSplitSection(null);
                    }}
                    className="w-full bg-[#3cc366] text-black font-bold py-2 rounded text-xs hover:bg-[#32a454] transition-colors cursor-pointer"
                  >
                    Apply ₹{splitCashAmount} to Cash Portion
                  </button>
                  {totalCash > 0 && totalCash !== splitCashAmount && (
                    <button
                      onClick={() => {
                        setSplitCashAmount(totalCash);
                        setPaymentCash(totalCash);
                        setActiveSplitSection(null);
                      }}
                      className="w-full bg-blue-600 text-white font-bold py-1.5 rounded text-[10px] hover:bg-blue-700 transition-colors cursor-pointer"
                    >
                      Use Counted Cash Total (₹{totalCash})
                    </button>
                  )}
                </div>
              )}
            </div>
          );
        })()}

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
                  <div className="flex flex-col items-start gap-0.5">
                    <div className="flex items-center gap-1">
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
                      {tx.remainingBalance && tx.remainingBalance > 0 ? (
                        <span className="bg-amber-500 text-black text-[8px] font-bold px-1.5 py-0.5 rounded uppercase tracking-wide">
                          Partial
                        </span>
                      ) : null}
                    </div>
                    {tx.method === "PAYMENT" && tx.paymentDetails && (
                      <span className="text-[8px] text-gray-500 font-mono pl-0.5">
                        {[
                          tx.paymentDetails.cash ? `Cash: ₹${tx.paymentDetails.cash}` : null,
                          tx.paymentDetails.upi ? `UPI: ₹${tx.paymentDetails.upi}` : null,
                          tx.paymentDetails.other ? `Other: ₹${tx.paymentDetails.other}` : null,
                        ].filter(Boolean).join(" | ")}
                      </span>
                    )}
                    {tx.method === "OTHER" && tx.otherMode && (
                      <span className="text-[8px] text-gray-500 font-mono pl-0.5">
                        Mode: {tx.otherMode} {tx.remarks ? `| ${tx.remarks}` : ""}
                      </span>
                    )}
                    {tx.remarks && tx.method !== "OTHER" && (
                      <span className="text-[8px] text-gray-500 font-mono pl-0.5">
                        Note: {tx.remarks}
                      </span>
                    )}
                    {tx.changeReturnedVia === "UPI" && (
                      <div className="mt-1 pl-0.5">
                        <span className="text-[8px] font-bold bg-[#3cc366]/10 border border-[#3cc366]/30 text-[#3cc366] px-1.5 py-0.5 rounded inline-flex items-center gap-1">
                          📱 UPI Return {tx.customerUpiId ? `(${tx.customerUpiId})` : ""}
                        </span>
                      </div>
                    )}
                    {tx.denominations && Object.values(tx.denominations).some((count) => count !== 0) && (
                      <div className="flex flex-wrap gap-1 mt-1 pl-0.5 max-w-[220px]">
                        {Object.entries(tx.denominations)
                          .filter(([_, count]) => count !== 0)
                          .sort(([a], [b]) => Number(b) - Number(a))
                          .map(([val, count]) => (
                            <span
                              key={val}
                              className={cn(
                                "text-[8px] font-mono border px-1 py-0.5 rounded",
                                count > 0
                                  ? "bg-black/40 border-gray-800/80 text-gray-400"
                                  : "bg-red-950/20 border-red-900/30 text-red-400"
                              )}
                            >
                              {count > 0 ? `₹${val}×${count}` : `-₹${val}×${Math.abs(count)}`}
                            </span>
                          ))}
                      </div>
                    )}
                    {(tx.customerName || tx.customerMobile || tx.customerAddress || tx.vehicleNumber) && (
                      <div className="mt-1 bg-black/30 border border-gray-800/40 rounded px-1.5 py-0.5 max-w-[240px] text-[8px] text-gray-400 space-y-0.5 animate-fade-in pl-0.5">
                        {tx.customerName && (
                          <div>
                            <span className="font-bold text-gray-500 uppercase tracking-wide">Cust:</span> {tx.customerName}
                          </div>
                        )}
                        {tx.customerMobile && (
                          <div>
                            <span className="font-bold text-gray-500 uppercase tracking-wide">Mob:</span> {tx.customerMobile}
                          </div>
                        )}
                        {tx.customerAddress && (
                          <div>
                            <span className="font-bold text-gray-500 uppercase tracking-wide">Addr:</span> {tx.customerAddress}
                          </div>
                        )}
                        {tx.vehicleNumber && (
                          <div>
                            <span className="font-bold text-[#3cc366] uppercase tracking-wide">Veh:</span> <span className="font-mono bg-[#3cc366]/10 text-[#3cc366] px-1 rounded">{tx.vehicleNumber}</span>
                          </div>
                        )}
                      </div>
                    )}
                  </div>
                  <div className="flex items-center gap-2 lg:gap-4">
                    {deletingId === tx.id ? (
                      <div className="flex items-center gap-1 lg:gap-1.5 bg-[#2a1b1b] border border-red-800/60 p-1 rounded animate-fade-in">
                        <span className="text-[8px] lg:text-[10px] text-red-400 font-bold px-1">Delete?</span>
                        <button
                          onClick={() => {
                            onDeleteTransaction(tx.id);
                            setDeletingId(null);
                          }}
                          className="text-[9px] lg:text-xs bg-red-600 text-white hover:bg-red-700 font-bold px-2 py-0.5 rounded transition cursor-pointer"
                        >
                          Yes
                        </button>
                        <button
                          onClick={() => setDeletingId(null)}
                          className="text-[9px] lg:text-xs bg-gray-850 text-gray-300 hover:bg-gray-800 px-2 py-0.5 rounded transition cursor-pointer border border-gray-750"
                        >
                          No
                        </button>
                      </div>
                    ) : (
                      <>
                        <div className="flex flex-col items-end">
                          <span className="font-mono font-bold text-gray-300 lg:text-base">
                            ₹{tx.amount}
                          </span>
                          {tx.remainingBalance && tx.remainingBalance > 0 ? (
                            <span className="text-[8px] font-bold text-amber-400 bg-amber-400/10 border border-amber-400/20 px-1 py-0.5 rounded mt-0.5 animate-pulse">
                              Bal Due: ₹{tx.remainingBalance}
                            </span>
                          ) : null}
                        </div>
                        <button
                          onClick={() => setPreviewPrintInfo({ type: "tx", tx })}
                          className="text-gray-400 hover:text-white transition-colors bg-[#2c2c2c] rounded p-1 lg:p-2 active:bg-[#444]"
                          title="Print Preview / Print"
                        >
                          <Printer className="w-3 h-3 lg:w-4 lg:h-4" />
                        </button>
                        <button
                          onClick={() => setEditingTransaction(tx)}
                          className="text-blue-400 hover:text-blue-300 hover:bg-blue-950/30 transition-colors bg-[#2c2c2c] rounded p-1 lg:p-2 active:bg-blue-900/40"
                          title="Edit Transaction"
                        >
                          <Edit2 className="w-3 h-3 lg:w-4 lg:h-4" />
                        </button>
                        <button
                          onClick={() => setDeletingId(tx.id)}
                          className="text-red-400 hover:text-red-300 hover:bg-red-950/30 transition-colors bg-[#2c2c2c] rounded p-1 lg:p-2 active:bg-red-900/40"
                          title="Delete Transaction"
                        >
                          <Trash2 className="w-3 h-3 lg:w-4 lg:h-4" />
                        </button>
                      </>
                    )}
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

        {mode === "HISTORY" && (
          <div className="flex-1 flex flex-col bg-black p-2 lg:p-6 overflow-y-auto">
            {/* Header */}
            <div className="flex items-center justify-between mb-3 pb-2 border-b border-[#333]">
              <button
                onClick={() => setScreenMode("CALC")}
                className="text-gray-400 hover:text-white transition-colors flex items-center gap-1 text-[11px] lg:text-sm font-bold cursor-pointer"
              >
                <ChevronLeft className="w-4 h-4" />
                Back
              </button>
              <span className="text-[10px] lg:text-xs font-bold text-gray-400 tracking-wider uppercase">
                Transaction History
              </span>
              <div className="text-[9px] lg:text-xs font-mono text-gray-500">
                Count: {transactions.length}
              </div>
            </div>

            {/* List */}
            <div className="flex-1 space-y-1.5 lg:space-y-2 overflow-y-auto no-scrollbar pr-1">
              {transactions.map((tx) => (
                <div
                  key={tx.id}
                  className="flex justify-between items-center text-[10px] lg:text-sm bg-[#1e1e1e] p-2 rounded shadow-sm border border-[#333] animate-fade-in"
                >
                  <div className="flex flex-col items-start gap-1">
                    <div className="flex items-center gap-1.5">
                      <span
                        className={cn(
                          "font-bold px-1 lg:px-2 py-0.5 rounded text-black text-[9px] lg:text-xs",
                          tx.type === "SALE" || tx.type === "BILL"
                            ? "bg-[#3cc366]"
                            : "bg-red-400",
                        )}
                      >
                        {tx.type} ({tx.method})
                      </span>
                      {tx.remainingBalance && tx.remainingBalance > 0 ? (
                        <span className="bg-amber-500 text-black text-[8px] font-bold px-1.5 py-0.5 rounded uppercase tracking-wide">
                          Partial
                        </span>
                      ) : null}
                      <span className="text-[8px] text-gray-500 font-mono">
                        {new Date(tx.timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                      </span>
                    </div>
                    {tx.method === "PAYMENT" && tx.paymentDetails && (
                      <span className="text-[8px] text-gray-500 font-mono pl-0.5">
                        {[
                          tx.paymentDetails.cash ? `Cash: ₹${tx.paymentDetails.cash}` : null,
                          tx.paymentDetails.upi ? `UPI: ₹${tx.paymentDetails.upi}` : null,
                          tx.paymentDetails.other ? `Other: ₹${tx.paymentDetails.other}` : null,
                        ].filter(Boolean).join(" | ")}
                      </span>
                    )}
                    {tx.method === "OTHER" && tx.otherMode && (
                      <span className="text-[8px] text-gray-500 font-mono pl-0.5">
                        Mode: {tx.otherMode} {tx.remarks ? `| ${tx.remarks}` : ""}
                      </span>
                    )}
                    {tx.remarks && tx.method !== "OTHER" && (
                      <span className="text-[8px] text-gray-500 font-mono pl-0.5">
                        Note: {tx.remarks}
                      </span>
                    )}
                    {tx.changeReturnedVia === "UPI" && (
                      <div className="mt-1 pl-0.5">
                        <span className="text-[8px] font-bold bg-[#3cc366]/10 border border-[#3cc366]/30 text-[#3cc366] px-1.5 py-0.5 rounded inline-flex items-center gap-1">
                          📱 UPI Return {tx.customerUpiId ? `(${tx.customerUpiId})` : ""}
                        </span>
                      </div>
                    )}
                    {tx.denominations && Object.values(tx.denominations).some((count) => count !== 0) && (
                      <div className="flex flex-wrap gap-1 mt-1 pl-0.5 max-w-[220px]">
                        {Object.entries(tx.denominations)
                          .filter(([_, count]) => count !== 0)
                          .sort(([a], [b]) => Number(b) - Number(a))
                          .map(([val, count]) => (
                            <span
                              key={val}
                              className={cn(
                                "text-[8px] font-mono border px-1 py-0.5 rounded",
                                count > 0
                                  ? "bg-black/40 border-gray-800/80 text-gray-400"
                                  : "bg-red-950/20 border-red-900/30 text-red-400"
                              )}
                            >
                              {count > 0 ? `₹${val}×${count}` : `-₹${val}×${Math.abs(count)}`}
                            </span>
                          ))}
                      </div>
                    )}
                    {(tx.customerName || tx.customerMobile || tx.customerAddress || tx.vehicleNumber) && (
                      <div className="mt-1 bg-black/30 border border-gray-800/40 rounded px-1.5 py-0.5 max-w-[240px] text-[8px] text-gray-400 space-y-0.5 animate-fade-in pl-0.5">
                        {tx.customerName && (
                          <div>
                            <span className="font-bold text-gray-500 uppercase tracking-wide">Cust:</span> {tx.customerName}
                          </div>
                        )}
                        {tx.customerMobile && (
                          <div>
                            <span className="font-bold text-gray-500 uppercase tracking-wide">Mob:</span> {tx.customerMobile}
                          </div>
                        )}
                        {tx.customerAddress && (
                          <div>
                            <span className="font-bold text-gray-500 uppercase tracking-wide">Addr:</span> {tx.customerAddress}
                          </div>
                        )}
                        {tx.vehicleNumber && (
                          <div>
                            <span className="font-bold text-[#3cc366] uppercase tracking-wide">Veh:</span> <span className="font-mono bg-[#3cc366]/10 text-[#3cc366] px-1 rounded">{tx.vehicleNumber}</span>
                          </div>
                        )}
                      </div>
                    )}
                    <span className="text-[8px] text-gray-600 font-mono pl-0.5">
                      ID: {tx.id.toUpperCase()}
                    </span>
                  </div>
                  <div className="flex items-center gap-2 lg:gap-4">
                    {deletingId === tx.id ? (
                      <div className="flex items-center gap-1 lg:gap-1.5 bg-[#2a1b1b] border border-red-800/60 p-1 rounded animate-fade-in">
                        <span className="text-[8px] lg:text-[10px] text-red-400 font-bold px-1">Delete?</span>
                        <button
                          onClick={() => {
                            onDeleteTransaction(tx.id);
                            setDeletingId(null);
                          }}
                          className="text-[9px] lg:text-xs bg-red-600 text-white hover:bg-red-700 font-bold px-2 py-0.5 rounded transition cursor-pointer"
                        >
                          Yes
                        </button>
                        <button
                          onClick={() => setDeletingId(null)}
                          className="text-[9px] lg:text-xs bg-gray-850 text-gray-300 hover:bg-gray-800 px-2 py-0.5 rounded transition cursor-pointer border border-gray-750"
                        >
                          No
                        </button>
                      </div>
                    ) : (
                      <>
                        <div className="flex flex-col items-end">
                          <span className="font-mono font-bold text-gray-300 lg:text-base">
                            ₹{tx.amount}
                          </span>
                          {tx.remainingBalance && tx.remainingBalance > 0 ? (
                            <span className="text-[8px] font-bold text-amber-400 bg-amber-400/10 border border-amber-400/20 px-1 py-0.5 rounded mt-0.5 animate-pulse">
                              Bal Due: ₹{tx.remainingBalance}
                            </span>
                          ) : null}
                        </div>
                        <button
                          onClick={() => setPreviewPrintInfo({ type: "tx", tx })}
                          className="text-gray-400 hover:text-white transition-colors bg-[#2c2c2c] rounded p-1 lg:p-2 active:bg-[#444]"
                          title="Print Preview / Print"
                        >
                          <Printer className="w-3 h-3 lg:w-4 lg:h-4" />
                        </button>
                        <button
                          onClick={() => setEditingTransaction(tx)}
                          className="text-blue-400 hover:text-blue-300 hover:bg-blue-950/30 transition-colors bg-[#2c2c2c] rounded p-1 lg:p-2 active:bg-blue-900/40"
                          title="Edit Transaction"
                        >
                          <Edit2 className="w-3 h-3 lg:w-4 lg:h-4" />
                        </button>
                        <button
                          onClick={() => setDeletingId(tx.id)}
                          className="text-red-400 hover:text-red-300 hover:bg-red-950/30 transition-colors bg-[#2c2c2c] rounded p-1 lg:p-2 active:bg-red-900/40"
                          title="Delete Transaction"
                        >
                          <Trash2 className="w-3 h-3 lg:w-4 lg:h-4" />
                        </button>
                      </>
                    )}
                  </div>
                </div>
              ))}
              {transactions.length === 0 && (
                <div className="text-center text-[10px] lg:text-sm text-gray-600 py-10">
                  No transactions yet.
                </div>
              )}
            </div>
          </div>
        )}

        {mode === "PAYMENT" && !activeSplitSection && (
          <div className="flex-1 flex flex-col bg-black p-3 text-white overflow-y-auto no-scrollbar">
            {/* Header */}
            <div className="flex items-center justify-between mb-3 pb-2 border-b border-gray-800">
              <button
                onClick={() => {
                  if (paymentSubMode === "split") {
                    setPaymentSubMode("menu");
                  } else {
                    setScreenMode("CALC");
                  }
                }}
                className="text-gray-400 hover:text-white transition-colors flex items-center gap-1 text-[11px] font-bold"
              >
                <ChevronLeft className="w-4 h-4" />
                {paymentSubMode === "split" ? "Back" : "Cancel"}
              </button>
              <span className="text-[10px] font-bold text-gray-500 tracking-wider uppercase">
                {paymentSubMode === "split" ? "Split Payment" : "Payment Options"}
              </span>
              <div className="w-12"></div> {/* spacer */}
            </div>

            {/* Bill Info */}
            <div className="bg-[#111] border border-gray-800 rounded-lg p-2.5 text-center mb-3">
              <div className="text-[9px] text-gray-400 uppercase tracking-widest mb-0.5">
                Total Bill Amount
              </div>
              <div className="text-2xl font-bold text-white font-sans">
                ₹{paymentBillAmount.toLocaleString("en-IN")}
              </div>
            </div>

            {paymentSubMode === "menu" ? (
              /* Payment Options Selection Menu */
              <div className="flex-1 flex flex-col justify-center gap-3">
                <button
                  onClick={() => onHandlePayment?.("CASH")}
                  className="w-full bg-[#111] hover:bg-[#1a1a1a] border border-gray-800 hover:border-[#3cc366]/50 rounded-xl p-4 flex items-center justify-between transition-all group active:scale-[0.98] cursor-pointer"
                >
                  <div className="flex items-center gap-3.5 text-left">
                    <div className="p-2.5 rounded-lg bg-[#3cc366]/10 text-[#3cc366] group-hover:bg-[#3cc366]/20 transition-colors">
                      <Smartphone className="w-5 h-5" />
                    </div>
                    <div>
                      <div className="font-bold text-sm text-white">Cash Payment</div>
                      <div className="text-[10px] text-gray-400 mt-0.5">Denomination calculator & change due</div>
                    </div>
                  </div>
                  <ChevronRight className="w-4 h-4 text-gray-500 group-hover:text-white transition-colors" />
                </button>

                <button
                  onClick={() => onHandlePayment?.("UPI")}
                  className="w-full bg-[#111] hover:bg-[#1a1a1a] border border-gray-800 hover:border-[#3cc366]/50 rounded-xl p-4 flex items-center justify-between transition-all group active:scale-[0.98] cursor-pointer"
                >
                  <div className="flex items-center gap-3.5 text-left">
                    <div className="p-2.5 rounded-lg bg-blue-500/10 text-blue-400 group-hover:bg-blue-500/20 transition-colors">
                      <QrCode className="w-5 h-5" />
                    </div>
                    <div>
                      <div className="font-bold text-sm text-white">UPI QR Payment</div>
                      <div className="text-[10px] text-gray-400 mt-0.5">Generate dynamic QR for instant scan</div>
                    </div>
                  </div>
                  <ChevronRight className="w-4 h-4 text-gray-500 group-hover:text-white transition-colors" />
                </button>

                <button
                  onClick={() => onHandlePayment?.("OTHER")}
                  className="w-full bg-[#111] hover:bg-[#1a1a1a] border border-gray-800 hover:border-[#3cc366]/50 rounded-xl p-4 flex items-center justify-between transition-all group active:scale-[0.98] cursor-pointer"
                >
                  <div className="flex items-center gap-3.5 text-left">
                    <div className="p-2.5 rounded-lg bg-purple-500/10 text-purple-400 group-hover:bg-purple-500/20 transition-colors">
                      <FileText className="w-5 h-5" />
                    </div>
                    <div>
                      <div className="font-bold text-sm text-white">Other Payment</div>
                      <div className="text-[10px] text-gray-400 mt-0.5">Card, Sodexo, Cheque, Coupons, etc.</div>
                    </div>
                  </div>
                  <ChevronRight className="w-4 h-4 text-gray-500 group-hover:text-white transition-colors" />
                </button>

                <div className="h-[1px] bg-gray-800/85 my-1" />

                <button
                  onClick={() => setPaymentSubMode("split")}
                  className="w-full bg-[#111] hover:bg-[#1a1a1a] border border-gray-800 hover:border-[#3cc366]/50 rounded-xl p-4 flex items-center justify-between transition-all group active:scale-[0.98] cursor-pointer"
                >
                  <div className="flex items-center gap-3.5 text-left">
                    <div className="p-2.5 rounded-lg bg-amber-500/10 text-amber-400 group-hover:bg-amber-500/20 transition-colors">
                      <Plus className="w-5 h-5" />
                    </div>
                    <div>
                      <div className="font-bold text-sm text-white">Split Payment</div>
                      <div className="text-[10px] text-gray-400 mt-0.5">Combine Cash, UPI, & Other portions</div>
                    </div>
                  </div>
                  <ChevronRight className="w-4 h-4 text-gray-500 group-hover:text-white transition-colors" />
                </button>
              </div>
            ) : (
              /* Split Allocators */
              <>
                <div className="flex-1 flex flex-col gap-2.5 min-h-0">
                  {/* Cash Input Row */}
                  <div className="bg-[#111] border border-gray-800/80 rounded-lg p-2 flex flex-col gap-1">
                    <div className="flex justify-between items-center px-1">
                      <span className="text-[10px] font-bold text-gray-400">Cash Portion</span>
                      <div className="flex gap-1.5">
                        <button
                          onClick={activateCashPortion}
                          className="text-[8px] bg-[#3cc366]/20 text-[#3cc366] hover:bg-[#3cc366]/30 transition border border-[#3cc366]/30 px-2 py-0.5 rounded font-bold"
                        >
                          Denominations
                        </button>
                        <button
                          onClick={() => {
                            const currentOthers = (Number(paymentUpi) || 0) + (Number(paymentOther) || 0);
                            const diff = Math.max(0, paymentBillAmount - currentOthers);
                            setPaymentCash(diff || "");
                          }}
                          className="text-[8px] bg-gray-800 text-gray-300 hover:bg-gray-750 transition border border-gray-700 px-2 py-0.5 rounded font-bold"
                        >
                          Set Remaining
                        </button>
                      </div>
                    </div>
                    <div 
                      onClick={activateCashPortion}
                      className="relative flex items-center bg-black border border-gray-800 rounded overflow-hidden cursor-pointer hover:border-gray-700 transition"
                    >
                      <span className="absolute left-2.5 text-[11px] text-gray-500 font-bold">₹</span>
                      <input
                        type="text"
                        value={paymentCash === "" ? "0 (Tap to count/set)" : `${paymentCash} (Tap to edit)`}
                        readOnly
                        className="w-full bg-transparent text-[11px] text-[#3cc366] pl-6 pr-2.5 py-1.5 outline-none font-mono cursor-pointer font-bold"
                      />
                    </div>
                  </div>

                  {/* UPI Input Row */}
                  <div className="bg-[#111] border border-gray-800/80 rounded-lg p-2 flex flex-col gap-1">
                    <div className="flex justify-between items-center px-1">
                      <span className="text-[10px] font-bold text-gray-400">UPI Portion</span>
                      <div className="flex gap-1.5">
                        <button
                          onClick={activateUpiPortion}
                          className="text-[8px] bg-[#3cc366]/20 text-[#3cc366] hover:bg-[#3cc366]/30 transition border border-[#3cc366]/30 px-2 py-0.5 rounded font-bold"
                        >
                          UPI QR
                        </button>
                        <button
                          onClick={() => {
                            const currentOthers = (Number(paymentCash) || 0) + (Number(paymentOther) || 0);
                            const diff = Math.max(0, paymentBillAmount - currentOthers);
                            setPaymentUpi(diff || "");
                          }}
                          className="text-[8px] bg-gray-800 text-gray-300 hover:bg-gray-750 transition border border-gray-700 px-2 py-0.5 rounded font-bold"
                        >
                          Set Remaining
                        </button>
                      </div>
                    </div>
                    <div 
                      onClick={activateUpiPortion}
                      className="relative flex items-center bg-black border border-gray-800 rounded overflow-hidden cursor-pointer hover:border-gray-700 transition"
                    >
                      <span className="absolute left-2.5 text-[11px] text-gray-500 font-bold">₹</span>
                      <input
                        type="text"
                        value={paymentUpi === "" ? "0 (Tap to show QR/set)" : `${paymentUpi} (Tap to edit)`}
                        readOnly
                        className="w-full bg-transparent text-[11px] text-[#3cc366] pl-6 pr-2.5 py-1.5 outline-none font-mono cursor-pointer font-bold"
                      />
                    </div>
                  </div>

                  {/* Other Input Row */}
                  <div className="bg-[#111] border border-gray-800/80 rounded-lg p-2 flex flex-col gap-1">
                    <div className="flex justify-between items-center px-1">
                      <span className="text-[10px] font-bold text-gray-400">Other Portion</span>
                      <div className="flex gap-1.5">
                        <button
                          onClick={activateOtherPortion}
                          className="text-[8px] bg-[#3cc366]/20 text-[#3cc366] hover:bg-[#3cc366]/30 transition border border-[#3cc366]/30 px-2 py-0.5 rounded font-bold"
                        >
                          Details
                        </button>
                        <button
                          onClick={() => {
                            const currentOthers = (Number(paymentCash) || 0) + (Number(paymentUpi) || 0);
                            const diff = Math.max(0, paymentBillAmount - currentOthers);
                            setPaymentOther(diff || "");
                          }}
                          className="text-[8px] bg-gray-800 text-gray-300 hover:bg-gray-750 transition border border-gray-700 px-2 py-0.5 rounded font-bold"
                        >
                          Set Remaining
                        </button>
                      </div>
                    </div>
                    <div 
                      onClick={activateOtherPortion}
                      className="relative flex items-center bg-black border border-gray-800 rounded overflow-hidden cursor-pointer hover:border-gray-700 transition"
                    >
                      <span className="absolute left-2.5 text-[11px] text-gray-500 font-bold">₹</span>
                      <input
                        type="text"
                        value={paymentOther === "" ? "0 (Tap to enter details/set)" : `${paymentOther} (Tap to edit) ${otherModeInput ? `[${otherModeInput}]` : ""}`}
                        readOnly
                        className="w-full bg-transparent text-[11px] text-[#3cc366] pl-6 pr-2.5 py-1.5 outline-none font-mono cursor-pointer font-bold"
                      />
                    </div>
                  </div>
                </div>

                {/* Dynamic Status / Summary Block */}
                <div className="mt-3 bg-[#111] border border-gray-800 rounded-lg p-2 flex flex-col gap-1 shrink-0">
                  <div className="flex justify-between items-center text-[10px]">
                    <span className="text-gray-400">Total Allocated:</span>
                    <span className="font-bold text-white">₹{((Number(paymentCash) || 0) + (Number(paymentUpi) || 0) + (Number(paymentOther) || 0)).toLocaleString("en-IN")}</span>
                  </div>
                  <div className="flex justify-between items-center text-[10px]">
                    <span className="text-gray-400">Status:</span>
                    {(() => {
                      const allocated = (Number(paymentCash) || 0) + (Number(paymentUpi) || 0) + (Number(paymentOther) || 0);
                      const diff = paymentBillAmount - allocated;
                      if (diff === 0) {
                        return <span className="text-[#3cc366] font-bold flex items-center gap-1">● Fully Allocated</span>;
                      } else if (diff > 0) {
                        return <span className="text-amber-400 font-bold">● Need ₹{diff.toLocaleString("en-IN")} more</span>;
                      } else {
                        return <span className="text-red-400 font-bold">● Overallocated by ₹{Math.abs(diff).toLocaleString("en-IN")}</span>;
                      }
                    })()}
                  </div>
                </div>

                {/* Action Buttons */}
                <div className="mt-3 flex flex-col gap-2 shrink-0">
                  <button
                    onClick={() => {
                      const allocated = (Number(paymentCash) || 0) + (Number(paymentUpi) || 0) + (Number(paymentOther) || 0);
                      if (allocated === paymentBillAmount) {
                        onConfirmPayment({
                          cash: Number(paymentCash) || 0,
                          upi: Number(paymentUpi) || 0,
                          other: Number(paymentOther) || 0,
                        }, otherModeInput || undefined, otherRemarksInput || undefined, denominations, 0);
                      }
                    }}
                    disabled={((Number(paymentCash) || 0) + (Number(paymentUpi) || 0) + (Number(paymentOther) || 0)) !== paymentBillAmount}
                    className={cn(
                      "w-full py-2 rounded text-[11px] font-bold flex items-center justify-center gap-1.5 transition-all cursor-pointer",
                      ((Number(paymentCash) || 0) + (Number(paymentUpi) || 0) + (Number(paymentOther) || 0)) === paymentBillAmount
                        ? "bg-[#3cc366] text-black hover:bg-[#32a454] shadow"
                        : "bg-gray-800 text-gray-500 cursor-not-allowed border border-gray-700/50"
                    )}
                  >
                    Confirm Full Payment
                  </button>

                  {(() => {
                    const allocated = (Number(paymentCash) || 0) + (Number(paymentUpi) || 0) + (Number(paymentOther) || 0);
                    const remaining = paymentBillAmount - allocated;
                    const isPartial = allocated > 0 && remaining > 0;
                    if (!isPartial) return null;
                    return (
                      <button
                        onClick={() => {
                          onConfirmPayment({
                            cash: Number(paymentCash) || 0,
                            upi: Number(paymentUpi) || 0,
                            other: Number(paymentOther) || 0,
                          }, otherModeInput || undefined, otherRemarksInput || undefined, denominations, remaining);
                        }}
                        className="w-full py-2 rounded text-[11px] font-bold flex flex-col items-center justify-center bg-amber-500 text-black hover:bg-amber-600 shadow transition-all cursor-pointer border border-amber-600/30"
                      >
                        <span className="font-extrabold uppercase tracking-wide">Accept Partial Payment</span>
                        <span className="text-[9px] opacity-90 font-medium">
                          Paid: ₹{allocated.toLocaleString("en-IN")} | Bal Due: ₹{remaining.toLocaleString("en-IN")}
                        </span>
                      </button>
                    );
                  })()}
                </div>
              </>
            )}
          </div>
        )}

        {(mode === "OTHER" || (mode === "PAYMENT" && paymentSubMode === "split" && activeSplitSection === "OTHER")) && (() => {
          const isSplitOther = mode === "PAYMENT" && paymentSubMode === "split" && activeSplitSection === "OTHER";
          const displayOtherAmount = isSplitOther ? splitOtherAmount : otherBillAmount;

          return (
            <div className="flex-1 flex flex-col bg-black p-3 text-white overflow-y-auto no-scrollbar animate-fade-in">
              {/* Header */}
              <div className="flex items-center justify-between mb-3 pb-2 border-b border-gray-800">
                {isSplitOther ? (
                  <button
                    onClick={() => setActiveSplitSection(null)}
                    className="text-gray-400 hover:text-white transition-colors flex items-center gap-1 text-[11px] font-bold"
                  >
                    <ChevronLeft className="w-4 h-4" />
                    Back to Split
                  </button>
                ) : (
                  <button
                    onClick={() => setScreenMode("CALC")}
                    className="text-gray-400 hover:text-white transition-colors flex items-center gap-1 text-[11px] font-bold"
                  >
                    <ChevronLeft className="w-4 h-4" />
                    Cancel
                  </button>
                )}
                <span className="text-[10px] font-bold text-gray-500 tracking-wider uppercase">
                  {isSplitOther ? "Split Other Portion" : "Other Payment"}
                </span>
                <div className="w-12"></div> {/* spacer */}
              </div>

              {/* Bill Info */}
              <div className="bg-[#111] border border-gray-800 rounded-lg p-2.5 text-center mb-3">
                <div className="text-[9px] text-gray-400 uppercase tracking-widest mb-0.5">
                  Total Bill Amount
                </div>
                {isSplitOther ? (
                  <div className="relative flex items-center justify-center bg-black border border-gray-800 rounded overflow-hidden max-w-[160px] mx-auto mt-1 shrink-0">
                    <span className="absolute left-3 text-sm text-gray-500 font-bold">₹</span>
                    <input
                      type="number"
                      value={splitOtherAmount === 0 ? "" : splitOtherAmount}
                      onChange={(e) => setSplitOtherAmount(parseFloat(e.target.value) || 0)}
                      placeholder="0"
                      className="w-full bg-transparent text-sm text-white pl-7 pr-2 py-1 outline-none font-mono text-center font-bold"
                    />
                  </div>
                ) : (
                  <div className="text-2xl font-bold text-white font-sans">
                    ₹{displayOtherAmount.toLocaleString("en-IN")}
                  </div>
                )}
              </div>

              {/* Input Form */}
              <div className="flex-1 flex flex-col gap-3 min-h-0">
                {/* Payment Mode */}
                <div className="bg-[#111] border border-gray-800/80 rounded-lg p-3 flex flex-col gap-1.5">
                  <span className="text-[10px] font-bold text-gray-400 uppercase tracking-wider">Payment Mode / Type</span>
                  <input
                    type="text"
                    value={otherModeInput}
                    onChange={(e) => setOtherModeInput(e.target.value)}
                    placeholder="e.g. Sodexo, Cheque, Card, Coupon"
                    className="w-full bg-black border border-gray-800 rounded text-xs text-white px-2.5 py-1.5 outline-none focus:border-[#3cc366] transition-colors"
                  />
                  {/* Quick suggestions */}
                  <div className="flex flex-wrap gap-1.5 mt-1">
                    {["Card", "Sodexo", "Cheque", "Coupon", "Credit"].map((suggestion) => (
                      <button
                        key={suggestion}
                        onClick={() => setOtherModeInput(suggestion)}
                        className={cn(
                          "text-[9px] font-medium px-2 py-0.5 rounded transition border cursor-pointer",
                          otherModeInput === suggestion
                            ? "bg-[#3cc366]/10 text-[#3cc366] border-[#3cc366]/30"
                            : "bg-gray-900 text-gray-400 border-gray-800 hover:bg-gray-850 hover:text-white"
                        )}
                      >
                        {suggestion}
                      </button>
                    ))}
                  </div>
                </div>

                {/* Remarks */}
                <div className="bg-[#111] border border-gray-800/80 rounded-lg p-3 flex flex-col gap-1.5">
                  <span className="text-[10px] font-bold text-gray-400 uppercase tracking-wider">Pertinent Remarks</span>
                  <textarea
                    value={otherRemarksInput}
                    onChange={(e) => setOtherRemarksInput(e.target.value)}
                    placeholder="e.g. Ref No, Transaction ID, Authorization code"
                    rows={3}
                    className="w-full bg-black border border-gray-800 rounded text-xs text-white px-2.5 py-1.5 outline-none focus:border-[#3cc366] transition-colors resize-none"
                  />
                </div>
              </div>

              {/* Confirm Button */}
              <div className="mt-3 flex gap-2 shrink-0">
                {isSplitOther ? (
                  <button
                    onClick={() => {
                      setPaymentOther(splitOtherAmount);
                      setActiveSplitSection(null);
                    }}
                    className="w-full py-2 bg-[#3cc366] text-black font-bold rounded text-xs hover:bg-[#32a454] transition-all cursor-pointer"
                  >
                    Apply ₹{splitOtherAmount} to Other Portion
                  </button>
                ) : (
                  <button
                    onClick={() => {
                      if (otherModeInput.trim()) {
                        onConfirmOtherPayment(otherModeInput.trim(), otherRemarksInput.trim());
                      }
                    }}
                    disabled={!otherModeInput.trim()}
                    className={cn(
                      "w-full py-2 rounded text-[11px] font-bold flex items-center justify-center gap-1.5 transition-all cursor-pointer",
                      otherModeInput.trim()
                        ? "bg-[#3cc366] text-black hover:bg-[#32a454] shadow"
                        : "bg-gray-800 text-gray-500 cursor-not-allowed border border-gray-700/50"
                    )}
                  >
                    Confirm Payment
                  </button>
                )}
              </div>
            </div>
          );
        })()}
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

          <div className="w-full max-w-sm bg-white rounded-xl p-6 shadow-2xl relative flex flex-col items-center justify-center gap-3">
            {customQrUrls.length > 0 && currentQrIndex < customQrUrls.length ? (
              <img
                src={customQrUrls[currentQrIndex]}
                alt="Custom QR"
                className="w-full aspect-square object-contain"
              />
            ) : (
              <div className="w-full aspect-square bg-white flex flex-col items-center justify-center p-2 upi-qr-wrapper gap-3">
                <QRCode
                  value={getUpiUrl(qrAmount)}
                  size={500}
                  style={{ height: "100%", width: "100%", maxWidth: "100%" }}
                />
                <div className="text-sm font-bold text-gray-800 flex items-center gap-1.5 mt-1 bg-transparent">
                  <span className="w-2.5 h-2.5 rounded-full bg-[#3cc366] animate-pulse shrink-0"></span>
                  <span>Verified: {retrievedName}</span>
                </div>
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

          <div className="mt-4 flex gap-3">
            <button
              onClick={() => handleShareQr(qrAmount)}
              className="flex items-center justify-center gap-2 bg-white/10 hover:bg-white/20 active:bg-white/30 text-white border border-white/10 px-5 py-2 rounded-lg text-sm font-bold transition shadow-lg cursor-pointer backdrop-blur-sm"
            >
              <Share2 className="w-4 h-4 text-[#3cc366]" />
              <span>{shareStatus || "Share QR"}</span>
            </button>
            <button
              onClick={() => handlePrintQr(qrAmount)}
              className="flex items-center justify-center gap-2 bg-white/10 hover:bg-white/20 active:bg-white/30 text-white border border-white/10 px-5 py-2 rounded-lg text-sm font-bold transition shadow-lg cursor-pointer backdrop-blur-sm"
            >
              <Printer className="w-4 h-4 text-blue-400" />
              <span>Print QR</span>
            </button>
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

          <div className="bg-white text-black p-4 pb-6 w-full max-w-[280px] font-mono text-[10px] sm:text-xs overflow-y-auto max-h-[60vh] receipt-edge shadow-2xl flex flex-col gap-1 items-center">
            <div className="w-full whitespace-pre-wrap text-left">
              {(() => {
                if (previewPrintInfo.type === "tx" && previewPrintInfo.tx) {
                  return getTxLines(previewPrintInfo.tx).join("\n");
                }
                if (previewPrintInfo.lines) {
                  return previewPrintInfo.lines.join("\n");
                }
                return "";
              })()}
            </div>

            {/* UPI QR Code inside receipt preview (displayed exclusively for UPI transactions) */}
            {previewPrintInfo.type === "tx" && previewPrintInfo.tx && previewPrintInfo.tx.method === "UPI" && (
              <div className="mt-4 flex flex-col items-center gap-1 border-t border-dashed border-gray-400 pt-4 w-full receipt-qr-section bg-transparent">
                <div className="text-[10px] font-bold tracking-wider mb-1 uppercase text-black bg-transparent">UPI Scan & Pay</div>
                <div className="bg-white p-2 border border-gray-200 rounded">
                  <QRCode
                    value={getUpiUrl(previewPrintInfo.tx.amount)}
                    size={110}
                    style={{ height: "110px", width: "110px" }}
                  />
                </div>
                <div className="text-[9px] font-bold text-black bg-transparent mt-0.5">{retrievedName}</div>
                <div className="text-[8px] text-gray-600 bg-transparent">₹{previewPrintInfo.tx.amount}</div>
              </div>
            )}
          </div>

          <div className="mt-8 flex flex-col gap-3 w-full max-w-[280px]">
            <div className="grid grid-cols-2 gap-3">
              <button
                onClick={() => {
                  const lines = previewPrintInfo.lines || (previewPrintInfo.tx ? getTxLines(previewPrintInfo.tx) : []);
                  
                  // Try to get the QR code SVG if this is a transaction
                  let qrImgHtml = "";
                  if (previewPrintInfo.type === "tx" && previewPrintInfo.tx && previewPrintInfo.tx.method === "UPI") {
                    const svgEl = document.querySelector(".receipt-qr-section svg");
                    if (svgEl) {
                      const svgString = new XMLSerializer().serializeToString(svgEl);
                      const svgBlob = new Blob([svgString], { type: "image/svg+xml;charset=utf-8" });
                      const qrImgSrc = URL.createObjectURL(svgBlob);
                      qrImgHtml = `
                        <div style="display: flex; flex-direction: column; align-items: center; text-align: center; justify-content: center; margin-top: 15px; border-top: 1px dashed #000; padding-top: 15px; background-color: transparent;">
                          <div style="font-size: 10px; font-weight: bold; margin-bottom: 5px; text-transform: uppercase;">UPI SCAN & PAY</div>
                          <div style="background: white; padding: 4px; border: 1px solid #000; display: inline-block; margin: 0 auto;">
                            <img src="${qrImgSrc}" style="width: 110px; height: 110px; display: block;" />
                          </div>
                          <div style="font-size: 9px; font-weight: bold; margin-top: 4px;">Verified: ${retrievedName}</div>
                          <div style="font-size: 9px; margin-top: 2px;">₹${previewPrintInfo.tx.amount}</div>
                        </div>
                      `;
                    }
                  }

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
                        <body>
                          <div>${htmlLines}</div>
                          ${qrImgHtml}
                          <script>window.onload=()=>{setTimeout(()=>{window.print();window.close();},250)}</script>
                        </body>
                      </html>
                    `;
                    printWindow.document.write(printContent);
                    printWindow.document.close();
                  }
                  setPreviewPrintInfo(null);
                }}
                className="bg-[#3cc366] text-black p-3 rounded font-bold uppercase tracking-wider text-[11px] flex flex-col items-center justify-center gap-1.5 hover:bg-[#32a454] transition-colors"
              >
                <Printer className="w-5 h-5 opacity-80" />
                <div className="flex flex-col items-center bg-transparent">
                  <span>System Print</span>
                  <span className="text-[8px] opacity-70 normal-case tracking-normal">WiFi / USB</span>
                </div>
              </button>

              <button
                onClick={() => {
                  const lines = previewPrintInfo.lines || (previewPrintInfo.tx ? getTxLines(previewPrintInfo.tx) : []);
                  let finalLines = [...lines];
                  if (previewPrintInfo.type === "tx" && previewPrintInfo.tx && previewPrintInfo.tx.method === "UPI") {
                    finalLines.push("--------------------------------");
                    finalLines.push("   Payee:  " + retrievedName);
                    finalLines.push("   UPI ID: " + computedUpiId);
                    finalLines.push("   Amount: Rs " + previewPrintInfo.tx.amount);
                    finalLines.push("--------------------------------");
                  }
                  const intentUri = `intent:#Intent;action=android.intent.action.SEND;type=text/plain;S.android.intent.extra.TEXT=${encodeURIComponent(finalLines.join("\n"))};package=com.dolewa;end;`;
                  window.location.href = intentUri;
                  setPreviewPrintInfo(null);
                }}
                className="bg-[#1e1e1e] text-white border border-[#444] p-3 rounded font-bold uppercase tracking-wider text-[11px] flex flex-col items-center justify-center gap-1.5 hover:bg-[#2c2c2c] transition-colors"
              >
                <Smartphone className="w-5 h-5 text-blue-400" />
                <div className="flex flex-col items-center bg-transparent">
                  <span>Dolewa Print</span>
                  <span className="text-[8px] opacity-70 normal-case tracking-normal text-gray-400">Android App</span>
                </div>
              </button>
            </div>



            <div className="grid grid-cols-2 gap-3">
               <button
                onClick={async () => {
                  try {
                    let blob: Blob;
                    if (previewPrintInfo.type === "tx" && previewPrintInfo.tx) {
                      const qrDataUrl = (() => {
                        if (previewPrintInfo.tx.method !== "UPI") return undefined;
                        const svgEl = document.querySelector(".receipt-qr-section svg");
                        if (svgEl) {
                          const svgString = new XMLSerializer().serializeToString(svgEl);
                          const svgBlob = new Blob([svgString], { type: "image/svg+xml;charset=utf-8" });
                          return URL.createObjectURL(svgBlob);
                        }
                        return undefined;
                      })();
                      blob = await generateReceiptImage(previewPrintInfo.tx, qrDataUrl, retrievedName);
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
                  let finalLines = [...lines];
                  if (previewPrintInfo.type === "tx" && previewPrintInfo.tx && previewPrintInfo.tx.method === "UPI") {
                    // Inject UPI metadata beautifully
                    finalLines.splice(finalLines.length - 3, 0, 
                      "--------------------------------",
                      "Payee:  " + retrievedName,
                      "UPI ID: " + computedUpiId,
                      "Amount: Rs " + previewPrintInfo.tx.amount
                    );
                  }
                  const text = finalLines.join("\n");
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

      {editingTransaction && createPortal(
        <div 
          className="fixed inset-0 z-[100] bg-black/80 backdrop-blur-sm flex items-center justify-center p-4"
          onClick={(e) => {
            if (e.target === e.currentTarget) {
              setEditingTransaction(null);
            }
          }}
        >
          <div className="w-full max-w-md bg-[#121212] border border-[#2c2c2c] rounded-xl p-6 shadow-2xl relative flex flex-col gap-4 text-white animate-fade-in">
            <div className="flex items-center justify-between border-b border-[#222] pb-3">
              <div className="flex items-center gap-2">
                <Edit2 className="w-5 h-5 text-blue-400" />
                <h3 className="font-bold text-sm uppercase tracking-wider text-gray-200">
                  Modify Transaction
                </h3>
              </div>
              <button
                onClick={() => setEditingTransaction(null)}
                className="text-gray-400 hover:text-white p-1 rounded-lg hover:bg-white/5 transition"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="flex flex-col gap-3 text-xs overflow-y-auto max-h-[70vh] pr-1">
              {/* Transaction ID input */}
              <div>
                <label className="text-[10px] font-bold text-gray-400 uppercase tracking-wider block mb-1">
                  Transaction ID
                </label>
                <input
                  type="text"
                  value={editTxId}
                  onChange={(e) => setEditTxId(e.target.value)}
                  className="w-full bg-[#1e1e1e] border border-[#2c2c2c] rounded px-3 py-2 text-white placeholder-gray-600 focus:outline-none focus:border-blue-500 transition-colors font-mono text-[11px]"
                  placeholder="Enter transaction ID"
                />
              </div>

              {/* Type selection */}
              <div>
                <label className="text-[10px] font-bold text-gray-400 uppercase tracking-wider block mb-1">
                  Transaction Type
                </label>
                <div className="grid grid-cols-4 gap-1 bg-[#1a1a1a] p-1 rounded border border-[#222]">
                  {(["SALE", "EXPENSE", "BILL", "ESTIMATE"] as const).map((type) => (
                    <button
                      key={type}
                      type="button"
                      onClick={() => setEditType(type)}
                      className={cn(
                        "py-1.5 px-1 text-[9px] font-bold rounded transition cursor-pointer text-center",
                        editType === type
                          ? "bg-blue-600 text-white shadow"
                          : "text-gray-400 hover:text-white"
                      )}
                    >
                      {type}
                    </button>
                  ))}
                </div>
              </div>

              {/* Method selection */}
              <div>
                <label className="text-[10px] font-bold text-gray-400 uppercase tracking-wider block mb-1">
                  Payment Method
                </label>
                <div className="grid grid-cols-3 gap-1 bg-[#1a1a1a] p-1 rounded border border-[#222]">
                  {(["CASH", "UPI", "OTHER", "UDHAAR", "PAYMENT REQUIRED", "PAYMENT"] as const).map((method) => (
                    <button
                      key={method}
                      type="button"
                      onClick={() => setEditMethod(method)}
                      className={cn(
                        "py-1.5 px-0.5 text-[9px] font-bold rounded transition cursor-pointer text-center truncate",
                        editMethod === method
                          ? "bg-blue-600 text-white shadow"
                          : "text-gray-400 hover:text-white"
                      )}
                      title={method}
                    >
                      {method}
                    </button>
                  ))}
                </div>
              </div>

              {/* Amount input */}
              <div>
                <label className="text-[10px] font-bold text-gray-400 uppercase tracking-wider block mb-1">
                  Amount (₹)
                </label>
                <input
                  type="number"
                  value={editAmount}
                  onChange={(e) => setEditAmount(e.target.value)}
                  className="w-full bg-[#1e1e1e] border border-[#2c2c2c] rounded px-3 py-2 text-white placeholder-gray-600 focus:outline-none focus:border-blue-500 transition-colors font-mono text-[11px]"
                  placeholder="Enter amount"
                />
              </div>

              {/* Other Mode field (only visible if OTHER) */}
              {editMethod === "OTHER" && (
                <div>
                  <label className="text-[10px] font-bold text-gray-400 uppercase tracking-wider block mb-1">
                    Custom Mode Name
                  </label>
                  <input
                    type="text"
                    value={editOtherMode}
                    onChange={(e) => setEditOtherMode(e.target.value)}
                    className="w-full bg-[#1e1e1e] border border-[#2c2c2c] rounded px-3 py-2 text-white placeholder-gray-600 focus:outline-none focus:border-blue-500 transition-colors text-[11px]"
                    placeholder="e.g. Card, Cheque"
                  />
                </div>
              )}

              {/* Remaining Balance (for Partial Payment / Udhaar) */}
              {(editMethod === "PAYMENT" || editMethod === "UDHAAR" || editMethod === "PAYMENT REQUIRED") && (
                <div>
                  <label className="text-[10px] font-bold text-gray-400 uppercase tracking-wider block mb-1">
                    Remaining Balance / Balance Due (₹)
                  </label>
                  <input
                    type="number"
                    value={editRemainingBalance}
                    onChange={(e) => setEditRemainingBalance(e.target.value)}
                    className="w-full bg-[#1e1e1e] border border-[#2c2c2c] rounded px-3 py-2 text-white placeholder-gray-600 focus:outline-none focus:border-blue-500 transition-colors font-mono text-[11px]"
                    placeholder="Remaining balance due"
                  />
                </div>
              )}

              {/* Customer Details */}
              <div>
                <label className="text-[10px] font-bold text-gray-400 uppercase tracking-wider block mb-1">
                  Customer Name
                </label>
                <input
                  type="text"
                  value={editCustomerName}
                  onChange={(e) => setEditCustomerName(e.target.value)}
                  className="w-full bg-[#1e1e1e] border border-[#2c2c2c] rounded px-3 py-2 text-white placeholder-gray-600 focus:outline-none focus:border-blue-500 transition-colors text-[11px]"
                  placeholder="Customer Name"
                />
              </div>

              <div>
                <label className="text-[10px] font-bold text-gray-400 uppercase tracking-wider block mb-1">
                  Mobile Number
                </label>
                <input
                  type="text"
                  value={editCustomerMobile}
                  onChange={(e) => setEditCustomerMobile(e.target.value)}
                  className="w-full bg-[#1e1e1e] border border-[#2c2c2c] rounded px-3 py-2 text-white placeholder-gray-600 focus:outline-none focus:border-blue-500 transition-colors font-mono text-[11px]"
                  placeholder="Mobile Number"
                />
              </div>

              <div>
                <label className="text-[10px] font-bold text-gray-400 uppercase tracking-wider block mb-1">
                  Address
                </label>
                <input
                  type="text"
                  value={editCustomerAddress}
                  onChange={(e) => setEditCustomerAddress(e.target.value)}
                  className="w-full bg-[#1e1e1e] border border-[#2c2c2c] rounded px-3 py-2 text-white placeholder-gray-600 focus:outline-none focus:border-blue-500 transition-colors text-[11px]"
                  placeholder="Address"
                />
              </div>

              <div>
                <label className="text-[10px] font-bold text-gray-400 uppercase tracking-wider block mb-1">
                  Vehicle Number
                </label>
                <input
                  type="text"
                  value={editVehicleNumber}
                  onChange={(e) => setEditVehicleNumber(e.target.value.toUpperCase())}
                  className="w-full bg-[#1e1e1e] border border-[#2c2c2c] rounded px-3 py-2 text-white placeholder-gray-600 focus:outline-none focus:border-blue-500 transition-colors font-mono text-[11px]"
                  placeholder="Vehicle Number"
                />
              </div>

              {/* Remarks / Note */}
              <div>
                <label className="text-[10px] font-bold text-gray-400 uppercase tracking-wider block mb-1">
                  Notes / Remarks
                </label>
                <textarea
                  value={editRemarks}
                  onChange={(e) => setEditRemarks(e.target.value)}
                  className="w-full bg-[#1e1e1e] border border-[#2c2c2c] rounded px-3 py-2 text-white placeholder-gray-600 focus:outline-none focus:border-blue-500 transition-colors min-h-[60px] text-[11px]"
                  placeholder="Add custom transaction remarks"
                />
              </div>
            </div>

            {/* Action Buttons */}
            <div className="flex gap-2 border-t border-[#222] pt-3 mt-1">
              <button
                type="button"
                onClick={() => setEditingTransaction(null)}
                className="flex-1 bg-transparent hover:bg-white/5 border border-[#333] text-gray-300 hover:text-white py-2 rounded font-bold uppercase tracking-wider text-[11px] cursor-pointer transition"
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={() => {
                  const trimmedId = editTxId.trim();
                  if (!trimmedId) {
                    alert("Please enter a valid Transaction ID");
                    return;
                  }
                  const duplicate = transactions.some(
                    (tx) => tx.id.toLowerCase() === trimmedId.toLowerCase() && tx.id.toLowerCase() !== editingTransaction.id.toLowerCase()
                  );
                  if (duplicate) {
                    alert("This Transaction ID is already in use. Please enter a unique ID.");
                    return;
                  }
                  if (!editAmount || isNaN(Number(editAmount))) {
                    alert("Please enter a valid amount");
                    return;
                  }
                  const updatedTx: Partial<Transaction> = {
                    id: trimmedId,
                    type: editType,
                    method: editMethod,
                    amount: Number(editAmount),
                    remarks: editRemarks || undefined,
                    otherMode: editMethod === "OTHER" ? (editOtherMode || undefined) : undefined,
                    remainingBalance: (editMethod === "PAYMENT" || editMethod === "UDHAAR" || editMethod === "PAYMENT REQUIRED")
                      ? (editRemainingBalance ? Number(editRemainingBalance) : undefined)
                      : undefined,
                    customerName: editCustomerName || undefined,
                    customerMobile: editCustomerMobile || undefined,
                    customerAddress: editCustomerAddress || undefined,
                    vehicleNumber: editVehicleNumber || undefined,
                  };
                  onUpdateTransaction(editingTransaction.id, updatedTx);
                  setEditingTransaction(null);
                }}
                className="flex-1 bg-blue-600 hover:bg-blue-700 text-white py-2 rounded font-bold uppercase tracking-wider text-[11px] cursor-pointer transition shadow"
              >
                Save Changes
              </button>
            </div>
          </div>
        </div>,
        document.body
      )}
    </div>
  );
}
