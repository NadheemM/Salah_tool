import { useState, useEffect, useMemo } from "react";
import { useNavigate } from "react-router-dom";
import axios from "axios";
import { API } from "@/App";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Plus, Building2, MapPin, Trash2, Search, Filter, X } from "lucide-react";
import { toast } from "sonner";

export default function MasjidList() {
  const [masjids, setMasjids] = useState([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState("");
  const [districtFilter, setDistrictFilter] = useState("");
  const [stateFilter, setStateFilter] = useState("");
  const navigate = useNavigate();

  const fetchMasjids = async (search = "") => {
    try {
      const params = search ? `?search=${encodeURIComponent(search)}` : "";
      const res = await axios.get(`${API}/masjids${params}`, { withCredentials: true });
      setMasjids(res.data);
    } catch (err) {
      toast.error("Failed to load masjids");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { fetchMasjids(); }, []);

  useEffect(() => {
    const timer = setTimeout(() => {
      fetchMasjids(searchTerm);
    }, 300);
    return () => clearTimeout(timer);
  }, [searchTerm]);

  const uniqueDistricts = useMemo(() =>
    [...new Set(masjids.map(m => m.district).filter(Boolean))].sort(), [masjids]);
  const uniqueStates = useMemo(() =>
    [...new Set(masjids.map(m => m.state).filter(Boolean))].sort(), [masjids]);

  const displayedMasjids = useMemo(() => masjids.filter(m => {
    if (districtFilter && m.district !== districtFilter) return false;
    if (stateFilter && m.state !== stateFilter) return false;
    return true;
  }), [masjids, districtFilter, stateFilter]);

  const hasActiveFilters = districtFilter || stateFilter;

  const handleDelete = async (e, masjidId) => {
    e.stopPropagation();
    if (!window.confirm("Delete this masjid?")) return;
    try {
      await axios.delete(`${API}/masjids/${masjidId}`, { withCredentials: true });
      toast.success("Masjid deleted");
      fetchMasjids(searchTerm);
    } catch {
      toast.error("Failed to delete");
    }
  };

  if (loading) {
    return <div className="animate-pulse text-[#5C6B64] p-8">Loading masjids...</div>;
  }

  return (
    <div data-testid="masjid-list-page" className="animate-slide-in">
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-2xl sm:text-3xl font-semibold text-[#1E2522]" style={{ fontFamily: 'Work Sans' }}>
            Masjids
          </h1>
          <p className="text-sm text-[#5C6B64] mt-1">
            {displayedMasjids.length}{hasActiveFilters ? ` of ${masjids.length}` : ""} registered
          </p>
        </div>
        <button
          data-testid="add-masjid-btn"
          onClick={() => navigate("/masjids/add")}
          className="flex items-center gap-2 bg-[#2B5336] text-white px-4 py-2 rounded-lg hover:bg-[#1E3F20] transition-colors text-sm font-medium"
        >
          <Plus className="w-4 h-4" />
          <span className="hidden sm:inline">Add Masjid</span>
        </button>
      </div>

      {/* Search */}
      <div className="relative mb-3">
        <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-[#5C6B64]" />
        <Input
          data-testid="masjid-search-input"
          value={searchTerm}
          onChange={(e) => setSearchTerm(e.target.value)}
          placeholder="Search by name or Mihrab ID..."
          className="pl-10 bg-white border-[#EAE6DD]"
        />
      </div>

      {/* Filters */}
      <div className="flex flex-wrap items-center gap-2 mb-4">
        <Filter className="w-4 h-4 text-[#5C6B64] flex-shrink-0" />
        <Select value={districtFilter || "__all__"} onValueChange={v => setDistrictFilter(v === "__all__" ? "" : v)}>
          <SelectTrigger data-testid="district-filter" className="h-8 text-xs bg-white border-[#EAE6DD] w-40">
            <SelectValue placeholder="All Districts" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="__all__">All Districts</SelectItem>
            {uniqueDistricts.map(d => (
              <SelectItem key={d} value={d}>{d}</SelectItem>
            ))}
          </SelectContent>
        </Select>
        <Select value={stateFilter || "__all__"} onValueChange={v => setStateFilter(v === "__all__" ? "" : v)}>
          <SelectTrigger data-testid="state-filter" className="h-8 text-xs bg-white border-[#EAE6DD] w-40">
            <SelectValue placeholder="All States" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="__all__">All States</SelectItem>
            {uniqueStates.map(s => (
              <SelectItem key={s} value={s}>{s}</SelectItem>
            ))}
          </SelectContent>
        </Select>
        {hasActiveFilters && (
          <button
            onClick={() => { setDistrictFilter(""); setStateFilter(""); }}
            className="flex items-center gap-1 px-2 py-1 text-xs text-[#B24C41] hover:bg-red-50 rounded transition-colors"
          >
            <X className="w-3 h-3" /> Clear filters
          </button>
        )}
      </div>

      {displayedMasjids.length === 0 ? (
        <div className="text-center py-16">
          <Building2 className="w-12 h-12 text-[#EAE6DD] mx-auto mb-3" />
          <p className="text-[#5C6B64]">{searchTerm || hasActiveFilters ? "No masjids match your filters" : "No masjids added yet"}</p>
          {!searchTerm && !hasActiveFilters && (
            <button
              onClick={() => navigate("/masjids/add")}
              className="mt-4 text-sm text-[#2B5336] font-medium hover:underline"
            >
              Add your first masjid
            </button>
          )}
        </div>
      ) : (
        <div className="space-y-3">
          {displayedMasjids.map((masjid) => (
            <div
              key={masjid.masjid_id}
              data-testid={`masjid-item-${masjid.masjid_id}`}
              onClick={() => navigate(`/masjids/${masjid.masjid_id}`)}
              className="surface-card rounded-lg p-4 cursor-pointer flex items-center justify-between"
            >
              <div className="flex items-center gap-3 min-w-0">
                <div className="w-10 h-10 rounded-lg bg-[#2B5336]/10 flex items-center justify-center flex-shrink-0">
                  <Building2 className="w-5 h-5 text-[#2B5336]" />
                </div>
                <div className="min-w-0">
                  <p className="text-sm font-medium text-[#1E2522] truncate">{masjid.name}</p>
                  <div className="flex items-center gap-2 mt-0.5 flex-wrap">
                    {(masjid.district || masjid.state) && (
                      <span className="text-xs text-[#5C6B64]">
                        {[masjid.district, masjid.state].filter(Boolean).join(", ")}
                      </span>
                    )}
                    {masjid.location_link && (
                      <span className="flex items-center gap-1 text-xs text-[#5C6B64]">
                        <MapPin className="w-3 h-3" />
                        <span className="truncate max-w-[150px]">{masjid.location_link}</span>
                      </span>
                    )}
                    {masjid.mihrab_masjid_id && (
                      <span className="text-xs text-[#5C6B64]">ID: {masjid.mihrab_masjid_id}</span>
                    )}
                  </div>
                </div>
              </div>
              <button
                data-testid={`delete-masjid-${masjid.masjid_id}`}
                onClick={(e) => handleDelete(e, masjid.masjid_id)}
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
