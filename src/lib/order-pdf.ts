import type { OrderDocumentData } from "./order-document";

const W = 595, H = 842, M = 48;
const esc = (value: string) => value.normalize("NFKD").replace(/[^\x20-\x7E]/g, "?").replace(/[\\()]/g, (c) => `\\${c}`);
const money = (value: number, currency: string) => `${currency} ${value.toLocaleString("en-US", { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;
const wrap = (value: string, max: number) => { const lines: string[] = []; let line = ""; for (const word of value.split(/\s+/).filter(Boolean)) { if (line && line.length + word.length + 1 > max) { lines.push(line); line = word; } else line += `${line ? " " : ""}${word}`; } if (line) lines.push(line); return lines.length ? lines : [""]; };
const color = (v: string) => `${v} rg`;
const txt = (v: string, x: number, y: number, size: number, font = "F1", fill = "0.16 0.11 0.13") => `${color(fill)} BT /${font} ${size} Tf 1 0 0 1 ${x} ${y} Tm (${esc(v)}) Tj ET`;
const line = (y: number) => `0.6 w 0.89 0.84 0.86 RG ${M} ${y} m ${W - M} ${y} l S`;
const rect = (x: number, y: number, w: number, h: number, fill = "1 1 1", stroke = "0.89 0.84 0.86") => `0.7 w ${stroke} RG ${fill} rg ${x} ${y} ${w} ${h} re B`;

export function generateOrderPdf(data: OrderDocumentData) {
  const c: string[] = ["1 1 1 rg 0 0 595 842 re f", txt("Y A R A", M, 786, 23, "F2", "0.52 0.08 0.23"), txt("ORDER DOCUMENT", M, 768, 8, "F2", "0.52 0.08 0.23")];
  c.push(rect(M, 700, W - M * 2, 48, "0.98 0.94 0.96"), txt("ORDER", M + 16, 728, 8, "F2", "0.52 0.08 0.23"), txt(data.orderNumber, M + 16, 710, 14, "F2"));
  const date = data.createdAt ? new Intl.DateTimeFormat("en-GB", { dateStyle: "medium", timeStyle: "short", timeZone: "Asia/Colombo" }).format(new Date(data.createdAt)) : "";
  c.push(txt(date, W - M - date.length * 4.2, 728, 8, "F2", "0.52 0.08 0.23"));
  c.push(txt("CUSTOMER", M, 674, 8, "F2", "0.52 0.08 0.23"), txt(data.customerName, M, 652, 16, "F2"));
  let y = 635; if (data.phone) { c.push(txt(data.phone, M, y, 9, "F1", "0.43 0.37 0.40")); y -= 14; } if (data.email) { c.push(txt(data.email, M, y, 9, "F1", "0.43 0.37 0.40")); y -= 14; }
  c.push(txt("DELIVER TO", 330, 674, 8, "F2", "0.52 0.08 0.23")); y = 652; for (const l of data.addressLines.flatMap((v) => wrap(v, 38))) { c.push(txt(l, 330, y, 9)); y -= 13; }
  const sectionY = Math.min(y, 590) - 22; c.push(line(sectionY), txt("ORDER ITEMS", M, sectionY - 23, 8, "F2", "0.52 0.08 0.23"), txt("PRODUCT", M, sectionY - 43, 8, "F2", "0.43 0.37 0.40"), txt("QTY", 410, sectionY - 43, 8, "F2", "0.43 0.37 0.40"), txt("AMOUNT", 478, sectionY - 43, 8, "F2", "0.43 0.37 0.40"));
  y = sectionY - 63; for (const item of data.items) { const lines = wrap(item.name, 44); c.push(txt(lines[0], M, y, 10, "F2"), txt(String(item.quantity), 414, y, 10, "F2", "0.52 0.08 0.23"), txt(money(item.subtotal, data.currency), 478, y, 9)); if (lines[1]) { c.push(txt(lines[1], M, y - 13, 9)); y -= 13; } if (item.sku) { c.push(txt(`SKU ${item.sku}`, M, y - 13, 7, "F1", "0.43 0.37 0.40")); y -= 12; } c.push(line(y - 9)); y -= 25; }
  const totalsTop = y - 4; c.push(rect(330, totalsTop - 126, 217, 126, "0.99 0.98 0.98"), txt("ORDER SUMMARY", 346, totalsTop - 22, 8, "F2", "0.52 0.08 0.23")); let ty = totalsTop - 44; const rows: Array<[string, string]> = [["Subtotal", money(data.subtotal, data.currency)]]; if (data.discount > 0) rows.push(["Discount", `-${money(data.discount, data.currency)}`]); rows.push(["Delivery", data.shipping === 0 ? "Free" : money(data.shipping, data.currency)]); if (data.paymentFee > 0) rows.push(["Processing fee", money(data.paymentFee, data.currency)]); for (const [k, v] of rows) { c.push(txt(k, 346, ty, 9, "F1", "0.43 0.37 0.40"), txt(v, 528 - v.length * 4, ty, 9)); ty -= 17; } c.push(lineAt(ty + 6, 346, 531), txt("TOTAL", 346, ty - 12, 10, "F2", "0.52 0.08 0.23"), txt(money(data.total, data.currency), 528 - money(data.total, data.currency).length * 4.5, ty - 12, 10, "F2", "0.52 0.08 0.23"));
  const payment = data.payment.type === "cod" ? `COLLECT ${money(data.payment.amount ?? data.total, data.currency)}` : data.payment.type === "prepaid" ? "NO PAYMENT TO COLLECT" : data.payment.instruction;
  c.push(rect(M, totalsTop - 126, 267, 70, "0.98 0.94 0.96", "0.52 0.08 0.23"), txt("PAYMENT", M + 16, totalsTop - 78, 8, "F2", "0.52 0.08 0.23"), txt(data.payment.heading, M + 16, totalsTop - 99, 12, "F2", "0.52 0.08 0.23"), txt(payment, M + 16, totalsTop - 116, 8, "F2"));
  if (data.courier || data.trackingNumber) c.push(txt("COURIER / TRACKING", M, 130, 8, "F2", "0.52 0.08 0.23"), txt([data.courier, data.trackingNumber].filter(Boolean).join("  /  "), M, 112, 10));
  c.push(txt(`YARA  /  ${data.orderNumber}`, M, 42, 8, "F1", "0.43 0.37 0.40"));
  return pdfBytes(c.join("\n"));
}
function lineAt(y: number, x1: number, x2: number) { return `0.5 w 0.89 0.84 0.86 RG ${x1} ${y} m ${x2} ${y} l S`; }
function pdfBytes(content: string) { const objects = ["<< /Type /Catalog /Pages 2 0 R >>", "", "", "<< /Type /Font /Subtype /Type1 /BaseFont /Helvetica >>", "<< /Type /Font /Subtype /Type1 /BaseFont /Helvetica-Bold >>"]; const contentId = 6; objects.push(`<< /Length ${content.length} >>\nstream\n${content}\nendstream`); objects.push(`<< /Type /Page /Parent 2 0 R /MediaBox [0 0 ${W} ${H}] /Resources << /Font << /F1 4 0 R /F2 5 0 R >> >> /Contents ${contentId} 0 R >>`); objects[1] = "<< /Type /Pages /Kids [7 0 R] /Count 1 >>"; let output = "%PDF-1.4\n%\xFF\xFF\xFF\xFF\n"; const offsets = [0]; objects.forEach((object, i) => { offsets[i + 1] = output.length; output += `${i + 1} 0 obj\n${object}\nendobj\n`; }); const xref = output.length; output += `xref\n0 ${objects.length + 1}\n0000000000 65535 f \n${offsets.slice(1).map((o) => `${String(o).padStart(10, "0")} 00000 n `).join("\n")}\ntrailer\n<< /Size ${objects.length + 1} /Root 1 0 R >>\nstartxref\n${xref}\n%%EOF`; return new TextEncoder().encode(output); }
