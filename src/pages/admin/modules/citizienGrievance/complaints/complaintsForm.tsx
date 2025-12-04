import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import Swal from "sweetalert2";
import ComponentCard from "@/components/common/ComponentCard";
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { getEncryptedRoute } from "@/utils/routeCache";
import {
  filterActiveCustomers,
  normalizeCustomerArray,
} from "@/utils/customerUtils";
import { adminApi } from "@/helpers/admin";

const FILE_ICON =
  "https://cdn-icons-png.flaticon.com/512/337/337946.png"; // fallback for pdf/doc

const customerApi = adminApi.customerCreations;
const zoneApi = adminApi.zones;
const wardApi = adminApi.wards;
const complaintApi = adminApi.complaints;

export default function ComplaintAddForm() {
  const navigate = useNavigate();

  const { encCitizenGrivence, encComplaint } = getEncryptedRoute();

  const ENC_LIST_PATH = `/${encCitizenGrivence}/${encComplaint}`;
  const [customers, setCustomers] = useState<any[]>([]);
  const [customer, setCustomer] = useState<any>(null);
  const [zones, setZones] = useState<any[]>([]);
  const [wards, setWards] = useState<any[]>([]);

  const [zone, setZone] = useState("");
  const [ward, setWard] = useState("");
  const [contact, setContact] = useState("");
  const [address, setAddress] = useState("");
  const [category, setCategory] = useState("");
  const [details, setDetails] = useState("");

  const [file, setFile] = useState<File | null>(null);
  const [previewUrl, setPreviewUrl] = useState("");
  const [isPreviewImage, setIsPreviewImage] = useState(false);

  const fetchCustomers = async () => {
    try {
      const res = await customerApi.list();
      const normalized = normalizeCustomerArray(res);
      setCustomers(filterActiveCustomers(normalized));
    } catch (err) {
      console.error("Failed to fetch customers:", err);
    }
  };

  useEffect(() => {
    fetchCustomers();
  }, []);

  const loadZones = async (cid: string) => {
    const res = await zoneApi.list({ params: { customer: cid } });
    setZones(res);
  };

  const loadWards = async (zid: string) => {
    const res = await wardApi.list({ params: { zone: zid } });
    setWards(res);
  };

  const resolveId = (item: any) => item?.unique_id ?? "";

  const onCustomerChange = (id: string) => {
    const c = customers.find((x) => resolveId(x) === id);
    setCustomer(c);
    setContact(c.contact_no);
    setAddress(
      `${c.building_no}, ${c.street}, ${c.area}, ${c.city_name}, ${c.district_name}, ${c.state_name}, ${c.pincode}`
    );
    loadZones(resolveId(c));
  };

  const isImageFile = (f: File) =>
    f.type.startsWith("image/") ||
    f.name.endsWith(".jpg") ||
    f.name.endsWith(".jpeg") ||
    f.name.endsWith(".png") ||
    f.name.endsWith(".webp");

  const uploadFile = (e: any) => {
    const f = e.target.files?.[0];
    if (!f) return;

    // revoke old blob
    if (previewUrl.startsWith("blob:")) URL.revokeObjectURL(previewUrl);

    setFile(f);

    if (isImageFile(f)) {
      setIsPreviewImage(true);
      setPreviewUrl(URL.createObjectURL(f));
    } else {
      setIsPreviewImage(false);
      setPreviewUrl(FILE_ICON);
    }
  };

  const clearFile = () => {
    if (previewUrl.startsWith("blob:")) URL.revokeObjectURL(previewUrl);

    setFile(null);
    setPreviewUrl("");
    setIsPreviewImage(false);

    const input = document.getElementById("uploadBox") as HTMLInputElement | null;
    if (input) input.value = "";
  };

  const save = async (e: any) => {
    e.preventDefault();

    const fd = new FormData();
    fd.append("customer", resolveId(customer));
    fd.append("zone", zone);
    fd.append("ward", ward);
    fd.append("contact_no", contact);
    fd.append("address", address);
    fd.append("category", category);
    fd.append("details", details);
    if (file) fd.append("image", file);

    try {
      await complaintApi.create(fd, {
        headers: { "Content-Type": "multipart/form-data" },
      });
      Swal.fire("Saved", "Complaint created successfully", "success");
      navigate(ENC_LIST_PATH);
    } catch {
      Swal.fire("Error", "Failed to save complaint", "error");
    }
  };

  return (
    <ComponentCard title="Add Complaint">
      <form onSubmit={save}>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">

          <div>
            <Label>Customer *</Label>
            <Select
              value={customer ? resolveId(customer) : undefined}
              onValueChange={onCustomerChange}
            >
              <SelectTrigger>
                <SelectValue placeholder="Select customer" />
              </SelectTrigger>
              <SelectContent>
                {customers.map((c) => (
                  <SelectItem key={resolveId(c)} value={resolveId(c)}>
                    {c.customer_name}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          <div>
            <Label>Contact</Label>
            <Input value={contact} disabled />
          </div>

          <div className="md:col-span-2">
            <Label>Address</Label>
            <Input value={address} disabled />
          </div>

          <div>
            <Label>Zone *</Label>
            <Select
              value={zone || undefined}
              onValueChange={(v) => {
                setZone(v);
                loadWards(v);
              }}
            >
              <SelectTrigger>
                <SelectValue placeholder="Select zone" />
              </SelectTrigger>
              <SelectContent>
                {zones.map((z) => (
                  <SelectItem key={resolveId(z)} value={resolveId(z)}>
                    {z.name}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          <div>
            <Label>Ward *</Label>
            <Select value={ward || undefined} onValueChange={(v) => setWard(v)}>
              <SelectTrigger>
                <SelectValue placeholder="Select ward" />
              </SelectTrigger>
              <SelectContent>
                {wards.map((w) => (
                  <SelectItem key={resolveId(w)} value={resolveId(w)}>
                    {w.name}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          <div>
            <Label>Category *</Label>
            <Select
              value={category || undefined}
              onValueChange={(v) => setCategory(v)}
            >
              <SelectTrigger>
                <SelectValue placeholder="Select category" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="COLLECTION">Collection</SelectItem>
                <SelectItem value="TRANSPORT">Transport</SelectItem>
                <SelectItem value="SEGREGATION">Segregation</SelectItem>
                <SelectItem value="VEHICLE">Vehicle</SelectItem>
                <SelectItem value="WORKER">Worker</SelectItem>
                <SelectItem value="OTHER">Other</SelectItem>
              </SelectContent>
            </Select>
          </div>

          <div className="md:col-span-2">
            <Label>Details *</Label>
            <Input
              required
              value={details}
              onChange={(e) => setDetails(e.target.value)}
            />
          </div>

          {/* FILE UPLOAD */}
          <div className="md:col-span-1">
            <Label>Complaint File</Label>

            <input
              id="uploadBox"
              type="file"
              accept=".jpg,.jpeg,.png,.webp,.pdf,.doc,.docx"
              onChange={uploadFile}
              className="hidden"
            />

            {/* Upload Box */}
            <div
              className="border border-gray-300 rounded flex flex-col items-center justify-center p-3 cursor-pointer bg-gray-50 hover:bg-gray-100 transition-all duration-200 w-60 h-32"
              onClick={() => document.getElementById("uploadBox")?.click()}
            >
              {previewUrl ? (
                <>
                  {isPreviewImage ? (
                    <img
                      src={previewUrl}
                      className="w-full h-full object-contain rounded"
                    />
                  ) : (
                    <img src={FILE_ICON} className="w-16 h-16 opacity-80" />
                  )}
                </>
              ) : (
                <>
                  <img src={FILE_ICON} className="w-10 h-10 opacity-60" />
                  <p className="text-gray-500 text-sm mt-1 text-center">
                    Drag & drop or click to upload
                  </p>
                </>
              )}
            </div>

            {/* PREVIEW + REMOVE BUTTONS */}
            {previewUrl && (
              <div className="flex items-center gap-3 mt-3">

                {/* Preview */}
                <Button
                  type="button"
                  variant="secondary"
                  onClick={() => {
                    if (isPreviewImage) {
                      window.open(previewUrl, "_blank");
                    } else {
                      window.open(URL.createObjectURL(file!), "_blank");
                    }
                  }}
                >
                  Preview
                </Button>

                {/* Remove */}
                <Button type="button" variant="destructive" onClick={clearFile}>
                  Remove
                </Button>

              </div>
            )}
          </div>
        </div>

        <div className="flex justify-end gap-3 mt-6">
          <Button type="submit">Save</Button>
          <Button type="button" variant="destructive" onClick={() => navigate(ENC_LIST_PATH)}>
            Cancel
          </Button>
        </div>
      </form>
    </ComponentCard>
  );
}
