import { useState, useCallback, useMemo, useRef } from "react";
import { Transaction, ScreenMode } from "../types";
import { evaluateExpression } from "../lib/calculator";

export function usePOS() {
  const [expression, setExpression] = useState("");
  const [displayValue, setDisplayValue] = useState("0");
  const [memory, setMemory] = useState<number>(0);
  const [transactions, setTransactions] = useState<Transaction[]>([]);

  const [screenMode, setScreenMode] = useState<ScreenMode>("CALC");
  const [pendingTxType, setPendingTxType] = useState<
    "SALE" | "EXPENSE" | "BILL" | "ESTIMATE"
  >("ESTIMATE");
  const [qrAmount, setQrAmount] = useState(0);
  const [upiId, setUpiId] = useState("");
  const [upiNote, setUpiNote] = useState("");
  const [customQrUrls, setCustomQrUrls] = useState<string[]>([]);
  const [currentQrIndex, setCurrentQrIndex] = useState(0);

  const [cashAmount, setCashAmount] = useState(0);
  const [paymentBillAmount, setPaymentBillAmount] = useState(0);
  const [otherBillAmount, setOtherBillAmount] = useState(0);

  const [shouldResetDisplay, setShouldResetDisplay] = useState(false);
  const [transactionId, setTransactionId] = useState("");
  const mrcPressedRef = useRef(false);

  const _evaluateCurrent = () => {
    if (!expression) return 0;
    const res = evaluateExpression(expression);
    if (res === "Error") return 0;
    return parseFloat(res);
  };

  const handleMath = useCallback(
    (key: string) => {
      mrcPressedRef.current = false;
      if (screenMode !== "CALC") {
        setScreenMode("CALC");
      }

      if (key === "AC") {
        setExpression("");
        setDisplayValue("0");
        setPendingTxType("SALE");
        return;
      }
      if (key === "C") {
        setExpression("");
        setDisplayValue("0");
        return;
      }
      if (key === "DEL") {
        if (shouldResetDisplay) {
          setExpression("");
          setDisplayValue("0");
          setShouldResetDisplay(false);
        } else {
          setExpression((prev) => (prev.length > 1 ? prev.slice(0, -1) : ""));
          setDisplayValue((prev) =>
            prev.length > 1 ? prev.slice(0, -1) : "0",
          );
        }
        return;
      }

      if (key === "=") {
        if (!expression) return;
        const res = evaluateExpression(expression);
        if (res === "Error") {
          setDisplayValue("ERR");
        } else {
          setDisplayValue(res);
          setExpression(res);
          setShouldResetDisplay(true);
        }
        return;
      }

      const isOperator = ["+", "−", "×", "÷", "%"].includes(key);

      if (shouldResetDisplay && !isOperator) {
        setExpression(key);
        setDisplayValue(key);
        setShouldResetDisplay(false);
      } else {
        setExpression((prev) => prev + key);
        setDisplayValue((prev) => {
          if (prev === "0" && key !== ".") return key;
          return prev === "0" && key !== "." ? key : prev + key;
        });
        setShouldResetDisplay(false);
      }
    },
    [expression, shouldResetDisplay, screenMode],
  );

  const handleMemory = useCallback(
    (action: "M+" | "M-" | "MRC") => {
      const val = _evaluateCurrent();
      if (action === "M+") {
        setMemory((prev) => prev + val);
        setShouldResetDisplay(true);
        mrcPressedRef.current = false;
      } else if (action === "M-") {
        setMemory((prev) => prev - val);
        setShouldResetDisplay(true);
        mrcPressedRef.current = false;
      } else if (action === "MRC") {
        if (mrcPressedRef.current) {
          // Double press: Clear Memory
          setMemory(0);
          setExpression("0");
          setDisplayValue("0");
          mrcPressedRef.current = false;
        } else {
          // Single press: Recall Memory
          setExpression(memory.toString());
          setDisplayValue(memory.toString());
          setShouldResetDisplay(true);
          mrcPressedRef.current = true;
        }
      }
    },
    [expression, memory],
  );

  const handleTax = useCallback(
    (action: "TAX+" | "TAX-") => {
      const val = _evaluateCurrent();
      if (val) {
        // Typically GST is 18%.
        const result = action === "TAX+" ? val + val * 0.18 : val - val * 0.18;
        const formatted = Number.isInteger(result)
          ? result.toString()
          : result.toFixed(2);
        setExpression(formatted);
        setDisplayValue(formatted);
        setShouldResetDisplay(true);
      }
    },
    [expression],
  );

  const handleTransactionMode = useCallback(
    (type: "SALE" | "EXPENSE" | "BILL" | "ESTIMATE" | "MENU") => {
      if (type === "MENU") {
        setScreenMode((prev) => (prev === "DASHBOARD" ? "CALC" : "DASHBOARD"));
        return;
      }
      setPendingTxType(type);
      setScreenMode("CALC");
    },
    [],
  );

  const handlePayment = useCallback(
    (method: "CASH" | "UPI" | "OTHER" | "UDHAAR" | "PAYMENT REQUIRED" | "PAYMENT") => {
      const amt = _evaluateCurrent();
      if (amt <= 0) return;

      if (method === "UPI") {
        setQrAmount(amt);
        setScreenMode("QR");
      } else if (method === "CASH") {
        setCashAmount(amt);
        setScreenMode("CASH");
      } else if (method === "PAYMENT") {
        setPaymentBillAmount(amt);
        setScreenMode("PAYMENT");
        return; // Don't record transaction yet!
      } else if (method === "OTHER") {
        setOtherBillAmount(amt);
        setScreenMode("OTHER");
        return; // Don't record transaction yet!
      } else {
        setScreenMode("CALC");
      }

      const newTx: Transaction = {
        id: transactionId || Math.random().toString(36).substring(2, 9),
        type: pendingTxType,
        method,
        amount: amt,
        timestamp: Date.now(),
        remarks: method === "UPI" && upiNote ? upiNote : undefined,
      };

      setTransactions((prev) => [newTx, ...prev]);

      // reset for next
      setExpression("");
      setDisplayValue("0");
      setShouldResetDisplay(true);
      setTransactionId("");
      setPendingTxType("ESTIMATE"); // default back to estimate
      if (method === "UPI") {
        setUpiNote("");
      }
    },
    [expression, pendingTxType, transactionId, upiNote],
  );

  const confirmPayment = useCallback(
    (paymentDetails: { cash: number; upi: number; other: number }, otherMode?: string, remarks?: string, denominations?: Record<number, number>, remainingBalance?: number) => {
      const amt = paymentBillAmount;
      if (amt <= 0) return;

      const newTx: Transaction = {
        id: transactionId || Math.random().toString(36).substring(2, 9),
        type: pendingTxType,
        method: "PAYMENT",
        amount: amt,
        timestamp: Date.now(),
        paymentDetails,
        otherMode,
        remarks,
        denominations,
        remainingBalance,
      };

      setTransactions((prev) => [newTx, ...prev]);

      // reset for next
      setExpression("");
      setDisplayValue("0");
      setShouldResetDisplay(true);
      setTransactionId("");
      setPendingTxType("ESTIMATE"); // default back to estimate
      setPaymentBillAmount(0);
      setScreenMode("CALC");
    },
    [paymentBillAmount, pendingTxType, transactionId],
  );

  const confirmOtherPayment = useCallback(
    (otherMode: string, remarks: string) => {
      const amt = otherBillAmount;
      if (amt <= 0) return;

      const newTx: Transaction = {
        id: transactionId || Math.random().toString(36).substring(2, 9),
        type: pendingTxType,
        method: "OTHER",
        amount: amt,
        timestamp: Date.now(),
        otherMode,
        remarks,
      };

      setTransactions((prev) => [newTx, ...prev]);

      // reset for next
      setExpression("");
      setDisplayValue("0");
      setShouldResetDisplay(true);
      setTransactionId("");
      setPendingTxType("ESTIMATE"); // default back to estimate
      setOtherBillAmount(0);
      setScreenMode("CALC");
    },
    [otherBillAmount, pendingTxType, transactionId],
  );

  const updateLastTransactionDenominations = useCallback((denoms: Record<number, number>) => {
    setTransactions((prev) => {
      if (prev.length === 0) return prev;
      const copy = [...prev];
      copy[0] = { ...copy[0], denominations: denoms };
      return copy;
    });
  }, []);

  const deleteTransaction = useCallback((id: string) => {
    setTransactions((prev) => prev.filter((tx) => tx.id !== id));
  }, []);

  const stats = useMemo(() => {
    let sales = 0;
    let expenses = 0;
    transactions.forEach((t) => {
      if (t.type === "SALE" || t.type === "BILL") sales += t.amount;
      if (t.type === "EXPENSE") expenses += t.amount;
    });
    return { sales, expenses, profit: sales - expenses };
  }, [transactions]);

  return {
    expression,
    displayValue,
    memory,
    screenMode,
    pendingTxType,
    qrAmount,
    cashAmount,
    transactions,
    transactionId,
    setTransactionId,
    upiId,
    setUpiId,
    upiNote,
    setUpiNote,
    customQrUrls,
    setCustomQrUrls,
    currentQrIndex,
    setCurrentQrIndex,
    stats,
    paymentBillAmount,
    otherBillAmount,
    confirmPayment,
    confirmOtherPayment,
    updateLastTransactionDenominations,
    deleteTransaction,
    handleMath,
    handleMemory,
    handleTax,
    handleTransactionMode,
    handlePayment,
    setScreenMode,
  };
}
