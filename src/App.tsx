import React from 'react';
import { GameProvider, useGame } from './context/GameContext';
import { Header } from './components/Header';
import { StatusPanel } from './components/StatusPanel';
import { GateView } from './components/GateView';
import { LandingView } from './components/LandingView';
import { TeamGate } from './components/TeamGate';
import { EventWindowView } from './components/EventWindowView';
import { DashboardView } from './components/DashboardView';
import { TeamView } from './components/TeamView';
import { AdminDashboard } from './components/admin/AdminDashboard';
import { AdminEvents } from './components/admin/AdminEvents';
import { AdminChallenges } from './components/admin/AdminChallenges';
import { AdminGlitches } from './components/admin/AdminGlitches';
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

const Shell: React.FC<{ children: React.ReactNode }> = ({ children }) => (
  <div className="min-h-screen bg-[#07090F] font-mono">{children}</div>
);

const BootScreen: React.FC<{ title: string; detail?: string; onRetry?: () => void }> = ({
  title,
  detail,
  onRetry,
}) => (
  <Shell>
    <div className="min-h-screen flex flex-col items-center justify-center gap-4 px-6 text-center">
      <div className="text-[11px] tracking-[0.4em] text-[#5ED6E3]">{title}</div>
      {detail && <p className="max-w-md text-[13px] leading-relaxed text-[#8B93A9]">{detail}</p>}
      {onRetry && (
        <button
          onClick={onRetry}
          className="mt-2 border border-[#1E2536] px-6 py-2.5 text-[11px] tracking-[0.25em] text-[#5A6379] hover:text-[#5ED6E3] cursor-pointer"
        >
          RETRY →
        </button>
      )}
    </div>
  </Shell>
);

const isAdminView = (v: string) => v.startsWith('ADMIN');

const AdminShell: React.FC<{ children: React.ReactNode }> = ({ children }) => (
  <div className="soot min-h-screen bg-[#07090F] text-[#D5DBE7] font-mono">
    {children}
    <ToastBanner />
  </div>
);

const AppContent: React.FC = () => {
  const { phase, bootError, retryBoot, currentView, currentUser, navigateTo, glitchEndsAt, refresh, glitchSample } = useGame();

  // The gate is public lore — readable before a session exists.
  if (currentView === 'GATE') {
    return (
      <Shell>
        <GateView />
        <TourModal />
        <ToastBanner />
      </Shell>
    );
  }

  if (phase === 'loading') return <BootScreen title="ESTABLISHING UPLINK…" />;

  if (phase === 'error') {
    return (
      <BootScreen
        title="UPLINK REFUSED"
        detail={bootError ?? 'The archive did not answer.'}
        onRetry={retryBoot}
      />
    );
  }

  if (phase === 'unauthenticated') {
    return (
      <Shell>
        <LandingView />
        <TourModal />
        <ToastBanner />
      </Shell>
    );
  }

  // Admin console — accessible in any phase as long as the user is authenticated and admin.
  if (isAdminView(currentView) && currentUser?.isAdmin) {
    const renderAdminView = () => {
      switch (currentView) {
        case 'ADMIN_EVENTS': return <AdminEvents />;
        case 'ADMIN_CHALLENGES': return <AdminChallenges />;
        case 'ADMIN_GLITCHES': return <AdminGlitches />;
        default: return <AdminDashboard />;
      }
    };
    return <AdminShell>{renderAdminView()}</AdminShell>;
  }

  // Non-admin trying to access admin routes — bounce to dashboard.
  if (isAdminView(currentView)) {
    navigateTo('DASHBOARD');
    return null;
  }

  // Outside the event window there is nothing to play, but teams can still be
  // formed before the gun — so the lobby yields to the team gate on request.
  if (phase === 'pending' || phase === 'ended') {
    return (
      <Shell>
        {phase === 'pending' && currentView === 'TEAM' ? <TeamGate /> : <EventWindowView state={phase} />}
        <ToastBanner />
      </Shell>
    );
  }

  if (phase === 'no-team') {
    return (
      <Shell>
        <TeamGate />
        <ToastBanner />
      </Shell>
    );
  }

  const renderCurrentView = () => {
    switch (currentView) {
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
        <main className="flex-1 flex flex-col">{renderCurrentView()}</main>
      </div>
      <BriefingModal />
      <MainStoryModal />
      <StoryNarrationModal />
      <TourModal />
      <ToastBanner />
      {/* Glitch windows are scheduled server-side and arrive on the board. When
          one closes, re-read it: decay is live again and every price changes. */}
      <TimeGlitch
        active={glitchEndsAt !== null}
        endsAt={glitchEndsAt ?? 0}
        sample={glitchSample}
        onReset={() => {
          window.setTimeout(() => void refresh(), 1500);
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
