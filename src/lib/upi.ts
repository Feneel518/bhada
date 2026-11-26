// UPI helpers shared by the dashboard, PDF bills and public share pages.
// A UPI ID (VPA) looks like name@bank. NPCI allows letters, digits, dots,
// hyphens and underscores before the handle.
export const UPI_ID_REGEX = /^[a-zA-Z0-9._-]{2,256}@[a-zA-Z][a-zA-Z0-9.-]{1,64}$/;

export function normaliseUpiId(value: string) {
  return value.trim().replace(/\s+/g, "").toLowerCase();
}

export function isValidUpiId(value: string) {
  return UPI_ID_REGEX.test(normaliseUpiId(value));
}

export function upiPayLink({
  upiId,
  payeeName,
  amount,
  note,
}: {
  upiId: string;
  payeeName: string;
  amount?: number;
  note?: string;
}) {
  // The UPI ID is kept unencoded ("@" as is): it only contains safe characters
  // and a few older UPI apps fail to decode "%40".
  const parts = [`pa=${normaliseUpiId(upiId)}`, `pn=${encodeURIComponent(payeeName.slice(0, 50))}`, "cu=INR"];
  if (amount && amount > 0) parts.push(`am=${amount.toFixed(2)}`);
  // Transaction notes longer than ~50 characters are rejected by some apps.
  if (note) parts.push(`tn=${encodeURIComponent(note.slice(0, 50))}`);
  return `upi://pay?${parts.join("&")}`;
}

export async function upiQrDataUrl(link: string) {
  const QRCode = await import("qrcode");
  return QRCode.toDataURL(link, { margin: 1, width: 360, errorCorrectionLevel: "M" });
}
