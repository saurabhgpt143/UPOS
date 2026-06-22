import React from "react";
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

  return (
    <div className="relative w-full max-w-[400px] md:max-w-[800px] h-[100dvh] sm:h-[800px] md:h-[560px] sm:max-h-[100dvh] bg-black sm:rounded-[36px] overflow-hidden flex flex-col md:flex-row items-center md:items-stretch mx-auto sm:border-[6px] sm:border-[#1c1c1c] shadow-2xl">
      {/* Screen area */}
      <div
        className={cn(
          "w-full md:w-[45%] pt-4 sm:pt-10 md:pt-6 md:pb-6 px-4 mb-2 md:mb-0 relative z-10 flex flex-col justify-end md:justify-center transition-all duration-300 flex-1 min-h-0",
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
        />
      </div>

      {/* Separator for desktop */}
      <div className="hidden md:block w-[2px] bg-[#1c1c1c] relative z-10 shadow-lg" />

      {/* Keypad Area */}
      <div
        className={cn(
          "w-full md:w-[55%] relative z-10 bg-black transition-all duration-300 flex-shrink-0 md:flex md:items-center md:justify-center",
        )}
      >
        <POSKeypad onKeyPress={handleKeyPress} mode={pos.screenMode} />
      </div>
    </div>
  );
}
