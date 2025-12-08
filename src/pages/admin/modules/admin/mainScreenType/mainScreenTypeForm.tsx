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
import { adminApi } from "@/helpers/admin";

/* ------------------------------
    ROUTES
------------------------------ */
const encAdmins = encryptSegment("admins");
const encMainScreenType = encryptSegment("mainscreen-type");
const ENC_LIST_PATH = `/${encAdmins}/${encMainScreenType}`;

/* ------------------------------
    APIS
------------------------------ */
const mainScreenTypeApi = adminApi.mainscreentype;

/* ==========================================================
    COMPONENT START
========================================================== */
export default function MainScreenTypeForm() {
  /* FORM FIELDS */
  const [typeName, setTypeName] = useState("");
  const [isActive, setIsActive] = useState(true);

  /* STATES */
  const [loading, setLoading] = useState(false);

  const navigate = useNavigate();
  const { id } = useParams<{ id: string }>();
  const isEdit = Boolean(id);

  /* ==========================================================
      EDIT MODE — LOAD RECORD
  ========================================================== */
  useEffect(() => {
    if (!isEdit || !id) return;

    (async () => {
      try {
        const data = await mainScreenTypeApi.get(id);

        setTypeName(data.type_name ?? "");
        setIsActive(Boolean(data.is_active));
      } catch (err: any) {
        Swal.fire("Error", "Unable to load record.", "error");
      }
    })();
  }, [id, isEdit]);

  /* ==========================================================
      SUBMIT HANDLER
  ========================================================== */
  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault();

    if (!typeName.trim()) {
      Swal.fire("Missing Field", "Main Screen Type Name is required.", "warning");
      return;
    }

    setLoading(true);

    try {
      const payload = {
        type_name: typeName.trim(),
        is_active: isActive,
      };

      if (isEdit && id) {
        await mainScreenTypeApi.update(id, payload);
        Swal.fire("Success", "Updated successfully!", "success");
      } else {
        await mainScreenTypeApi.create(payload);
        Swal.fire("Success", "Added successfully!", "success");
      }

      navigate(ENC_LIST_PATH);
    } catch (err: any) {
      const message =
        err?.response?.data?.type_name?.[0] ||
        err?.response?.data?.detail ||
        "Unable to save.";

      Swal.fire("Save failed", message, "error");
    } finally {
      setLoading(false);
    }
  };

  /* ==========================================================
      JSX
  ========================================================== */
  return (
    <ComponentCard
      title={isEdit ? "Edit Main Screen Type" : "Add Main Screen Type"}
    >
      <form onSubmit={handleSubmit} noValidate>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">

          {/* Type Name */}
          <div>
            <Label>Main Screen Type Name *</Label>
            <Input
              value={typeName}
              onChange={(e) => setTypeName(e.target.value)}
              placeholder="Enter type name"
              className="input-validate w-full"
              required
            />
          </div>

          {/* Status */}
          <div>
            <Label>Status *</Label>
            <Select
              value={isActive ? "true" : "false"}
              onValueChange={(v) => setIsActive(v === "true")}
            >
              <SelectTrigger className="input-validate w-full">
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

          <Button
            type="button"
            variant="destructive"
            onClick={() => navigate(ENC_LIST_PATH)}
          >
            Cancel
          </Button>
        </div>
      </form>
    </ComponentCard>
  );
}
