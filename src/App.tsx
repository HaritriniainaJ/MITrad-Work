// admin route test
import React from "react";
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
import Analytics from "@/pages/Analytics";
import NewTrade from "@/pages/NewTrade";
import TradeHistory from "@/pages/TradeHistory";
import CalendarPage from "@/pages/CalendarPage";
import DailyAnalysis from "@/pages/DailyAnalysis";
import Profile from "@/pages/Profile";
import CoachAlphaPage from "@/pages/CoachAlphaPage";
import Settings from "@/pages/Settings";
import TradingPlan from "@/pages/TradingPlan";
import Successes from "@/pages/Successes";
import Objectives from "@/pages/Objectives";
import Import from "@/pages/Import";
import Support from "@/pages/Support";
import NotFound from '@/pages/NotFound';
import ShareReport from '@/pages/ShareReport';
import Admin from '@/pages/Admin';

const queryClient = new QueryClient();

function DiscordCallback() {
  React.useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    const token = params.get('token');
    const userStr = params.get('user');
    if (token && userStr) {
      try {
        const user = JSON.parse(decodeURIComponent(userStr));
        localStorage.setItem('mitrad_token', token);
        localStorage.setItem('mitrad_user', JSON.stringify(user));
        window.location.replace('/analytics');
      } catch (e) {
        console.error('Discord callback error:', e);
      }
    }
  }, []);
  return null;
}

function ProtectedRoute({ children }: { children: React.ReactNode }) {
  const { user } = useAuth();
  if (!user) return <Navigate to="/login" replace />;
  return <Layout>{children}</Layout>;
}

function AppRoutes() {
  const { user } = useAuth();

  return (
    <Routes>
      <Route path="/login" element={<><DiscordCallback />{user ? <Navigate to="/analytics" replace /> : <Login />}</>} />
      <Route path="/" element={<Navigate to={user ? "/analytics" : "/login"} replace />} />

      <Route path="/analytics"      element={<ProtectedRoute><Analytics /></ProtectedRoute>} />
      <Route path="/new-trade"      element={<ProtectedRoute><NewTrade /></ProtectedRoute>} />
      <Route path="/history"        element={<ProtectedRoute><TradeHistory /></ProtectedRoute>} />
      <Route path="/calendar"       element={<ProtectedRoute><CalendarPage /></ProtectedRoute>} />
      <Route path="/daily-analysis" element={<ProtectedRoute><DailyAnalysis /></ProtectedRoute>} />
      <Route path="/profile"        element={<ProtectedRoute><Profile /></ProtectedRoute>} />
      <Route path="/coach"          element={<ProtectedRoute><CoachAlphaPage /></ProtectedRoute>} />
      <Route path="/settings"       element={<ProtectedRoute><Settings /></ProtectedRoute>} />
      <Route path="/trading-plan"   element={<ProtectedRoute><TradingPlan /></ProtectedRoute>} />
      <Route path="/successes"      element={<ProtectedRoute><Successes /></ProtectedRoute>} />
      <Route path="/objectives"     element={<ProtectedRoute><Objectives /></ProtectedRoute>} />
      <Route path="/import"         element={<ProtectedRoute><Import /></ProtectedRoute>} />
      <Route path="/support"        element={<ProtectedRoute><Support /></ProtectedRoute>} />

      <Route path="/share/:token" element={<ShareReport />} />
      <Route path="/admin" element={<ProtectedRoute><Admin /></ProtectedRoute>} />
      <Route path="*" element={<NotFound />} />
    </Routes>
  );
}

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