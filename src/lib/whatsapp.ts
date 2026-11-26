// Click-to-chat WhatsApp links. No WhatsApp Business API, no cost: the landlord's
// own WhatsApp opens with the message ready, and they press send.

// Same output as formatCurrency in utils, kept local so this file has no
// path-alias imports and can be unit-tested directly with Node.
const formatCurrency = (value: number) =>
  new Intl.NumberFormat("en-IN", { style: "currency", currency: "INR", minimumFractionDigits: 0, maximumFractionDigits: 2 }).format(value);

export type MessageLanguage = "en" | "hi" | "gu";

/** Returns an international number without "+" (e.g. 919876543210), or null. */
export function whatsappNumber(phone: string | null | undefined) {
  const digits = (phone ?? "").replace(/\D/g, "");
  if (/^[6-9]\d{9}$/.test(digits)) return `91${digits}`;
  if (/^0[6-9]\d{9}$/.test(digits)) return `91${digits.slice(1)}`;
  if (/^91[6-9]\d{9}$/.test(digits)) return digits;
  // Other country codes: accept 11–15 digit international numbers as typed.
  if (/^[1-9]\d{10,14}$/.test(digits) && !digits.startsWith("91")) return digits;
  return null;
}

export function whatsappLink(phone: string | null | undefined, text: string) {
  const number = whatsappNumber(phone);
  return `https://wa.me/${number ?? ""}?text=${encodeURIComponent(text)}`;
}

function shortDate(value: string, language: MessageLanguage) {
  if (!value) return "";
  const locale = language === "en" ? "en-IN" : `${language}-IN`;
  return new Intl.DateTimeFormat(locale, { day: "numeric", month: "short", timeZone: "Asia/Kolkata" })
    .format(new Date(`${value}T12:00:00+05:30`));
}

export function reminderMessage({
  tenantName,
  landlordName,
  amount,
  dueDate,
  overdue,
  billUrl,
  upiId,
  language = "en",
}: {
  tenantName: string;
  landlordName: string;
  amount: number;
  dueDate?: string;
  overdue: boolean;
  billUrl?: string;
  upiId?: string;
  language?: MessageLanguage;
}) {
  const firstName = tenantName.trim().split(/\s+/)[0] || tenantName;
  const money = formatCurrency(amount);
  const date = dueDate ? shortDate(dueDate, language) : "";

  if (language === "hi") {
    return [
      `नमस्ते ${firstName} जी,`,
      overdue
        ? `आपका किराया ${money}${date ? ` (${date} तक देय था)` : ""} अभी बाकी है।`
        : `याद दिला रहे हैं: आपका किराया ${money}${date ? ` ${date} तक` : ""} देय है।`,
      billUrl ? `बिल देखें और UPI से भुगतान करें: ${billUrl}` : "",
      !billUrl && upiId ? `UPI: ${upiId}` : "",
      `धन्यवाद,\n${landlordName}`,
    ].filter(Boolean).join("\n\n");
  }

  if (language === "gu") {
    return [
      `નમસ્તે ${firstName},`,
      overdue
        ? `તમારું ભાડું ${money}${date ? ` (${date} સુધીમાં ભરવાનું હતું)` : ""} હજી બાકી છે.`
        : `યાદ અપાવીએ છીએ: તમારું ભાડું ${money}${date ? ` ${date} સુધીમાં` : ""} ભરવાનું છે.`,
      billUrl ? `બિલ જુઓ અને UPIથી ચૂકવો: ${billUrl}` : "",
      !billUrl && upiId ? `UPI: ${upiId}` : "",
      `આભાર,\n${landlordName}`,
    ].filter(Boolean).join("\n\n");
  }

  return [
    `Hi ${firstName},`,
    overdue
      ? `A gentle reminder that rent of ${money}${date ? ` was due on ${date}` : " is overdue"}.`
      : `A friendly reminder that rent of ${money} is due${date ? ` on ${date}` : ""}.`,
    billUrl ? `View the bill and pay by UPI: ${billUrl}` : "",
    !billUrl && upiId ? `UPI: ${upiId}` : "",
    `Thank you,\n${landlordName}`,
  ].filter(Boolean).join("\n\n");
}

export function receiptMessage({
  tenantName,
  landlordName,
  amount,
  receiptUrl,
  language = "en",
}: {
  tenantName: string;
  landlordName: string;
  amount: number;
  receiptUrl: string;
  language?: MessageLanguage;
}) {
  const firstName = tenantName.trim().split(/\s+/)[0] || tenantName;
  const money = formatCurrency(amount);
  if (language === "hi") {
    return `नमस्ते ${firstName} जी,\n\n${money} मिल गए, धन्यवाद! आपकी किराया रसीद (HRA के लिए भी): ${receiptUrl}\n\n${landlordName}`;
  }
  if (language === "gu") {
    return `નમસ્તે ${firstName},\n\n${money} મળી ગયા, આભાર! તમારી ભાડાની રસીદ (HRA માટે પણ): ${receiptUrl}\n\n${landlordName}`;
  }
  return `Hi ${firstName},\n\nReceived ${money}, thank you! Here is your rent receipt (works for HRA too): ${receiptUrl}\n\n${landlordName}`;
}

export function billShareMessage({
  tenantName,
  landlordName,
  label,
  url,
  language = "en",
}: {
  tenantName: string;
  landlordName: string;
  label: string;
  url: string;
  language?: MessageLanguage;
}) {
  const firstName = tenantName.trim().split(/\s+/)[0] || tenantName;
  if (language === "hi") return `नमस्ते ${firstName} जी,\n\nआपका ${label}: ${url}\n\n${landlordName}`;
  if (language === "gu") return `નમસ્તે ${firstName},\n\nતમારું ${label}: ${url}\n\n${landlordName}`;
  return `Hi ${firstName},\n\nHere is your ${label}: ${url}\n\n${landlordName}`;
}
