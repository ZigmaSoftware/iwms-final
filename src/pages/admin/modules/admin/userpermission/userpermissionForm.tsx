import { useEffect, useState } from "react";
import Swal from "sweetalert2";
import {desktopApi} from "@/api";
import { useNavigate, useLocation, useParams } from "react-router-dom";
import { getEncryptedRoute } from "@/utils/routeCache";

const { encAdmins, encUserPermission } = getEncryptedRoute();


const ENC_LIST_PATH = `/${encAdmins}/${encUserPermission}`;

type PermissionSet = {
  all: boolean;
  add: boolean;
  update: boolean;
  list: boolean;
  delete: boolean;
  view: boolean;
  print: boolean;
};

const CHILD_PERMISSION_KEYS: Array<Exclude<keyof PermissionSet, "all">> = [
  "add",
  "update",
  "list",
  "delete",
  "view",
  "print",
];

const PERMISSION_KEYS: Array<keyof PermissionSet> = ["all", ...CHILD_PERMISSION_KEYS];

type ScreenPermission = {
  id: number;
  screen_name: string;
  permissions: PermissionSet;
};

type MainScreen = {
  id: number;
  mainscreen: string;
  is_active: boolean;
  is_delete: boolean;
};

export default function UserPermission() {
  const navigate = useNavigate();
  const location = useLocation();
  const { id } = useParams();
  const isEdit = Boolean(id && id !== "new");

  const [userTypes, setUserTypes] = useState<{ value: string; label: string }[]>([]);
  const [mainScreens, setMainScreens] = useState<MainScreen[]>([]);
  const [selectedUserType, setSelectedUserType] = useState("");
  const [selectedMainScreen, setSelectedMainScreen] = useState("");
  const [screens, setScreens] = useState<ScreenPermission[]>([]);
  const [loading, setLoading] = useState(false);
  const [originalUserType, setOriginalUserType] = useState<string | null>(null);
  const [originalMainScreen, setOriginalMainScreen] = useState<string | null>(null);

  const createEmptyPermissions = (): PermissionSet => ({
    all: false,
    add: false,
    update: false,
    list: false,
    delete: false,
    view: false,
    print: false,
  });

  // �Y"� Fetch dropdowns on mount
  useEffect(() => {
    fetchUserTypes();
    fetchMainScreens();
  }, []);

  const fetchUserTypes = async () => {
    try {
      const res = await desktopApi.get("user-type/");
      const activeTypes = res.data
        .filter((t: any) => t.is_active)
        .map((t: any) => ({ value: t.id.toString(), label: t.name }));
      setUserTypes(activeTypes);
    } catch (err) {
      console.error("Error fetching user types:", err);
    }
  };

  const clearExistingPermissions = async () => {
    if (!originalUserType || !originalMainScreen) {
      return;
    }

    try {
      const res = await desktopApi.get("userpermissions/", {
        params: {
          user_type: originalUserType,
          main_screen: originalMainScreen,
        },
      });

      if (!Array.isArray(res.data) || res.data.length === 0) {
        return;
      }

      for (const record of res.data) {
        await desktopApi.delete(`userpermissions/${record.id}/`);
      }
    } catch (error) {
      console.error("Failed to clear existing permissions:", error);
    }
  };

  const fetchMainScreens = async () => {
    try {
      const res = await desktopApi.get("mainuserscreen/");
      setMainScreens(res.data.filter((m: any) => m.is_active && !m.is_delete));
    } catch (error) {
      console.error("Error fetching main screens:", error);
    }
  };

  // �Y"� Fetch screens by main screen (triggered when dropdown changes)
  const fetchScreensByMainScreen = async (mainScreenId: string) => {
    if (!mainScreenId) {
      setScreens([]);
      return;
    }

    try {
      setLoading(true);
      const res = await desktopApi.get<ScreenPermission[]>("userscreens/", {
        params: { mainscreen: mainScreenId },
      });

      const withPermissions = res.data.map((screen) => ({
        ...screen,
        permissions: createEmptyPermissions(),
      }));
      setScreens(withPermissions);

      // If user type selected ��' try to load any saved permissions
      if (selectedUserType) {
        await fetchExistingPermissions(selectedUserType, mainScreenId);
      }
    } catch (error) {
      console.error("Error fetching filtered screens:", error);
      Swal.fire("Error", "Unable to load screens for selected main screen", "error");
    } finally {
      setLoading(false);
    }
  };

  // �Y"� Fetch existing permissions (edit mode or existing saved data)
  const fetchExistingPermissions = async (userType: string, mainScreen: string) => {
    try {
      const res = await desktopApi.get("userpermissions/", {
        params: { user_type: userType, main_screen: mainScreen },
      });

      if (!res.data || res.data.length === 0) return;

      setScreens((prev) =>
        prev.map((screen) => {
          const match = res.data.find((p: any) => p.user_screen === screen.id);
          if (!match) {
            return screen;
          }

          const existingPermissions =
            (match.permissions ?? {}) as Partial<Record<keyof PermissionSet, boolean>>;
          const mergedPermissions = createEmptyPermissions();

          PERMISSION_KEYS.forEach((key) => {
            mergedPermissions[key] = Boolean(existingPermissions[key]);
          });

          return { ...screen, permissions: mergedPermissions };
        })
      );
    } catch (error) {
      console.error("Failed to load saved permissions:", error);
    }
  };

  // �Y"� Handle Edit Mode
  useEffect(() => {
    if (isEdit && location.state) {
      const { user_type, main_screen } = location.state;
      setSelectedUserType(String(user_type));
      setSelectedMainScreen(String(main_screen));
      setOriginalUserType(String(user_type));
      setOriginalMainScreen(String(main_screen));

      // First fetch screens, then load their saved permissions
      fetchScreensByMainScreen(String(main_screen)).then(() => {
        fetchExistingPermissions(String(user_type), String(main_screen));
      });
    }
  }, [isEdit, location.state]);

  // �Y"� Permission checkbox toggle
  const handlePermissionToggle = (screenId: number, field: keyof PermissionSet) => {
    setScreens((prev) =>
      prev.map((s) => {
        if (s.id !== screenId) {
          return s;
        }

        const updatedPermissions: PermissionSet = {
          ...s.permissions,
          [field]: !s.permissions[field],
        };

        if (field !== "all") {
          const areAllSelected = CHILD_PERMISSION_KEYS.every((key) => updatedPermissions[key]);
          updatedPermissions.all = areAllSelected;
        }

        return { ...s, permissions: updatedPermissions };
      })
    );
  };

  // �Y"� "All" toggle ��' select/deselect all permissions in one row
  const handleAllToggle = (screenId: number) => {
    setScreens((prev) =>
      prev.map((s) => {
        if (s.id !== screenId) {
          return s;
        }

        const nextValue = !s.permissions.all;
        const updatedPermissions = createEmptyPermissions();
        PERMISSION_KEYS.forEach((key) => {
          updatedPermissions[key] = nextValue;
        });

        return {
          ...s,
          permissions: updatedPermissions,
        };
      })
    );
  };

  // �Y"� Save permissions
  const handleSave = async () => {
    if (!selectedUserType || !selectedMainScreen) {
      Swal.fire("Warning", "Please select both User Type and Main Screen.", "warning");
      return;
    }

    const payload = screens.map((s) => ({
      user_type: Number(selectedUserType),
      main_screen: Number(selectedMainScreen),
      user_screen: s.id,
      permissions: s.permissions,
      is_active: true,
      is_delete: false,
    }));

    try {
      setLoading(true);
      if (isEdit) {
        await clearExistingPermissions();
      }
      await desktopApi.post("userpermissions/", payload);
      Swal.fire({
        icon: "success",
        title: isEdit ? "Updated successfully!" : "Added successfully!",
        timer: 1500,
        showConfirmButton: false,
      });

      navigate(ENC_LIST_PATH);
    } catch (error) {
      Swal.fire("Error", "Failed to save permissions.", "error");
      console.error("Save error:", error);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="p-8">
      <h1 className="text-2xl font-bold mb-4">
        {isEdit ? "Edit User Permissions" : "Add User Permissions"}
      </h1>

      {/* Dropdowns */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-6">
        <div>
          <label className="block text-gray-700 font-semibold mb-2">User Type</label>
          <select
            value={selectedUserType}
            onChange={(e) => {
              setSelectedUserType(e.target.value);
              // Load permissions again if main screen already chosen
              if (selectedMainScreen) {
                fetchExistingPermissions(e.target.value, selectedMainScreen);
              }
            }}
            className="w-full border border-gray-300 rounded-md p-2 focus:ring-2 focus:ring-green-500"
          >
            <option value="">Select User Type</option>
            {userTypes.map((t) => (
              <option key={t.value} value={t.value}>
                {t.label}
              </option>
            ))}
          </select>
        </div>

        <div>
          <label className="block text-gray-700 font-semibold mb-2">Main Screen</label>
          <select
            value={selectedMainScreen}
            onChange={(e) => {
              const value = e.target.value;
              setSelectedMainScreen(value);
              fetchScreensByMainScreen(value); // �o. FIX: Trigger data load when selected
            }}
            className="w-full border border-gray-300 rounded-md p-2 focus:ring-2 focus:ring-green-500"
          >
            <option value="">Select Main Screen</option>
            {mainScreens.map((m) => (
              <option key={m.id} value={m.id.toString()}>
                {m.mainscreen}
              </option>
            ))}
          </select>
        </div>
      </div>

      {/* Permissions Table */}
      <div className="bg-white rounded-md shadow-sm border border-gray-200 overflow-x-auto">
        {!selectedMainScreen ? (
          <div className="text-gray-500 text-center p-6">
            Select a Main Screen to view related screens and permissions.
          </div>
        ) : loading ? (
          <div className="text-center p-6 text-gray-600">Loading screens...</div>
        ) : (
          <table className="min-w-full border-collapse">
            <thead>
              <tr className="bg-gray-50 text-gray-700 font-semibold text-sm">
                <th className="border p-3 text-center w-16">S.No</th>
                <th className="border p-3 text-left">User Screen</th>
                <th className="border p-3 text-center">All</th>
                <th className="border p-3 text-center">Add</th>
                <th className="border p-3 text-center">Update</th>
                <th className="border p-3 text-center">List</th>
                <th className="border p-3 text-center">Delete</th>
                <th className="border p-3 text-center">View</th>
                <th className="border p-3 text-center">Print</th>
              </tr>
            </thead>
            <tbody>
              {screens.length > 0 ? (
                screens.map((screen, index) => (
                  <tr key={screen.id} className="hover:bg-gray-50">
                    <td className="border p-3 text-center">{index + 1}</td>
                    <td className="border p-3">{screen.screen_name}</td>
                    {PERMISSION_KEYS.map((key) => {
                      const value = screen.permissions[key];
                      const inputId = `${screen.id}-${key}`;
                      return (
                        <td key={key} className="border p-3 text-center">
                          <input
                            id={inputId}
                            type="checkbox"
                            checked={value}
                            onChange={() =>
                              key === "all"
                                ? handleAllToggle(screen.id)
                                : handlePermissionToggle(screen.id, key as keyof PermissionSet)
                            }
                            className="w-4 h-4 accent-green-600"
                          />
                        </td>
                      );
                    })}
                  </tr>
                ))
              ) : (
                <tr>
                  <td colSpan={9} className="text-center p-4 text-gray-500">
                    No screens found for this main screen.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        )}
      </div>

      {/* Buttons */}
      <div className="flex justify-end gap-4 mt-6">
        <button
          onClick={() => navigate(ENC_LIST_PATH)}
          className="bg-red-500 hover:bg-red-600 text-white px-6 py-2 rounded-md"
        >
          Cancel
        </button>
        <button
          onClick={handleSave}
          className="bg-indigo-700 hover:bg-indigo-800 text-white px-6 py-2 rounded-md"
        >
          Save
        </button>
      </div>
    </div>
  );
}
