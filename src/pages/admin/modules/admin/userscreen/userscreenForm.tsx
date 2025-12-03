import { useEffect, useState } from "react";
import { useNavigate, useParams } from "react-router-dom";
import Swal from "sweetalert2";
import {desktopApi} from "@/api";
import { Input } from "@/components/ui/input";
import ComponentCard from "@/components/common/ComponentCard";
import Label from "@/components/form/Label";
import Select from "./selects";
import { getEncryptedRoute } from "@/utils/routeCache";

const { encAdmins, encUserScreen } = getEncryptedRoute();
const ENC_LIST_PATH = `/${encAdmins}/${encUserScreen}`;

interface PermissionSet {
  all: boolean;
  add: boolean;
  update: boolean;
  list: boolean;
  delete: boolean;
  view: boolean;
  print: boolean;
}

interface FormData {
  mainscreen: string | number;
  screen_name: string;
  folder_name: string;
  order_no: string | number;
  icon: string;
  description: string;
  is_active: boolean;
  permissions: PermissionSet;
}

interface MainScreenOption {
  id: number;
  mainscreen: string;
}

export default function UserScreenForm() {
  const [mainScreens, setMainScreens] = useState<MainScreenOption[]>([]);
  const [formData, setFormData] = useState<FormData>({
    mainscreen: "",
    screen_name: "",
    folder_name: "",
    order_no: "",
    icon: "",
    description: "",
    is_active: true,
    permissions: {
      all: false,
      add: false,
      update: false,
      list: false,
      delete: false,
      view: false,
      print: false,
    },
  });

  const navigate = useNavigate();
  const { id } = useParams();
  const isEdit = Boolean(id && id !== "new");

  useEffect(() => {
    const load = async () => {
      try {
        const main = await desktopApi.get("mainuserscreen/");
        const mainScreensData: any[] = Array.isArray(main.data)
          ? main.data
          : Array.isArray(main.data?.results)
          ? main.data.results
          : [];
        const activeMainScreens = mainScreensData
          .filter((item) => item.is_active && !item.is_delete)
          .map((item) => ({
            id: item.id,
            mainscreen: item.mainscreen,
          }));

        setMainScreens(activeMainScreens);

        if (id && id !== "new") {
          const res = await desktopApi.get(`userscreens/${id}/`);
          const d = res.data;
          setFormData({
            mainscreen: String(d.mainscreen),
            screen_name: d.screen_name || "",
            folder_name: d.folder_name || "",
            order_no: d.order_no || "",
            icon: d.icon || "",
            description: d.description || "",
            is_active: d.is_active,
            permissions: d.permissions || {
              all: false,
              add: false,
              update: false,
              list: false,
              delete: false,
              view: false,
              print: false,
            },
          });

          const selectedMainScreenId = Number(d.mainscreen);
          if (
            d.mainscreen &&
            !Number.isNaN(selectedMainScreenId) &&
            !activeMainScreens.some((screen) => screen.id === selectedMainScreenId)
          ) {
            const fallbackName =
              d.mainscreen_name ||
              d.mainscreen ||
              `Main Screen ${selectedMainScreenId}`;
            setMainScreens((prev) => [
              ...prev,
              { id: selectedMainScreenId, mainscreen: fallbackName },
            ]);
          }
        }
      } catch (err) {
        console.error("Fetch failed:", err);
        Swal.fire("Error", "Failed to load data", "error");
      }
    };
    load();
  }, [id]);

  const handleChange = (key: keyof FormData, value: any) =>
    setFormData((p) => ({ ...p, [key]: value }));

  const handlePermissionChange = (perm: keyof PermissionSet) => {
    if (perm === "all") {
      const newVal = !formData.permissions.all;
      const updated = Object.keys(formData.permissions).reduce(
        (acc, k) => ({ ...acc, [k]: newVal }),
        {} as PermissionSet
      );
      setFormData((p) => ({ ...p, permissions: updated }));
    } else {
      const updated = { ...formData.permissions, [perm]: !formData.permissions[perm] };
      const allSelected = Object.entries(updated)
        .filter(([k]) => k !== "all")
        .every(([_, v]) => v);
      setFormData((p) => ({ ...p, permissions: { ...updated, all: allSelected } }));
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    const payload = {
      mainscreen: Number(formData.mainscreen),
      screen_name: formData.screen_name.trim(),
      folder_name: formData.folder_name.trim(),
      order_no: Number(formData.order_no) || 1,
      icon: formData.icon.trim(),
      description: formData.description.trim(),
      is_active: Boolean(formData.is_active),
      permissions: formData.permissions,
    };

    try {
      if (isEdit && id && id !== "new") {
        await desktopApi.put(`userscreens/${id}/`, payload);
      } else {
        await desktopApi.post("userscreens/", payload);
      }

      Swal.fire({
        icon: "success",
        title: isEdit ? "Updated!" : "Added!",
        timer: 1500,
        showConfirmButton: false,
      });

      // ensure list reloads when we navigate back
      navigate(ENC_LIST_PATH, { state: { refreshed: Date.now() } });
    } catch (err: any) {
      console.error("Save failed:", err.response?.data || err.message);
      Swal.fire({
        icon: "error",
        title: "Save failed",
        text: JSON.stringify(err.response?.data || err.message),
      });
    }
  };

  return (
    <ComponentCard title={isEdit ? "Edit User Screen" : "Add User Screen"}>
      <form onSubmit={handleSubmit}>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <div>
            <Label>Main Screen</Label>
            <Select
              required
              value={String(formData.mainscreen)}
              onChange={(val) => handleChange("mainscreen", val)}
              options={mainScreens.map((m) => ({
                value: String(m.id),
                label: m.mainscreen,
              }))}
            />
          </div>

          <div>
            <Label>Screen Name</Label>
            <Input
              value={formData.screen_name}
              onChange={(e) => handleChange("screen_name", e.target.value)}
              required
            />
          </div>

          <div>
            <Label>Folder Name</Label>
            <Input
              value={formData.folder_name}
              onChange={(e) => handleChange("folder_name", e.target.value)}
            />
          </div>

          <div>
            <Label>Order No</Label>
            <Input
              type="number"
              value={formData.order_no}
              onChange={(e) => handleChange("order_no", e.target.value)}
            />
          </div>

          <div>
            <Label>Icon</Label>
            <Input
              value={formData.icon}
              onChange={(e) => handleChange("icon", e.target.value)}
            />
          </div>

          <div>
            <Label>Description</Label>
            <Input
              value={formData.description}
              onChange={(e) => handleChange("description", e.target.value)}
            />
          </div>

          <div>
            <Label>Status</Label>
            <select
              value={formData.is_active ? "true" : "false"}
              onChange={(e) => handleChange("is_active", e.target.value === "true")}
              className="border rounded px-3 py-2 w-full"
            >
              <option value="true">Active</option>
              <option value="false">Inactive</option>
            </select>
          </div>
        </div>

        <div className="mt-4">
          <Label>Permissions</Label>
          <div className="flex flex-wrap gap-4 mt-2">
            {Object.keys(formData.permissions).map((perm) => {
              const checked = formData.permissions[perm as keyof PermissionSet];
              return (
                <label
                  key={perm}
                  className={`flex items-center gap-2 px-3 py-1 border rounded ${
                    checked
                      ? "bg-green-100 border-green-400 text-green-700"
                      : "border-gray-300 hover:border-green-300"
                  }`}
                >
                  <input
                    type="checkbox"
                    className="accent-green-600"
                    checked={checked}
                    onChange={() => handlePermissionChange(perm as keyof PermissionSet)}
                  />
                  {perm.charAt(0).toUpperCase() + perm.slice(1)}
                </label>
              );
            })}
          </div>
        </div>

        <div className="flex justify-end gap-3 mt-6">
          <button
            type="submit"
            className="bg-green-600 text-white px-4 py-2 rounded hover:bg-green-700"
          >
            {isEdit ? "Update" : "Save"}
          </button>
          <button
            type="button"
            onClick={() => navigate(ENC_LIST_PATH)}
            className="bg-red-500 text-white px-4 py-2 rounded hover:bg-red-600"
          >
            Cancel
          </button>
        </div>
      </form>
    </ComponentCard>
  );
}
