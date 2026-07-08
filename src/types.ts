export interface Transaction {
  id: string;
  type: "SALE" | "EXPENSE" | "ESTIMATE" | "BILL";
  method: "CASH" | "UPI" | "OTHER" | "UDHAAR" | "PAYMENT REQUIRED" | "PAYMENT";
  amount: number;
  timestamp: number;
  paymentDetails?: {
    cash?: number;
    upi?: number;
    other?: number;
  };
  otherMode?: string;
  remarks?: string;
  denominations?: Record<number, number>;
  remainingBalance?: number;
}

export type ScreenMode = "CALC" | "QR" | "DASHBOARD" | "HISTORY" | "CASH" | "PAYMENT" | "OTHER";

