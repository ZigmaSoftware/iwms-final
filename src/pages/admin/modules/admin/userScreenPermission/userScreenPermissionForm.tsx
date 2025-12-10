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

/* ---------------------------------------------------------
   ROUTES
--------------------------------------------------------- */
const ENC_LIST_PATH = `/${encryptSegment("admins")}/${encryptSegment(
  "userscreenpermissions"
)}`;

/* ---------------------------------------------------------
   APIS
--------------------------------------------------------- */
const userTypeApi = adminApi.userTypes;
const staffUserTypeApi = adminApi.staffUserTypes;
const mainScreenApi = adminApi.mainscreens;
const userScreenApi = adminApi.userscreens;
const userScreenActionApi = adminApi.userscreenaction;
const userScreenPermissionApi = adminApi.userscreenpermissions;

/* ---------------------------------------------------------
   TYPES
--------------------------------------------------------- */
type Option = { value: string; label: string };

export default function UserScreenPermissionForm() {
  const navigate = useNavigate();
  const { id } = useParams<{ id: string }>();
  const isEdit = Boolean(id);

  /* STATE */
  const [userTypeId, setUserTypeId] = useState("");
  const [staffUserTypeId, setStaffUserTypeId] = useState("");
  const [mainScreenId, setMainScreenId] = useState("");

  const [description, setDescription] = useState("");

  const [userTypes, setUserTypes] = useState<Option[]>([]);
  const [staffUserTypes, setStaffUserTypes] = useState<Option[]>([]);
  const [mainScreens, setMainScreens] = useState<Option[]>([]);
  const [allUserScreens, setAllUserScreens] = useState<any[]>([]);

  const [actions, setActions] = useState<Option[]>([]);

  const [screenMatrix, setScreenMatrix] = useState<
    { userscreen_id: string; userscreen_name: string; actions: string[] }[]
  >([]);

  const [loading, setLoading] = useState(false);

  /* =========================================================
     LOAD MASTER DATA
  ========================================================== */
  useEffect(() => {
    const load = async () => {
      try {
        const ut = await userTypeApi.list();
        const sut = await staffUserTypeApi.list();
        const ms = await mainScreenApi.list();
        const us = await userScreenApi.list();
        const ac = await userScreenActionApi.list();

        setUserTypes(ut.map((x: any) => ({ value: x.unique_id, label: x.name })));
        setStaffUserTypes(sut.map((x: any) => ({ value: x.unique_id, label: x.name })));
        setMainScreens(ms.map((x: any) => ({ value: x.unique_id, label: x.mainscreen_name })));

        setAllUserScreens(us);

        setActions(
          ac.map((x: any) => ({ value: x.unique_id, label: x.action_name }))
        );
      } catch {
        Swal.fire("Error", "Failed to load dropdown values", "error");
      }
    };

    load();
  }, []);

  /* =========================================================
     EDIT MODE → LOAD EXISTING PERMISSION RECORD
  ========================================================== */
  useEffect(() => {
    if (!isEdit) return;

    const loadRecord = async () => {
      try {
        const res = await userScreenPermissionApi.get(id!);
        const data = res.data ?? res;

        setUserTypeId(data.usertype_id);
        setStaffUserTypeId(data.staffusertype_id);
        setMainScreenId(data.mainscreen_id);
        setDescription(data.description || "");

        if (data.screens) {
          // We'll refill matrix after mainScreen auto-load
          setTimeout(() => {
            setScreenMatrix(
              data.screens.map((s: any) => ({
                userscreen_id: s.userscreen_id,
                userscreen_name: allUserScreens.find((u: any) => u.unique_id === s.userscreen_id)
                  ?.userscreen_name,
                actions: s.actions,
              }))
            );
          }, 300);
        }
      } catch {
        Swal.fire("Error", "Unable to load permission record", "error");
      }
    };

    loadRecord();
  }, [id, isEdit, allUserScreens]);

  /* =========================================================
     WHEN MAIN SCREEN SELECTED → AUTO LOAD USER SCREENS
  ========================================================== */
  useEffect(() => {
    if (!mainScreenId) {
      setScreenMatrix([]);
      return;
    }

    const filtered = allUserScreens.filter(
      (u: any) => u.mainscreen_id === mainScreenId
    );

    const matrix = filtered.map((u: any) => ({
      userscreen_id: u.unique_id,
      userscreen_name: u.userscreen_name,
      actions: [],
    }));

    setScreenMatrix(matrix);
  }, [mainScreenId, allUserScreens]);

  /* =========================================================
     TOGGLE ACTION FOR A ROW
  ========================================================== */
  const handleActionToggle = (screenId: string, actionId: string, checked: boolean) => {
    setScreenMatrix((prev) =>
      prev.map((row) =>
        row.userscreen_id === screenId
          ? {
            ...row,
            actions: checked
              ? [...row.actions, actionId]
              : row.actions.filter((a) => a !== actionId),
          }
          : row
      )
    );
  };

  /* =========================================================
     SELECT ALL ACTIONS FOR A SCREEN ROW
  ========================================================== */
  const handleSelectAll = (screenId: string, checked: boolean) => {
    const allActions = actions.map((a) => a.value);

    setScreenMatrix((prev) =>
      prev.map((row) =>
        row.userscreen_id === screenId
          ? { ...row, actions: checked ? allActions : [] }
          : row
      )
    );
  };

  /* =========================================================
     SUBMIT FORM
  ========================================================== */
  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault();

    if (!userTypeId || !staffUserTypeId || !mainScreenId) {
      Swal.fire("Missing Fields", "Required fields must be selected", "warning");
      return;
    }

    const payload = {
      usertype_id: userTypeId,
      staffusertype_id: staffUserTypeId,
      mainscreen_id: mainScreenId,
      screens: screenMatrix.map((s) => ({
        userscreen_id: s.userscreen_id,
        actions: s.actions,
      })),
      description: description.trim(),
    };

    try {
      setLoading(true);

      await userScreenPermissionApi.action(
        `bulk-sync-multi/${staffUserTypeId}`,
        payload
      );

      Swal.fire("Success", "Permissions saved successfully", "success");
      navigate(ENC_LIST_PATH);
    } catch {
      Swal.fire("Error", "Failed to save data", "error");
    } finally {
      setLoading(false);
    }
  };

  /* =========================================================
     JSX UI
  ========================================================== */
  return (
    <ComponentCard title={isEdit ? "Edit Permission" : "Add Permission"}>
      <form onSubmit={handleSubmit} noValidate>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">

          {/* USER TYPE */}
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

          {/* STAFF USER TYPE */}
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

          {/* MAIN SCREEN */}
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

        </div>

        {/* PERMISSION TABLE */}
        <div className="mt-6 border rounded-lg p-4 bg-white shadow-sm">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b font-semibold">
                <th className="p-2 w-10">#</th>
                <th className="p-2 text-left">Screen</th>

                <th className="p-2 text-center">All</th>
                {actions.map((act) => (
                  <th key={act.value} className="p-2 text-center">
                    {act.label}
                  </th>
                ))}
              </tr>
            </thead>

            <tbody>
              {screenMatrix.map((row, index) => {
                const allChecked = row.actions.length === actions.length;

                return (
                  <tr key={row.userscreen_id} className="border-b">
                    <td className="p-2 text-center">{index + 1}</td>
                    <td className="p-2">{row.userscreen_name}</td>

                    {/* ALL */}
                    <td className="p-2 text-center">
                      <input
                        type="checkbox"
                        checked={allChecked}
                        onChange={(e) =>
                          handleSelectAll(row.userscreen_id, e.target.checked)
                        }
                      />
                    </td>

                    {/* INDIVIDUAL ACTIONS */}
                    {actions.map((act) => (
                      <td key={act.value} className="p-2 text-center">
                        <input
                          type="checkbox"
                          checked={row.actions.includes(act.value)}
                          onChange={(e) =>
                            handleActionToggle(
                              row.userscreen_id,
                              act.value,
                              e.target.checked
                            )
                          }
                        />
                      </td>
                    ))}
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>

        {/* DESCRIPTION */}
        <div className="mt-6">
          <Label>Description</Label>
          <Input
            value={description}
            onChange={(e) => setDescription(e.target.value)}
            placeholder="Enter description"
          />
        </div>

        {/* BUTTONS */}
        <div className="flex justify-end gap-3 mt-6">
          <Button disabled={loading} type="submit">
            {loading ? "Saving..." : "Save"}
          </Button>

          <Button type="button" variant="destructive" onClick={() => navigate(ENC_LIST_PATH)}>
            Cancel
          </Button>
        </div>
      </form>
    </ComponentCard>
  );
}
