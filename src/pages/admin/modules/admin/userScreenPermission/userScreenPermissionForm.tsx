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

const ENC_LIST_PATH = `/${encryptSegment("admins")}/${encryptSegment(
  "userscreenpermissions"
)}`;

import {
  staffUserTypeApi,
  mainScreenApi,
  userScreenApi,
  userScreenActionApi,
  userScreenPermissionApi
} from "@/helpers/admin";


type Option = {
  value: string;
  label: string;
  userTypeId?: string;
  alreadyAssigned?: boolean;
};

export default function UserScreenPermissionForm() {
  const navigate = useNavigate();

  // Only staffTypeId in route now
  const params = useParams();
  const staffTypeId = params.id;

  const isEdit = Boolean(staffTypeId);

  const [staffUserTypeId, setStaffUserTypeId] = useState("");
  const [mainScreenId, setMainScreenId] = useState("");
  const [description, setDescription] = useState("");
  const [userTypeId, setUserTypeId] = useState("");

  const [staffUserTypes, setStaffUserTypes] = useState<Option[]>([]);
  const [mainScreens, setMainScreens] = useState<Option[]>([]);
  const [allUserScreens, setAllUserScreens] = useState<any[]>([]);
  const [actions, setActions] = useState<Option[]>([]);

  const [screenMatrix, setScreenMatrix] = useState<
    { userscreen_id: string; userscreen_name: string; actions: string[] }[]
  >([]);

  const [loading, setLoading] = useState(false);
  const [loadingData, setLoadingData] = useState(false);

  /* -----------------------------------------------------------
     LOAD DROPDOWNS
  ----------------------------------------------------------- */
  useEffect(() => {
    const load = async () => {
      try {
        setLoadingData(true);

        const [sut, ms, us, ac, perms] = await Promise.all([
          staffUserTypeApi.list(),
          mainScreenApi.list(),
          userScreenApi.list(),
          userScreenActionApi.list(),
          userScreenPermissionApi.list(),
        ]);

        const usedStaffTypes = new Set(
          perms.map((p: any) => p.staffusertype_id)
        );

        setStaffUserTypes(
          sut.map((x: any) => ({
            value: x.unique_id,
            label: x.name,
            userTypeId: x.usertype_id,
            alreadyAssigned: usedStaffTypes.has(x.unique_id), // <-- store flag
          }))
        );

        setMainScreens(
          ms.map((x: any) => ({
            value: x.unique_id,
            label: x.mainscreen_name,
          }))
        );

        setAllUserScreens(us);

        setActions(
          ac.map((x: any) => ({ value: x.unique_id, label: x.action_name }))
        );
      } catch {
        Swal.fire("Error", "Failed to load dropdown values", "error");
      } finally {
        setLoadingData(false);
      }
    };

    load();
  }, []);

  /* -----------------------------------------------------------
     EDIT MODE — Prefill only StaffUserType
  ----------------------------------------------------------- */
  useEffect(() => {
    if (!isEdit || !staffTypeId) return;

    setStaffUserTypeId(staffTypeId);
    setMainScreenId(""); // User must select manually
    setScreenMatrix([]); // Reset table
  }, [isEdit, staffTypeId]);

  /* -----------------------------------------------------------
     LOAD PERMISSIONS AFTER USER SELECTS MAIN SCREEN
  ----------------------------------------------------------- */
  useEffect(() => {
    if (!staffUserTypeId || !mainScreenId) return;

    const loadPermissions = async () => {
      try {
        let formatted: any = null;

        // TRY TO LOAD PERMISSIONS
        try {
          formatted = await userScreenPermissionApi.get(
            `by-staff-format/?staffusertype_id=${staffUserTypeId}&mainscreen_id=${mainScreenId}`
          );
        } catch (err) {
          // backend returns 404 → treat as no permissions
          formatted = { screens: [], description: "" };
        }

        // ---- ALWAYS LOAD ALL USER SCREENS FOR THIS MAIN SCREEN ----
        const fullScreens = allUserScreens.filter(
          (u: any) => u.mainscreen_id === mainScreenId
        );

        // map DB permissions
        const dbMap = new Map<string, { actions?: string[] }>(
          (formatted.screens || []).map((s: any) => [s.userscreen_id, s])
        );

        // Merge full list + permissions
        const matrix = fullScreens.map((scr: any) => ({
          userscreen_id: scr.unique_id,
          userscreen_name: scr.userscreen_name,
          actions: dbMap.get(scr.unique_id)?.actions || [], // prefill or empty
        }));

        setDescription(formatted.description || "");
        setScreenMatrix(matrix);
      } catch (err) {
        console.error("Permission Load Failed:", err);
        Swal.fire("Error", "Failed to load permission matrix", "error");
      }
    };

    loadPermissions();
  }, [staffUserTypeId, mainScreenId, allUserScreens]);

  /* -----------------------------------------------------------
     AUTO SET USER TYPE
  ----------------------------------------------------------- */
  useEffect(() => {
    if (!staffUserTypeId || staffUserTypes.length === 0) return;

    const sut = staffUserTypes.find((s) => s.value === staffUserTypeId);
    setUserTypeId(sut?.userTypeId || "");
  }, [staffUserTypeId, staffUserTypes]);

  /* -----------------------------------------------------------
     LIST TOGGLE FUNCTIONS
  ----------------------------------------------------------- */
  const handleActionToggle = (
    screenId: string,
    actionId: string,
    checked: boolean
  ) => {
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

  /* -----------------------------------------------------------
     SUBMIT
  ----------------------------------------------------------- */
  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault();

    if (!staffUserTypeId || !mainScreenId) {
      Swal.fire(
        "Missing Fields",
        "Select staff user type & main screen",
        "warning"
      );
      return;
    }

    const payload = {
      staffusertype_id: staffUserTypeId,
      mainscreen_id: mainScreenId,
      screens: screenMatrix,
      description: description.trim(),
      usertype_id: userTypeId,
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
      Swal.fire("Error", "Failed to save", "error");
    } finally {
      setLoading(false);
    }
  };

  /* -----------------------------------------------------------
     RENDER
  ----------------------------------------------------------- */
  if (loadingData) {
    return (
      <ComponentCard title="Loading...">
        <div className="flex justify-center items-center py-12 text-gray-500">
          Loading permission data...
        </div>
      </ComponentCard>
    );
  }

  return (
    <ComponentCard title={isEdit ? "Edit Permission" : "Add Permission"}>
      <form onSubmit={handleSubmit}>
        <div className="grid md:grid-cols-2 gap-6">
          <div>
            <Label>Staff User Type *</Label>

            <Select
              value={staffUserTypeId}
              onValueChange={(v) => {
                const selected = staffUserTypes.find((o) => o.value === v);

                if (selected?.alreadyAssigned && !isEdit) {
                  Swal.fire(
                    "Permission Exists",
                    "This staff user type already has permissions. Redirecting to Edit.",
                    "info"
                  );
                  navigate(
                    `/${encryptSegment("admins")}/${encryptSegment("userscreenpermissions")}/${v}/edit`
                  );
                  return;
                }

                setStaffUserTypeId(v);
              }}
              disabled={isEdit}
            >
              <SelectTrigger>
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

          <div>
            <Label>Main Screen *</Label>
            <Select value={mainScreenId} onValueChange={setMainScreenId}>
              <SelectTrigger>
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
        {screenMatrix.length > 0 && (
          <div className="mt-6 border rounded-lg overflow-x-auto bg-white">
            <table className="w-full">
              <thead className="bg-gray-50 border-b">
                <tr>
                  <th className="px-4 py-3 text-left text-sm font-semibold">
                    #
                  </th>
                  <th className="px-4 py-3 text-left text-sm font-semibold">
                    Screen
                  </th>
                  <th className="px-4 py-3 text-center text-sm font-semibold">
                    All
                  </th>

                  {actions.map((act) => (
                    <th
                      key={act.value}
                      className="px-4 py-3 text-center text-sm font-semibold"
                    >
                      {act.label}
                    </th>
                  ))}
                </tr>
              </thead>

              <tbody>
                {screenMatrix.map((row, i) => {
                  const allChecked = row.actions.length === actions.length;

                  return (
                    <tr
                      key={row.userscreen_id}
                      className="border-b hover:bg-gray-50"
                    >
                      <td className="px-4 py-3 text-sm">{i + 1}</td>
                      <td className="px-4 py-3 text-sm font-medium">
                        {row.userscreen_name}
                      </td>

                      <td className="px-4 py-3 text-center">
                        <input
                          type="checkbox"
                          checked={allChecked}
                          onChange={(e) =>
                            handleSelectAll(row.userscreen_id, e.target.checked)
                          }
                          className="w-4 h-4 cursor-pointer"
                        />
                      </td>

                      {actions.map((act) => (
                        <td key={act.value} className="px-4 py-3 text-center">
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
                            className="w-4 h-4 cursor-pointer"
                          />
                        </td>
                      ))}
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}

        {screenMatrix.length === 0 && mainScreenId && (
          <div className="mt-6 p-8 border rounded-lg bg-gray-50 text-center text-gray-500">
            No screens found for this main screen.
          </div>
        )}

        {mainScreenId && (
          <div className="mt-6">
            <Label>Description</Label>
            <Input
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              placeholder="Enter description (optional)"
            />
          </div>
        )}

        <div className="flex justify-end gap-3 mt-6">
          <Button
            type="submit"
            disabled={loading || !staffUserTypeId || !mainScreenId}
          >
            {loading ? "Saving..." : isEdit ? "Update" : "Save"}
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
