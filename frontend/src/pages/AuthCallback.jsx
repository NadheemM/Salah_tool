import { useEffect, useRef } from "react";
import { useNavigate } from "react-router-dom";
import axios from "axios";
import { useAuth, API } from "@/App";

export default function AuthCallback() {
  const hasProcessed = useRef(false);
  const navigate = useNavigate();
  const { setUser } = useAuth();

  useEffect(() => {
    if (hasProcessed.current) return;
    hasProcessed.current = true;

    const hash = window.location.hash;
    const params = new URLSearchParams(hash.substring(1));
    const sessionId = params.get("session_id");

    if (!sessionId) {
      navigate("/login", { replace: true });
      return;
    }

    const exchangeSession = async () => {
      try {
        const response = await axios.post(
          `${API}/auth/session`,
          { session_id: sessionId },
          { withCredentials: true }
        );
        setUser(response.data);
        navigate("/dashboard", { replace: true, state: { user: response.data } });
      } catch (error) {
        console.error("Auth exchange failed:", error);
        navigate("/login", { replace: true });
      }
    };

    exchangeSession();
  }, [navigate, setUser]);

  return (
    <div className="min-h-screen flex items-center justify-center bg-[#FCFBF8]">
      <div className="animate-pulse text-[#2B5336] font-medium">Authenticating...</div>
    </div>
  );
}
