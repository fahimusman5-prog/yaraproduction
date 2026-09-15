import type { ShippingLabelData } from "./types";

const WIDTH = 288;
const HEIGHT = 432;
const margin = 18;
const safe = (value: string) => value.normalize("NFKD").replace(/[^\x20-\x7E]/g, "?").replace(/[\\()]/g, (char) => `\\${char}`);
const wrap = (value: string, maxChars: number) => {
  const words = value.split(/\s+/).filter(Boolean);
  const lines: string[] = [];
  let line = "";
  for (const word of words) {
    if ((line ? line.length + 1 : 0) + word.length > maxChars && line) { lines.push(line); line = word; } else line += `${line ? " " : ""}${word}`;
  }
  if (line) lines.push(line);
  return lines.length ? lines : [""];
};
const money = (amount: number, currency: string) => `${currency} ${Number.isFinite(amount) ? amount.toFixed(2) : "—"}`;

function textCommand(value: string, x: number, y: number, size: number, bold = false) {
  return `BT /${bold ? "F2" : "F1"} ${size} Tf 1 0 0 1 ${x.toFixed(2)} ${y.toFixed(2)} Tm (${safe(value)}) Tj ET`;
}
function lineCommand(y: number) { return `0.75 w 18 ${y.toFixed(2)} m 270 ${y.toFixed(2)} l S`; }

function pageContent(data: ShippingLabelData, page: 1 | 2) {
  const commands = ["0 0 0 RG 0 0 0 rg"];
  if (page === 1) {
    commands.push(textCommand("YARA", margin, 408, 18, true), textCommand("SHIPPING LABEL", margin, 393, 7, true), lineCommand(382));
    commands.push(textCommand("ORDER", margin, 367, 7, true));
    for (const [index, line] of wrap(data.orderNumber, 31).entries()) commands.push(textCommand(line, margin, 353 - index * 12, 10, true));
    let y = 327;
    commands.push(lineCommand(y), textCommand("DELIVER TO", margin, y - 17, 7, true)); y -= 34;
    commands.push(...wrap(data.customerName, 29).map((line, index) => textCommand(line, margin, y - index * 14, 14, true))); y -= Math.max(14, wrap(data.customerName, 29).length * 14);
    if (data.phone) { commands.push(textCommand(data.phone, margin, y - 2, 11, true)); y -= 18; }
    for (const addressLine of data.addressLines.flatMap((line) => wrap(line, 38))) { commands.push(textCommand(addressLine, margin, y, 9)); y -= 12; }
    if (data.email && y > 260) { commands.push(textCommand(data.email, margin, y, 7)); y -= 12; }
    y -= 4; commands.push(lineCommand(y));
    const paymentTop = y - 12;
    commands.push(textCommand("PAYMENT COLLECTION", margin, paymentTop, 7, true));
    commands.push(`2 w 18 ${(paymentTop - 60).toFixed(2)} m 270 ${(paymentTop - 60).toFixed(2)} l 270 ${(paymentTop + 8).toFixed(2)} l 18 ${(paymentTop + 8).toFixed(2)} l h S`);
    commands.push(textCommand(data.payment.heading, 27, paymentTop - 20, 13, true));
    commands.push(textCommand(data.payment.type === "cod" ? `COLLECT ${money(data.payment.amount, data.payment.currency)}` : data.payment.instruction, 27, paymentTop - 43, data.payment.type === "cod" ? 13 : 9, true));
    y = paymentTop - 78;
    if (data.items.length && y > 125) {
      commands.push(lineCommand(y), textCommand("ORDER CONTENTS", margin, y - 14, 7, true)); y -= 30;
      for (const item of data.items.slice(0, 5)) {
        const itemLines = wrap(`${item.quantity} x ${item.name}`, 38);
        commands.push(...itemLines.map((line, index) => textCommand(line, margin, y - index * 10, 8, true))); y -= itemLines.length * 10;
        if (item.sku) { commands.push(textCommand(`SKU: ${item.sku}`, margin + 8, y, 7)); y -= 12; }
      }
      if (data.items.length > 5) commands.push(textCommand(`+ ${data.items.length - 5} more item${data.items.length - 5 === 1 ? "" : "s"}`, margin, y, 8, true));
    }
    y = Math.max(y - 8, 42); commands.push(lineCommand(y), textCommand("COURIER", margin, y - 14, 7, true), textCommand(data.courier || "________________________", 70, y - 14, 8));
    commands.push(textCommand("TRACKING", margin, y - 29, 7, true), textCommand(data.trackingNumber || "____________________", 70, y - 29, 8));
    if (data.estimatedDelivery) commands.push(textCommand("EST. DELIVERY", margin, y - 44, 7, true), textCommand(data.estimatedDelivery, 80, y - 44, 8));
    commands.push(textCommand(data.orderNumber, margin, 22, 7));
  } else {
    commands.push(textCommand("YARA", margin, 408, 18, true), textCommand("ORDER CONTENTS - CONTINUED", margin, 391, 8, true), lineCommand(378));
    let y = 355;
    for (const item of data.items) {
      const lines = wrap(`${item.quantity} x ${item.name}`, 38);
      commands.push(...lines.map((line, index) => textCommand(line, margin, y - index * 12, 10, true))); y -= lines.length * 12;
      if (item.sku) { commands.push(textCommand(`SKU: ${item.sku}`, margin + 10, y, 8)); y -= 16; }
      y -= 3;
      if (y < 35) break;
    }
    commands.push(textCommand(data.orderNumber, margin, 22, 7));
  }
  return commands.join("\n");
}

function pdfBytes(contents: string[]) {
  const objects: string[] = ["<< /Type /Catalog /Pages 2 0 R >>", "", "", "<< /Type /Font /Subtype /Type1 /BaseFont /Helvetica >>", "<< /Type /Font /Subtype /Type1 /BaseFont /Helvetica-Bold >>"];
  const pageIds: number[] = [];
  for (const content of contents) {
    const contentId = objects.length + 1; objects.push(`<< /Length ${content.length} >>\nstream\n${content}\nendstream`);
    const pageId = objects.length + 1; objects.push(`<< /Type /Page /Parent 2 0 R /MediaBox [0 0 ${WIDTH} ${HEIGHT}] /Resources << /Font << /F1 4 0 R /F2 5 0 R >> >> /Contents ${contentId} 0 R >>`); pageIds.push(pageId);
  }
  objects[1] = `<< /Type /Pages /Kids [${pageIds.map((id) => `${id} 0 R`).join(" ")}] /Count ${pageIds.length} >>`;
  let output = "%PDF-1.4\n%\xFF\xFF\xFF\xFF\n"; const offsets = [0];
  objects.forEach((object, index) => { offsets[index + 1] = output.length; output += `${index + 1} 0 obj\n${object}\nendobj\n`; });
  const xref = output.length; output += `xref\n0 ${objects.length + 1}\n0000000000 65535 f \n${offsets.slice(1).map((offset) => `${String(offset).padStart(10, "0")} 00000 n `).join("\n")}\ntrailer\n<< /Size ${objects.length + 1} /Root 1 0 R >>\nstartxref\n${xref}\n%%EOF`;
  return new TextEncoder().encode(output);
}

export function generateShippingLabel(data: ShippingLabelData): Uint8Array {
  const first = pageContent(data, 1);
  const needsContinuation = data.items.length > 5 || data.addressLines.join(" ").length > 160 || data.items.some((item) => item.name.length > 38);
  const second = needsContinuation ? pageContent(data, 2) : undefined;
  return pdfBytes(second ? [first, second] : [first]);
}
