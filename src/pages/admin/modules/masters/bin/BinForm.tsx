import { useEffect, useState, FormEvent } from "react";
import { useNavigate, useParams } from "react-router-dom";
import Swal from "sweetalert2";

import ComponentCard from "@/components/common/ComponentCard";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Button } from "@/components/ui/button";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";

import { binApi } from "@/helpers/admin";
import { encryptSegment } from "@/utils/routeCrypto";
import type { BinRecord } from "./types";

const encMasters = encryptSegment("masters");
const encBins = encryptSegment("bins");
const LIST_PATH = `/${encMasters}/${encBins}`;

export default function BinForm() {
  const { id } = useParams<{ id: string }>();
  const isEdit = Boolean(id);
  const navigate = useNavigate();

  const [form, setForm] = useState<Partial<BinRecord>>({
    bin_status: "active",
    bin_type: "public",
    waste_type: "organic",
    is_active: true,
  });

  const onChange = (key: keyof BinRecord, value: any) => {
    setForm((prev) => ({ ...prev, [key]: value }));
  };

  useEffect(() => {
    if (!isEdit || !id) return;
    binApi.get(id).then((data: BinRecord) => setForm(data));
  }, [id, isEdit]);

  const submit = async (e: FormEvent) => {
    e.preventDefault();

    try {
      if (isEdit && id) {
        await binApi.update(id, form);
      } else {
        await binApi.create(form);
      }

      Swal.fire("Success", "Bin saved successfully", "success");
      navigate(LIST_PATH);
    } catch (err: any) {
      Swal.fire("Error", err?.message || "Save failed", "error");
    }
  };

  return (
    <ComponentCard title={isEdit ? "Update Bin" : "Add Bin"}>
      <form onSubmit={submit} className="grid grid-cols-2 gap-4">

        <div>
          <Label>Bin Name</Label>
          <Input value={form.bin_name || ""} onChange={e => onChange("bin_name", e.target.value)} />
        </div>

        <div>
          <Label>Ward</Label>
          <Input value={form.ward || ""} onChange={e => onChange("ward", e.target.value)} />
        </div>

        <div>
          <Label>Bin Type</Label>
          <Select value={form.bin_type} onValueChange={v => onChange("bin_type", v)}>
            <SelectTrigger><SelectValue /></SelectTrigger>
            <SelectContent>
              <SelectItem value="public">Public</SelectItem>
              <SelectItem value="commercial">Commercial</SelectItem>
              <SelectItem value="residential">Residential</SelectItem>
            </SelectContent>
          </Select>
        </div>

        <div>
          <Label>Waste Type</Label>
          <Select value={form.waste_type} onValueChange={v => onChange("waste_type", v)}>
            <SelectTrigger><SelectValue /></SelectTrigger>
            <SelectContent>
              <SelectItem value="organic">Organic</SelectItem>
              <SelectItem value="plastic">Plastic</SelectItem>
              <SelectItem value="metal">Metal</SelectItem>
              <SelectItem value="paper">Paper</SelectItem>
              <SelectItem value="mixed">Mixed</SelectItem>
            </SelectContent>
          </Select>
        </div>

        <div>
          <Label>Capacity (Liters)</Label>
          <Input type="number" value={form.capacity_liters || ""} onChange={e => onChange("capacity_liters", +e.target.value)} />
        </div>

        <div>
          <Label>Color Code</Label>
          <Input value={form.color_code || ""} onChange={e => onChange("color_code", e.target.value)} />
        </div>

        <div>
          <Label>Latitude</Label>
          <Input value={form.latitude || ""} onChange={e => onChange("latitude", +e.target.value)} />
        </div>

        <div>
          <Label>Longitude</Label>
          <Input value={form.longitude || ""} onChange={e => onChange("longitude", +e.target.value)} />
        </div>

        <div> 
          <Label>Installation Date</Label>
          <Input type="date" value={form.installation_date || ""} onChange={e => onChange("installation_date", e.target.value)} />
        </div>

        <div>
          <Label>Expected Life (Years)</Label>
          <Input type="number" value={form.expected_life_years || ""} onChange={e => onChange("expected_life_years", +e.target.value)} />
        </div>

        <div className="col-span-2 flex justify-end gap-3">
          <Button type="submit">{isEdit ? "Update" : "Save"}</Button>
          <Button type="button" variant="outline" onClick={() => navigate(LIST_PATH)}>Cancel</Button>
        </div>

      </form>
    </ComponentCard>
  );
}
