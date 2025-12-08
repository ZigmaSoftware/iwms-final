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
const encUserScreenAction = encryptSegment("userscreen-action");
const ENC_LIST_PATH = `/${encAdmins}/${encUserScreenAction}`;

/* ------------------------------
    UTILITIES
------------------------------ */
const extractError = (error: any): string => {
  if (error?.response?.data?.action_name) return error.response.data.action_name[0];
  if (error?.response?.data?.variable_name) return error.response.data.variable_name[0];
  if (error?.response?.data?.detail) return error.response.data.detail;
  return "Unexpected error!";
};

/* ==========================================================
    COMPONENT START
========================================================== */
export default function UserScreenActionForm() {
  const [actionName, setActionName] = useState("");
  const [variableName, setVariableName] = useState("");
  const [isActive, setIsActive] = useState(true);

  const [loading, setLoading] = useState(false);

  const api = adminApi.userscreenaction;
  const navigate = useNavigate();
  const { id } = useParams<{ id: string }>();
  const isEdit = Boolean(id);

  /* ==========================================================
      FETCH EDIT DATA
  ========================================================== */
  useEffect(() => {
    if (!isEdit || !id) return;

    (async () => {
      try {
        const data = await api.get(id);

        setActionName(data.action_name || "");
        setVariableName(data.variable_name || "");
        setIsActive(Boolean(data.is_active));
      } catch (err) {
        Swal.fire("Error", "Failed to load record", "error");
      }
    })();
  }, [id, isEdit]);

  /* ==========================================================
      SUBMIT HANDLER
  ========================================================== */
  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault();

    if (!actionName.trim() || !variableName.trim()) {
      Swal.fire("Validation", "All fields are mandatory.", "warning");
      return;
    }

    setLoading(true);

    const payload = {
      action_name: actionName.trim(),
      variable_name: variableName.trim(),
      is_active: isActive,
    };

    try {
      if (isEdit && id) {
        await api.update(id, payload);
        Swal.fire("Success", "Updated successfully!", "success");
      } else {
        await api.create(payload);
        Swal.fire("Success", "Added successfully!", "success");
      }

      navigate(ENC_LIST_PATH);
    } catch (err) {
      Swal.fire("Save failed", extractError(err), "error");
    } finally {
      setLoading(false);
    }
  };

  /* ==========================================================
      JSX
  ========================================================== */
  return (
    <ComponentCard title={isEdit ? "Edit User Screen Action" : "Add User Screen Action"}>
      <form onSubmit={handleSubmit} noValidate>
        
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">

          {/* Action Name */}
          <div>
            <Label>Action Name *</Label>
            <Input
              value={actionName}
              onChange={(e) => setActionName(e.target.value)}
              placeholder="Enter action name (e.g., add, edit, view)"
              required
              className="input-validate w-full"
            />
          </div>

          {/* Variable Name */}
          <div>
            <Label>Variable Name *</Label>
            <Input
              value={variableName}
              onChange={(e) => setVariableName(e.target.value)}
              placeholder="Enter variable name (e.g., premAdd)"
              required
              className="input-validate w-full"
            />
          </div>

          {/* Status */}
          <div>
            <Label>Active Status *</Label>
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

        {/* Actions */}
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
