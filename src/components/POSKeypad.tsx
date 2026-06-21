import React from "react";
import { cn } from "../lib/utils";

import { ScreenMode } from "../types";

interface KeyConfig {
  label: string;
  action: string;
  type?: "num" | "op" | "ac" | "eq" | "pos";
  isSmall?: boolean;
}

const POS_KEYS: KeyConfig[] = [
  { label: "MENU", action: "MENU", type: "pos" },
  { label: "EXP", action: "EXPENSE", type: "pos" },
  { label: "ESTM", action: "ESTIMATE", type: "pos" },
  { label: "M+", action: "M+", type: "pos" },
  { label: "M-", action: "M-", type: "pos" },
  { label: "MRC", action: "MRC", type: "pos" },
  { label: "GT", action: "GT", type: "pos" },
  { label: "PAY REQ", action: "PAYMENT REQUIRED", type: "pos" },
];

const PAYMENT_KEYS: KeyConfig[] = [
  { label: "CASH", action: "CASH", type: "pos" },
  { label: "UPI", action: "UPI", type: "pos" },
  { label: "CARD", action: "CARD", type: "pos" },
];

const NUMPAD_KEYS: KeyConfig[][] = [
  [
    { label: "C", action: "AC", type: "ac" },
    { label: "⌫", action: "DEL", type: "op" },
    { label: "%", action: "%", type: "op" },
    { label: "÷", action: "÷", type: "op" },
  ],
  [
    { label: "7", action: "7", type: "num" },
    { label: "8", action: "8", type: "num" },
    { label: "9", action: "9", type: "num" },
    { label: "×", action: "×", type: "op" },
  ],
  [
    { label: "4", action: "4", type: "num" },
    { label: "5", action: "5", type: "num" },
    { label: "6", action: "6", type: "num" },
    { label: "−", action: "−", type: "op" },
  ],
  [
    { label: "1", action: "1", type: "num" },
    { label: "2", action: "2", type: "num" },
    { label: "3", action: "3", type: "num" },
    { label: "+", action: "+", type: "op" },
  ],
  [
    { label: "00", action: "00", type: "num" },
    { label: "0", action: "0", type: "num" },
    { label: ".", action: ".", type: "num" },
    { label: "=", action: "=", type: "eq" },
  ],
];

export interface POSKeypadProps {
  onKeyPress: (key: any) => void;
  mode: ScreenMode;
}

export function POSKeypad({ onKeyPress, mode }: POSKeypadProps) {
  return (
    <div className="w-full flex flex-col bg-black px-4 sm:px-6 pb-6 gap-3 shrink">
      {/* POS Action Strip (Scrollable) */}
      <div className="flex gap-2 overflow-x-auto no-scrollbar py-2 shrink-0">
        {PAYMENT_KEYS.map((k) => (
          <button
            key={k.label}
            onClick={() => onKeyPress({ ...k, type: "silicone" })}
            className="shrink-0 font-medium text-sm px-4 py-2 rounded-full bg-[#1e1e1e] text-[#3cc366] active:bg-[#2c2c2c] transition-colors"
          >
            {k.label}
          </button>
        ))}
        {POS_KEYS.map((k) => (
          <button
            key={k.label}
            onClick={() => onKeyPress({ ...k, type: "silicone" })}
            className="shrink-0 font-medium text-sm px-4 py-2 rounded-full bg-[#1e1e1e] text-white active:bg-[#2c2c2c] transition-colors"
          >
            {k.label}
          </button>
        ))}
      </div>

      <div
        className={cn(
          "bg-[#2c2c2c] h-[1px] w-full rounded-full opacity-50 my-1 shrink-0",
          mode !== "CALC" && "hidden",
        )}
      />

      {/* Main Numpad */}
      <div
        className={cn(
          "grid grid-cols-4 gap-3 sm:gap-4 justify-items-center max-w-[320px] mx-auto w-full transition-all shrink-0",
          mode !== "CALC" ? "hidden" : "flex-1",
        )}
      >
        {NUMPAD_KEYS.map((row) =>
          row.map((k) => (
            <button
              key={k.label}
              onClick={() => onKeyPress({ ...k, type: "plastic" })}
              className={cn(
                "relative flex items-center justify-center font-normal rounded-full transition-colors active:scale-[0.95]",
                "w-16 h-16 sm:w-[72px] sm:h-[72px]",
                k.type === "num"
                  ? "bg-[#1e1e1e] text-[#eeeeee] text-3xl active:bg-[#2c2c2c]"
                  : k.type === "op"
                    ? "bg-[#1e1e1e] text-[#3cc366] text-3xl active:bg-[#2c2c2c]"
                    : k.type === "ac"
                      ? "bg-[#1e1e1e] text-[#ff4c4c] text-3xl active:bg-[#2c2c2c]"
                      : k.type === "eq"
                        ? "bg-[#3cc366] text-black text-4xl pb-1 active:bg-[#32a454]"
                        : "bg-[#1e1e1e] text-white",
                k.label === "⌫" && "text-2xl",
                k.label === "00" && "text-2xl",
              )}
            >
              {k.label}
            </button>
          )),
        )}
      </div>
    </div>
  );
}
