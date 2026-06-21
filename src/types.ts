export interface Transaction {
  id: string;
  type: "SALE" | "EXPENSE" | "ESTIMATE" | "BILL";
  method: "CASH" | "UPI" | "CARD" | "UDHAAR" | "PAYMENT REQUIRED";
  amount: number;
  timestamp: number;
}

export type ScreenMode = "CALC" | "QR" | "DASHBOARD" | "HISTORY" | "CASH";
