import { useState } from "react";
import { useNavigate, Navigate } from "react-router-dom";
import axios from "axios";
import { useAuth, API } from "@/App";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from "@/components/ui/dialog";
import { toast } from "sonner";

export default function LoginPage() {
  const { user, loading, setUser } = useAuth();
  const navigate = useNavigate();
  const [mode, setMode] = useState("login");
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [forgotOpen, setForgotOpen] = useState(false);
  const [forgotEmail, setForgotEmail] = useState("");
  const [forgotSubmitting, setForgotSubmitting] = useState(false);

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-[#FCFBF8]">
        <div className="animate-pulse text-[#2B5336]">Loading...</div>
      </div>
    );
  }

  if (user) return <Navigate to="/dashboard" replace />;

  const handleSubmit = async (e) => {
    e.preventDefault();
    setSubmitting(true);
    try {
      const endpoint = mode === "login" ? "/auth/login" : "/auth/register";
      const payload = mode === "login"
        ? { email, password }
        : { name, email, password };
      const res = await axios.post(`${API}${endpoint}`, payload, { withCredentials: true });
      const { session_token, ...userData } = res.data;
      if (session_token) {
        localStorage.setItem('session_token', session_token);
        axios.defaults.headers.common['Authorization'] = `Bearer ${session_token}`;
      }
      setUser(userData);
      navigate("/dashboard", { replace: true });
    } catch (err) {
      toast.error(err.response?.data?.detail || "Something went wrong");
    } finally {
      setSubmitting(false);
    }
  };

  const handleForgotPassword = async (e) => {
    e.preventDefault();
    if (!forgotEmail.trim()) { toast.error("Please enter your email address"); return; }
    setForgotSubmitting(true);
    try {
      await axios.post(`${API}/auth/forgot-password`, { email: forgotEmail.trim() }, { withCredentials: true });
      toast.success("If that email is registered, a reset link has been sent.");
      setForgotOpen(false);
      setForgotEmail("");
    } catch (err) {
      toast.error(err.response?.data?.detail || "Something went wrong. Please try again.");
    } finally {
      setForgotSubmitting(false);
    }
  };

  return (
    <div className="min-h-screen flex flex-col items-center justify-center bg-[#FCFBF8] p-4">
      <div className="w-full max-w-md">
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

        <div className="surface-card rounded-lg p-6">
          {/* Tabs */}
          <div className="flex mb-6 border border-[#EAE6DD] rounded-lg overflow-hidden">
            <button
              type="button"
              onClick={() => setMode("login")}
              className={`flex-1 py-2 text-sm font-medium transition-colors ${mode === "login" ? "bg-[#2B5336] text-white" : "text-[#5C6B64] hover:bg-[#EAE6DD]/50"}`}
            >
              Sign In
            </button>
            <button
              type="button"
              onClick={() => setMode("register")}
              className={`flex-1 py-2 text-sm font-medium transition-colors ${mode === "register" ? "bg-[#2B5336] text-white" : "text-[#5C6B64] hover:bg-[#EAE6DD]/50"}`}
            >
              Register
            </button>
          </div>

          <form onSubmit={handleSubmit} className="space-y-4">
            {mode === "register" && (
              <div className="space-y-1">
                <Label className="text-sm font-medium text-[#1E2522]">Full Name</Label>
                <Input
                  value={name}
                  onChange={e => setName(e.target.value)}
                  placeholder="Your name"
                  required
                  className="bg-white border-[#EAE6DD]"
                />
              </div>
            )}
            <div className="space-y-1">
              <Label className="text-sm font-medium text-[#1E2522]">Email</Label>
              <Input
                type="email"
                value={email}
                onChange={e => setEmail(e.target.value)}
                placeholder="you@example.com"
                required
                className="bg-white border-[#EAE6DD]"
              />
            </div>
            <div className="space-y-1">
              <Label className="text-sm font-medium text-[#1E2522]">Password</Label>
              <Input
                type="password"
                value={password}
                onChange={e => setPassword(e.target.value)}
                placeholder="Min 6 characters"
                required
                className="bg-white border-[#EAE6DD]"
              />
              {mode === "login" && (
                <button
                  type="button"
                  onClick={() => { setForgotEmail(email); setForgotOpen(true); }}
                  className="mt-1 text-xs text-[#2B5336] hover:underline focus:outline-none"
                >
                  Forgot password?
                </button>
              )}
            </div>
            <button
              type="submit"
              disabled={submitting}
              className="w-full py-3 bg-[#2B5336] text-white rounded-lg hover:bg-[#1E3F20] transition-colors font-medium disabled:opacity-50"
            >
              {submitting ? "Please wait..." : mode === "login" ? "Sign In" : "Create Account"}
            </button>
          </form>
        </div>
      </div>

      <Dialog open={forgotOpen} onOpenChange={setForgotOpen}>
        <DialogContent className="max-w-sm">
          <DialogHeader>
            <DialogTitle className="text-[#1E2522]">Reset your password</DialogTitle>
          </DialogHeader>
          <p className="text-sm text-[#5C6B64]">
            Enter your account email and we'll send you a reset link.
          </p>
          <form onSubmit={handleForgotPassword} className="space-y-4">
            <div className="space-y-1">
              <Label className="text-sm font-medium text-[#1E2522]">Email address</Label>
              <Input
                type="email"
                value={forgotEmail}
                onChange={e => setForgotEmail(e.target.value)}
                placeholder="you@example.com"
                required
                className="bg-white border-[#EAE6DD]"
              />
            </div>
            <DialogFooter className="gap-2 sm:gap-0">
              <button
                type="button"
                onClick={() => setForgotOpen(false)}
                className="px-4 py-2 text-sm border border-[#EAE6DD] rounded-lg hover:bg-[#EAE6DD]/50 text-[#1E2522]"
              >
                Cancel
              </button>
              <button
                type="submit"
                disabled={forgotSubmitting}
                className="px-4 py-2 text-sm bg-[#2B5336] text-white rounded-lg hover:bg-[#1E3F20] font-medium disabled:opacity-50"
              >
                {forgotSubmitting ? "Sending..." : "Send Reset Link"}
              </button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>
    </div>
  );
}
