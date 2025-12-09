import { useEffect, useState } from "react";
import { useNavigate, useParams } from "react-router-dom";
import Swal from "sweetalert2";
import { desktopApi } from "@/api";
import { getEncryptedRoute } from "@/utils/routeCache";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";

const { encAdmins, encStaffUserType } = getEncryptedRoute();
const ENC_LIST_PATH = `/${encAdmins}/${encStaffUserType}`;

type UserType = {
  unique_id: string;
  name: string;
  is_active: boolean;
};

export default function StaffUserTypeForm() {
  const [name, setName] = useState("");
  const [userTypes, setUserTypes] = useState<UserType[]>([]);
  const [selectedUserType, setSelectedUserType] = useState<string>("");
  const [isActive, setIsActive] = useState(true);
  const [loading, setLoading] = useState(false);

  const navigate = useNavigate();
  const { id } = useParams();
  const isEdit = Boolean(id);

  /* ---------------------- FETCH ALL USERTYPES ---------------------- */
  const fetchUserTypes = async () => {
    const res = await desktopApi.get("user-type/");
    const list = Array.isArray(res.data) ? res.data : res.data.results ?? [];

    setUserTypes(list);

    // auto select first usertype if none selected
    if (!selectedUserType && list.length > 0) {
      setSelectedUserType(list[0].unique_id);
    }
  };

  useEffect(() => {
    fetchUserTypes();
  }, []);

  /* ---------------------- EDIT MODE LOAD ---------------------- */
  useEffect(() => {
    if (isEdit) {
      desktopApi
        .get(`staffusertypes/${id}/`)
        .then((res) => {
          setName(res.data.name);
          setIsActive(res.data.is_active);
          setSelectedUserType(res.data.usertype_id);  
        })
        .catch(() => {
          Swal.fire({
            icon: "error",
            title: "Failed to load Staff User Type",
          });
        });
    }
  }, [id, isEdit]);

  /* ---------------------- SUBMIT ---------------------- */
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);

    const payload = {
      usertype_id: selectedUserType,
      name,
      is_active: isActive,
    };

    try {
      if (isEdit) {
        await desktopApi.put(`staffusertypes/${id}/`, payload);
        Swal.fire({ icon: "success", title: "Updated", timer: 1500, showConfirmButton: false });
      } else {
        await desktopApi.post("staffusertypes/", payload);
        Swal.fire({ icon: "success", title: "Created", timer: 1500, showConfirmButton: false });
      }

      navigate(ENC_LIST_PATH);
    } catch (error: any) {
      Swal.fire({
        icon: "error",
        title: "Validation Error",
        text:
          error.response?.data?.usertype_id?.[0] ??
          error.response?.data?.name?.[0] ??
          "Invalid data",
      });
    } finally {
      setLoading(false);
    }
  };

  return (
   <div className="bg-[#f9fafb] min-h-screen p-8">
  <div className="max-w-6xl mx-auto bg-white rounded-xl shadow-md border">
    <div className="px-6 py-4 border-b">
      <h2 className="text-xl font-semibold">Add Staff User Type</h2>
    </div>

    <form onSubmit={handleSubmit} className="px-6 py-6 space-y-6">

      {/* ==================== ROW 1 : User Type + Staff Role ==================== */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">

        {/* USER TYPE */}
        <div>
          <label className="block text-sm font-medium mb-1">
            User Type <span className="text-red-500">*</span>
          </label>

          <Select
            value={selectedUserType}
            onValueChange={(value) => setSelectedUserType(value)}
          >
            <SelectTrigger className="w-full">
              <SelectValue placeholder="Select User Type" />
            </SelectTrigger>

            <SelectContent>
              {userTypes.map((u) => (
                <SelectItem key={u.unique_id} value={u.unique_id}>
                  {u.name}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>

        {/* STAFF ROLE */}
        <div>
          <label className="block text-sm font-medium mb-1">
            Staff User Role <span className="text-red-500">*</span>
          </label>

          <Select value={name} onValueChange={(value) => setName(value)}>
            <SelectTrigger className="w-full">
              <SelectValue placeholder="Select Role" />
            </SelectTrigger>

            <SelectContent>
              <SelectItem value="admin">Admin</SelectItem>
              <SelectItem value="operator">Operator</SelectItem>
              <SelectItem value="driver">Driver</SelectItem>
              <SelectItem value="user">User</SelectItem>
            </SelectContent>
          </Select>
        </div>
      </div>

      {/* ==================== ROW 2 : Active Status ALONE ==================== */}
      <div className="w-full md:w-1/3">
        <label className="block text-sm font-medium mb-1">
          Active Status <span className="text-red-500">*</span>
        </label>

        <Select
          value={isActive ? "Active" : "Inactive"}
          onValueChange={(val) => setIsActive(val === "Active")}
        >
          <SelectTrigger className="w-full">
            <SelectValue placeholder="Select Status" />
          </SelectTrigger>

          <SelectContent>
            <SelectItem value="Active">Active</SelectItem>
            <SelectItem value="Inactive">Inactive</SelectItem>
          </SelectContent>
        </Select>
      </div>

      {/* ==================== BUTTONS ==================== */}
      <div className="flex justify-end gap-3 pt-4">
        <button
          type="submit"
          disabled={loading}
          className="bg-green-600 text-white px-6 py-2 rounded"
        >
          {loading ? "Saving..." : "Save"}
        </button>

        <button
          type="button"
          onClick={() => navigate(ENC_LIST_PATH)}
          className="bg-red-600 text-white px-6 py-2 rounded"
        >
          Cancel
        </button>
      </div>

    </form>
  </div>
</div>

  );
}
