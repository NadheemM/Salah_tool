import { useState } from "react";
import { useNavigate } from "react-router-dom";
import axios from "axios";
import { API } from "@/App";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { toast } from "sonner";
import { Upload, FileSpreadsheet } from "lucide-react";

export default function AddWaqthChart() {
  const [name, setName] = useState("");
  const [district, setDistrict] = useState("");
  const [state, setState] = useState("");
  const [country, setCountry] = useState("");
  const [file, setFile] = useState(null);
  const [manualData, setManualData] = useState("");
  const [saving, setSaving] = useState(false);
  const navigate = useNavigate();

  const handleFileUpload = async (e) => {
    e.preventDefault();
    if (!name.trim()) { toast.error("Chart name is required"); return; }
    if (!file) { toast.error("Please select a file"); return; }

    setSaving(true);
    const formData = new FormData();
    formData.append("file", file);
    formData.append("name", name.trim());
    formData.append("district", district.trim());
    formData.append("state", state.trim());
    formData.append("country", country.trim());

    try {
      await axios.post(`${API}/waqth-charts/upload`, formData, {
        withCredentials: true,
        headers: { "Content-Type": "multipart/form-data" }
      });
      toast.success("Chart uploaded successfully");
      navigate("/waqth-charts");
    } catch (err) {
      toast.error(err.response?.data?.detail || "Failed to upload chart");
    } finally {
      setSaving(false);
    }
  };

  const handleManualSubmit = async (e) => {
    e.preventDefault();
    if (!name.trim()) { toast.error("Chart name is required"); return; }

    let prayerTimes = [];
    try {
      if (manualData.trim()) {
        prayerTimes = JSON.parse(manualData);
      }
    } catch {
      toast.error("Invalid JSON format. Use array of objects with date, fajr, sunrise, zuhr, asr, maghrib, isha fields.");
      return;
    }

    setSaving(true);
    try {
      await axios.post(`${API}/waqth-charts`, {
        name: name.trim(),
        district: district.trim(),
        state: state.trim(),
        country: country.trim(),
        prayer_times: prayerTimes
      }, { withCredentials: true });
      toast.success("Chart created successfully");
      navigate("/waqth-charts");
    } catch (err) {
      toast.error("Failed to create chart");
    } finally {
      setSaving(false);
    }
  };

  return (
    <div data-testid="add-waqth-page" className="animate-slide-in max-w-xl">
      <h1 className="text-2xl sm:text-3xl font-semibold text-[#1E2522] mb-6" style={{ fontFamily: 'Work Sans' }}>
        Add Waqth Chart
      </h1>

      {/* Common fields */}
      <div className="space-y-4 mb-6">
        <div className="space-y-2">
          <Label className="text-sm font-medium text-[#1E2522]">Chart Name *</Label>
          <Input
            data-testid="chart-name-input"
            value={name}
            onChange={(e) => setName(e.target.value)}
            placeholder="e.g., Lalpet Madrasa, MWL, University of Karachi"
            className="bg-white border-[#EAE6DD]"
          />
        </div>
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
          <div className="space-y-2">
            <Label className="text-sm font-medium text-[#1E2522]">District</Label>
            <Input
              data-testid="chart-district-input"
              value={district}
              onChange={(e) => setDistrict(e.target.value)}
              placeholder="District"
              className="bg-white border-[#EAE6DD]"
            />
          </div>
          <div className="space-y-2">
            <Label className="text-sm font-medium text-[#1E2522]">State</Label>
            <Input
              data-testid="chart-state-input"
              value={state}
              onChange={(e) => setState(e.target.value)}
              placeholder="State"
              className="bg-white border-[#EAE6DD]"
            />
          </div>
          <div className="space-y-2">
            <Label className="text-sm font-medium text-[#1E2522]">Country</Label>
            <Input
              data-testid="chart-country-input"
              value={country}
              onChange={(e) => setCountry(e.target.value)}
              placeholder="Country"
              className="bg-white border-[#EAE6DD]"
            />
          </div>
        </div>
      </div>

      {/* Tabs for upload method */}
      <Tabs defaultValue="file" className="w-full">
        <TabsList className="w-full bg-[#EAE6DD]/50">
          <TabsTrigger value="file" data-testid="tab-file-upload" className="flex-1">
            <Upload className="w-4 h-4 mr-2" /> File Upload
          </TabsTrigger>
          <TabsTrigger value="manual" data-testid="tab-manual-entry" className="flex-1">
            <FileSpreadsheet className="w-4 h-4 mr-2" /> Manual Entry
          </TabsTrigger>
        </TabsList>

        <TabsContent value="file">
          <form onSubmit={handleFileUpload} className="space-y-4 mt-4">
            <div className="border-2 border-dashed border-[#EAE6DD] rounded-lg p-6 text-center">
              <input
                type="file"
                accept=".csv,.xlsx,.xls"
                onChange={(e) => setFile(e.target.files[0])}
                className="hidden"
                id="file-upload"
                data-testid="file-upload-input"
              />
              <label htmlFor="file-upload" className="cursor-pointer">
                <Upload className="w-8 h-8 text-[#5C6B64] mx-auto mb-2" />
                <p className="text-sm text-[#5C6B64]">
                  {file ? file.name : "Click to upload CSV or Excel file"}
                </p>
                <p className="text-xs text-[#5C6B64] mt-1">
                  Columns: date, fajr, sunrise, zuhr, asr, maghrib, isha
                </p>
              </label>
            </div>
            <div className="flex gap-3">
              <button
                type="button"
                onClick={() => navigate("/waqth-charts")}
                className="px-4 py-2 text-sm text-[#5C6B64] border border-[#EAE6DD] rounded-lg hover:bg-[#EAE6DD]/50"
                data-testid="cancel-upload-btn"
              >
                Cancel
              </button>
              <button
                type="submit"
                disabled={saving}
                className="px-6 py-2 text-sm font-medium bg-[#2B5336] text-white rounded-lg hover:bg-[#1E3F20] disabled:opacity-50"
                data-testid="upload-chart-btn"
              >
                {saving ? "Uploading..." : "Upload Chart"}
              </button>
            </div>
          </form>
        </TabsContent>

        <TabsContent value="manual">
          <form onSubmit={handleManualSubmit} className="space-y-4 mt-4">
            <div className="space-y-2">
              <Label className="text-sm font-medium text-[#1E2522]">Prayer Times (JSON)</Label>
              <textarea
                data-testid="manual-data-input"
                value={manualData}
                onChange={(e) => setManualData(e.target.value)}
                rows={8}
                className="w-full p-3 text-sm border border-[#EAE6DD] rounded-lg bg-white font-mono resize-y focus:ring-2 focus:ring-[#2B5336] focus:border-[#2B5336] outline-none"
                placeholder={`[\n  {"date": "1", "fajr": "4:36", "sunrise": "5:52", "zuhr": "12:15", "asr": "15:45", "maghrib": "18:32", "isha": "19:48"},\n  {"date": "2", "fajr": "4:37", "sunrise": "5:53", "zuhr": "12:15", "asr": "15:44", "maghrib": "18:31", "isha": "19:47"}\n]`}
              />
              <p className="text-xs text-[#5C6B64]">
                Enter prayer times as JSON array. Each entry needs: date, fajr, sunrise, zuhr, asr, maghrib, isha
              </p>
            </div>
            <div className="flex gap-3">
              <button
                type="button"
                onClick={() => navigate("/waqth-charts")}
                className="px-4 py-2 text-sm text-[#5C6B64] border border-[#EAE6DD] rounded-lg hover:bg-[#EAE6DD]/50"
                data-testid="cancel-manual-btn"
              >
                Cancel
              </button>
              <button
                type="submit"
                disabled={saving}
                className="px-6 py-2 text-sm font-medium bg-[#2B5336] text-white rounded-lg hover:bg-[#1E3F20] disabled:opacity-50"
                data-testid="save-manual-chart-btn"
              >
                {saving ? "Saving..." : "Save Chart"}
              </button>
            </div>
          </form>
        </TabsContent>
      </Tabs>
    </div>
  );
}
