import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import axios from "axios";
import { API } from "@/App";
import { Building2, Clock, FileText, Plus } from "lucide-react";

export default function Dashboard() {
  const [stats, setStats] = useState(null);
  const navigate = useNavigate();

  useEffect(() => {
    const fetchStats = async () => {
      try {
        const res = await axios.get(`${API}/dashboard/stats`, { withCredentials: true });
        setStats(res.data);
      } catch (err) {
        console.error("Failed to fetch stats:", err);
      }
    };
    fetchStats();
  }, []);

  const statCards = [
    { label: "Total Masjids", value: stats?.masjid_count || 0, icon: Building2, color: "#2B5336" },
    { label: "Waqth Charts", value: stats?.chart_count || 0, icon: Clock, color: "#C27A62" },
    { label: "Salah Configs", value: stats?.config_count || 0, icon: FileText, color: "#D4A373" },
  ];

  return (
    <div data-testid="dashboard-page" className="animate-slide-in">
      <div className="mb-8">
        <h1 className="text-2xl sm:text-3xl font-semibold text-[#1E2522]" style={{ fontFamily: 'Work Sans' }}>
          Dashboard
        </h1>
        <p className="text-sm text-[#5C6B64] mt-1">
          Overview of your salah time management
        </p>
      </div>

      {/* Stats Grid */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 mb-8 stagger-children">
        {statCards.map(({ label, value, icon: Icon, color }) => (
          <div key={label} className="surface-card rounded-lg p-5">
            <div className="flex items-center justify-between mb-3">
              <span className="text-xs uppercase tracking-wider text-[#5C6B64]">{label}</span>
              <Icon className="w-5 h-5" style={{ color }} />
            </div>
            <p className="text-3xl font-semibold text-[#1E2522] font-tabular">{value}</p>
          </div>
        ))}
      </div>

      {/* Quick Actions */}
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 mb-8">
        <button
          data-testid="quick-add-masjid"
          onClick={() => navigate("/masjids/add")}
          className="surface-card rounded-lg p-5 text-left group"
        >
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-lg bg-[#2B5336]/10 flex items-center justify-center group-hover:bg-[#2B5336]/20 transition-colors">
              <Plus className="w-5 h-5 text-[#2B5336]" />
            </div>
            <div>
              <p className="text-sm font-medium text-[#1E2522]">Add New Masjid</p>
              <p className="text-xs text-[#5C6B64]">Register a new masjid</p>
            </div>
          </div>
        </button>
        <button
          data-testid="quick-add-waqth"
          onClick={() => navigate("/waqth-charts/add")}
          className="surface-card rounded-lg p-5 text-left group"
        >
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-lg bg-[#C27A62]/10 flex items-center justify-center group-hover:bg-[#C27A62]/20 transition-colors">
              <Plus className="w-5 h-5 text-[#C27A62]" />
            </div>
            <div>
              <p className="text-sm font-medium text-[#1E2522]">Add Waqth Chart</p>
              <p className="text-xs text-[#5C6B64]">Upload or create prayer time chart</p>
            </div>
          </div>
        </button>
      </div>

      {/* Recent Masjids */}
      {stats?.recent_masjids?.length > 0 && (
        <div>
          <h2 className="text-lg font-semibold text-[#1E2522] mb-3" style={{ fontFamily: 'Work Sans' }}>
            Recent Masjids
          </h2>
          <div className="space-y-2">
            {stats.recent_masjids.map((masjid) => (
              <button
                key={masjid.masjid_id}
                data-testid={`recent-masjid-${masjid.masjid_id}`}
                onClick={() => navigate(`/masjids/${masjid.masjid_id}`)}
                className="w-full surface-card rounded-lg p-4 text-left flex items-center justify-between"
              >
                <div>
                  <p className="text-sm font-medium text-[#1E2522]">{masjid.name}</p>
                  {masjid.location_link && (
                    <p className="text-xs text-[#5C6B64] truncate max-w-[200px]">{masjid.location_link}</p>
                  )}
                </div>
                <svg className="w-4 h-4 text-[#5C6B64]" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                </svg>
              </button>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
