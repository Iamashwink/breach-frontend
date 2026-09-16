import React from 'react';
import { GameProvider, useGame } from './context/GameContext';
import { Header } from './components/Header';
import { StatusPanel } from './components/StatusPanel';
import { GateView } from './components/GateView';
import { LandingView } from './components/LandingView';
import { DashboardView } from './components/DashboardView';
import { TeamView } from './components/TeamView';
import { NodeMap } from './components/NodeMap';
import { PathTrail } from './components/PathTrail';
import { ChallengeView } from './components/ChallengeView';
import { ConvergenceTerminal } from './components/ConvergenceTerminal';
import { LeaderboardView } from './components/LeaderboardView';
import { BriefingModal } from './components/BriefingModal';
import { MainStoryModal } from './components/MainStoryModal';
import { StoryNarrationModal } from './components/StoryNarrationModal';
import { TourModal } from './components/TourModal';
import { ToastBanner } from './components/ToastBanner';
import { TimeGlitch } from './components/TimeGlitch';

const AppContent: React.FC = () => {
  const { currentView, currentUser, glitchEndsAt, clearGlitch } = useGame();

  // Unauthenticated: combined gate + login landing (read-only gate stays separate)
  if (!currentUser && currentView !== 'GATE') {
    return (
      <div className="min-h-screen bg-[#07090F] font-mono">
        <LandingView />
        <TourModal />
        <ToastBanner />
      </div>
    );
  }

  if (currentView === 'GATE') {
    return (
      <div className="min-h-screen bg-[#07090F] font-mono">
        <GateView />
        <BriefingModal />
        <TourModal />
        <ToastBanner />
      </div>
    );
  }

  if (currentView === 'LOGIN') {
    return (
      <div className="min-h-screen bg-[#07090F] font-mono">
        <LandingView />
        <TourModal />
        <ToastBanner />
      </div>
    );
  }

  const renderCurrentView = () => {
    switch (currentView) {
      case 'DASHBOARD': return <DashboardView />;
      case 'TEAM': return <TeamView />;
      case 'MAP': return <NodeMap />;
      case 'TRAIL': return <PathTrail />;
      case 'CHALLENGE': return <ChallengeView />;
      case 'CONVERGENCE': return <ConvergenceTerminal />;
      case 'BOARD': return <LeaderboardView />;
      default: return <DashboardView />;
    }
  };

  return (
    <div className="soot min-h-screen bg-[#07090F] text-[#D5DBE7] flex flex-col lg:flex-row font-mono gap-0 p-0 m-0">
      <Header />
      <div className="flex-1 flex flex-col min-w-0 gap-0 p-0 m-0">
        <StatusPanel />
        <main className="flex-1 flex flex-col gap-0 p-0 m-0">
          {renderCurrentView()}
        </main>
      </div>
      <BriefingModal />
      <MainStoryModal />
      <StoryNarrationModal />
      <TourModal />
      <ToastBanner />
      {/* time-glitch takeover → HUD bar → reset pulse at T−0 */}
      <TimeGlitch
        active={glitchEndsAt !== null}
        endsAt={glitchEndsAt ?? 0}
        sample={{ original: 500, decayed: 300 }}
        onReset={() => {
          // Let the reset pulse play out before standing the component down.
          window.setTimeout(() => clearGlitch(), 2000);
        }}
      />
    </div>
  );
};

export default function App() {
  return (
    <GameProvider>
      <AppContent />
    </GameProvider>
  );
}
