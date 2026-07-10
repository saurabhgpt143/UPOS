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
  changeReturnedVia?: "CASH" | "UPI";
  customerUpiId?: string;
  upiReturnAmount?: number;
  customerName?: string;
  customerMobile?: string;
  customerAddress?: string;
  vehicleNumber?: string;
}

export type ScreenMode = "CALC" | "QR" | "DASHBOARD" | "HISTORY" | "CASH" | "PAYMENT" | "OTHER";

