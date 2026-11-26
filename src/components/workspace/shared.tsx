

export const statusStyles: Record<string, string> = {
  Paid: "border border-[#6f927f]/40 bg-[#6f927f]/10 text-[#9bc4ab]",
  Pending: "border border-[#e4c77a]/40 bg-[#e4c77a]/10 text-[#e4c77a]",
  Overpaid: "border border-[#9aa9c4]/40 bg-[#9aa9c4]/10 text-[#b8c5dd]",
  Overdue: "border border-[#c96a4e]/40 bg-[#c96a4e]/10 text-[#df8a70]",
  Upcoming: "border border-white/15 bg-white/5 text-white/60",
};

export const propertyColors = [
  { backgroundColor: "#eeeefd", color: "#5b5bd6", borderColor: "#ddddef" },
  { backgroundColor: "#e6f6f2", color: "#168b79", borderColor: "#d1ebe4" },
  { backgroundColor: "#fff1df", color: "#bd7335", borderColor: "#f4e1c9" },
  { backgroundColor: "#f9e9f0", color: "#a85f7c", borderColor: "#edd6e0" },
  { backgroundColor: "#e8f0fb", color: "#4776bd", borderColor: "#d4e1f3" },
] as const;

export function propertyColor(id: string) {
  const index =
    Array.from(id).reduce((total, character) => total + character.charCodeAt(0), 0) %
    propertyColors.length;
  return propertyColors[index];
}

export const formatInr = (value: number) =>
  new Intl.NumberFormat("en-IN", {
    style: "currency",
    currency: "INR",
    maximumFractionDigits: 0,
  }).format(value);

export function Field({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <label className="block">
      <span className="mb-2 block text-xs font-semibold text-white/65">{label}</span>
      {children}
    </label>
  );
}

export const inputClass = "h-11 w-full rounded-none border border-white/[0.09] bg-white/[0.018] px-3.5 text-sm text-[#edede8]/85 outline-none transition-[border-color,background-color,color] placeholder:text-white/25 focus:border-white/20 focus:bg-white/[0.028] focus:ring-0 aria-invalid:border-[#c96a4e]/55";

export const meterReadingFormatter = new Intl.NumberFormat("en-IN", {
  maximumFractionDigits: 3,
});

export function formatMeterReading(value: number | string) {
  const reading = Number(value);
  return Number.isFinite(reading) ? meterReadingFormatter.format(reading) : "—";
}

export function FieldError({ message }: { message: string }) {
  return <p className="mt-1.5 text-xs font-medium text-[#c65c4d]">{message}</p>;
}
