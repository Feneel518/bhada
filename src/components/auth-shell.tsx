import Link from "next/link";
import { ArrowLeft } from "lucide-react";
import { BhadaLogo } from "@/components/brand-logo";

export function AuthShell({ children }: { children: React.ReactNode }) {
  return (
    <main className="relative grid min-h-screen place-items-center overflow-hidden bg-[#f7f8fc] px-5 py-12">
      <div className="absolute left-[-12rem] top-[-8rem] size-[28rem] rounded-full bg-[#e6e6ff] blur-3xl" />
      <div className="absolute bottom-[-12rem] right-[-10rem] size-[28rem] rounded-full bg-[#e3f5ef] blur-3xl" />
      <div className="relative w-full max-w-md">
        <Link href="/" className="mb-7 flex items-center justify-center gap-2.5">
          <BhadaLogo
            markClassName="size-10 text-[#111111]"
            wordmarkClassName="text-xl text-[#202636]"
            accentColor="#B8934A"
          />
        </Link>
        <div className="rounded-[26px] border border-white bg-white p-7 shadow-[0_24px_80px_rgba(35,40,60,.1)] sm:p-9">{children}</div>
        <Link href="/sign-in" className="mt-6 flex items-center justify-center gap-2 text-xs font-bold text-[#7d8493] hover:text-[#5555c7]"><ArrowLeft className="size-3.5" /> Back to sign in</Link>
      </div>
    </main>
  );
}
