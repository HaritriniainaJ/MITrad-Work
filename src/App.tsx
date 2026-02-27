// â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€
// APP.TSX "” Routeur principal de MITrad Journal
// MODIFIÉ v2 : Ajout des routes /import et /support
// â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€
import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Routes, Route, Navigate } from "react-router-dom";
import { AuthProvider, useAuth } from "@/context/AuthContext";
import { DisplayModeProvider } from "@/context/DisplayModeContext";
import { ThemeProvider } from "@/context/ThemeContext";
import Layout from "@/components/Layout";
import Login from "@/pages/Login";
import NewTrade from "@/pages/NewTrade";
import TradeHistory from "@/pages/TradeHistory";
import Analytics from "@/pages/Analytics";
import CalendarPage from "@/pages/CalendarPage";
import DailyAnalysis from "@/pages/DailyAnalysis";
// import Leaderboard from "@/pages/Leaderboard";
import Profile from "@/pages/Profile";
import CoachAlphaPage from "@/pages/CoachAlphaPage";
// import Calculator from "@/pages/Calculator";
import Settings from "@/pages/Settings";
import TradingPlan from "@/pages/TradingPlan";
import Successes from "@/pages/Successes";
import Objectives from "@/pages/Objectives";
import Import from "@/pages/Import";           // ← NOUVEAU v2
import Support from "@/pages/Support";         // ← NOUVEAU v2
import NotFound from "@/pages/NotFound";

const queryClient = new QueryClient();

/** Route protégée "” redirige vers /login si non connecté */
function ProtectedRoute({ children }: { children: React.ReactNode }) {
  const { user } = useAuth();
  if (!user) return <Navigate to="/login" replace />;
  return <Layout>{children}</Layout>;
}

/** Composant de routing "” accès Ã  useAuth() ici */
function AppRoutes() {
  const { user } = useAuth();

  return (
    <Routes>
      {/* Auth */}
      <Route path="/login" element={user ? <Navigate to="/analytics" replace /> : <Login />} />
      <Route path="/" element={<Navigate to={user ? "/analytics" : "/login"} replace />} />

      {/* Pages principales */}
      <Route path="/analytics"      element={<ProtectedRoute><Analytics /></ProtectedRoute>} />
      <Route path="/new-trade"      element={<ProtectedRoute><NewTrade /></ProtectedRoute>} />
      <Route path="/history"        element={<ProtectedRoute><TradeHistory /></ProtectedRoute>} />
      <Route path="/calendar"       element={<ProtectedRoute><CalendarPage /></ProtectedRoute>} />
      <Route path="/daily-analysis" element={<ProtectedRoute><DailyAnalysis /></ProtectedRoute>} />
      {/* <Route path="/leaderboard"    element={<ProtectedRoute><Leaderboard /></ProtectedRoute>} /> */}
      <Route path="/profile"        element={<ProtectedRoute><Profile /></ProtectedRoute>} />
      <Route path="/coach"          element={<ProtectedRoute><CoachAlphaPage /></ProtectedRoute>} />
      {/* <Route path="/calculator"     element={<ProtectedRoute><Calculator /></ProtectedRoute>} /> */}
      <Route path="/settings"       element={<ProtectedRoute><Settings /></ProtectedRoute>} />
      <Route path="/trading-plan"   element={<ProtectedRoute><TradingPlan /></ProtectedRoute>} />
      <Route path="/successes"      element={<ProtectedRoute><Successes /></ProtectedRoute>} />
      <Route path="/objectives"     element={<ProtectedRoute><Objectives /></ProtectedRoute>} />

      {/* Nouvelles pages v2 */}
      <Route path="/import"         element={<ProtectedRoute><Import /></ProtectedRoute>} />
      <Route path="/support"        element={<ProtectedRoute><Support /></ProtectedRoute>} />

      {/* 404 */}
      <Route path="*" element={<NotFound />} />
    </Routes>
  );
}

/** Application principale avec tous les providers */
const App = () => (
  <QueryClientProvider client={queryClient}>
    <TooltipProvider>
      <ThemeProvider>
        <DisplayModeProvider>
          <Toaster />
          <Sonner />
          <BrowserRouter>
            <AuthProvider>
              <AppRoutes />
            </AuthProvider>
          </BrowserRouter>
        </DisplayModeProvider>
      </ThemeProvider>
    </TooltipProvider>
  </QueryClientProvider>
);

export default App;

