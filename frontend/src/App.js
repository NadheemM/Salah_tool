import { useState, useEffect, useCallback, createContext, useContext } from "react";
import "@/App.css";
import { BrowserRouter, Routes, Route, Navigate, useLocation, useNavigate } from "react-router-dom";
import axios from "axios";
import LoginPage from "@/pages/LoginPage";
import Dashboard from "@/pages/Dashboard";
import MasjidList from "@/pages/MasjidList";
import AddMasjid from "@/pages/AddMasjid";
import MasjidDetail from "@/pages/MasjidDetail";
import WaqthCharts from "@/pages/WaqthCharts";
import AddWaqthChart from "@/pages/AddWaqthChart";
import WaqthChartDetail from "@/pages/WaqthChartDetail";
import Sidebar from "@/components/Sidebar";
import { Toaster } from "@/components/ui/sonner";

const BACKEND_URL = process.env.REACT_APP_BACKEND_URL;
const API = `${BACKEND_URL}/api`;

// Auth Context
const AuthContext = createContext(null);

export const useAuth = () => useContext(AuthContext);
export { API };

function AuthProvider({ children }) {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);

  const checkAuth = useCallback(async () => {
    const token = localStorage.getItem('session_token');
    if (token) {
      axios.defaults.headers.common['Authorization'] = `Bearer ${token}`;
    }
    try {
      const response = await axios.get(`${API}/auth/me`, { withCredentials: true });
      setUser(response.data);
    } catch {
      setUser(null);
      localStorage.removeItem('session_token');
      delete axios.defaults.headers.common['Authorization'];
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    checkAuth();
  }, [checkAuth]);

  const logout = async () => {
    try {
      await axios.post(`${API}/auth/logout`, {}, { withCredentials: true });
    } catch {}
    setUser(null);
    localStorage.removeItem('session_token');
    delete axios.defaults.headers.common['Authorization'];
  };

  return (
    <AuthContext.Provider value={{ user, setUser, loading, logout, checkAuth }}>
      {children}
    </AuthContext.Provider>
  );
}

function ProtectedRoute({ children }) {
  const { user, loading } = useAuth();
  const location = useLocation();

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-[#FCFBF8]">
        <div className="animate-pulse text-[#2B5336] font-medium">Loading...</div>
      </div>
    );
  }

  if (!user) {
    return <Navigate to="/login" state={{ from: location }} replace />;
  }

  return children;
}

function AppLayout({ children }) {
  const [sidebarOpen, setSidebarOpen] = useState(false);

  return (
    <div className="min-h-screen bg-[#FCFBF8] flex">
      <Sidebar open={sidebarOpen} onClose={() => setSidebarOpen(false)} />
      <main className="flex-1 min-h-screen md:ml-64">
        <header className="glass-header sticky top-0 z-30 px-4 py-3 md:px-6 flex items-center">
          <button
            data-testid="mobile-menu-btn"
            className="md:hidden mr-3 p-2 rounded-md hover:bg-[#EAE6DD] transition-colors"
            onClick={() => setSidebarOpen(true)}
          >
            <svg className="w-5 h-5 text-[#1E2522]" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6h16M4 12h16M4 18h16" />
            </svg>
          </button>
          <div className="flex-1" />
        </header>
        <div className="p-4 sm:p-6 md:p-8">
          {children}
        </div>
      </main>
    </div>
  );
}

function AppRouter() {
  return (
    <Routes>
      <Route path="/login" element={<LoginPage />} />
      <Route path="/dashboard" element={
        <ProtectedRoute>
          <AppLayout><Dashboard /></AppLayout>
        </ProtectedRoute>
      } />
      <Route path="/masjids" element={
        <ProtectedRoute>
          <AppLayout><MasjidList /></AppLayout>
        </ProtectedRoute>
      } />
      <Route path="/masjids/add" element={
        <ProtectedRoute>
          <AppLayout><AddMasjid /></AppLayout>
        </ProtectedRoute>
      } />
      <Route path="/masjids/:id" element={
        <ProtectedRoute>
          <AppLayout><MasjidDetail /></AppLayout>
        </ProtectedRoute>
      } />
      <Route path="/waqth-charts" element={
        <ProtectedRoute>
          <AppLayout><WaqthCharts /></AppLayout>
        </ProtectedRoute>
      } />
      <Route path="/waqth-charts/add" element={
        <ProtectedRoute>
          <AppLayout><AddWaqthChart /></AppLayout>
        </ProtectedRoute>
      } />
      <Route path="/waqth-charts/:chartId" element={
        <ProtectedRoute>
          <AppLayout><WaqthChartDetail /></AppLayout>
        </ProtectedRoute>
      } />
      <Route path="/" element={<Navigate to="/dashboard" replace />} />
      <Route path="*" element={<Navigate to="/dashboard" replace />} />
    </Routes>
  );
}

function App() {
  return (
    <BrowserRouter>
      <AuthProvider>
        <AppRouter />
        <Toaster />
      </AuthProvider>
    </BrowserRouter>
  );
}

export default App;
