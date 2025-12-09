import { useEffect, useState, type FormEvent } from "react";
import { useNavigate, useParams } from "react-router-dom";
import Swal from "sweetalert2";

import ComponentCard from "@/components/common/ComponentCard";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Button } from "@/components/ui/button";
import {
  Select,
  SelectTrigger,
  SelectValue,
  SelectContent,
  SelectItem,
} from "@/components/ui/select";

import { encryptSegment } from "@/utils/routeCrypto";
import { adminApi } from "@/helpers/admin";

/* ------------------------------
    ROUTES
------------------------------ */
const encAdmins = encryptSegment("admins");
const encUserScreenPermission = encryptSegment("userscreenpermissions");
const ENC_LIST_PATH = `/${encAdmins}/${encUserScreenPermission}`;

/* ------------------------------
    APIS
------------------------------ */
const userTypeApi = adminApi.userTypes;
const staffUserTypeApi = adminApi.staffUserTypes;
const mainScreenApi = adminApi.mainscreens;
const userScreenApi = adminApi.userscreens;
const userScreenActionApi = adminApi.userscreenaction;
const userScreenPermissionApi = adminApi.userscreenpermissions;

/* ------------------------------
    TYPES
------------------------------ */
type Option = { value: string; label: string };

/* ==========================================================
    COMPONENT START
========================================================== */
export default function UserScreenPermissionForm() {
  const navigate = useNavigate();
  const { id } = useParams<{ id: string }>();
  const isEdit = Boolean(id);

  /* Form Fields */
  const [userTypeId, setUserTypeId] = useState("");
  const [staffUserTypeId, setStaffUserTypeId] = useState("");
  const [mainScreenId, setMainScreenId] = useState("");
  const [userScreenId, setUserScreenId] = useState("");
  const [description, setDescription] = useState("");

  /* Options */
  const [userTypes, setUserTypes] = useState<Option[]>([]);
  const [staffUserTypes, setStaffUserTypes] = useState<Option[]>([]);
  const [mainScreens, setMainScreens] = useState<Option[]>([]);
  const [userScreens, setUserScreens] = useState<Option[]>([]);
  const [actions, setActions] = useState<Option[]>([]);
  const [selectedActions, setSelectedActions] = useState<string[]>([]);

  const [loading, setLoading] = useState(false);

  /* ==========================================================
      LOAD MASTER DATA
  ========================================================== */
  useEffect(() => {
    const loadAll = async () => {
      try {
        const ut = await userTypeApi.list();
        const sut = await staffUserTypeApi.list();
        const ms = await mainScreenApi.list();
        const us = await userScreenApi.list();
        const ac = await userScreenActionApi.list();

        setUserTypes(ut.map((x: any) => ({ value: x.unique_id, label: x.name })));
        setStaffUserTypes(sut.map((x: any) => ({ value: x.unique_id, label: x.name })));
        setMainScreens(ms.map((x: any) => ({ value: x.unique_id, label: x.mainscreen_name })));
        setUserScreens(us.map((x: any) => ({ value: x.unique_id, label: x.userscreen_name })));
        setActions(ac.map((x: any) => ({ value: x.unique_id, label: x.action_name })));
      } catch (err) {
        Swal.fire("Error", "Failed to load master data.", "error");
      }
    };

    loadAll();
  }, []);

  /* ==========================================================
      SUBMIT HANDLER
  ========================================================== */
  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault();

    if (!userTypeId || !staffUserTypeId || !mainScreenId || !userScreenId) {
      Swal.fire("Missing Fields", "All required fields must be selected.", "warning");
      return;
    }
    if (selectedActions.length === 0) {
      Swal.fire("Missing Actions", "Select at least one user action.", "warning");
      return;
    }

    const payload = {
      usertype_id: userTypeId,
      staffusertype_id: staffUserTypeId,
      mainscreen_id: mainScreenId,
      userscreen_id: userScreenId,
      userscreenaction_ids: selectedActions,
      description: description.trim(),
    };

    setLoading(true);

    try {
      await userScreenPermissionApi.action("bulk-create", payload);

      Swal.fire("Success", "Permissions saved successfully!", "success");
      navigate(ENC_LIST_PATH);
    } catch (err: any) {
      Swal.fire("Error", "Failed to save permissions.", "error");
    } finally {
      setLoading(false);
    }
  };

  /* ==========================================================
      JSX
  ========================================================== */
  return (
    <ComponentCard title="User Screen Permission">
      <form onSubmit={handleSubmit} noValidate>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">

          {/* User Type */}
          <div>
            <Label>User Type *</Label>
            <Select value={userTypeId} onValueChange={setUserTypeId}>
              <SelectTrigger className="input-validate w-full">
                <SelectValue placeholder="Select User Type" />
              </SelectTrigger>
              <SelectContent>
                {userTypes.map((opt) => (
                  <SelectItem key={opt.value} value={opt.value}>
                    {opt.label}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          {/* Staff User Type */}
          <div>
            <Label>Staff User Type *</Label>
            <Select value={staffUserTypeId} onValueChange={setStaffUserTypeId}>
              <SelectTrigger className="input-validate w-full">
                <SelectValue placeholder="Select Staff User Type" />
              </SelectTrigger>
              <SelectContent>
                {staffUserTypes.map((opt) => (
                  <SelectItem key={opt.value} value={opt.value}>
                    {opt.label}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          {/* Main Screen */}
          <div>
            <Label>Main Screen *</Label>
            <Select value={mainScreenId} onValueChange={setMainScreenId}>
              <SelectTrigger className="input-validate w-full">
                <SelectValue placeholder="Select Main Screen" />
              </SelectTrigger>
              <SelectContent>
                {mainScreens.map((opt) => (
                  <SelectItem key={opt.value} value={opt.value}>
                    {opt.label}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          {/* User Screen */}
          <div>
            <Label>User Screen *</Label>
            <Select value={userScreenId} onValueChange={setUserScreenId}>
              <SelectTrigger className="input-validate w-full">
                <SelectValue placeholder="Select User Screen" />
              </SelectTrigger>
              <SelectContent>
                {userScreens.map((opt) => (
                  <SelectItem key={opt.value} value={opt.value}>
                    {opt.label}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          {/* User Screen Actions - Checkbox List */}
          <div className="md:col-span-2">
            <Label>User Actions *</Label>
            <div className="grid grid-cols-2 md:grid-cols-4 gap-3 mt-2">
              {actions.map((act) => (
                <label key={act.value} className="flex items-center gap-2 p-2 border rounded-md">
                  <input
                    type="checkbox"
                    checked={selectedActions.includes(act.value)}
                    onChange={(e) => {
                      if (e.target.checked) {
                        setSelectedActions([...selectedActions, act.value]);
                      } else {
                        setSelectedActions(selectedActions.filter((x) => x !== act.value));
                      }
                    }}
                  />
                  <span>{act.label}</span>
                </label>
              ))}
            </div>
          </div>

          {/* Description */}
          <div className="md:col-span-2">
            <Label>Description</Label>
            <Input
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              placeholder="Enter description"
            />
          </div>

        </div>

        {/* Buttons */}
        <div className="flex justify-end gap-3 mt-6">
          <Button disabled={loading} type="submit">
            {loading ? "Saving..." : "Save"}
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
