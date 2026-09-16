import React from 'react';
import { LoginForm } from './LoginForm';

/**
 * Combined entry page: incident headline + event branding on the left,
 * login panel on the right. Stacks vertically on small screens.
 */
export const LandingView: React.FC = () => {
  return (
    <div
      className="min-h-screen bg-[#07090F] text-[#D5DBE7] flex flex-col justify-center"
    >
      <div className="w-full max-w-7xl mx-auto px-6 sm:px-10 py-12 grid grid-cols-1 lg:grid-cols-[1.35fr_1fr] gap-10 lg:gap-14 items-center">
        {/* left — headline + event branding */}
        <section aria-label="Incident gate" className="min-w-0">
          <div className="mt-10">
            <div className="text-[11px] font-semibold tracking-[0.4em] text-[#E0A83E]">AXIOS</div>
            <div className="mt-2 font-display font-bold uppercase leading-none tracking-tight text-[#F2F5FA] text-4xl sm:text-5xl">
              Breach Point
            </div>
            <div className="mt-3 h-px w-24 bg-[#1E2536]" />
            <p className="mt-4 max-w-md text-[12px] leading-relaxed tracking-[0.1em] text-[#8B93A9]">
              AXIOS PRESENTS BREACH POINT — SIGN IN, FORM A CELL, OPEN THE ARCHIVE.
            </p>
          </div>

          <div className="mt-10 text-[12px] text-[#454C61]">→</div>
        </section>

        {/* right — login panel */}
        <section aria-label="Operative login" className="min-w-0">
          <LoginForm />
        </section>
      </div>
    </div>
  );
};
