import Link from "next/link";
import { ArrowLeft, Building2 } from "lucide-react";

export function AuthShell({ children }: { children: React.ReactNode }) {
  return (
    <main className="relative grid min-h-screen place-items-center overflow-hidden bg-[#f7f8fc] px-5 py-12">
      <div className="absolute left-[-12rem] top-[-8rem] size-[28rem] rounded-full bg-[#e6e6ff] blur-3xl" />
      <div className="absolute bottom-[-12rem] right-[-10rem] size-[28rem] rounded-full bg-[#e3f5ef] blur-3xl" />
      <div className="relative w-full max-w-md">
        <Link href="/" className="mb-7 flex items-center justify-center gap-2.5">
          <span className="grid size-10 place-items-center rounded-xl bg-[#5656ce] text-white"><Building2 className="size-5" /></span>
          <span className="font-display text-xl tracking-[-0.045em]">bhada</span>
        </Link>
        <div className="rounded-[26px] border border-white bg-white p-7 shadow-[0_24px_80px_rgba(35,40,60,.1)] sm:p-9">{children}</div>
        <Link href="/sign-in" className="mt-6 flex items-center justify-center gap-2 text-xs font-bold text-[#7d8493] hover:text-[#5555c7]"><ArrowLeft className="size-3.5" /> Back to sign in</Link>
      </div>
    </main>
  );
}
