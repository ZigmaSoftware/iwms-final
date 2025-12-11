import { useEffect, useState } from "react";
import { useNavigate, useParams } from "react-router-dom";
import Swal from "sweetalert2";

import ComponentCard from "@/components/common/ComponentCard";
import Label from "@/components/form/Label";
import { Input } from "@/components/ui/input";

import { getEncryptedRoute } from "@/utils/routeCache";

import {
  Select,
  SelectTrigger,
  SelectValue,
  SelectContent,
  SelectItem,
} from "@/components/ui/select";

const { encMasters, encSubProperties } = getEncryptedRoute();

import { subPropertiesApi, propertiesApi } from "@/helpers/admin";


const ENC_LIST_PATH = `/${encMasters}/${encSubProperties}`;


export default function SubPropertyForm() {
  const [subPropertyName, setSubPropertyName] = useState("");
  const [propertyId, setPropertyId] = useState<string>(""); // ALWAYS controlled
  const [properties, setProperties] = useState<
    { unique_id: string; property_name: string; is_active?: boolean }[]
  >([]);
  const [isActive, setIsActive] = useState(true);
  const [loading, setLoading] = useState(false);

  const navigate = useNavigate();
  const { id } = useParams<{ id: string }>();
  const isEdit = Boolean(id);

  // ---------------------------------------------------
  // Fetch Property List
  // ---------------------------------------------------
  const fetchProperties = async () => {
    try {
      const res = await propertiesApi.list();
      setProperties(res);
    } catch (error) {
      Swal.fire({
        icon: "error",
        title: "Failed to load properties",
      });
    }
  };

  // ---------------------------------------------------
  // Fetch existing data for edit
  // ---------------------------------------------------
  useEffect(() => {
    fetchProperties();

    if (isEdit) {
      subPropertiesApi
        .get(id as string)
        .then((res) => {
          setSubPropertyName(res.sub_property_name);
          setIsActive(res.is_active);

          // Backend returns property → unique_id
          setPropertyId(String(res.property_id ?? res.property ?? ""));
        })
        .catch((err) => {
          Swal.fire({
            icon: "error",
            title: "Unable to load record",
            text: err.response?.data?.detail || "Something went wrong!",
          });
        });
    }
  }, [id, isEdit]);

  // ---------------------------------------------------
  // Save / Update
  // ---------------------------------------------------
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!subPropertyName || !propertyId) {
      Swal.fire({
        icon: "warning",
        title: "Missing Fields",
        text: "Select a property and enter sub property name.",
      });
      return;
    }

    setLoading(true);

    const payload = {
      sub_property_name: subPropertyName,
      property_id: propertyId, // FIXED → backend expects this
      is_active: isActive,
    };

    try {
      if (isEdit) {
        await subPropertiesApi.update(id as string, payload);
        Swal.fire({
          icon: "success",
          title: "Updated successfully!",
          timer: 1400,
          showConfirmButton: false,
        });
      } else {
        await subPropertiesApi.create(payload);
        Swal.fire({
          icon: "success",
          title: "Added successfully!",
          timer: 1400,
          showConfirmButton: false,
        });
      }

      navigate(ENC_LIST_PATH);
    } catch (error: any) {
      const data = error.response?.data;
      let message = "Failed to save.";

      if (typeof data === "object" && data !== null) {
        message = Object.entries(data)
          .map(([k, v]) => `${k}: ${(v as string[]).join(", ")}`)
          .join("\n");
      }

      Swal.fire({
        icon: "error",
        title: "Save Failed",
        text: message,
      });
    } finally {
      setLoading(false);
    }
  };

  // ---------------------------------------------------
  // UI
  // ---------------------------------------------------

  return (
    <ComponentCard title={isEdit ? "Edit Sub Property" : "Add Sub Property"}>
      <form onSubmit={handleSubmit} noValidate>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {/* Property dropdown */}
          <div>
            <Label htmlFor="property">Parent Property *</Label>

            <Select
              value={propertyId || ""}
              onValueChange={(val) => setPropertyId(val)}
            >
              <SelectTrigger id="property" className="input-validate w-full">
                <SelectValue placeholder="Select Property" />
              </SelectTrigger>

              <SelectContent>
                {properties
                  .filter((p) => p.is_active === true) // 🔥 Only active properties
                  .map((p) => (
                    <SelectItem key={p.unique_id} value={p.unique_id}>
                      {p.property_name}
                    </SelectItem>
                  ))}
              </SelectContent>
            </Select>
          </div>

          {/* Sub-property Name */}
          <div>
            <Label htmlFor="subPropertyName">Sub Property Name *</Label>
            <Input
              id="subPropertyName"
              type="text"
              className="input-validate w-full"
              placeholder="Enter Sub Property name"
              value={subPropertyName}
              onChange={(e) => setSubPropertyName(e.target.value)}
            />
          </div>

          {/* Status */}
          <div>
            <Label htmlFor="isActive">Status *</Label>

            <Select
              value={isActive ? "true" : "false"}
              onValueChange={(val) => setIsActive(val === "true")}
            >
              <SelectTrigger id="isActive" className="input-validate w-full">
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
          <button
            type="submit"
            disabled={loading}
            className="bg-green-custom text-white px-4 py-2 rounded disabled:opacity-50"
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
