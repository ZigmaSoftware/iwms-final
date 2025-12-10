import { useEffect, useState } from "react";
import { useNavigate, useParams } from "react-router-dom";
import Swal from "sweetalert2";

import { mobileApi } from "@/api";
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
import ComponentCard from "@/components/common/ComponentCard";

import { getEncryptedRoute } from "@/utils/routeCache";
const { encCitizenGrivence, encSubComplaintCategory } = getEncryptedRoute();
const ENC_LIST_PATH = `/${encCitizenGrivence}/${encSubComplaintCategory}`;

export default function SubComplaintCategoryForm() {
  const [name, setName] = useState("");
  const [mainCategory, setMainCategory] = useState<string>("");
  const [isActive, setIsActive] = useState(true);
  const [mainList, setMainList] = useState<any[]>([]);

  const [loading, setLoading] = useState(false);
  const navigate = useNavigate();
  const { id } = useParams();
  const isEdit = Boolean(id);

  // Load dropdown
  useEffect(() => {
    mobileApi.get("main-category/").then((res) => {
      const list = Array.isArray(res.data) ? res.data : res.data?.data || [];
      setMainList(list);
    });
  }, []);

  // Load edit data
  useEffect(() => {
    if (isEdit) {
      mobileApi.get(`sub-category/${id}/`).then(res => {
        const d = res.data.data || res.data;
        setName(d.name);
        setMainCategory(String(d.mainCategory));
        setIsActive(d.is_active);
      });
    }
  }, [id, isEdit]);

  const handleSubmit = async (e: any) => {
    e.preventDefault();
    setLoading(true);

    const payload = {
      name,
      mainCategory: mainCategory ? Number(mainCategory) : null,
      is_active: isActive,
    };

    try {
      if (isEdit) {
        await mobileApi.patch(`sub-category/${id}/`, payload);
        Swal.fire({
          icon: "success",
          title: "Updated successfully!",
          timer: 1500,
          showConfirmButton: false,
        });
      } else {
        await mobileApi.post("sub-category/", payload);
        Swal.fire({
          icon: "success",
          title: "Added successfully!",
          timer: 1500,
          showConfirmButton: false,
        });
      }

      navigate(ENC_LIST_PATH);

    } catch (err) {
      Swal.fire("Error", "Unable to save record.", "error");
    } finally {
      setLoading(false);
    }
  };

  return (
    <ComponentCard
      title={isEdit ? "Edit Sub Complaint Category" : "Add Sub Complaint Category"}
    >
      <form onSubmit={handleSubmit}>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">

          {/* Main Category */}
          <div>
            <Label htmlFor="mainCategory">
              Main Category <span className="text-red-500">*</span>
            </Label>

            <Select value={mainCategory} onValueChange={(val) => setMainCategory(val)}>
              <SelectTrigger className="input-validate w-full" id="mainCategory">
                <SelectValue placeholder="Select Main Category" />
              </SelectTrigger>
              <SelectContent>
                {mainList.map((m: any) => (
                  <SelectItem key={m.id ?? m.unique_id} value={String(m.id ?? m.unique_id)}>
                    {m.main_categoryName || m.name}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          {/* Sub Category Name */}
          <div>
            <Label htmlFor="name">
              Sub-Category Name <span className="text-red-500">*</span>
            </Label>

            <Input
              id="name"
              type="text"
              required
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder="Enter sub-category name"
              className="input-validate w-full"
            />
          </div>

          {/* Active Status */}
          <div>
            <Label htmlFor="isActive">
              Active Status <span className="text-red-500">*</span>
            </Label>

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

        {/* Buttons */}
        <div className="flex justify-end gap-3 mt-6">
          <Button type="submit" disabled={loading}>
            {loading
              ? isEdit
                ? "Updating..."
                : "Saving..."
              : isEdit
                ? "Update"
                : "Save"}
          </Button>

          <Button type="button" variant="destructive" onClick={() => navigate(ENC_LIST_PATH)}>
            Cancel
          </Button>
        </div>
      </form>
    </ComponentCard>
  );
}
