import { useAuth } from "@/App";
import { Navigate } from "react-router-dom";

export default function LoginPage() {
  const { user, loading } = useAuth();

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-[#FCFBF8]">
        <div className="animate-pulse text-[#2B5336]">Loading...</div>
      </div>
    );
  }

  if (user) {
    return <Navigate to="/dashboard" replace />;
  }

  const handleLogin = () => {
    // REMINDER: DO NOT HARDCODE THE URL, OR ADD ANY FALLBACKS OR REDIRECT URLS, THIS BREAKS THE AUTH
    const redirectUrl = window.location.origin + '/dashboard';
    window.location.href = `https://auth.emergentagent.com/?redirect=${encodeURIComponent(redirectUrl)}`;
  };

  return (
    <div className="min-h-screen flex flex-col items-center justify-center bg-[#FCFBF8] p-4">
      <div className="w-full max-w-md">
        {/* Hero area */}
        <div className="relative mb-8 rounded-xl overflow-hidden h-48">
          <img
            src="https://images.unsplash.com/photo-1680153120659-d36c692a7083?crop=entropy&cs=srgb&fm=jpg&ixid=M3w3NDk1Nzh8MHwxfHNlYXJjaHwzfHxtb2Rlcm4lMjBtb3NxdWUlMjBtaW5pbWFsJTIwYXJjaGl0ZWN0dXJlfGVufDB8fHx8MTc3NzU1NzM0OXww&ixlib=rb-4.1.0&q=85"
            alt="Mosque"
            className="w-full h-full object-cover"
          />
          <div className="absolute inset-0 bg-gradient-to-t from-[#1E2522]/80 to-transparent" />
          <div className="absolute bottom-4 left-4 right-4">
            <h1 className="text-white text-2xl sm:text-3xl font-semibold" style={{ fontFamily: 'Work Sans' }}>
              Salah Time Generator
            </h1>
            <p className="text-white/80 text-sm mt-1">
              Generate accurate prayer times for your masjid
            </p>
          </div>
        </div>

        {/* Login card */}
        <div className="surface-card rounded-lg p-6">
          <p className="text-[#5C6B64] text-sm mb-6 text-center">
            Sign in to manage your masjids and prayer schedules
          </p>
          <button
            data-testid="google-login-btn"
            onClick={handleLogin}
            className="w-full flex items-center justify-center gap-3 bg-[#2B5336] text-white py-3 px-4 rounded-lg hover:bg-[#1E3F20] transition-colors font-medium"
          >
            <svg className="w-5 h-5" viewBox="0 0 24 24">
              <path fill="currentColor" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"/>
              <path fill="currentColor" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"/>
              <path fill="currentColor" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z"/>
              <path fill="currentColor" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"/>
            </svg>
            Sign in with Google
          </button>
        </div>
      </div>
    </div>
  );
}
