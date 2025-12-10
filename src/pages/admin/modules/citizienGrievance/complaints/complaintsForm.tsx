import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { desktopApi, mobileApi } from "@/api";
import Swal from "sweetalert2";
import ComponentCard from "@/components/common/ComponentCard";
import Label from "@/components/form/Label";
import Select from "@/components/form/Select";
import Input from "@/components/form/input/InputField";
import { getEncryptedRoute } from "@/utils/routeCache";
import {
  filterActiveCustomers,
  filterActiveRecords,
  normalizeCustomerArray,
} from "@/utils/customerUtils";

const listFromResponse = (payload: any) => {
  if (Array.isArray(payload)) return payload;
  if (Array.isArray(payload?.data)) return payload.data;
  if (Array.isArray(payload?.results)) return payload.results;
  return [];
};

const FILE_ICON =
  "https://cdn-icons-png.flaticon.com/512/337/337946.png"; // fallback for pdf/doc

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
  const [mainCategoryId, setMainCategoryId] = useState("");
  const [subCategoryId, setSubCategoryId] = useState("");
  const [mainCategories, setMainCategories] = useState<any[]>([]);
  const [allSubCategories, setAllSubCategories] = useState<any[]>([]);
  const [subCategories, setSubCategories] = useState<any[]>([]);
  const [details, setDetails] = useState("");

  const [file, setFile] = useState<File | null>(null);
  const [previewUrl, setPreviewUrl] = useState("");
  const [isPreviewImage, setIsPreviewImage] = useState(false);

  const resolveOptionValue = (item: any) => {
    if (!item) return "";
    if (item.unique_id !== undefined && item.unique_id !== null) {
      return String(item.unique_id);
    }
    if (item.id !== undefined && item.id !== null) {
      return String(item.id);
    }
    return "";
  };

  const fetchCustomers = async () => {
    try {
      const res = await desktopApi.get("/customercreations/");
      const normalized = normalizeCustomerArray(res.data);
      setCustomers(filterActiveCustomers(normalized));
    } catch (err) {
      console.error("Failed to fetch customers:", err);
    }
  };

  const loadMainCategories = async () => {
    try {
      const res = await mobileApi.get("main-category/");
      const list = listFromResponse(res.data);
      setMainCategories(filterActiveRecords(list));
    } catch (error) {
      console.error("Failed to load main categories:", error);
    }
  };

  const loadSubCategoryMaster = async () => {
    try {
      const res = await mobileApi.get("sub-category/");
      const list = listFromResponse(res.data);
      setAllSubCategories(filterActiveRecords(list));
    } catch (error) {
      console.error("Failed to load sub categories:", error);
    }
  };

  useEffect(() => {
    fetchCustomers();
    loadMainCategories();
    loadSubCategoryMaster();
  }, []);

  const loadZones = async (cid: number) => {
    const res = await desktopApi.get(`/zones/?customer=${cid}`);
    setZones(filterActiveRecords(listFromResponse(res.data)));
  };

  const loadWards = async (zid: string | number) => {
    const res = await desktopApi.get(`/wards/?zone=${zid}`);
    setWards(filterActiveRecords(listFromResponse(res.data)));
  };

  const findOptionByValue = (items: any[], value: string) =>
    items.find((item) => {
      const optionValue = resolveOptionValue(item);
      if (optionValue && optionValue === value) return true;
      const alt =
        item?.id ??
        item?.pk ??
        item?.unique_id ??
        item?.uniqueId ??
        item?.value ??
        item?.code;
      return alt !== undefined && alt !== null && String(alt) === value;
    });

  const resolveSubmitValue = (items: any[], value: string) => {
    if (!value) return "";
    const option = findOptionByValue(items, value);
    if (!option) return value;
    const raw =
      option.id ??
      option.pk ??
      option.unique_id ??
      option.uniqueId ??
      option.value ??
      option.code ??
      value;
    return raw === undefined || raw === null ? value : String(raw);
  };

  const onCustomerChange = (id: string) => {
    const c = customers.find((x) => String(x.id) === id || x.id === Number(id));
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
    if (c) {
      loadZones(c.id);
    } else {
      setZones([]);
    }
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

  const findMainCategory = (value: string) =>
    mainCategories.find((cat) => resolveOptionValue(cat) === value);

  const findSubCategory = (value: string) =>
    allSubCategories.find((cat) => resolveOptionValue(cat) === value);

  const handleMainCategoryChange = (value: string) => {
    setMainCategoryId(value);
  };

  const getMainCategoryLabel = () =>
    findMainCategory(mainCategoryId)?.main_categoryName ||
    findMainCategory(mainCategoryId)?.name ||
    "";

  const getSubCategoryLabel = () =>
    findSubCategory(subCategoryId)?.name || "";

  useEffect(() => {
    if (!mainCategoryId) {
      setSubCategories([]);
      setSubCategoryId("");
      return;
    }

    const selectedMain = findMainCategory(mainCategoryId);
    const acceptedParentValues = new Set<string>();
    const addValue = (val: any) => {
      if (val === undefined || val === null) return;
      const normalized = String(val);
      if (normalized) acceptedParentValues.add(normalized);
    };

    addValue(mainCategoryId);
    if (selectedMain) {
      [
        selectedMain.id,
        selectedMain.pk,
        selectedMain.unique_id,
        selectedMain.uniqueId,
        selectedMain.value,
        selectedMain.code,
      ].forEach(addValue);
    }

    const filtered = allSubCategories.filter((sub) => {
      const parentCandidates = [
        sub.mainCategory,
        sub.mainCategory_id,
        sub.mainCategoryId,
        sub.main_category,
        sub.main_category_id,
        sub.mainCategory_unique_id,
        sub.main_category_unique_id,
      ];

      return parentCandidates.some((value) => {
        if (value === undefined || value === null) return false;
        return acceptedParentValues.has(String(value));
      });
    });

    setSubCategories(filtered);
    setSubCategoryId((current) =>
      filtered.some((sub) => resolveOptionValue(sub) === current)
        ? current
        : ""
    );
  }, [mainCategoryId, allSubCategories]);

  const clearFile = () => {
    if (previewUrl.startsWith("blob:")) URL.revokeObjectURL(previewUrl);

    setFile(null);
    setPreviewUrl("");
    setIsPreviewImage(false);

    const input = document.getElementById("uploadBox") as HTMLInputElement | null;
    if (input) input.value = "";
  };

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

    const zoneSubmitValue = resolveSubmitValue(zones, zone);
    const wardSubmitValue = resolveSubmitValue(wards, ward);

    if (!zoneSubmitValue || !wardSubmitValue) {
      Swal.fire(
        "Missing Fields",
        "Selected zone/ward is invalid. Please re-select and try again.",
        "warning"
      );
      return;
    }

    const mainLabel = getMainCategoryLabel();
    const subLabel = getSubCategoryLabel();

    const fd = new FormData();
    fd.append("customer", String(customer.id));
    fd.append("zone", zoneSubmitValue);
    fd.append("ward", wardSubmitValue);
    fd.append("contact_no", contact || "");
    fd.append("address", address || "");
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
    } catch (error: any) {
      console.error("Complaint save failed:", error);
      const message =
        error?.response?.data &&
        typeof error.response.data === "object" &&
        !Array.isArray(error.response.data)
          ? JSON.stringify(error.response.data)
          : "Failed to save complaint";
      Swal.fire("Error", message, "error");
    }
  };

  return (
    <ComponentCard title="Add Complaint">
      <form onSubmit={save}>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">

          <div>
            <Label>Customer *</Label>
            <Select
              value={customer ? String(customer.id ?? customer.unique_id) : ""}
              required
              onChange={onCustomerChange}
              options={customers.map((c) => ({
                value: String(c.id ?? c.unique_id),
                label: c.customer_name,
              }))}
            />
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
              required
              value={zone}
              onChange={(v) => {
                setZone(v);
                setWard("");
                loadWards(v);
              }}
              options={zones.map((z) => ({
                value: resolveOptionValue(z),
                label: z.name,
              }))}
            />
          </div>

          <div>
            <Label>Ward *</Label>
            <Select
              required
              value={ward}
              onChange={(v) => setWard(v)}
              options={wards.map((w) => ({
                value: resolveOptionValue(w),
                label: w.name,
              }))}
            />
          </div>

          <div>
            <Label>Main Category *</Label>
            <Select
              required
              value={mainCategoryId}
              onChange={handleMainCategoryChange}
              options={mainCategories.map((cat) => ({
                value: resolveOptionValue(cat),
                label: cat.main_categoryName || cat.name,
              }))}
            />
          </div>

          <div>
            <Label>Sub Category *</Label>
            <Select
              required
              value={subCategoryId}
              onChange={(v) => setSubCategoryId(v)}
              options={subCategories.map((sub) => ({
                value: resolveOptionValue(sub),
                label: sub.name,
              }))}
            />
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
                <button
                  type="button"
                  onClick={() => {
                    if (isPreviewImage) {
                      window.open(previewUrl, "_blank");
                    } else {
                      window.open(URL.createObjectURL(file!), "_blank");
                    }
                  }}
                  className="bg-gray-300 hover:bg-gray-200 text-white px-3 py-1 rounded text-sm"
                >
                  Preview
                </button>

                {/* Remove */}
                <button
                  type="button"
                  onClick={clearFile}
                  className="bg-red-400 hover:bg-red-300 text-white px-3 py-1 rounded text-sm"
                >
                  Remove
                </button>

              </div>
            )}
          </div>
        </div>

        <div className="flex justify-end gap-3 mt-6">
          <button className="bg-green-custom text-white px-4 py-2 rounded">
            Save
          </button>
          <button
            type="button"
            onClick={() => navigate(ENC_LIST_PATH)}
            className="bg-red-400 text-white px-4 py-2 rounded"
          >
            Cancel
          </button>
        </div>
      </form>
    </ComponentCard>
  );
}
