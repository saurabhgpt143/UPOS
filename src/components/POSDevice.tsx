import React, { useEffect } from "react";
import { usePOS } from "../hooks/usePOS";
import { useAudioFeedback } from "../hooks/useAudioFeedback";
import { POSScreen } from "./POSScreen";
import { POSKeypad } from "./POSKeypad";
import { cn } from "../lib/utils";

export function POSDevice() {
  const pos = usePOS();
  const { playPlasticClick, playSiliconeClick, playError } = useAudioFeedback();

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
      ["CASH", "UPI", "CARD", "UDHAAR", "PAYMENT REQUIRED"].includes(action)
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
    <div className="relative w-full max-w-[400px] md:max-w-[800px] lg:max-w-full lg:w-full h-[100dvh] sm:h-[800px] md:h-[560px] lg:h-[100dvh] bg-black sm:rounded-[36px] lg:rounded-none overflow-hidden flex flex-col md:flex-row items-center md:items-stretch mx-auto sm:border-[6px] lg:border-none sm:border-[#1c1c1c] shadow-2xl lg:shadow-none">
      {/* Screen area */}
      <div
        className={cn(
          "w-full md:w-[45%] lg:w-[60%] xl:w-[65%] pt-4 sm:pt-10 md:pt-6 md:pb-6 lg:pt-12 px-4 lg:px-16 xl:px-24 mb-2 md:mb-0 relative z-10 flex flex-col justify-end md:justify-center transition-all duration-300 flex-1 min-h-0",
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
          customQrUrls={pos.customQrUrls}
          onCustomQrUrlsChange={pos.setCustomQrUrls}
          currentQrIndex={pos.currentQrIndex}
          onCurrentQrIndexChange={pos.setCurrentQrIndex}
          stats={pos.stats}
          memory={pos.memory}
        />
      </div>

      {/* Separator for desktop */}
      <div className="hidden md:block w-[2px] bg-[#1c1c1c] relative z-10 shadow-lg" />

      {/* Keypad Area */}
      <div
        className={cn(
          "w-full md:w-[55%] lg:w-[40%] xl:w-[35%] relative z-10 bg-black transition-all duration-300 flex-shrink-0 lg:py-8 overflow-y-auto no-scrollbar",
        )}
      >
        <div className="min-h-full flex flex-col justify-center">
          <POSKeypad onKeyPress={handleKeyPress} mode={pos.screenMode} />
        </div>
      </div>
    </div>
  );
}
