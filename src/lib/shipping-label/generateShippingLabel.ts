import type { ShippingLabelData } from "./types";

const WIDTH = 288;
const HEIGHT = 432;
const MARGIN = 15;
const INK = "0.14 0.10 0.12";
const MUTED = "0.43 0.38 0.40";
const WINE = "0.62 0.09 0.28";
const PALE_WINE = "0.98 0.93 0.95";
const LINE = "0.89 0.84 0.86";

const safe = (value: string) => value.normalize("NFKD").replace(/[^\x20-\x7E]/g, "?").replace(/[\\()]/g, (char) => `\\${char}`);
const wrap = (value: string, maxChars: number) => {
  const lines: string[] = [];
  let line = "";
  for (const word of value.split(/\s+/).filter(Boolean)) {
    if (line && line.length + word.length + 1 > maxChars) { lines.push(line); line = word; } else line += `${line ? " " : ""}${word}`;
  }
  if (line) lines.push(line);
  return lines.length ? lines : [""];
};
const formatMoney = (value: number, currency: string) => `${currency || ""} ${Number.isFinite(value) ? value.toLocaleString("en-US", { minimumFractionDigits: 2, maximumFractionDigits: 2 }) : "-"}`.trim();
const formatDate = (value?: string) => value ? new Intl.DateTimeFormat("en-GB", { day: "2-digit", month: "short", year: "numeric", timeZone: "Asia/Colombo" }).format(new Date(value)).toUpperCase() : "";

function color(fill: string) { return `${fill} rg`; }
function stroke(fill: string) { return `${fill} RG`; }
function line(x1: number, y1: number, x2: number, y2: number, width = 0.6) { return `${width} w ${x1} ${y1} m ${x2} ${y2} l S`; }
function roundedRect(x: number, y: number, width: number, height: number, radius: number, fill?: string, border = LINE, borderWidth = 0.6) {
  const k = 0.5522848;
  const c = radius * k;
  return [`${borderWidth} w`, stroke(border), color(fill ?? "1 1 1"), `${x + radius} ${y} m`, `${x + width - radius} ${y} l`, `${x + width - radius + c} ${y} ${x + width} ${y + radius - c} ${x + width} ${y + radius} c`, `${x + width} ${y + height - radius} l`, `${x + width} ${y + height - radius + c} ${x + width - radius + c} ${y + height} ${x + width - radius} ${y + height} c`, `${x + radius} ${y + height} l`, `${x + radius - c} ${y + height} ${x} ${y + height - radius + c} ${x} ${y + height - radius} c`, `${x} ${y + radius} l`, `${x} ${y + radius - c} ${x + radius - c} ${y} ${x + radius} ${y} c`, "h", "B"].join("\n");
}
function textCommand(value: string, x: number, y: number, size: number, font = "F1", fill = INK, charSpace = 0) { return `${color(fill)} BT /${font} ${size} Tf ${charSpace} Tc 1 0 0 1 ${x.toFixed(2)} ${y.toFixed(2)} Tm (${safe(value)}) Tj ET`; }
function label(value: string, x: number, y: number) { return textCommand(value, x, y, 6.5, "F2", WINE, 0.65); }
function rightText(value: string, right: number, y: number, size: number, font = "F1", fill = INK) { return textCommand(value, right - value.length * size * 0.5, y, size, font, fill); }

function paymentCard(data: ShippingLabelData, top: number) {
  const height = 50;
  const instruction = data.payment.type === "cod" ? `COLLECT ${formatMoney(data.payment.amount, data.payment.currency)}` : data.payment.instruction;
  return [roundedRect(MARGIN, top - height, WIDTH - MARGIN * 2, height, 5, PALE_WINE, WINE, 0.9), label("PAYMENT / COLLECTION", MARGIN + 10, top - 12), textCommand(data.payment.heading, MARGIN + 10, top - 27, 11.5, "F2", WINE), textCommand(instruction, MARGIN + 10, top - 41, data.payment.type === "cod" ? 11 : 7.5, "F2", INK)];
}

function financialSummary(data: ShippingLabelData, top: number) {
  const height = 63;
  const commands = [roundedRect(MARGIN, top - height, WIDTH - MARGIN * 2, height, 5, undefined, LINE, 0.6), label("ORDER VALUE", MARGIN + 10, top - 12)];
  const rows: Array<[string, string]> = [["Subtotal", formatMoney(data.subtotal, data.currency)]];
  if (data.discount > 0) rows.push(["Discount", `-${formatMoney(data.discount, data.currency)}`]);
  rows.push(["Delivery", data.delivery === 0 ? "FREE" : formatMoney(data.delivery, data.currency)]);
  if (data.processingFee > 0) rows.push(["Processing fee", formatMoney(data.processingFee, data.currency)]);
  let y = top - 25;
  for (const [name, value] of rows) { commands.push(textCommand(name, MARGIN + 10, y, 7, "F1", MUTED), rightText(value, WIDTH - MARGIN - 10, y, 7)); y -= 9; }
  commands.push(line(MARGIN + 10, top - 48, WIDTH - MARGIN - 10, top - 48, 0.5), textCommand("GRAND TOTAL", MARGIN + 10, top - 58, 8, "F2", WINE), rightText(formatMoney(data.grandTotal, data.currency), WIDTH - MARGIN - 10, top - 58, 8, "F2", WINE));
  return commands;
}

