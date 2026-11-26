// "12,345.50" -> "Twelve thousand three hundred forty-five rupees and fifty paise only"
// using the Indian system (thousand, lakh, crore), as expected on rent receipts.
const ones = [
  "", "one", "two", "three", "four", "five", "six", "seven", "eight", "nine", "ten",
  "eleven", "twelve", "thirteen", "fourteen", "fifteen", "sixteen", "seventeen", "eighteen", "nineteen",
];
const tens = ["", "", "twenty", "thirty", "forty", "fifty", "sixty", "seventy", "eighty", "ninety"];

function belowHundred(value: number) {
  if (value < 20) return ones[value];
  return `${tens[Math.floor(value / 10)]}${value % 10 ? `-${ones[value % 10]}` : ""}`;
}

function belowThousand(value: number) {
  const hundred = Math.floor(value / 100);
  const rest = value % 100;
  return [hundred ? `${ones[hundred]} hundred` : "", rest ? belowHundred(rest) : ""].filter(Boolean).join(" ");
}

function integerWords(value: number): string {
  if (value === 0) return "zero";
  const parts: string[] = [];
  const crore = Math.floor(value / 10_000_000);
  const lakh = Math.floor((value % 10_000_000) / 100_000);
  const thousand = Math.floor((value % 100_000) / 1000);
  const rest = value % 1000;
  if (crore) parts.push(`${integerWords(crore)} crore`);
  if (lakh) parts.push(`${belowHundred(lakh)} lakh`);
  if (thousand) parts.push(`${belowHundred(thousand)} thousand`);
  if (rest) parts.push(belowThousand(rest));
  return parts.join(" ");
}

export function rupeesInWords(amount: number) {
  const paiseTotal = Math.round(Math.abs(amount) * 100);
  const rupees = Math.floor(paiseTotal / 100);
  const paise = paiseTotal % 100;
  const words = `${integerWords(rupees)} rupee${rupees === 1 ? "" : "s"}${paise ? ` and ${belowHundred(paise)} paise` : ""} only`;
  return words.charAt(0).toUpperCase() + words.slice(1);
}
