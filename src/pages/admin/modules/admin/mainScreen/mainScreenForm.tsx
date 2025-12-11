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


/* ------------------------------
    ROUTES
------------------------------ */
const encAdmins = encryptSegment("admins");
const encMainScreens = encryptSegment("mainscreens");
const ENC_LIST_PATH = `/${encAdmins}/${encMainScreens}`;

/* ------------------------------
    APIs
------------------------------ */

import {
  mainScreenTypeApi,
  mainScreenApi
} from "@/helpers/admin";


/* ==========================================================
      COMPONENT
========================================================== */
export default function MainScreenForm() {
  /* FORM FIELDS */
  const [mainscreenName, setMainScreenName] = useState("");
  const [iconName, setIconName] = useState("");
  const [orderNo, setOrderNo] = useState<number | string>("");
  const [description, setDescription] = useState("");
  const [mainscreenTypeId, setMainScreenTypeId] = useState<string>("");

  /* DROPDOWN DATA */
  const [mainScreenTypes, setMainScreenTypes] = useState<
    { value: string; label: string }[]
  >([]);

  /* STATE */
  const [isActive, setIsActive] = useState(true);
  const [loading, setLoading] = useState(false);

  const { id } = useParams<{ id: string }>();
  const isEdit = Boolean(id);

  const navigate = useNavigate();

  /* ==========================================================
      LOAD MAINSCREEN TYPES
  ========================================================== */
  useEffect(() => {
    (async () => {
      try {
        const res = await mainScreenTypeApi.list();
        const mapped = res
          .filter((x: any) => x.is_active)
          .map((x: any) => ({
            value: String(x.unique_id),
            label: x.type_name,
          }));
        setMainScreenTypes(mapped);
      } catch (err) {
        Swal.fire("Error", "Failed to load screen types.", "error");
      }
    })();
  }, []);

  /* ==========================================================
      EDIT MODE — LOAD RECORD
  ========================================================== */
  useEffect(() => {
    if (!isEdit || !id) return;

    (async () => {
      try {
        const data = await mainScreenApi.get(id);

        setMainScreenName(data.mainscreen_name ?? "");
        setIconName(data.icon_name ?? "");
        setOrderNo(data.order_no ?? "");
        setDescription(data.description ?? "");
        setMainScreenTypeId(data.mainscreentype_id ?? "");
        setIsActive(Boolean(data.is_active));
      } catch (err) {
        Swal.fire("Error", "Unable to load record.", "error");
      }
    })();
  }, [isEdit, id]);

  /* ==========================================================
      SUBMIT
  ========================================================== */
  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault();

    if (!mainscreenName.trim() || !mainscreenTypeId) {
      Swal.fire("Missing Fields", "Name and Type are required.", "warning");
      return;
    }

    setLoading(true);

    try {
      const payload = {
        mainscreen_name: mainscreenName.trim(),
        icon_name: iconName.trim(),
        order_no: Number(orderNo) || 0,
        description: description.trim(),
        mainscreentype_id: mainscreenTypeId,
        is_active: isActive,
      };

      if (isEdit && id) {
        await mainScreenApi.update(id, payload);
        Swal.fire("Success", "Updated successfully!", "success");
      } else {
        await mainScreenApi.create(payload);
        Swal.fire("Success", "Added successfully!", "success");
      }

      navigate(ENC_LIST_PATH);
    } catch (err: any) {
      Swal.fire(
        "Save Failed",
        err?.response?.data?.detail || "Unable to save record.",
        "error"
      );
    } finally {
      setLoading(false);
    }
  };

  /* ==========================================================
      JSX
  ========================================================== */
  return (
    <ComponentCard
      title={isEdit ? "Edit Main Screen" : "Add Main Screen"}
    >
      <form onSubmit={handleSubmit} noValidate>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          
          {/* MainScreen Type */}
          <div>
            <Label>Main Screen Type *</Label>
            <Select
              value={mainscreenTypeId}
              onValueChange={(v) => setMainScreenTypeId(v)}
            >
              <SelectTrigger className="input-validate w-full">
                <SelectValue placeholder="Select Type" />
              </SelectTrigger>
              <SelectContent>
                {mainScreenTypes.length === 0 ? (
                  <div className="px-3 py-2 text-sm text-muted-foreground">
                    No types found
                  </div>
                ) : (
                  mainScreenTypes.map((opt) => (
                    <SelectItem key={opt.value} value={opt.value}>
                      {opt.label}
                    </SelectItem>
                  ))
                )}
              </SelectContent>
            </Select>
          </div>

          {/* Name */}
          <div>
            <Label>Main Screen Name *</Label>
            <Input
              value={mainscreenName}
              onChange={(e) => setMainScreenName(e.target.value)}
              placeholder="Enter main screen name"
              className="input-validate w-full"
              required
            />
          </div>

          {/* Icon Name */}
          <div>
            <Label>Icon Name</Label>
            <Input
              value={iconName}
              onChange={(e) => setIconName(e.target.value)}
              placeholder="Enter icon class"
              className="input-validate w-full"
            />
          </div>

          {/* Order No */}
          <div>
            <Label>Order No</Label>
            <Input
              type="number"
              value={orderNo}
              onChange={(e) => setOrderNo(e.target.value)}
              placeholder="Enter order number"
              className="input-validate w-full"
            />
          </div>

          {/* Description */}
          <div className="md:col-span-2">
            <Label>Description</Label>
            <Input
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              placeholder="Enter description"
              className="input-validate w-full"
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