function contentsCard(data: ShippingLabelData, top: number, itemLimit = 4) {
  const visible = data.items.slice(0, itemLimit);
  const height = 40 + visible.reduce((sum, item) => sum + 17 + (item.sku ? 8 : 0), 0) + (data.items.length > itemLimit ? 12 : 0);
  const commands = [roundedRect(MARGIN, top - height, WIDTH - MARGIN * 2, height, 5, undefined, LINE, 0.6), label("ORDER CONTENTS", MARGIN + 10, top - 12), textCommand("PRODUCT", MARGIN + 10, top - 24, 6.2, "F2", MUTED, 0.4), rightText("QTY", WIDTH - MARGIN - 10, top - 24, 6.2, "F2", MUTED)];
  let y = top - 36;
  for (const item of visible) {
    const lines = wrap(item.name, 29);
    commands.push(textCommand(lines[0], MARGIN + 10, y, 7.4, "F2"), rightText(String(item.quantity), WIDTH - MARGIN - 10, y, 8, "F2", WINE));
    if (lines.length > 1) { commands.push(textCommand(lines[1], MARGIN + 10, y - 8, 7.4, "F2")); y -= 6; }
    y -= 10;
    if (item.sku) { commands.push(textCommand(`SKU: ${item.sku}`, MARGIN + 10, y, 6.2, "F1", MUTED)); y -= 9; }
  }
  if (data.items.length > itemLimit) commands.push(textCommand(`+ ${data.items.length - itemLimit} more item${data.items.length - itemLimit === 1 ? "" : "s"}`, MARGIN + 10, y, 6.8, "F2", WINE));
  return { commands, height };
}

