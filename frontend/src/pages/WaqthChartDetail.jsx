import { useState, useEffect } from "react";
import { useParams, useNavigate } from "react-router-dom";
import axios from "axios";
import { API } from "@/App";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { toast } from "sonner";
import { ArrowLeft, Clock } from "lucide-react";

export default function WaqthChartDetail() {
  const { chartId } = useParams();
  const navigate = useNavigate();
  const [chart, setChart] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchChart = async () => {
      try {
        const res = await axios.get(`${API}/waqth-charts/${chartId}`, { withCredentials: true });
        setChart(res.data);
      } catch (err) {
        toast.error("Failed to load chart");
        navigate("/waqth-charts");
      } finally {
        setLoading(false);
      }
    };
    fetchChart();
  }, [chartId, navigate]);

  if (loading) return <div className="animate-pulse text-[#5C6B64] p-8">Loading chart...</div>;
  if (!chart) return null;

  const prayerTimes = chart.prayer_times || [];
  // Get all columns from the data
  const columns = prayerTimes.length > 0 ? Object.keys(prayerTimes[0]) : [];

  return (
    <div data-testid="waqth-chart-detail-page" className="animate-slide-in">
      {/* Header */}
      <div className="flex items-center gap-3 mb-6">
        <button
          data-testid="back-btn"
          onClick={() => navigate("/waqth-charts")}
          className="p-2 rounded-lg hover:bg-[#EAE6DD] transition-colors"
        >
          <ArrowLeft className="w-5 h-5 text-[#5C6B64]" />
        </button>
        <div>
          <h1 className="text-xl sm:text-2xl font-semibold text-[#1E2522]" style={{ fontFamily: 'Work Sans' }}>
            {chart.name}
          </h1>
          <div className="flex items-center gap-2 text-xs text-[#5C6B64] mt-1">
            {chart.district && <span>{chart.district}</span>}
            {chart.state && <span>/ {chart.state}</span>}
            {chart.country && <span>/ {chart.country}</span>}
            <span className="ml-2">{prayerTimes.length} entries</span>
          </div>
        </div>
      </div>

      {/* Data Table */}
      {prayerTimes.length === 0 ? (
        <div className="text-center py-16">
          <Clock className="w-12 h-12 text-[#EAE6DD] mx-auto mb-3" />
          <p className="text-[#5C6B64]">No prayer time data in this chart</p>
        </div>
      ) : (
        <>
          {/* Mobile: Card view */}
          <div className="sm:hidden space-y-3">
            {prayerTimes.map((row, idx) => (
              <div key={idx} className="surface-card rounded-lg p-3">
                <p className="text-xs font-semibold text-[#2B5336] mb-2">
                  Date: {row.date || row.Date || idx + 1}
                </p>
                <div className="grid grid-cols-2 gap-2 text-xs">
                  {columns.filter(c => c.toLowerCase() !== 'date').map(col => (
                    <div key={col}>
                      <span className="text-[#5C6B64] capitalize">{col}</span>
                      <p className="font-tabular text-[#1E2522]">{row[col] || "-"}</p>
                    </div>
                  ))}
                </div>
              </div>
            ))}
          </div>

          {/* Desktop: Table */}
          <div className="hidden sm:block overflow-x-auto">
            <Table>
              <TableHeader>
                <TableRow className="bg-[#2B5336]">
                  {columns.map(col => (
                    <TableHead key={col} className="text-white text-xs font-medium capitalize text-center">
                      {col}
                    </TableHead>
                  ))}
                </TableRow>
              </TableHeader>
              <TableBody>
                {prayerTimes.map((row, idx) => (
                  <TableRow key={idx} className={idx % 2 === 0 ? "bg-white" : "bg-[#FCFBF8]"}>
                    {columns.map(col => (
                      <TableCell key={col} className="text-center font-tabular text-xs text-[#1E2522]">
                        {row[col] || "-"}
                      </TableCell>
                    ))}
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </div>
        </>
      )}
    </div>
  );
}
