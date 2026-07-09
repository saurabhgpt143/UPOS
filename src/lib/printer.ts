import { Transaction } from "../types";

export const generateImageFromLines = (lines: string[], qrDataUrl?: string, payeeName?: string): Promise<Blob> => {
  return new Promise((resolve) => {
    const canvas = document.createElement("canvas");
    // Mini Portable Cat Printer typical print width is 384 dots (48mm print width at 8 dots/mm)
    canvas.width = 384;
    // Calculate required height based on number of lines and optional QR code
    const baseHeight = lines.length * 30 + 80;
    canvas.height = qrDataUrl ? baseHeight + (payeeName ? 235 : 210) : Math.max(400, baseHeight);
    
    const ctx = canvas.getContext("2d");
    if (!ctx) throw new Error("Could not get canvas context");

    // Fill white background for thermal interpretation
    ctx.fillStyle = "#FFFFFF";
    ctx.fillRect(0, 0, canvas.width, canvas.height);

    // Draw text (Black)
    ctx.fillStyle = "#000000";
    ctx.textAlign = "left";

    let currentY = 40;

    lines.forEach((line) => {
      // Check for custom formatting markers
      if (line.includes("UNIVERSE POS") || line.includes("TOTAL:")) {
        ctx.font = "bold 24px monospace";
        // Calculate centered position for UNIVERSE POS
        if (line.includes("UNIVERSE POS")) {
           ctx.textAlign = "center";
           ctx.fillText("UNIVERSE POS", canvas.width / 2, currentY);
           ctx.textAlign = "left";
        } else {
           ctx.fillText(line.trim(), 20, currentY);
        }
        currentY += 32;
      } else if (line.includes("NET CASH")) {
        ctx.font = "bold 20px monospace";
        ctx.fillText(line.trim(), 20, currentY);
        currentY += 30;
      } else {
        ctx.font = "18px monospace";
        ctx.fillText(line, 20, currentY);
        currentY += 24;
      }
    });

    const completeAndResolve = () => {
      canvas.toBlob((blob) => {
        resolve(blob!);
      }, "image/png");
    };

    if (qrDataUrl) {
      const img = new Image();
      img.onload = () => {
        // Draw centered dashed line
        ctx.strokeStyle = "#000000";
        ctx.lineWidth = 2;
        ctx.setLineDash([5, 5]);
        ctx.beginPath();
        ctx.moveTo(20, currentY);
        ctx.lineTo(canvas.width - 20, currentY);
        ctx.stroke();
        currentY += 25;

        // Draw title
        ctx.font = "bold 16px monospace";
        ctx.textAlign = "center";
        ctx.fillText("UPI SCAN & PAY", canvas.width / 2, currentY);
        currentY += 15;

        // Draw QR Image
        ctx.drawImage(img, (canvas.width - 150) / 2, currentY, 150, 150);
        
        if (payeeName) {
          currentY += 165;
          ctx.font = "bold 13px monospace";
          ctx.textAlign = "center";
          ctx.fillText(payeeName, canvas.width / 2, currentY);
        }

        completeAndResolve();
      };
      img.onerror = () => {
        completeAndResolve();
      };
      img.src = qrDataUrl;
    } else {
      completeAndResolve();
    }
  });
};

export const generateReceiptImage = (tx: Transaction, qrDataUrl?: string, payeeName?: string): Promise<Blob> => {
  const lines = [
    "         UNIVERSE POS         ",
    "------------------------------",
    `Date: ${new Date(tx.timestamp).toLocaleString()}`,
    `Type: ${tx.type}`,
  ];
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
  if (tx.denominations && Object.entries(tx.denominations).some(([_, count]) => count !== 0)) {
    const received = Object.entries(tx.denominations)
      .filter(([_, count]) => count > 0)
      .sort(([a], [b]) => Number(b) - Number(a));

    const returned = Object.entries(tx.denominations)
      .filter(([_, count]) => count < 0)
      .sort(([a], [b]) => Number(b) - Number(a));

    if (received.length > 0) {
      lines.push("DENOMINATIONS:");
      received.forEach(([val, count]) => {
        const left = `  Rs.${val} x ${count}`;
        const right = `Rs.${Number(val) * count}`;
        const spaces = Math.max(0, 30 - left.length - right.length);
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

    const changeAmount = (tx.changeReturnedVia === "UPI" && tx.upiReturnAmount !== undefined)
      ? tx.upiReturnAmount
      : baseChangeAmount;

    if (changeAmount > 0) {
      lines.push("------------------------------");
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
          returned.forEach(([val, count]) => {
            const numCount = Math.abs(count);
            const left = `  Rs.${val} x ${numCount}`;
            const right = `Rs.${Number(val) * numCount}`;
            const spaces = Math.max(0, 30 - left.length - right.length);
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
                const spaces = Math.max(0, 30 - left.length - right.length);
                lines.push(`${left}${" ".repeat(spaces)}${right}`);
              }
              remainingChange -= count * d;
            }
          }
        }
      }
    }
  }
  lines.push("------------------------------");
  lines.push(`TOTAL: Rs ${tx.amount}`);
  if (tx.remainingBalance && tx.remainingBalance > 0) {
    lines.push("------------------------------");
    lines.push(`PAID AMOUNT: Rs ${tx.amount - tx.remainingBalance}`);
    lines.push(`BALANCE DUE: Rs ${tx.remainingBalance}`);
    lines.push("==============================");
  } else {
    lines.push("------------------------------");
  }
  lines.push("          Thank You!          ");
  lines.push("      Mob: 9752556113         ");
  return generateImageFromLines(lines, qrDataUrl, payeeName);
};

export const printReceipt = async (tx: Transaction) => {
  try {
    const blob = await generateReceiptImage(tx);
    const file = new File([blob], `receipt_${tx.id}.png`, {
      type: "image/png",
    });

    if (
      navigator.share &&
      navigator.canShare &&
      navigator.canShare({ files: [file] })
    ) {
      await navigator.share({
        title: "Receipt",
        files: [file],
      });
    } else {
      // Fallback: download the image
      const url = URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = url;
      a.download = `receipt_${tx.id}.png`;
      a.click();
      URL.revokeObjectURL(url);
    }
  } catch (err: any) {
    if (err.name !== "AbortError" && !err.message?.includes("canceled")) {
      console.error("Failed to print receipt:", err);
    }
  }
};
