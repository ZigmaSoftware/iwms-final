import { useEffect, useState } from "react";
import { useNavigate, useParams } from "react-router-dom";
import Swal from "sweetalert2";
import {desktopApi} from "@/api";
import { Input } from "@/components/ui/input";
import ComponentCard from "@/components/common/ComponentCard";
import Label from "@/components/form/Label";
import Select from "@/components/form/Select";
import { getEncryptedRoute } from "@/utils/routeCache";
import { adminApi } from "@/helpers/admin";

const { encMasters, encProperties } = getEncryptedRoute();

const ENC_LIST_PATH = `/${encMasters}/${encProperties}`;


function PropertyForm() {
  const [propertyName, setPropertyName] = useState("");
  const [isActive, setIsActive] = useState(true);
  const [loading, setLoading] = useState(false);
  const navigate = useNavigate();
  const { id } = useParams();
  const isEdit = Boolean(id);
  const propertiesApi = adminApi.properties;

  // Fetch existing data if editing
  useEffect(() => {
    if (isEdit) {
      propertiesApi
        .get(id as string)
        .then((res) => {
          setPropertyName(res.property_name);

          setIsActive(res.is_active);
        })
        .catch((err) => {
          console.error("Error fetching propertyData:", err);
          Swal.fire({
            icon: "error",
            title: "Failed to load propertyName",
            text: err.response?.data?.detail || "Something went wrong!",
          });
        });
    }
  }, [id, isEdit]);

  // Handle save
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    // 🔹 Basic validation BEFORE enabling loading or API call
    if (!propertyName) {
      Swal.fire({
        icon: "warning",
        title: "Missing Fields",
        text: "Please fill all the required fields before submitting.",
        confirmButtonColor: "#3085d6",
      });
      return; // Stop here if validation fails
    }
    setLoading(true);

    try {
      const payload = { property_name: propertyName, is_active: isActive };
      console.log(payload);

      if (isEdit) {
       
        await propertiesApi.update(id as string, payload);
        Swal.fire({
          icon: "success",
          title: "Updated successfully!",
          timer: 1500,
          showConfirmButton: false,
        });
      } else {
        await propertiesApi.create(payload);
        Swal.fire({
          icon: "success",
          title: "Added successfully!",
          timer: 1500,
          showConfirmButton: false,
        });
      }

      navigate(ENC_LIST_PATH);
    } catch (error: any) {
      console.error("Failed to save:", error);

      const data = error.response?.data;
      let message = "Something went wrong while saving.";

      if (typeof data === "object" && data !== null) {
        message = Object.entries(data)
          .map(([key, val]) => `${key}: ${(val as string[]).join(", ")}`)
          .join("\n");
      } else if (typeof data === "string") {
        message = data;
      }

      Swal.fire({
        icon: "error",
        title: "Save failed",
        text: message,
      });
    } finally {
      setLoading(false);
    }
  };

  return (
    <ComponentCard title={isEdit ? "Edit Property" : "Add Property"}>
      <form onSubmit={handleSubmit} noValidate>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {/*Property Name */}
          <div>
            <Label htmlFor="name">
              Property Name <span className="text-red-500">*</span>
            </Label>
            <Input
              id="propertyName"
              type="text"
              value={propertyName}
              onChange={(e) => setPropertyName(e.target.value)}
              placeholder="Enter Property Name"
              className="input-validate w-full"
              required
            />
          </div>

          {/* Active Status */}
          <div>
            <Label htmlFor="isActive">
              Active Status <span className="text-red-500">*</span>
            </Label>
            <Select
              id="isActive"
              value={isActive ? "true" : "false"}
              onChange={(val) => setIsActive(val === "true")}
              options={[
                { value: "true", label: "Active" },
                { value: "false", label: "Inactive" },
              ]}
              className="input-validate w-full"
              required
            />
          </div>
        </div>

        {/* Buttons */}
        <div className="flex justify-end gap-3 mt-6">
          <button
            type="submit"
            disabled={loading}
            className="bg-green-custom text-white px-4 py-2 rounded disabled:opacity-50 transition-colors"
          >
            {loading
              ? isEdit
                ? "Updating..."
                : "Saving..."
              : isEdit
                ? "Update"
                : "Save"}
          </button>
          <button
            type="button"
            onClick={() => navigate(ENC_LIST_PATH)}
            className="bg-red-400 text-white px-4 py-2 rounded hover:bg-red-500"
          >
            Cancel
          </button>
        </div>
      </form>
    </ComponentCard>
  );
}

export default PropertyForm;
