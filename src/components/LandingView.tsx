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
            <div className="text-[15px] sm:text-[18px] font-bold tracking-[0.45em] text-[#E0A83E]">AXIOS</div>
            <div className="mt-2 font-display font-extrabold uppercase leading-[0.95] tracking-tight text-[#F2F5FA] text-5xl sm:text-6xl lg:text-7xl drop-shadow-[0_2px_12px_rgba(0,0,0,0.6)]">
              Breach Point
            </div>
            <div className="mt-4 h-0.5 w-28 bg-[#2B354C]" />
            <p className="mt-5 max-w-md text-[13.5px] leading-relaxed tracking-[0.08em] text-[#C6CCDA]">
              AXIOS PRESENTS BREACH POINT — SIGN IN, FORM A CELL, OPEN THE ARCHIVE.
            </p>
          </div>
        </section>

        {/* right — login panel */}
        <section aria-label="Operative login" className="min-w-0">
          <LoginForm />
        </section>
      </div>
    </div>
  );
};
