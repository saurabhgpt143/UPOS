import React, { useEffect, useState, useRef, useCallback } from "react";
import { usePOS } from "../hooks/usePOS";
import { useAudioFeedback } from "../hooks/useAudioFeedback";
import { POSScreen } from "./POSScreen";
import { POSKeypad } from "./POSKeypad";
import { cn } from "../lib/utils";

export function POSDevice() {
  const pos = usePOS();
  const { playPlasticClick, playSiliconeClick, playError } = useAudioFeedback();

  const [panelRatio, setPanelRatio] = useState(60); // Default 60%
  const isDraggingRef = useRef(false);
  const containerRef = useRef<HTMLDivElement>(null);

  const startDragging = useCallback((e: React.MouseEvent | React.TouchEvent) => {
    isDraggingRef.current = true;
    document.body.style.cursor = "col-resize";
    document.body.style.userSelect = "none";
  }, []);

  useEffect(() => {
    const handleMouseMove = (e: MouseEvent | TouchEvent) => {
      if (!isDraggingRef.current || !containerRef.current) return;
      
      const rect = containerRef.current.getBoundingClientRect();
      const clientX = 'touches' in e ? e.touches[0].clientX : (e as MouseEvent).clientX;
      
      // Calculate based on container width and offset
      const relativeX = clientX - rect.left;
      const ratio = (relativeX / rect.width) * 100;
      
      // Clamp between 30% and 75%
      setPanelRatio(Math.max(30, Math.min(75, ratio)));
    };

    const handleMouseUp = () => {
      if (isDraggingRef.current) {
        isDraggingRef.current = false;
        document.body.style.cursor = "auto";
        document.body.style.userSelect = "auto";
      }
    };

    window.addEventListener("mousemove", handleMouseMove);
    window.addEventListener("mouseup", handleMouseUp);
    window.addEventListener("touchmove", handleMouseMove, { passive: false });
    window.addEventListener("touchend", handleMouseUp);

    return () => {
      window.removeEventListener("mousemove", handleMouseMove);
      window.removeEventListener("mouseup", handleMouseUp);
      window.removeEventListener("touchmove", handleMouseMove);
      window.removeEventListener("touchend", handleMouseUp);
    };
  }, []);

  const handleKeyPress = (keyConfig: any) => {
    const { action, type } = keyConfig;

    if (type === "silicone") {
      playSiliconeClick();
    } else {
      playPlasticClick();
    }

    // Number / Math
    if (
      [
        "0",
        "1",
        "2",
        "3",
        "4",
        "5",
        "6",
        "7",
        "8",
        "9",
        "00",
        ".",
        "+",
        "−",
        "×",
        "÷",
        "=",
        "AC",
        "C",
        "DEL",
        "%",
      ].includes(action)
    ) {
      pos.handleMath(action);
      return;
    }

    // Memory
    if (["M+", "M-", "MRC"].includes(action)) {
      pos.handleMemory(action as any);
      return;
    }

    // TAX
    if (["TAX+", "TAX-"].includes(action)) {
      pos.handleTax(action as any);
      return;
    }

    // Tx Types
    if (["SALE", "EXPENSE", "BILL", "ESTIMATE", "MENU"].includes(action)) {
      pos.handleTransactionMode(action as any);
      return;
    }

    // Payments
    if (
      ["CASH", "UPI", "OTHER", "UDHAAR", "PAYMENT REQUIRED", "PAYMENT"].includes(action)
    ) {
      pos.handlePayment(action as any);
      return;
    }
  };

  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      // Don't intercept if user is typing in an input field
      if (e.target instanceof HTMLInputElement || e.target instanceof HTMLTextAreaElement) {
        return;
      }

      let action = null;
      let type = "plastic"; // Default to plastic sound for keys

      switch (e.key) {
        case "0":
        case "1":
        case "2":
        case "3":
        case "4":
        case "5":
        case "6":
        case "7":
        case "8":
        case "9":
        case ".":
          action = e.key;
          break;
        case "+":
          action = "+";
          break;
        case "-":
          action = "−"; // Note the minus symbol used in the app
          break;
        case "*":
          action = "×";
          break;
        case "/":
          action = "÷";
          break;
        case "Enter":
        case "=":
          action = "=";
          break;
        case "Backspace":
          action = "DEL";
          break;
        case "Escape":
          action = "AC";
          break;
        case "%":
          action = "%";
          break;
      }

      if (action) {
        e.preventDefault();
        handleKeyPress({ action, type });
      }
    };

    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [pos, playPlasticClick, playSiliconeClick]);

  return (
    <div 
      ref={containerRef}
      className="relative w-full max-w-[400px] md:max-w-[800px] lg:max-w-full lg:w-full h-[100dvh] sm:h-[800px] md:h-[560px] lg:h-[100dvh] bg-black sm:rounded-[36px] lg:rounded-none overflow-hidden flex flex-col md:flex-row items-center md:items-stretch mx-auto sm:border-[6px] lg:border-none sm:border-[#1c1c1c] shadow-2xl lg:shadow-none"
      style={{ '--panel-ratio': `${panelRatio}%`, '--keypad-ratio': `calc(100% - ${panelRatio}% - 8px)` } as React.CSSProperties}
    >
      {/* Screen area */}
      <div
        className={cn(
          "w-full md:w-[var(--panel-ratio)] pt-4 sm:pt-10 md:pt-6 md:pb-6 lg:pt-12 px-4 lg:px-16 xl:px-24 mb-2 md:mb-0 relative z-10 flex flex-col justify-end md:justify-center flex-1 md:flex-none min-h-0",
        )}
      >
        <POSScreen
          mode={pos.screenMode}
          expression={pos.expression}
          displayValue={pos.displayValue}
          qrAmount={pos.qrAmount}
          cashAmount={pos.cashAmount}
          pendingTxType={pos.pendingTxType}
          transactions={pos.transactions}
          transactionId={pos.transactionId}
          onTransactionIdChange={pos.setTransactionId}
          upiId={pos.upiId}
          onUpiIdChange={pos.setUpiId}
          upiNote={pos.upiNote}
          onUpiNoteChange={pos.setUpiNote}
          customQrUrls={pos.customQrUrls}
          onCustomQrUrlsChange={pos.setCustomQrUrls}
          currentQrIndex={pos.currentQrIndex}
          onCurrentQrIndexChange={pos.setCurrentQrIndex}
          stats={pos.stats}
          memory={pos.memory}
          paymentBillAmount={pos.paymentBillAmount}
          otherBillAmount={pos.otherBillAmount}
          onConfirmPayment={pos.confirmPayment}
          onConfirmOtherPayment={pos.confirmOtherPayment}
          onUpdateTransactionDenominations={pos.updateLastTransactionDenominations}
          onHandlePayment={pos.handlePayment}
          setScreenMode={pos.setScreenMode}
          onDeleteTransaction={pos.deleteTransaction}
        />
      </div>

      {/* Separator / Drag Handle for desktop */}
      <div 
        className="hidden md:flex w-[8px] bg-[#111] hover:bg-[#222] active:bg-[#333] relative z-20 shadow-lg cursor-col-resize flex-col justify-center items-center group flex-shrink-0 transition-colors"
        onMouseDown={startDragging}
        onTouchStart={startDragging}
      >
        <div className="w-[2px] h-12 bg-[#333] group-hover:bg-[#555] rounded-full" />
      </div>

      {/* Keypad Area */}
      <div
        className={cn(
          "w-full md:w-[var(--keypad-ratio)] relative z-10 bg-black flex-shrink-0 lg:py-8 overflow-y-auto no-scrollbar",
        )}
      >
        <div className="min-h-full flex flex-col justify-center">
          <POSKeypad onKeyPress={handleKeyPress} mode={pos.screenMode} />
        </div>
      </div>
    </div>
  );
}
