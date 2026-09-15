import React from 'react';
import { GateHero } from './GateHero';

/**
 * Standalone entry gate route — renders the shared gate content full-page.
 */
export const GateView: React.FC = () => {
  return (
    <div className="min-h-screen bg-[#07090F] text-[#D5DBE7] scan-faint flex flex-col">
      <GateHero />
    </div>
  );
};
