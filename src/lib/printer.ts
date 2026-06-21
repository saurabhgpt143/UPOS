import { Transaction } from "../types";

export const generateImageFromLines = (lines: string[]): Promise<Blob> => {
  return new Promise((resolve) => {
    const canvas = document.createElement("canvas");
    // Mini Portable Cat Printer typical print width is 384 dots (48mm print width at 8 dots/mm)
    canvas.width = 384;
    // Calculate required height based on number of lines
    canvas.height = Math.max(400, lines.length * 30 + 80); 
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
        currentY += 28;
      } else {
        ctx.font = "18px monospace";
        ctx.fillText(line, 20, currentY);
        currentY += 24;
      }
    });

    canvas.toBlob((blob) => {
      resolve(blob!);
    }, "image/png");
  });
};

export const generateReceiptImage = (tx: Transaction): Promise<Blob> => {
  const lines = [
    "         UNIVERSE POS         ",
    "------------------------------",
    `Date: ${new Date(tx.timestamp).toLocaleString()}`,
    `Type: ${tx.type}`,
    `Mode: ${tx.method}`,
    `Tx ID: ${tx.id.toUpperCase()}`,
    "------------------------------",
    `TOTAL: Rs ${tx.amount}`,
    "------------------------------",
    "          Thank You!          ",
    "      Mob: 9752556113         "
  ];
  return generateImageFromLines(lines);
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