function pageContent(data: ShippingLabelData, continuation = false) {
  const commands = [color("1 1 1"), "0 0 288 432 re f", color(INK)];
  if (continuation) {
    commands.push(textCommand("Y A R A", MARGIN, 404, 16, "F2", WINE, 2.1), textCommand("ORDER CONTENTS / CONTINUED", MARGIN, 390, 7, "F2", MUTED, 0.6), line(MARGIN, 379, WIDTH - MARGIN, 379, 1));
    let y = 360;
    for (const item of data.items) {
      const lines = wrap(item.name, 32);
      commands.push(textCommand(`${item.quantity} x ${lines[0]}`, MARGIN, y, 9, "F2")); y -= 13;
      if (lines.length > 1) { commands.push(textCommand(lines[1], MARGIN + 12, y, 9, "F2")); y -= 12; }
      if (item.sku) { commands.push(textCommand(`SKU: ${item.sku}`, MARGIN + 12, y, 7, "F1", MUTED)); y -= 15; } else y -= 8;
      if (y < 90) break;
    }
    commands.push(...financialSummary(data, 100), textCommand(data.orderNumber, MARGIN, 16, 6.5, "F1", MUTED));
    return commands.join("\n");
  }
  commands.push(textCommand("Y A R A", MARGIN, 408, 17, "F2", WINE, 2.3), textCommand("SHIPPING / ORDER", MARGIN, 394, 6.5, "F2", MUTED, 0.8), line(MARGIN, 383, WIDTH - MARGIN, 383, 1.1));
  commands.push(roundedRect(MARGIN, 341, WIDTH - MARGIN * 2, 34, 5, PALE_WINE, LINE, 0.5), label("ORDER NO.", MARGIN + 10, 365), textCommand(data.orderNumber, MARGIN + 10, 351, 9.2, "F2"));
  const meta = [formatDate(data.orderDate), data.region].filter(Boolean).join("  /  ");
  if (meta) commands.push(textCommand(meta, WIDTH - MARGIN - meta.length * 3.1, 365, 6.4, "F2", WINE, 0.3));
  const deliveryTop = 333;
  const nameLines = wrap(data.customerName, 29);
  const addressLines = data.addressLines.flatMap((value) => wrap(value, 39));
  const deliveryHeight = Math.min(150, Math.max(85, 46 + Math.max(0, nameLines.length - 1) * 12 + addressLines.length * 10 + (data.email ? 9 : 0)));
  commands.push(roundedRect(MARGIN, deliveryTop - deliveryHeight, WIDTH - MARGIN * 2, deliveryHeight, 5, undefined, LINE, 0.6), label("DELIVER TO", MARGIN + 10, deliveryTop - 13));
  let y = deliveryTop - 30;
  commands.push(...nameLines.slice(0, 2).map((value, index) => textCommand(value, MARGIN + 10, y - index * 12, 11.5, "F2"))); y -= nameLines.length * 12 + 2;
  if (data.phone) { commands.push(textCommand(data.phone, MARGIN + 10, y, 8.5, "F2", WINE)); y -= 11; }
  if (data.email) { commands.push(textCommand(data.email, MARGIN + 10, y, 6.8, "F1", MUTED)); y -= 10; }
  for (const addressLine of addressLines) { commands.push(textCommand(addressLine, MARGIN + 10, y, 7.8)); y -= 10; }
  const paymentTop = deliveryTop - deliveryHeight - 7;
  commands.push(...paymentCard(data, paymentTop));
  const hasContinuation = data.items.length > 4 || data.addressLines.join(" ").length > 150 || data.items.some((item) => item.name.length > 38);
  if (hasContinuation) {
    const continuationTop = paymentTop - 57;
    commands.push(roundedRect(MARGIN, continuationTop - 32, WIDTH - MARGIN * 2, 32, 5, undefined, LINE, 0.6), label("ORDER SUMMARY", MARGIN + 10, continuationTop - 12), textCommand("CONTENTS AND FULL ORDER VALUE CONTINUE", MARGIN + 10, continuationTop - 25, 6.8, "F2", INK), textCommand("ON THE ATTACHED PAGE", MARGIN + 10, continuationTop - 31, 6.2, "F1", MUTED));
    commands.push(textCommand(`YARA  /  ${data.orderNumber}`, MARGIN, 14, 6.2, "F1", MUTED));
    return commands.join("\n");
  }
  const contentsTop = paymentTop - 57;
  const contents = contentsCard(data, contentsTop, 4);
  commands.push(...contents.commands);
  const totalsTop = contentsTop - contents.height - 7;
  commands.push(...financialSummary(data, totalsTop));
  const dispatchTop = totalsTop - 64;
  commands.push(roundedRect(MARGIN, dispatchTop - 29, WIDTH - MARGIN * 2, 29, 5, undefined, LINE, 0.6), label("DISPATCH", MARGIN + 10, dispatchTop - 11), textCommand("COURIER", MARGIN + 10, dispatchTop - 23, 6.2, "F2", MUTED), textCommand(data.courier || "________________", 67, dispatchTop - 23, 7), textCommand("TRACKING", 153, dispatchTop - 23, 6.2, "F2", MUTED), textCommand(data.trackingNumber || "____________", 201, dispatchTop - 23, 7));
  commands.push(textCommand(`YARA  /  ${data.orderNumber}`, MARGIN, 6, 6.2, "F1", MUTED));
  return commands.join("\n");
}

function pdfBytes(contents: string[]) {
  const objects = ["<< /Type /Catalog /Pages 2 0 R >>", "", "", "<< /Type /Font /Subtype /Type1 /BaseFont /Helvetica >>", "<< /Type /Font /Subtype /Type1 /BaseFont /Helvetica-Bold >>"];
  const pageIds: number[] = [];
  for (const content of contents) { const contentId = objects.length + 1; objects.push(`<< /Length ${content.length} >>\nstream\n${content}\nendstream`); const pageId = objects.length + 1; objects.push(`<< /Type /Page /Parent 2 0 R /MediaBox [0 0 ${WIDTH} ${HEIGHT}] /Resources << /Font << /F1 4 0 R /F2 5 0 R >> >> /Contents ${contentId} 0 R >>`); pageIds.push(pageId); }
  objects[1] = `<< /Type /Pages /Kids [${pageIds.map((id) => `${id} 0 R`).join(" ")}] /Count ${pageIds.length} >>`;
  let output = "%PDF-1.4\n%\xFF\xFF\xFF\xFF\n"; const offsets = [0];
  objects.forEach((object, index) => { offsets[index + 1] = output.length; output += `${index + 1} 0 obj\n${object}\nendobj\n`; });
  const xref = output.length; output += `xref\n0 ${objects.length + 1}\n0000000000 65535 f \n${offsets.slice(1).map((offset) => `${String(offset).padStart(10, "0")} 00000 n `).join("\n")}\ntrailer\n<< /Size ${objects.length + 1} /Root 1 0 R >>\nstartxref\n${xref}\n%%EOF`;
  return new TextEncoder().encode(output);
}

export function generateShippingLabel(data: ShippingLabelData): Uint8Array {
  const continuation = data.items.length > 4 || data.addressLines.join(" ").length > 150 || data.items.some((item) => item.name.length > 38);
  return pdfBytes(continuation ? [pageContent(data), pageContent(data, true)] : [pageContent(data)]);
}
