import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { desktopApi, mobileApi } from "@/api";
import Swal from "sweetalert2";

import ComponentCard from "@/components/common/ComponentCard";
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";

import {
  Select,
  SelectTrigger,
  SelectValue,
  SelectContent,
  SelectItem,
} from "@/components/ui/select";

import { getEncryptedRoute } from "@/utils/routeCache";
import {
  filterActiveCustomers,
  filterActiveRecords,
  normalizeCustomerArray,
} from "@/utils/customerUtils";
import { customerCreationApi } from "@/helpers/admin";

/* ================= CONSTANTS ================= */

const FILE_ICON =
  "https://cdn-icons-png.flaticon.com/512/337/337946.png";

/* ================= HELPERS ================= */

const listFromResponse = (payload: any) => {
  if (Array.isArray(payload)) return payload;
  if (Array.isArray(payload?.data)) return payload.data;
  if (Array.isArray(payload?.results)) return payload.results;
  return [];
};

const resolveValue = (o: any) =>
  String(o?.unique_id ?? o?.id ?? "");

const resolveMainCategoryLabel = (m: any) =>
  m?.main_categoryName ??
  m?.main_category ??
  m?.name ??
  "";

/* ================= COMPONENT ================= */

export default function ComplaintAddForm() {
  const navigate = useNavigate();
  const { encCitizenGrivence, encComplaint } = getEncryptedRoute();
  const ENC_LIST_PATH = `/${encCitizenGrivence}/${encComplaint}`;

  /* ---------------- STATE ---------------- */
  const [customers, setCustomers] = useState<any[]>([]);
  const [customer, setCustomer] = useState<any>(null);

  const [zones, setZones] = useState<any[]>([]);
  const [wards, setWards] = useState<any[]>([]);
  const [zone, setZone] = useState("");
  const [ward, setWard] = useState("");

  const [contact, setContact] = useState("");
  const [address, setAddress] = useState("");

  const [mainCategories, setMainCategories] = useState<any[]>([]);
  const [allSubCategories, setAllSubCategories] = useState<any[]>([]);
  const [subCategories, setSubCategories] = useState<any[]>([]);

  const [mainCategoryId, setMainCategoryId] = useState("");
  const [subCategoryId, setSubCategoryId] = useState("");

  const [details, setDetails] = useState("");

  const [file, setFile] = useState<File | null>(null);
  const [previewUrl, setPreviewUrl] = useState("");
  const [isPreviewImage, setIsPreviewImage] = useState(false);

  /* ---------------- INIT LOAD ---------------- */
  useEffect(() => {
    customerCreationApi.list().then((res) => {
      const normalized = normalizeCustomerArray(res);
      setCustomers(filterActiveCustomers(normalized));
    });

    mobileApi.get("main-category/").then((res) =>
      setMainCategories(filterActiveRecords(listFromResponse(res.data)))
    );

    mobileApi.get("sub-category/").then((res) =>
      setAllSubCategories(filterActiveRecords(listFromResponse(res.data)))
    );
  }, []);

  /* ---------------- CUSTOMER → ZONE → WARD ---------------- */

  const loadZones = async (cid: number) => {
    const res = await desktopApi.get(`/zones/?customer=${cid}`);
    setZones(filterActiveRecords(listFromResponse(res.data)));
  };

  const loadWards = async (zid: string) => {
    const res = await desktopApi.get(`/wards/?zone=${zid}`);
    setWards(filterActiveRecords(listFromResponse(res.data)));
  };

  const onCustomerChange = (id: string) => {
    const c = customers.find((x) => String(x.id) === id);
    setCustomer(c);

    setContact(c?.contact_no ?? "");
    setAddress(
      c
        ? `${c.building_no}, ${c.street}, ${c.area}, ${c.city_name}, ${c.district_name}, ${c.state_name}, ${c.pincode}`
        : ""
    );

    setZone("");
    setWard("");
    setWards([]);

    if (c) loadZones(c.id);
  };

  /* ---------------- MAIN → SUB CATEGORY (FIXED) ---------------- */

  useEffect(() => {
    if (!mainCategoryId) {
      setSubCategories([]);
      setSubCategoryId("");
      return;
    }

    // Build accepted parent keys
    const parentKeys = new Set<string>();

    const selectedMain = mainCategories.find(
      (m) => resolveValue(m) === mainCategoryId
    );

    const add = (v: any) => {
      if (v !== undefined && v !== null) parentKeys.add(String(v));
    };

    add(mainCategoryId);
    if (selectedMain) {
      [
        selectedMain.id,
        selectedMain.pk,
        selectedMain.unique_id,
        selectedMain.uniqueId,
        selectedMain.value,
        selectedMain.code,
      ].forEach(add);
    }

    const filtered = allSubCategories.filter((sub) => {
      const refs = [
        sub.mainCategory,
        sub.main_category,
        sub.mainCategory_id,
        sub.main_category_id,
        sub.mainCategory_unique_id,
        sub.main_category_unique_id,
      ];

      return refs.some((r) => r !== undefined && parentKeys.has(String(r)));
    });

    setSubCategories(filtered);
    setSubCategoryId("");
  }, [mainCategoryId, allSubCategories, mainCategories]);

  /* ---------------- FILE ---------------- */

  const uploadFile = (e: any) => {
    const f = e.target.files?.[0];
    if (!f) return;

    setFile(f);

    if (f.type.startsWith("image/")) {
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
  };

  /* ---------------- SAVE ---------------- */

  const save = async (e: React.FormEvent) => {
    e.preventDefault();

    if (
      !customer ||
      !zone ||
      !ward ||
      !mainCategoryId ||
      !subCategoryId ||
      !details
    ) {
      Swal.fire("Missing Fields", "Please fill all required fields.", "warning");
      return;
    }

    const mainLabel = resolveMainCategoryLabel(
      mainCategories.find((m) => resolveValue(m) === mainCategoryId)
    );

    const subLabel =
      subCategories.find((s) => resolveValue(s) === subCategoryId)?.name || "";

    const fd = new FormData();
    fd.append("customer", String(customer.id));
    fd.append("zone", zone);
    fd.append("ward", ward);
    fd.append("contact_no", contact);
    fd.append("address", address);
    fd.append("main_category", mainLabel);
    fd.append("sub_category", subLabel);
    fd.append("category", "OTHER");
    fd.append("details", details);
    if (file) fd.append("image", file);

    try {
      await desktopApi.post("/complaints/", fd, {
        headers: { "Content-Type": "multipart/form-data" },
      });
      Swal.fire("Saved", "Complaint created successfully", "success");
      navigate(ENC_LIST_PATH);
    } catch {
      Swal.fire("Error", "Failed to save complaint", "error");
    }
  };

  /* ---------------- RENDER ---------------- */

  return (
    <ComponentCard title="Add Complaint">
      <form onSubmit={save}>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">

          <div>
            <Label>Customer *</Label>
            <Select value={customer ? String(customer.id) : undefined}
              onValueChange={onCustomerChange}>
              <SelectTrigger>
                <SelectValue placeholder="Select customer" />
              </SelectTrigger>
              <SelectContent>
                {customers.map((c) => (
                  <SelectItem key={c.id} value={String(c.id)}>
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
            <Select value={zone || undefined}
              onValueChange={(v) => {
                setZone(v);
                setWard("");
                loadWards(v);
              }}>
              <SelectTrigger>
                <SelectValue placeholder="Select zone" />
              </SelectTrigger>
              <SelectContent>
                {zones.map((z) => (
                  <SelectItem key={resolveValue(z)} value={resolveValue(z)}>
                    {z.name}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          <div>
            <Label>Ward *</Label>
            <Select value={ward || undefined} onValueChange={setWard}>
              <SelectTrigger>
                <SelectValue placeholder="Select ward" />
              </SelectTrigger>
              <SelectContent>
                {wards.map((w) => (
                  <SelectItem key={resolveValue(w)} value={resolveValue(w)}>
                    {w.name}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          <div>
            <Label>Main Category *</Label>
            <Select value={mainCategoryId || undefined}
              onValueChange={setMainCategoryId}>
              <SelectTrigger>
                <SelectValue placeholder="Select main category" />
              </SelectTrigger>
              <SelectContent>
                {mainCategories.map((m) => (
                  <SelectItem key={resolveValue(m)} value={resolveValue(m)}>
                    {resolveMainCategoryLabel(m)}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          <div>
            <Label>Sub Category *</Label>
            <Select value={subCategoryId || undefined}
              onValueChange={setSubCategoryId}>
              <SelectTrigger>
                <SelectValue placeholder="Select sub category" />
              </SelectTrigger>
              <SelectContent>
                {subCategories.map((s) => (
                  <SelectItem key={resolveValue(s)} value={resolveValue(s)}>
                    {s.name}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          <div className="md:col-span-2">
            <Label>Details *</Label>
            <Input value={details} onChange={(e) => setDetails(e.target.value)} />
          </div>

          <div>
            <Label>Complaint File</Label>
            <input type="file" hidden id="uploadBox" onChange={uploadFile} />
            <div
              className="border rounded p-4 cursor-pointer bg-gray-50"
              onClick={() => document.getElementById("uploadBox")?.click()}
            >
              {previewUrl ? (
                <img src={previewUrl} className="w-full h-24 object-contain" />
              ) : (
                <img src={FILE_ICON} className="w-12 h-12 mx-auto opacity-60" />
              )}
            </div>
            {previewUrl && (
              <button type="button" onClick={clearFile}
                className="text-sm text-red-500 mt-2">
                Remove
              </button>
            )}
          </div>

        </div>

        <div className="flex justify-end gap-3 mt-6">
          <button className="bg-green-custom text-white px-4 py-2 rounded">
            Save
          </button>
          <button type="button"
            onClick={() => navigate(ENC_LIST_PATH)}
            className="bg-red-400 text-white px-4 py-2 rounded">
            Cancel
          </button>
        </div>
      </form>
    </ComponentCard>
  );
}
