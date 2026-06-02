import { useState, useEffect } from "react";
import { useSearchParams, useNavigate } from "react-router-dom";
import axios from "axios";
import { API } from "@/App";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { toast } from "sonner";

export default function ResetPasswordPage() {
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();
  const token = searchParams.get("token");

  const [newPassword, setNewPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [done, setDone] = useState(false);

  useEffect(() => {
    if (!token) {
      toast.error("Invalid reset link. Please request a new one.");
    }
  }, [token]);

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (newPassword.length < 6) {
      toast.error("Password must be at least 6 characters");
      return;
    }
    if (newPassword !== confirmPassword) {
      toast.error("Passwords do not match");
      return;
    }
    setSubmitting(true);
    try {
      await axios.post(`${API}/auth/reset-password`, { token, new_password: newPassword }, { withCredentials: true });
      setDone(true);
      toast.success("Password updated! Please sign in with your new password.");
    } catch (err) {
      toast.error(err.response?.data?.detail || "Failed to reset password. The link may have expired.");
    } finally {
      setSubmitting(false);
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
              Set a new password for your account
            </p>
          </div>
        </div>

        <div className="surface-card rounded-lg p-6">
          {done ? (
            <div className="text-center space-y-4">
              <div className="w-12 h-12 rounded-full bg-[#2B5336]/10 flex items-center justify-center mx-auto">
                <svg className="w-6 h-6 text-[#2B5336]" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                </svg>
              </div>
              <p className="text-[#1E2522] font-medium" style={{ fontFamily: 'Work Sans' }}>
                Password updated!
              </p>
              <p className="text-sm text-[#5C6B64]">
                Your password has been changed. You can now sign in with your new password.
              </p>
              <button
                onClick={() => navigate("/login", { replace: true })}
                className="w-full py-3 bg-[#2B5336] text-white rounded-lg hover:bg-[#1E3F20] transition-colors font-medium"
              >
                Back to Sign In
              </button>
            </div>
          ) : !token ? (
            <div className="text-center space-y-4">
              <p className="text-sm text-[#5C6B64]">
                This reset link is invalid or missing. Please request a new one.
              </p>
              <button
                onClick={() => navigate("/login", { replace: true })}
                className="w-full py-3 bg-[#2B5336] text-white rounded-lg hover:bg-[#1E3F20] transition-colors font-medium"
              >
                Back to Sign In
              </button>
            </div>
          ) : (
            <>
              <h2 className="text-lg font-semibold text-[#1E2522] mb-6" style={{ fontFamily: 'Work Sans' }}>
                Choose a new password
              </h2>
              <form onSubmit={handleSubmit} className="space-y-4">
                <div className="space-y-1">
                  <Label className="text-sm font-medium text-[#1E2522]">New Password</Label>
                  <Input
                    type="password"
                    value={newPassword}
                    onChange={e => setNewPassword(e.target.value)}
                    placeholder="Min 6 characters"
                    required
                    className="bg-white border-[#EAE6DD]"
                  />
                </div>
                <div className="space-y-1">
                  <Label className="text-sm font-medium text-[#1E2522]">Confirm New Password</Label>
                  <Input
                    type="password"
                    value={confirmPassword}
                    onChange={e => setConfirmPassword(e.target.value)}
                    placeholder="Re-enter new password"
                    required
                    className="bg-white border-[#EAE6DD]"
                  />
                </div>
                <button
                  type="submit"
                  disabled={submitting}
                  className="w-full py-3 bg-[#2B5336] text-white rounded-lg hover:bg-[#1E3F20] transition-colors font-medium disabled:opacity-50"
                >
                  {submitting ? "Updating..." : "Update Password"}
                </button>
                <button
                  type="button"
                  onClick={() => navigate("/login", { replace: true })}
                  className="w-full py-2 text-sm text-[#5C6B64] hover:text-[#1E2522] transition-colors"
                >
                  Back to Sign In
                </button>
              </form>
            </>
          )}
        </div>
      </div>
    </div>
  );
}
