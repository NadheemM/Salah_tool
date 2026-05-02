import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import axios from "axios";
import { API } from "@/App";
import { Plus, Clock, Trash2, MapPin } from "lucide-react";
import { toast } from "sonner";

export default function WaqthCharts() {
  const [charts, setCharts] = useState([]);
  const [loading, setLoading] = useState(true);
  const navigate = useNavigate();

  const fetchCharts = async () => {
    try {
      const res = await axios.get(`${API}/waqth-charts`, { withCredentials: true });
      setCharts(res.data);
    } catch {
      toast.error("Failed to load charts");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { fetchCharts(); }, []);

  const handleDelete = async (e, chartId) => {
    e.stopPropagation();
    if (!window.confirm("Delete this waqth chart?")) return;
    try {
      await axios.delete(`${API}/waqth-charts/${chartId}`, { withCredentials: true });
      toast.success("Chart deleted");
      fetchCharts();
    } catch {
      toast.error("Failed to delete");
    }
  };

  if (loading) {
    return <div className="animate-pulse text-[#5C6B64] p-8">Loading charts...</div>;
  }

  return (
    <div data-testid="waqth-charts-page" className="animate-slide-in">
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-2xl sm:text-3xl font-semibold text-[#1E2522]" style={{ fontFamily: 'Work Sans' }}>
            Waqth Charts
          </h1>
          <p className="text-sm text-[#5C6B64] mt-1">{charts.length} charts available</p>
        </div>
        <button
          data-testid="add-waqth-btn"
          onClick={() => navigate("/waqth-charts/add")}
          className="flex items-center gap-2 bg-[#2B5336] text-white px-4 py-2 rounded-lg hover:bg-[#1E3F20] transition-colors text-sm font-medium"
        >
          <Plus className="w-4 h-4" />
          <span className="hidden sm:inline">Add Chart</span>
        </button>
      </div>

      {charts.length === 0 ? (
        <div className="text-center py-16">
          <Clock className="w-12 h-12 text-[#EAE6DD] mx-auto mb-3" />
          <p className="text-[#5C6B64]">No waqth charts added yet</p>
          <button
            onClick={() => navigate("/waqth-charts/add")}
            className="mt-4 text-sm text-[#2B5336] font-medium hover:underline"
          >
            Add your first chart
          </button>
        </div>
      ) : (
        <div className="space-y-3">
          {charts.map((chart) => (
            <div
              key={chart.chart_id}
              data-testid={`chart-item-${chart.chart_id}`}
              onClick={() => navigate(`/waqth-charts/${chart.chart_id}`)}
              className="surface-card rounded-lg p-4 flex items-center justify-between cursor-pointer"
            >
              <div className="flex items-center gap-3 min-w-0">
                <div className="w-10 h-10 rounded-lg bg-[#C27A62]/10 flex items-center justify-center flex-shrink-0">
                  <Clock className="w-5 h-5 text-[#C27A62]" />
                </div>
                <div className="min-w-0">
                  <p className="text-sm font-medium text-[#1E2522]">{chart.name}</p>
                  <div className="flex items-center gap-2 mt-0.5 flex-wrap">
                    {chart.district && (
                      <span className="text-xs text-[#5C6B64] flex items-center gap-1">
                        <MapPin className="w-3 h-3" /> {chart.district}
                      </span>
                    )}
                    {chart.state && <span className="text-xs text-[#5C6B64]">{chart.state}</span>}
                    {chart.country && <span className="text-xs text-[#5C6B64]">{chart.country}</span>}
                    <span className="text-xs text-[#5C6B64]">
                      {chart.prayer_times?.length || 0} entries
                    </span>
                  </div>
                </div>
              </div>
              <button
                data-testid={`delete-chart-${chart.chart_id}`}
                onClick={(e) => handleDelete(e, chart.chart_id)}
                className="p-2 rounded-lg hover:bg-red-50 text-[#B24C41] transition-colors flex-shrink-0"
              >
                <Trash2 className="w-4 h-4" />
              </button>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
