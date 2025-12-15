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
const { encCitizenGrivence, encMainComplaintCategory } = getEncryptedRoute();
const ENC_LIST_PATH = `/${encCitizenGrivence}/${encMainComplaintCategory}`;

export function MainComplaintCategoryForm() {
  const [mainCategoryName, setMainCategoryName] = useState("");
  const [isActive, setIsActive] = useState(true);
  const [loading, setLoading] = useState(false);

  const navigate = useNavigate();
  const { id } = useParams();
  const isEdit = Boolean(id);

  // fetch record
  useEffect(() => {
    if (isEdit) {
      mobileApi
        .get(`main-category/${id}/`)
        .then((res) => {
          const data = res.data;
          setMainCategoryName(data.main_categoryName);
          setIsActive(data.is_active);
        })
        .catch(() => {
          Swal.fire({
            icon: "error",
            title: "Failed to load record",
          });
        });
    }
  }, [id, isEdit]);

  // submit handler
  const handleSubmit = async (e: any) => {
    e.preventDefault();
    setLoading(true);

    const name = mainCategoryName.trim();
    if (!name) {
      Swal.fire({
        icon: "warning",
        title: "Missing category name",
        text: "Please enter a main category name.",
      });
      setLoading(false);
      return;
    }

    const payload = { main_categoryName: name, is_active: isActive };

    try {
      if (isEdit) {
        await mobileApi.put(`main-category/${id}/`, payload);
        Swal.fire({
          icon: "success",
          title: "Updated successfully!",
          timer: 1500,
          showConfirmButton: false,
        });
      } else {
        await mobileApi.post("main-category/", payload);
        Swal.fire({
          icon: "success",
          title: "Added successfully!",
          timer: 1500,
          showConfirmButton: false,
        });
      }

      navigate(ENC_LIST_PATH);

    } catch (err) {
      const respData = (err as any)?.response?.data;
      const message =
        typeof respData === "string"
          ? respData
          : respData && typeof respData === "object"
            ? Object.entries(respData)
              .map(([k, v]) =>
                Array.isArray(v) ? `${k}: ${v.join(", ")}` : `${k}: ${String(v)}`
              )
              .join("\n")
            : "Unable to save data";
      Swal.fire("Error", message, "error");
    } finally {
      setLoading(false);
    }
  };

  return (
    <ComponentCard
      title={isEdit ? "Edit Main Complaint Category" : "Add Main Complaint Category"}
    >
      <form onSubmit={handleSubmit}>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">

          {/* Category Name */}
          <div>
            <Label htmlFor="mainCategoryName">
              Category Name <span className="text-red-500">*</span>
            </Label>
            <Input
              id="mainCategoryName"
              type="text"
              required
              value={mainCategoryName}
              onChange={(e) => setMainCategoryName(e.target.value)}
              placeholder="Enter category name"
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

        {/* Action Buttons */}
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
