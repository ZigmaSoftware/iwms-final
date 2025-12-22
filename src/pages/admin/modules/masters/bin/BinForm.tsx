import { useEffect, useState, type FormEvent } from "react";
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
import { encryptSegment } from "@/utils/routeCrypto";

import { binApi } from "@/helpers/admin";

const encMasters = encryptSegment("masters");
const encBins = encryptSegment("bins");
const ENC_LIST_PATH = `/${encMasters}/${encBins}`;

type BinRecord = {
  name?: string;
  code?: string;
  capacity?: number | string;
  is_active?: boolean;
};

type ErrorWithResponse = {
  response?: {
    data?: unknown;
  };
};

const extractErrorMessage = (error: unknown) => {
  if (!error) return "Something went wrong while processing the request.";
  if (typeof error === "string") return error;

  const data = (error as ErrorWithResponse)?.response?.data;
  if (typeof data === "string") return data;
  if (Array.isArray(data)) return data.join(", ");

  if (data && typeof data === "object") {
    return Object.entries(data as Record<string, unknown>)
      .map(([key, value]) => {
        if (Array.isArray(value)) {
          return `${key}: ${value.join(", ")}`;
        }
        return `${key}: ${String(value)}`;
      })
      .join("\n");
  }

  if (error instanceof Error && error.message) {
    return error.message;
  }

  return "Something went wrong while processing the request.";
};

export default function BinForm() {
  const [name, setName] = useState("");
  const [code, setCode] = useState("");
  const [capacity, setCapacity] = useState("");
  const [address, setAddress] = useState("");
  const [latitude, setLatitude] = useState("");
  const [longitude, setLongitude] = useState("");
  const [isActive, setIsActive] = useState(true);
  const [loading, setLoading] = useState(false);

  const navigate = useNavigate();
  const { id } = useParams<{ id: string }>();
  const isEdit = Boolean(id);

  useEffect(() => {
    if (!isEdit || !id) return;

    const loadBin = async () => {
      try {
        const data = (await binApi.get(id)) as BinRecord;
        setName(data.name ?? "");
        setCode(data.code ?? "");
        setCapacity(data.capacity ? String(data.capacity) : "");
        setAddress(data.address ?? "");
        setLatitude(data.latitude ? String(data.latitude) : "");
        setLongitude(data.longitude ? String(data.longitude) : "");
        setIsActive(Boolean(data.is_active));
      } catch (error) {
        Swal.fire({
          icon: "error",
          title: "Failed to load bin",
          text: extractErrorMessage(error),
        });
      }
    };

    void loadBin();
  }, [id, isEdit]);

  const handleSubmit = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    if (!name.trim()) {
      Swal.fire({
        icon: "warning",
        title: "Missing Fields",
        text: "Please enter the bin name.",
        confirmButtonColor: "#3085d6",
      });
      return;
    }

    setLoading(true);
    try {
      const payload = {
        name: name.trim(),
        code: code.trim() || null,
        capacity: capacity.trim() || null,
        address: address.trim() || null,
        latitude: latitude.trim() || null,
        longitude: longitude.trim() || null,
        is_active: isActive,
      };

      if (isEdit && id) {
        await binApi.update(id, payload);
        Swal.fire({
          icon: "success",
          title: "Updated successfully!",
          timer: 1500,
          showConfirmButton: false,
        });
      } else {
        await binApi.create(payload);
        Swal.fire({
          icon: "success",
          title: "Added successfully!",
          timer: 1500,
          showConfirmButton: false,
        });
      }

      navigate(ENC_LIST_PATH);
    } catch (error) {
      Swal.fire({
        icon: "error",
        title: "Save failed",
        text: extractErrorMessage(error),
      });
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="p-6">
      <ComponentCard
        title={isEdit ? "Update Bin" : "Add Bin"}
        desc="Create and maintain bin master records."
      >
        <form onSubmit={handleSubmit} className="space-y-6">
          <div className="grid grid-cols-1 gap-5 md:grid-cols-2">
            <div>
              <Label htmlFor="name">Bin Name</Label>
              <Input
                id="name"
                value={name}
                onChange={(event) => setName(event.target.value)}
                required
              />
            </div>
            <div>
              <Label htmlFor="code">Bin Code</Label>
              <Input
                id="code"
                value={code}
                onChange={(event) => setCode(event.target.value)}
              />
            </div>
            <div>
              <Label htmlFor="capacity">Capacity</Label>
              <Input
                id="capacity"
                value={capacity}
                onChange={(event) => setCapacity(event.target.value)}
                placeholder="e.g. 120 L"
              />
            </div>
            <div>
              <Label htmlFor="address">Address</Label>
              <Input
                id="address"
                value={address}
                onChange={(event) => setAddress(event.target.value)}
                placeholder="Enter address"
              />
            </div>
            <div>
              <Label htmlFor="latitude">Latitude</Label>
              <Input
                id="latitude"
                value={latitude}
                onChange={(event) => setLatitude(event.target.value)}
                placeholder="e.g. 11.0168"
              />
            </div>
            <div>
              <Label htmlFor="longitude">Longitude</Label>
              <Input
                id="longitude"
                value={longitude}
                onChange={(event) => setLongitude(event.target.value)}
                placeholder="e.g. 76.9558"
              />
            </div>
            <div>
              <Label htmlFor="isActive">Active Status</Label>
              <Select
                value={isActive ? "true" : "false"}
                onValueChange={(val) => setIsActive(val === "true")}
              >
                <SelectTrigger className="input-validate w-full" id="isActive">
                  <SelectValue placeholder="Select status" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="true">Active</SelectItem>
                  <SelectItem value="false">Inactive</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>

          <div className="flex flex-wrap justify-end gap-3">
            <Button type="submit" disabled={loading}>
              {loading ? "Saving..." : isEdit ? "Update" : "Save"}
            </Button>
            <Button
              type="button"
              variant="outline"
              onClick={() => navigate(ENC_LIST_PATH)}
            >
              Cancel
            </Button>
          </div>
        </form>
      </ComponentCard>
    </div>
  );
}
