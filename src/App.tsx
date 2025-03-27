import { useEffect } from "react";
import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Routes, Route, Navigate, useLocation } from "react-router-dom";
import AuthCallback from "./components/auth/AuthCallback";
import AuthScreen from "./components/AuthScreen";
import { useAuthState } from "./hooks/useAuthState";
import LoadingSpinner from "./components/LoadingSpinner";
import Index from "./pages/index";


const queryClient = new QueryClient();

const ProtectedRoute = ({ children }: { children: JSX.Element }) => {
  const { isAuthenticated, isLoading } = useAuthState();
  const location = useLocation();

  if (isLoading) return <LoadingSpinner />;

  if (!isAuthenticated) {
    return <Navigate to="/signin" state={{ from: location }} replace />;
  }

  return children;
};

const disableDevTools = () => {
  // Disable right-click
  window.addEventListener("contextmenu", (e) => e.preventDefault());

  // Disable F12 and Ctrl+Shift+I
  window.addEventListener("keydown", (e) => {
    if (
      e.key === "F12" || 
      (e.ctrlKey && (e.key === "I" || e.key === "U" || e.key === "S")) || 
      (e.shiftKey && e.ctrlKey && e.key === "I")
    ) {
      e.preventDefault();
    }
  });

  // Detect DevTools
  const devToolsCheck = setInterval(() => {
    if (window.outerWidth - window.innerWidth > 250 || window.outerHeight - window.innerHeight > 250) {
      alert("Developer tools detected! The page will now reload.");
      window.location.reload();
    }
  }, 1000);

  // Cleanup
  return () => {
    clearInterval(devToolsCheck);
    window.removeEventListener("contextmenu", (e) => e.preventDefault());
    window.removeEventListener("keydown", (e) => {
      if (
        e.key === "F12" || 
        (e.ctrlKey && (e.key === "I" || e.key === "U" || e.key === "S")) || 
        (e.shiftKey && e.ctrlKey && e.key === "I")
      ) {
        e.preventDefault();
      }
    });
  };
};

const App = () => {
  useEffect(() => {
    const cleanup = disableDevTools();
    return cleanup; // Cleanup when unmounting
  }, []);

  return (
    <QueryClientProvider client={queryClient}>
      <TooltipProvider>
        <Toaster />
        <Sonner />
        <BrowserRouter>
          <Routes>
            {/* Public Routes */}
            <Route path="/auth/callback" element={<AuthCallback />} />
            <Route path="/signin" element={<AuthScreen onLogin={() => {}} />} />

            {/* Protected Routes */}
            <Route path="/" element={<ProtectedRoute><Index /></ProtectedRoute>} />
            <Route path="/chat/:sessionId" element={<ProtectedRoute><Index /></ProtectedRoute>} />
          </Routes>
        </BrowserRouter>
      </TooltipProvider>
    </QueryClientProvider>
  );
};

export default App;

