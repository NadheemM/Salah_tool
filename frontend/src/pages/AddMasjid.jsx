import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import axios from "axios";
import { API } from "@/App";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { toast } from "sonner";
import { Plus, X } from "lucide-react";

export default function AddMasjid() {
  const [name, setName] = useState("");
  const [district, setDistrict] = useState("");
  const [state, setState] = useState("");
  const [masjidAddress, setMasjidAddress] = useState("");
  const [locationLink, setLocationLink] = useState("");
  const [waqthChartId, setWaqthChartId] = useState("");
  const [mihrabMasjidId, setMihrabMasjidId] = useState("");
  const [imam, setImam] = useState("");
  const [imamNumber, setImamNumber] = useState("");
  const [muaddin, setMuaddin] = useState("");
  const [muaddinNumber, setMuaddinNumber] = useState("");
  const [remark, setRemark] = useState("");
  const [committeeMembers, setCommitteeMembers] = useState([]);
  const [newMember, setNewMember] = useState({ name: "", number: "", address: "" });
  const [charts, setCharts] = useState([]);
  const [saving, setSaving] = useState(false);
  const navigate = useNavigate();

  useEffect(() => {
    const fetchCharts = async () => {
      try {
        const res = await axios.get(`${API}/waqth-charts`, { withCredentials: true });
        setCharts(res.data);
      } catch {}
    };
    fetchCharts();
  }, []);

  const addCommitteeMember = () => {
    if (newMember.name.trim()) {
      setCommitteeMembers(prev => [...prev, { name: newMember.name.trim(), number: newMember.number.trim(), address: newMember.address.trim() }]);
      setNewMember({ name: "", number: "", address: "" });
    }
  };

  const removeMember = (idx) => {
    setCommitteeMembers(prev => prev.filter((_, i) => i !== idx));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!name.trim()) {
      toast.error("Masjid name is required");
      return;
    }
    setSaving(true);
    try {
      await axios.post(`${API}/masjids`, {
        name: name.trim(),
        district: district.trim(),
        state: state.trim(),
        masjid_address: masjidAddress.trim(),
        location_link: locationLink.trim(),
        waqth_chart_id: waqthChartId,
        adjustments: {},
        mihrab_masjid_id: mihrabMasjidId.trim(),
        imam: imam.trim(),
        imam_number: imamNumber.trim(),
        muaddin: muaddin.trim(),
        muaddin_number: muaddinNumber.trim(),
        remark: remark.trim(),
        committee_members: committeeMembers
      }, { withCredentials: true });
      toast.success("Masjid added successfully");
      navigate("/masjids");
    } catch (err) {
      toast.error("Failed to add masjid");
    } finally {
      setSaving(false);
    }
  };

  return (
    <div data-testid="add-masjid-page" className="animate-slide-in max-w-lg">
      <h1 className="text-2xl sm:text-3xl font-semibold text-[#1E2522] mb-6" style={{ fontFamily: 'Work Sans' }}>
        Add New Masjid
      </h1>

      <form onSubmit={handleSubmit} className="space-y-5">
        <div className="space-y-2">
          <Label htmlFor="name" className="text-sm font-medium text-[#1E2522]">
            Masjid Name *
          </Label>
          <Input
            id="name"
            data-testid="masjid-name-input"
            value={name}
            onChange={(e) => setName(e.target.value)}
            placeholder="e.g., Masjid Al-Rahman"
            className="bg-white border-[#EAE6DD] focus:ring-[#2B5336] focus:border-[#2B5336]"
          />
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <div className="space-y-2">
            <Label className="text-sm font-medium text-[#1E2522]">District</Label>
            <Input
              data-testid="district-input"
              value={district}
              onChange={(e) => setDistrict(e.target.value)}
              placeholder="e.g., Petaling Jaya"
              className="bg-white border-[#EAE6DD] focus:ring-[#2B5336] focus:border-[#2B5336]"
            />
          </div>
          <div className="space-y-2">
            <Label className="text-sm font-medium text-[#1E2522]">State</Label>
            <Input
              data-testid="state-input"
              value={state}
              onChange={(e) => setState(e.target.value)}
              placeholder="e.g., Selangor"
              className="bg-white border-[#EAE6DD] focus:ring-[#2B5336] focus:border-[#2B5336]"
            />
          </div>
          <div className="space-y-2 sm:col-span-2">
            <Label className="text-sm font-medium text-[#1E2522]">Masjid Address</Label>
            <Input
              data-testid="masjid-address-input"
              value={masjidAddress}
              onChange={(e) => setMasjidAddress(e.target.value)}
              placeholder="e.g., No. 10, Jalan Masjid..."
              className="bg-white border-[#EAE6DD] focus:ring-[#2B5336] focus:border-[#2B5336]"
            />
          </div>
        </div>

        <div className="space-y-2">
          <Label htmlFor="mihrab" className="text-sm font-medium text-[#1E2522]">
            Mihrab Masjid ID
          </Label>
          <Input
            id="mihrab"
            data-testid="mihrab-masjid-id-input"
            value={mihrabMasjidId}
            onChange={(e) => setMihrabMasjidId(e.target.value)}
            placeholder="Enter Mihrab Masjid ID"
            className="bg-white border-[#EAE6DD] focus:ring-[#2B5336] focus:border-[#2B5336]"
          />
        </div>

        <div className="space-y-2">
          <Label htmlFor="location" className="text-sm font-medium text-[#1E2522]">
            Google Location Link
          </Label>
          <Input
            id="location"
            data-testid="masjid-location-input"
            value={locationLink}
            onChange={(e) => setLocationLink(e.target.value)}
            placeholder="Paste Google Maps link here"
            className="bg-white border-[#EAE6DD] focus:ring-[#2B5336] focus:border-[#2B5336]"
          />
        </div>

        <div className="space-y-2">
          <Label className="text-sm font-medium text-[#1E2522]">
            Waqth Chart (optional)
          </Label>
          <Select value={waqthChartId} onValueChange={setWaqthChartId}>
            <SelectTrigger data-testid="waqth-chart-select" className="bg-white border-[#EAE6DD]">
              <SelectValue placeholder="Select a waqth chart" />
            </SelectTrigger>
            <SelectContent>
              {charts.map((chart) => (
                <SelectItem key={chart.chart_id} value={chart.chart_id}>
                  {chart.name} {chart.district && `(${chart.district})`}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <div className="space-y-2">
            <Label className="text-sm font-medium text-[#1E2522]">Imam</Label>
            <Input
              data-testid="imam-input"
              value={imam}
              onChange={(e) => setImam(e.target.value)}
              placeholder="Imam name"
              className="bg-white border-[#EAE6DD]"
            />
          </div>
          <div className="space-y-2">
            <Label className="text-sm font-medium text-[#1E2522]">Imam Phone Number</Label>
            <Input
              data-testid="imam-number-input"
              type="tel"
              value={imamNumber}
              onChange={(e) => setImamNumber(e.target.value)}
              placeholder="e.g. +601234567890"
              className="bg-white border-[#EAE6DD]"
            />
          </div>
          <div className="space-y-2">
            <Label className="text-sm font-medium text-[#1E2522]">Muaddin</Label>
            <Input
              data-testid="muaddin-input"
              value={muaddin}
              onChange={(e) => setMuaddin(e.target.value)}
              placeholder="Muaddin name"
              className="bg-white border-[#EAE6DD]"
            />
          </div>
          <div className="space-y-2">
            <Label className="text-sm font-medium text-[#1E2522]">Muaddin Phone Number</Label>
            <Input
              data-testid="muaddin-number-input"
              type="tel"
              value={muaddinNumber}
              onChange={(e) => setMuaddinNumber(e.target.value)}
              placeholder="e.g. +601234567890"
              className="bg-white border-[#EAE6DD]"
            />
          </div>
        </div>

        {/* Committee Members */}
        <div className="space-y-2">
          <Label className="text-sm font-medium text-[#1E2522]">Committee Members</Label>
          <div className="border border-[#EAE6DD] rounded-lg p-3 bg-[#FCFBF8] space-y-2">
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-2">
              <Input
                data-testid="new-member-name"
                value={newMember.name}
                onChange={e => setNewMember(p => ({ ...p, name: e.target.value }))}
                placeholder="Name *"
                className="bg-white border-[#EAE6DD]"
                onKeyDown={e => { if (e.key === 'Enter') { e.preventDefault(); addCommitteeMember(); }}}
              />
              <Input
                data-testid="new-member-number"
                type="tel"
                value={newMember.number}
                onChange={e => setNewMember(p => ({ ...p, number: e.target.value }))}
                placeholder="Phone number"
                className="bg-white border-[#EAE6DD]"
              />
              <Input
                data-testid="new-member-address"
                value={newMember.address}
                onChange={e => setNewMember(p => ({ ...p, address: e.target.value }))}
                placeholder="Address"
                className="bg-white border-[#EAE6DD]"
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
          {committeeMembers.length > 0 && (
            <div className="space-y-2 mt-2">
              {committeeMembers.map((member, idx) => (
                <div key={idx} className="flex items-start justify-between gap-2 px-3 py-2 bg-[#EAE6DD]/40 rounded-lg text-xs text-[#1E2522]">
                  <div className="space-y-0.5">
                    <p className="font-medium">{typeof member === "string" ? member : member.name}</p>
                    {member.number && <p className="text-[#5C6B64]">{member.number}</p>}
                    {member.address && <p className="text-[#5C6B64]">{member.address}</p>}
                  </div>
                  <button type="button" onClick={() => removeMember(idx)} className="text-[#B24C41] hover:text-red-700 flex-shrink-0 mt-0.5">
                    <X className="w-3 h-3" />
                  </button>
                </div>
              ))}
            </div>
          )}
        </div>

        <div className="space-y-2">
          <Label className="text-sm font-medium text-[#1E2522]">Remark</Label>
          <textarea
            data-testid="remark-input"
            value={remark}
            onChange={(e) => setRemark(e.target.value)}
            rows={3}
            className="w-full p-3 text-sm border border-[#EAE6DD] rounded-lg bg-white resize-y focus:ring-2 focus:ring-[#2B5336] outline-none"
            placeholder="Any additional remarks about this masjid..."
          />
        </div>

        <div className="flex gap-3 pt-4">
          <button
            type="button"
            onClick={() => navigate("/masjids")}
            className="px-4 py-2 text-sm font-medium text-[#5C6B64] border border-[#EAE6DD] rounded-lg hover:bg-[#EAE6DD]/50 transition-colors"
            data-testid="cancel-btn"
          >
            Cancel
          </button>
          <button
            type="submit"
            disabled={saving}
            className="px-6 py-2 text-sm font-medium bg-[#2B5336] text-white rounded-lg hover:bg-[#1E3F20] transition-colors disabled:opacity-50"
            data-testid="save-masjid-btn"
          >
            {saving ? "Saving..." : "Save Masjid"}
          </button>
        </div>
      </form>
    </div>
  );
}
