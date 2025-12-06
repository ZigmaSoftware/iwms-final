import { useEffect, useState } from "react";
import { useNavigate, useParams } from "react-router-dom";
import Swal from "sweetalert2";
import {desktopApi} from "@/api";
import { Input } from "@/components/ui/input";
import { getEncryptedRoute } from "@/utils/routeCache";

const { encAdmins, encUserType } = getEncryptedRoute();
const ENC_LIST_PATH = `/${encAdmins}/${encUserType}`;

export default function UserTypeForm() {
  const [name, setName] = useState("");
  const [isActive, setIsActive] = useState(true);
  const [loading, setLoading] = useState(false);

  const navigate = useNavigate();
  const { id } = useParams();
  const userTypeId = id;
  const isEdit = Boolean(userTypeId);

  useEffect(() => {
    if (isEdit) {
      desktopApi
        .get(`user-type/${userTypeId}/`)
        .then((res) => {
          setName(res.data.name);
          setIsActive(res.data.is_active);
              
        })
      
        .catch(() =>
          Swal.fire({
            icon: "error",
            title: "Failed to load user type",
            text: "Something went wrong!",
          })
        );
    }
  }, [userTypeId, isEdit]);

  const handleSubmit = async (e: any) => {
    e.preventDefault();
    setLoading(true);

    const payload = {
      name,
      is_active: isActive,
    };

    try {
      if (isEdit) {
        await desktopApi.put(`user-type/${userTypeId}/`, payload);
        Swal.fire({
          icon: "success",
          title: "Updated successfully!",
          timer: 1500,
          showConfirmButton: false,
        });
      } else {
        await desktopApi.post("user-type/", payload);
        Swal.fire({
          icon: "success",
          title: "Added successfully!",
          timer: 1500,
          showConfirmButton: false,
        });
      }

      navigate(ENC_LIST_PATH);
    } catch (error: any) {
      const message =
        error?.response?.data?.name?.[0] ||
        error?.response?.data?.detail ||
        "Unable to save user type.";

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
    <div className="bg-[#f9fafb] min-h-screen p-8">
      <div className="max-w-6xl mx-auto bg-white rounded-xl shadow-sm border">
        <div className="px-6 py-4 border-b">
          <h2 className="text-lg font-semibold text-gray-800">
            {isEdit ? "Edit User Type" : "Add User Type"}
          </h2>
        </div>

        <form onSubmit={handleSubmit} className="px-6 py-6 space-y-6">

          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {/* Name Field */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                User Type Name <span className="text-red-500">*</span>
              </label>

              <Input
                type="text"
                placeholder="Enter user type name"
                value={name}
                required
                onChange={(e) => setName(e.target.value)}
              />
            </div>

            {/* Status Dropdown */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Active Status <span className="text-red-500">*</span>
              </label>

              <select
                value={isActive ? "Active" : "Inactive"}
                onChange={(e) => setIsActive(e.target.value === "Active")}
                className="w-full px-3 py-2 border border-green-400 rounded-sm focus:outline-none focus:ring-2 focus:ring-green-200"
              >
                <option value="Active">Active</option>
                <option value="Inactive">Inactive</option>
              </select>
            </div>
          </div>

          {/* Buttons */}
          <div className="flex justify-end gap-3">
            <button
              type="submit"
              disabled={loading}
              className="bg-green-600 text-white font-medium px-6 py-2 rounded hover:bg-green-700 transition disabled:opacity-50"
            >
              {loading ? "Saving..." : "Save"}
            </button>

            <button
              type="button"
              onClick={() => navigate(ENC_LIST_PATH)}
              className="bg-red-500 text-white font-medium px-6 py-2 rounded hover:bg-red-600 transition"
            >
              Cancel
            </button>
          </div>

        </form>
      </div>
    </div>
  );
}
