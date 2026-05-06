import { useState, useEffect, useMemo } from "react";
import { useParams, useNavigate } from "react-router-dom";
import axios from "axios";
import { API } from "@/App";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Switch } from "@/components/ui/switch";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { toast } from "sonner";
import { ArrowLeft, Save, Download, FileText, FileSpreadsheet, Pencil, X, Check, Plus, Trash2, Search } from "lucide-react";

const PRAYERS = ["fajr", "sunrise", "zuhr", "asr", "maghrib", "isha"];
const PRAYER_LABELS = { fajr: "Fajr", sunrise: "Sunrise", zuhr: "Zuhr", asr: "Asr", maghrib: "Maghrib", isha: "Isha", jummah: "Jummah" };
const ALL_DISPLAY_PRAYERS = ["fajr", "sunrise", "zuhr", "asr", "maghrib", "isha", "jummah"];

export default function MasjidDetail() {
  const { id } = useParams();
  const navigate = useNavigate();
  const [masjid, setMasjid] = useState(null);
  const [charts, setCharts] = useState([]);
  const [activeChart, setActiveChart] = useState("1");
  const [generatedData, setGeneratedData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [generating, setGenerating] = useState(false);
  const [editing, setEditing] = useState(false);
  const [editForm, setEditForm] = useState({});
  const [newMember, setNewMember] = useState({ name: "", number: "", address: "" });
  const [dateFilter, setDateFilter] = useState("");
  const [chartColumns, setChartColumns] = useState([]);

  // Config state for chart 1 and 2
  const [configForm, setConfigForm] = useState({
    1: { waqth_chart_id: "", adjustments: {} },
    2: { waqth_chart_id: "", adjustments: {} }
  });

  useEffect(() => {
    const fetchData = async () => {
      try {
        const [masjidRes, chartsRes, configsRes] = await Promise.all([
          axios.get(`${API}/masjids/${id}`, { withCredentials: true }),
          axios.get(`${API}/waqth-charts`, { withCredentials: true }),
          axios.get(`${API}/salah-configs/${id}`, { withCredentials: true })
        ]);
        setMasjid(masjidRes.data);
        setCharts(chartsRes.data);

        const newForm = { 1: { waqth_chart_id: "", adjustments: {} }, 2: { waqth_chart_id: "", adjustments: {} } };
        configsRes.data.forEach(cfg => {
          const num = cfg.chart_number;
          newForm[num] = {
            waqth_chart_id: cfg.waqth_chart_id || "",
            adjustments: cfg.adjustments || {}
          };
        });
        setConfigForm(newForm);
      } catch (err) {
        toast.error("Failed to load masjid details");
        navigate("/masjids");
      } finally {
        setLoading(false);
      }
    };
    fetchData();
  }, [id, navigate]);

  // Fetch chart columns when waqth chart is selected
  const fetchChartColumns = async (chartId) => {
    if (!chartId) return;
    try {
      const res = await axios.get(`${API}/waqth-charts/${chartId}/columns`, { withCredentials: true });
      setChartColumns(res.data.columns || []);
    } catch {}
  };

  // Only show prayers that have at least one non-empty azan in the generated data
  const displayPrayers = useMemo(() => {
    if (!generatedData || generatedData.length === 0) return ALL_DISPLAY_PRAYERS;
    return ALL_DISPLAY_PRAYERS.filter(p => generatedData.some(row => row[`${p}_azan`]));
  }, [generatedData]);

  // Filtered generated data
  const filteredData = useMemo(() => {
    if (!generatedData) return [];
    if (!dateFilter) return generatedData;
    return generatedData.filter(row => 
      String(row.date || "").toLowerCase().includes(dateFilter.toLowerCase())
    );
  }, [generatedData, dateFilter]);

  const startEditing = () => {
    setEditForm({
      name: masjid.name || "",
      district: masjid.district || "",
      state: masjid.state || "",
      masjid_address: masjid.masjid_address || "",
      location_link: masjid.location_link || "",
      imam: masjid.imam || "",
      imam_number: masjid.imam_number || "",
      muaddin: masjid.muaddin || "",
      muaddin_number: masjid.muaddin_number || "",
      committee_members: masjid.committee_members || [],
      remark: masjid.remark || "",
      mihrab_masjid_id: masjid.mihrab_masjid_id || "",
    });
    setEditing(true);
  };

  const handleSaveMasjid = async () => {
    try {
      const res = await axios.put(`${API}/masjids/${id}`, {
        ...editForm,
        waqth_chart_id: masjid.waqth_chart_id || "",
        adjustments: masjid.adjustments || {}
      }, { withCredentials: true });
      setMasjid(res.data);
      setEditing(false);
      toast.success("Masjid updated");
    } catch {
      toast.error("Failed to update");
    }
  };

  const addCommitteeMember = () => {
    if (newMember.name.trim()) {
      setEditForm(prev => ({
        ...prev,
        committee_members: [...(prev.committee_members || []), { name: newMember.name.trim(), number: newMember.number.trim(), address: newMember.address.trim() }]
      }));
      setNewMember({ name: "", number: "", address: "" });
    }
  };

  const removeCommitteeMember = (idx) => {
    setEditForm(prev => ({
      ...prev,
      committee_members: prev.committee_members.filter((_, i) => i !== idx)
    }));
  };

  const updateAdjustment = (chartNum, prayer, field, value) => {
    setConfigForm(prev => ({
      ...prev,
      [chartNum]: {
        ...prev[chartNum],
        adjustments: {
          ...prev[chartNum].adjustments,
          [prayer]: {
            ...prev[chartNum].adjustments[prayer],
            [field]: value
          }
        }
      }
    }));
  };

  const handleSaveConfig = async (chartNum) => {
    const cfg = configForm[chartNum];
    if (!cfg.waqth_chart_id) {
      toast.error("Please select a waqth chart");
      return;
    }
    setSaving(true);
    try {
      await axios.post(`${API}/salah-configs`, {
        masjid_id: id,
        chart_number: parseInt(chartNum),
        waqth_chart_id: cfg.waqth_chart_id,
        adjustments: cfg.adjustments
      }, { withCredentials: true });
      toast.success(`Chart ${chartNum} configuration saved`);
    } catch (err) {
      toast.error("Failed to save configuration");
    } finally {
      setSaving(false);
    }
  };

  const handleGenerate = async (chartNum) => {
    setGenerating(true);
    try {
      const res = await axios.post(`${API}/generate-salah`, {
        masjid_id: id,
        chart_number: parseInt(chartNum)
      }, { withCredentials: true });
      setGeneratedData(res.data.generated);
      toast.success("Salah times generated");
    } catch (err) {
      toast.error(err.response?.data?.detail || "Failed to generate. Save config first.");
    } finally {
      setGenerating(false);
    }
  };

  const handleExport = async (format) => {
    if (!generatedData || generatedData.length === 0) {
      toast.error("Generate salah times first");
      return;
    }
    try {
      const exportData = generatedData.map(row => {
        const filtered = { date: row.date };
        displayPrayers.forEach(p => {
          filtered[`${p}_azan`] = row[`${p}_azan`] || "";
          filtered[`${p}_iqamah`] = row[`${p}_iqamah`] || "";
        });
        return filtered;
      });
      const token = localStorage.getItem('session_token');
      const headers = { 'Content-Type': 'application/json' };
      if (token) headers['Authorization'] = `Bearer ${token}`;
      const response = await fetch(`${API}/export/${format}`, {
        method: 'POST',
        headers,
        credentials: 'include',
        body: JSON.stringify({
          data: exportData,
          masjid_name: masjid?.name || "salah_times"
        })
      });

      if (!response.ok) throw new Error('Export failed');

      const blob = await response.blob();
      const ext = format === 'excel' ? 'xlsx' : format;
      const filename = `${(masjid?.name || 'salah_times').replace(/\s+/g, '_')}_salah_times.${ext}`;
      
      // Create download link
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.style.display = 'none';
      a.href = url;
      a.download = filename;
      a.setAttribute('download', filename);
      document.body.appendChild(a);
      a.click();
      
      // Cleanup after delay
      setTimeout(() => {
        window.URL.revokeObjectURL(url);
        if (a.parentNode) a.parentNode.removeChild(a);
      }, 250);
      
      toast.success(`Downloaded: ${filename}`);
    } catch (err) {
      console.error("Export error:", err);
      toast.error("Export failed - please try again");
    }
  };

  if (loading) {
    return <div className="animate-pulse text-[#5C6B64] p-8">Loading...</div>;
  }

  if (!masjid) return null;

  const chartNum = parseInt(activeChart);
  const currentConfig = configForm[chartNum];

  return (
    <div data-testid="masjid-detail-page" className="animate-slide-in">
      {/* Header */}
      <div className="flex items-center gap-3 mb-6">
        <button
          data-testid="back-btn"
          onClick={() => navigate("/masjids")}
          className="p-2 rounded-lg hover:bg-[#EAE6DD] transition-colors"
        >
          <ArrowLeft className="w-5 h-5 text-[#5C6B64]" />
        </button>
        <div className="flex-1">
          <h1 className="text-xl sm:text-2xl font-semibold text-[#1E2522]" style={{ fontFamily: 'Work Sans' }}>
            {masjid.name}
          </h1>
          {masjid.location_link && (
            <a href={masjid.location_link} target="_blank" rel="noopener noreferrer" className="text-xs text-[#2B5336] hover:underline">
              View on Google Maps
            </a>
          )}
        </div>
        {!editing && (
          <button
            data-testid="edit-masjid-btn"
            onClick={startEditing}
            className="flex items-center gap-2 px-3 py-2 text-sm border border-[#EAE6DD] rounded-lg hover:bg-[#EAE6DD]/50 transition-colors"
          >
            <Pencil className="w-4 h-4" /> Edit
          </button>
        )}
      </div>

      {/* Edit Form */}
      {editing && (
        <div className="surface-card rounded-lg p-5 mb-6 space-y-4">
          <h3 className="text-sm font-semibold text-[#1E2522]" style={{ fontFamily: 'Work Sans' }}>Edit Masjid Details</h3>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label className="text-xs text-[#5C6B64]">Masjid Name *</Label>
              <Input data-testid="edit-name" value={editForm.name} onChange={e => setEditForm(p => ({...p, name: e.target.value}))} className="bg-white border-[#EAE6DD]" />
            </div>
            <div className="space-y-2">
              <Label className="text-xs text-[#5C6B64]">Google Location Link</Label>
              <Input data-testid="edit-location" value={editForm.location_link} onChange={e => setEditForm(p => ({...p, location_link: e.target.value}))} className="bg-white border-[#EAE6DD]" />
            </div>
            <div className="space-y-2">
              <Label className="text-xs text-[#5C6B64]">Mihrab Masjid ID</Label>
              <Input data-testid="edit-mihrab-id" value={editForm.mihrab_masjid_id} onChange={e => setEditForm(p => ({...p, mihrab_masjid_id: e.target.value}))} className="bg-white border-[#EAE6DD]" placeholder="Enter Mihrab Masjid ID" />
            </div>
            <div className="space-y-2">
              <Label className="text-xs text-[#5C6B64]">District</Label>
              <Input data-testid="edit-district" value={editForm.district} onChange={e => setEditForm(p => ({...p, district: e.target.value}))} className="bg-white border-[#EAE6DD]" placeholder="e.g., Petaling Jaya" />
            </div>
            <div className="space-y-2">
              <Label className="text-xs text-[#5C6B64]">State</Label>
              <Input data-testid="edit-state" value={editForm.state} onChange={e => setEditForm(p => ({...p, state: e.target.value}))} className="bg-white border-[#EAE6DD]" placeholder="e.g., Selangor" />
            </div>
            <div className="space-y-2">
              <Label className="text-xs text-[#5C6B64]">Masjid Address</Label>
              <Input data-testid="edit-masjid-address" value={editForm.masjid_address} onChange={e => setEditForm(p => ({...p, masjid_address: e.target.value}))} className="bg-white border-[#EAE6DD]" placeholder="e.g., No. 10, Jalan Masjid..." />
            </div>
            <div className="sm:col-span-2 grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label className="text-xs text-[#5C6B64]">Imam</Label>
                <Input data-testid="edit-imam" value={editForm.imam} onChange={e => setEditForm(p => ({...p, imam: e.target.value}))} className="bg-white border-[#EAE6DD]" placeholder="Imam name" />
              </div>
              <div className="space-y-2">
                <Label className="text-xs text-[#5C6B64]">Imam Phone Number</Label>
                <Input data-testid="edit-imam-number" type="tel" value={editForm.imam_number} onChange={e => setEditForm(p => ({...p, imam_number: e.target.value}))} className="bg-white border-[#EAE6DD]" placeholder="e.g. +601234567890" />
              </div>
            </div>
            <div className="sm:col-span-2 grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label className="text-xs text-[#5C6B64]">Muaddin</Label>
                <Input data-testid="edit-muaddin" value={editForm.muaddin} onChange={e => setEditForm(p => ({...p, muaddin: e.target.value}))} className="bg-white border-[#EAE6DD]" placeholder="Muaddin name" />
              </div>
              <div className="space-y-2">
                <Label className="text-xs text-[#5C6B64]">Muaddin Phone Number</Label>
                <Input data-testid="edit-muaddin-number" type="tel" value={editForm.muaddin_number} onChange={e => setEditForm(p => ({...p, muaddin_number: e.target.value}))} className="bg-white border-[#EAE6DD]" placeholder="e.g. +601234567890" />
              </div>
            </div>
            <div className="space-y-2 sm:col-span-2">
              <Label className="text-xs text-[#5C6B64]">Remark</Label>
              <textarea
                data-testid="edit-remark"
                value={editForm.remark}
                onChange={e => setEditForm(p => ({...p, remark: e.target.value}))}
                className="w-full p-2 text-sm border border-[#EAE6DD] rounded-lg bg-white resize-y min-h-[60px] focus:ring-2 focus:ring-[#2B5336] outline-none"
                placeholder="Any additional remarks..."
              />
            </div>
          </div>

          {/* Committee Members */}
          <div className="space-y-2">
            <Label className="text-xs text-[#5C6B64]">Committee Members</Label>
            <div className="border border-[#EAE6DD] rounded-lg p-3 bg-[#FCFBF8] space-y-2">
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-2">
                <Input
                  data-testid="new-member-name"
                  value={newMember.name}
                  onChange={e => setNewMember(p => ({ ...p, name: e.target.value }))}
                  placeholder="Name *"
                  className="bg-white border-[#EAE6DD] text-sm"
                  onKeyDown={e => e.key === 'Enter' && (e.preventDefault(), addCommitteeMember())}
                />
                <Input
                  data-testid="new-member-number"
                  type="tel"
                  value={newMember.number}
                  onChange={e => setNewMember(p => ({ ...p, number: e.target.value }))}
                  placeholder="Phone number"
                  className="bg-white border-[#EAE6DD] text-sm"
                />
                <Input
                  data-testid="new-member-address"
                  value={newMember.address}
                  onChange={e => setNewMember(p => ({ ...p, address: e.target.value }))}
                  placeholder="Address"
                  className="bg-white border-[#EAE6DD] text-sm"
                />
              </div>
              <button
                type="button"
                data-testid="add-member-btn"
                onClick={addCommitteeMember}
                className="flex items-center gap-1 px-3 py-1.5 text-xs bg-[#2B5336] text-white rounded-lg hover:bg-[#1E3F20] transition-colors"
              >
                <Plus className="w-3 h-3" /> Add Member
              </button>
            </div>
            {editForm.committee_members?.length > 0 && (
              <div className="space-y-2 mt-2">
                {editForm.committee_members.map((member, idx) => (
                  <div key={idx} className="flex items-start justify-between gap-2 px-3 py-2 bg-[#EAE6DD]/40 rounded-lg text-xs text-[#1E2522]">
                    <div className="space-y-0.5">
                      <p className="font-medium">{typeof member === "string" ? member : member.name}</p>
                      {member.number && <p className="text-[#5C6B64]">{member.number}</p>}
                      {member.address && <p className="text-[#5C6B64]">{member.address}</p>}
                    </div>
                    <button type="button" onClick={() => removeCommitteeMember(idx)} className="text-[#B24C41] hover:text-red-700 flex-shrink-0 mt-0.5">
                      <X className="w-3 h-3" />
                    </button>
                  </div>
                ))}
              </div>
            )}
          </div>

          <div className="flex gap-3 pt-2">
            <button data-testid="cancel-edit-btn" onClick={() => setEditing(false)} className="px-4 py-2 text-sm border border-[#EAE6DD] rounded-lg hover:bg-[#EAE6DD]/50">
              Cancel
            </button>
            <button data-testid="save-edit-btn" onClick={handleSaveMasjid} className="flex items-center gap-2 px-4 py-2 text-sm bg-[#2B5336] text-white rounded-lg hover:bg-[#1E3F20]">
              <Check className="w-4 h-4" /> Save Changes
            </button>
          </div>
        </div>
      )}

      {/* Masjid Info Summary (when not editing) */}
      {!editing && (masjid.imam || masjid.muaddin || masjid.mihrab_masjid_id || masjid.district || masjid.state || masjid.remark || (masjid.committee_members && masjid.committee_members.length > 0)) && (
        <div className="surface-card rounded-lg p-5 mb-6">
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 text-sm">
            {masjid.mihrab_masjid_id && (
              <div><span className="text-xs text-[#5C6B64] uppercase tracking-wider">Mihrab ID</span><p className="font-medium text-[#1E2522]">{masjid.mihrab_masjid_id}</p></div>
            )}
            {masjid.district && (
              <div><span className="text-xs text-[#5C6B64] uppercase tracking-wider">District</span><p className="font-medium text-[#1E2522]">{masjid.district}</p></div>
            )}
            {masjid.state && (
              <div><span className="text-xs text-[#5C6B64] uppercase tracking-wider">State</span><p className="font-medium text-[#1E2522]">{masjid.state}</p></div>
            )}
            {masjid.masjid_address && (
              <div className="sm:col-span-2 lg:col-span-3"><span className="text-xs text-[#5C6B64] uppercase tracking-wider">Masjid Address</span><p className="font-medium text-[#1E2522]">{masjid.masjid_address}</p></div>
            )}
            {masjid.imam && (
              <div>
                <span className="text-xs text-[#5C6B64] uppercase tracking-wider">Imam</span>
                <p className="font-medium text-[#1E2522]">{masjid.imam}</p>
                {masjid.imam_number && <p className="text-xs text-[#5C6B64]">{masjid.imam_number}</p>}
              </div>
            )}
            {masjid.muaddin && (
              <div>
                <span className="text-xs text-[#5C6B64] uppercase tracking-wider">Muaddin</span>
                <p className="font-medium text-[#1E2522]">{masjid.muaddin}</p>
                {masjid.muaddin_number && <p className="text-xs text-[#5C6B64]">{masjid.muaddin_number}</p>}
              </div>
            )}
            {masjid.committee_members && masjid.committee_members.length > 0 && (
              <div className="sm:col-span-2 lg:col-span-3">
                <span className="text-xs text-[#5C6B64] uppercase tracking-wider">Committee Members</span>
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-2 mt-2">
                  {masjid.committee_members.map((m, i) => (
                    <div key={i} className="px-3 py-2 bg-[#EAE6DD]/40 rounded-lg text-xs space-y-0.5">
                      <p className="font-medium text-[#1E2522]">{typeof m === "string" ? m : m.name}</p>
                      {m.number && <p className="text-[#5C6B64]">{m.number}</p>}
                      {m.address && <p className="text-[#5C6B64]">{m.address}</p>}
                    </div>
                  ))}
                </div>
              </div>
            )}
            {masjid.remark && (
              <div className="sm:col-span-2 lg:col-span-3">
                <span className="text-xs text-[#5C6B64] uppercase tracking-wider">Remark</span>
                <p className="text-[#1E2522]">{masjid.remark}</p>
              </div>
            )}
          </div>
        </div>
      )}

      {/* Chart Tabs */}
      <Tabs value={activeChart} onValueChange={setActiveChart} className="w-full">
        <TabsList className="w-full max-w-xs bg-[#EAE6DD]/50 mb-6">
          <TabsTrigger value="1" data-testid="tab-chart-1" className="flex-1">Chart 1</TabsTrigger>
          <TabsTrigger value="2" data-testid="tab-chart-2" className="flex-1">Chart 2</TabsTrigger>
        </TabsList>

        {["1", "2"].map(num => (
          <TabsContent key={num} value={num}>
            <div className="space-y-6">
              {/* Waqth Chart Selection */}
              <div className="surface-card rounded-lg p-5">
                <Label className="text-sm font-medium text-[#1E2522] mb-3 block">Select Waqth Chart</Label>
                <Select
                  value={configForm[parseInt(num)].waqth_chart_id}
                  onValueChange={(v) => {
                    setConfigForm(prev => ({
                      ...prev,
                      [parseInt(num)]: { ...prev[parseInt(num)], waqth_chart_id: v }
                    }));
                    fetchChartColumns(v);
                  }}
                >
                  <SelectTrigger data-testid={`select-waqth-chart-${num}`} className="bg-white border-[#EAE6DD]">
                    <SelectValue placeholder="Choose waqth chart" />
                  </SelectTrigger>
                  <SelectContent>
                    {charts.map(chart => (
                      <SelectItem key={chart.chart_id} value={chart.chart_id}>
                        {chart.name} {chart.district && `(${chart.district})`}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
                {chartColumns.length > 0 && (
                  <p className="text-xs text-[#5C6B64] mt-2">
                    Chart columns: {chartColumns.join(", ")}
                  </p>
                )}
              </div>

              {/* Prayer Adjustments */}
              <div className="surface-card rounded-lg p-5">
                <h3 className="text-sm font-semibold text-[#1E2522] mb-4" style={{ fontFamily: 'Work Sans' }}>
                  Prayer Adjustments
                </h3>
                <div className="space-y-4">
                  {PRAYERS.map(prayer => {
                    const adj = currentConfig.adjustments[prayer] || {};
                    const isFixed = adj.mode === "fixed";
                    return (
                      <div key={prayer} className="border border-[#EAE6DD] rounded-lg p-4">
                        <div className="flex items-center justify-between mb-3">
                          <span className="text-sm font-medium text-[#1E2522]">{PRAYER_LABELS[prayer]}</span>
                          <div className="flex items-center gap-2">
                            <span className="text-xs text-[#5C6B64]">{isFixed ? "Fixed Time" : "From Waqth"}</span>
                            <Switch
                              data-testid={`switch-mode-${prayer}-${num}`}
                              checked={isFixed}
                              onCheckedChange={(checked) => updateAdjustment(chartNum, prayer, "mode", checked ? "fixed" : "adjustment")}
                            />
                          </div>
                        </div>

                        {isFixed ? (
                          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                            <div className="space-y-1">
                              <Label className="text-xs text-[#5C6B64]">Fixed Azan Time (HH:MM)</Label>
                              <Input
                                data-testid={`fixed-time-${prayer}-${num}`}
                                value={adj.fixed_time || ""}
                                onChange={(e) => updateAdjustment(chartNum, prayer, "fixed_time", e.target.value)}
                                placeholder="e.g., 13:30"
                                className="bg-white border-[#EAE6DD] max-w-[150px]"
                              />
                            </div>
                            <div className="space-y-1">
                              <Label className="text-xs text-[#5C6B64]">Iqamah Offset (min)</Label>
                              <Input
                                data-testid={`iqamah-offset-${prayer}-${num}`}
                                type="number"
                                min="0"
                                value={adj.iqamah_offset || ""}
                                onChange={(e) => updateAdjustment(chartNum, prayer, "iqamah_offset", parseInt(e.target.value) || 0)}
                                className="bg-white border-[#EAE6DD] max-w-[150px]"
                                placeholder="e.g., 15"
                              />
                            </div>
                          </div>
                        ) : (
                          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                            <div className="space-y-1">
                              <Label className="text-xs text-[#5C6B64]">Rounding Rule</Label>
                              <Select
                                value={adj.rounding || "nearest_5"}
                                onValueChange={(v) => updateAdjustment(chartNum, prayer, "rounding", v)}
                              >
                                <SelectTrigger data-testid={`rounding-${prayer}-${num}`} className="bg-white border-[#EAE6DD] h-8 text-xs">
                                  <SelectValue />
                                </SelectTrigger>
                                <SelectContent>
                                  <SelectItem value="nearest_5">Nearest 5 min</SelectItem>
                                  <SelectItem value="round_up_5">Round Up 5 min</SelectItem>
                                  <SelectItem value="round_down_5">Round Down 5 min</SelectItem>
                                  <SelectItem value="custom">Custom Value</SelectItem>
                                </SelectContent>
                              </Select>
                            </div>
                            {adj.rounding === "custom" && (
                              <div className="space-y-1">
                                <Label className="text-xs text-[#5C6B64]">Add Minutes (0 = no change)</Label>
                                <Input
                                  data-testid={`custom-val-${prayer}-${num}`}
                                  type="number"
                                  min="0"
                                  max="59"
                                  value={adj.custom_value || ""}
                                  onChange={(e) => updateAdjustment(chartNum, prayer, "custom_value", e.target.value)}
                                  className="bg-white border-[#EAE6DD] h-8 text-xs"
                                  placeholder="e.g. 2"
                                />
                              </div>
                            )}
                            <div className="space-y-1">
                              <Label className="text-xs text-[#5C6B64]">Iqamah Offset (min)</Label>
                              <Input
                                data-testid={`iqamah-offset-${prayer}-${num}`}
                                type="number"
                                min="0"
                                value={adj.iqamah_offset || ""}
                                onChange={(e) => updateAdjustment(chartNum, prayer, "iqamah_offset", parseInt(e.target.value) || 0)}
                                className="bg-white border-[#EAE6DD] h-8 text-xs"
                                placeholder="e.g., 15"
                              />
                            </div>
                          </div>
                        )}
                      </div>
                    );
                  })}
                </div>
              </div>

              {/* Jummah (Friday Prayer) - Always Fixed */}
              <div className="surface-card rounded-lg p-5">
                <h3 className="text-sm font-semibold text-[#1E2522] mb-4" style={{ fontFamily: 'Work Sans' }}>
                  Jummah (Friday Prayer)
                </h3>
                <div className="border border-[#D4A373] rounded-lg p-4 bg-[#D4A373]/5">
                  <div className="flex items-center justify-between mb-3">
                    <span className="text-sm font-medium text-[#1E2522]">Jummah</span>
                    <span className="text-xs text-[#5C6B64] px-2 py-0.5 bg-[#D4A373]/20 rounded">Fixed Time</span>
                  </div>
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                    <div className="space-y-1">
                      <Label className="text-xs text-[#5C6B64]">Jummah Azan Time (HH:MM)</Label>
                      <Input
                        data-testid={`fixed-time-jummah-${num}`}
                        value={currentConfig.adjustments.jummah?.fixed_time || ""}
                        onChange={(e) => updateAdjustment(chartNum, "jummah", "fixed_time", e.target.value)}
                        placeholder="e.g., 12:30 or 13:00"
                        className="bg-white border-[#EAE6DD] max-w-[150px]"
                      />
                    </div>
                    <div className="space-y-1">
                      <Label className="text-xs text-[#5C6B64]">Iqamah Offset (min)</Label>
                      <Input
                        data-testid={`iqamah-offset-jummah-${num}`}
                        type="number"
                        min="0"
                        value={currentConfig.adjustments.jummah?.iqamah_offset || ""}
                        onChange={(e) => updateAdjustment(chartNum, "jummah", "iqamah_offset", parseInt(e.target.value) || 0)}
                        className="bg-white border-[#EAE6DD] max-w-[150px]"
                        placeholder="e.g., 30"
                      />
                    </div>
                  </div>
                </div>
              </div>

              {/* Actions */}
              <div className="flex flex-wrap gap-3">
                <button
                  data-testid={`save-config-${num}`}
                  onClick={() => handleSaveConfig(num)}
                  disabled={saving}
                  className="flex items-center gap-2 px-4 py-2 bg-[#2B5336] text-white rounded-lg hover:bg-[#1E3F20] transition-colors text-sm font-medium disabled:opacity-50"
                >
                  <Save className="w-4 h-4" />
                  {saving ? "Saving..." : "Save Config"}
                </button>
                <button
                  data-testid={`generate-salah-${num}`}
                  onClick={() => handleGenerate(num)}
                  disabled={generating}
                  className="flex items-center gap-2 px-4 py-2 bg-[#C27A62] text-white rounded-lg hover:bg-[#A86550] transition-colors text-sm font-medium disabled:opacity-50"
                >
                  {generating ? "Generating..." : "Generate Salah Times"}
                </button>
              </div>
            </div>
          </TabsContent>
        ))}
      </Tabs>

      {/* Generated Results */}
      {generatedData && generatedData.length > 0 && (
        <div className="mt-8">
          <div className="flex items-center justify-between mb-4 flex-wrap gap-2">
            <h3 className="text-lg font-semibold text-[#1E2522]" style={{ fontFamily: 'Work Sans' }}>
              Generated Salah Times
            </h3>
            <div className="flex gap-2">
              <button
                data-testid="export-csv-btn"
                onClick={() => handleExport("csv")}
                className="flex items-center gap-1 px-3 py-1.5 text-xs border border-[#EAE6DD] rounded-lg hover:bg-[#EAE6DD]/50 text-[#1E2522]"
              >
                <FileText className="w-3 h-3" /> CSV
              </button>
              <button
                data-testid="export-excel-btn"
                onClick={() => handleExport("excel")}
                className="flex items-center gap-1 px-3 py-1.5 text-xs border border-[#EAE6DD] rounded-lg hover:bg-[#EAE6DD]/50 text-[#1E2522]"
              >
                <FileSpreadsheet className="w-3 h-3" /> Excel
              </button>
              <button
                data-testid="export-pdf-btn"
                onClick={() => handleExport("pdf")}
                className="flex items-center gap-1 px-3 py-1.5 text-xs border border-[#EAE6DD] rounded-lg hover:bg-[#EAE6DD]/50 text-[#1E2522]"
              >
                <Download className="w-3 h-3" /> PDF
              </button>
            </div>
          </div>

          {/* Date Search/Filter */}
          <div className="relative mb-4 max-w-xs">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-[#5C6B64]" />
            <Input
              data-testid="date-filter-input"
              value={dateFilter}
              onChange={(e) => setDateFilter(e.target.value)}
              placeholder="Filter by date..."
              className="pl-10 bg-white border-[#EAE6DD] h-8 text-sm"
            />
          </div>

          <p className="text-xs text-[#5C6B64] mb-2">
            Showing {filteredData.length} of {generatedData.length} entries
          </p>

          {/* Mobile: Card view */}
          <div className="sm:hidden space-y-3">
            {filteredData.map((row, idx) => (
              <div key={idx} className="surface-card rounded-lg p-3">
                <p className="text-xs font-semibold text-[#2B5336] mb-2">Date: {row.date}</p>
                <div className="grid grid-cols-2 gap-2 text-xs">
                  {displayPrayers.map(p => (
                    <div key={p}>
                      <span className="text-[#5C6B64] block">{PRAYER_LABELS[p]}</span>
                      <div className="font-tabular text-[#1E2522]">
                        <span>A: {row[`${p}_azan`] || "-"}</span>
                        <br />
                        <span className="text-[#C27A62]">I: {row[`${p}_iqamah`] || "-"}</span>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            ))}
          </div>

          {/* Desktop: Table view */}
          <div className="hidden sm:block overflow-x-auto">
            <Table>
              <TableHeader>
                <TableRow className="bg-[#2B5336]">
                  <TableHead className="text-white text-xs font-medium">Date</TableHead>
                  {displayPrayers.map(p => (
                    <TableHead key={p} className="text-white text-xs font-medium text-center">
                      {PRAYER_LABELS[p]}
                      <div className="text-[10px] font-normal opacity-80">Azan / Iqamah</div>
                    </TableHead>
                  ))}
                </TableRow>
              </TableHeader>
              <TableBody>
                {filteredData.map((row, idx) => (
                  <TableRow key={idx} className={idx % 2 === 0 ? "bg-white" : "bg-[#FCFBF8]"}>
                    <TableCell className="text-xs font-medium text-[#1E2522]">{row.date}</TableCell>
                    {displayPrayers.map(p => (
                      <TableCell key={p} className="text-center font-tabular text-xs">
                        <span className="text-[#1E2522]">{row[`${p}_azan`] || "-"}</span>
                        <span className="text-[#C27A62] ml-1">/ {row[`${p}_iqamah`] || "-"}</span>
                      </TableCell>
                    ))}
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </div>
        </div>
      )}
    </div>
  );
}
