"use client";

import { useState } from "react";
import { landingFaqs } from "@/lib/landing-content";

export function LandingFaq() {
  const [open, setOpen] = useState(0);

  return (
    <div className="border-b border-white/10">
      {landingFaqs.map((faq, index) => {
        const isOpen = open === index;
        const answerId = `faq-answer-${index}`;
        return (
          <div key={faq.question} className="border-t border-white/10">
            <button
              type="button"
              aria-expanded={isOpen}
              aria-controls={answerId}
              onClick={() => setOpen(isOpen ? -1 : index)}
              className="group grid w-full grid-cols-[32px_1fr_auto] items-center gap-3 py-6 text-left outline-none transition hover:text-white focus-visible:ring-2 focus-visible:ring-inset focus-visible:ring-[#E4C77A] sm:grid-cols-[40px_1fr_auto] sm:gap-5 sm:py-7"
            >
              <span className="font-display text-sm text-white/25 transition group-hover:text-[#E4C77A]">
                {String(index + 1).padStart(2, "0")}
              </span>
              <span className="text-[15px] font-medium sm:text-lg">{faq.question}</span>
              <span
                aria-hidden="true"
                className="grid size-8 shrink-0 place-items-center border border-white/15 text-lg text-[#E4C77A] transition group-hover:border-[#E4C77A]/50"
              >
                {isOpen ? "−" : "+"}
              </span>
            </button>
            {isOpen && (
              <div id={answerId} className="max-w-2xl pb-7 pl-11 text-sm leading-6 text-white/55 sm:pl-[60px] sm:text-[15px] sm:leading-7">
                {faq.answer}
              </div>
            )}
          </div>
        );
      })}
    </div>
  );
}
