import { useEffect, useState } from "react";
import { useNavigate, useParams } from "react-router-dom";
import Swal from "sweetalert2";
import ComponentCard from "@/components/common/ComponentCard";
import Select from "@/components/form/Select";
import Label from "@/components/form/Label";
import { Input } from "@/components/ui/input";
import { getEncryptedRoute } from "@/utils/routeCache";
import { adminApi } from "@/helpers/admin/registry";

const FILE_ICON =
  "https://cdn-icons-png.flaticon.com/512/337/337946.png";

const complaintApi = adminApi.complaints;

export default function ComplaintEditForm() {
  const { id } = useParams();
  const navigate = useNavigate();

  const [status, setStatus] = useState("PROGRESSING");
  const [remarks, setRemarks] = useState("");

  const [closeFile, setCloseFile] = useState<File | null>(null);
  const [previewUrl, setPreviewUrl] = useState<string>("");
  const [isPreviewImage, setIsPreviewImage] = useState<boolean>(false);
  const [previewName, setPreviewName] = useState<string>("");

  const [data, setData] = useState<any>(null);

  const { encCitizenGrivence, encComplaint } = getEncryptedRoute();

  const ENC_LIST_PATH = `/${encCitizenGrivence}/${encComplaint}`;


  const isImageUrl = (url: string) => {
    const lower = url.toLowerCase();
    return (
      lower.endsWith(".jpg") ||
      lower.endsWith(".jpeg") ||
      lower.endsWith(".png") ||
      lower.endsWith(".webp")
    );
  };

  const isImageFile = (f: File) =>
    f.type.startsWith("image/") || isImageUrl(f.name || "");

  useEffect(() => {
    const load = async () => {
      if (!id) return;
      const c = await complaintApi.get(id);

      setData(c);
      setStatus(c.status);
      setRemarks(c.action_remarks || "");

      if (c.close_image_url) {
        setPreviewUrl(isImageUrl(c.close_image_url) ? c.close_image_url : FILE_ICON);
        setIsPreviewImage(isImageUrl(c.close_image_url));
        setPreviewName(c.close_image_url.split("/").pop() || "file");
      }
    };

    load();
  }, [id]);

  const upload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const f = e.target.files?.[0];
    if (!f) return;

    setCloseFile(f);
    setPreviewName(f.name);

    if (isImageFile(f)) {
      setIsPreviewImage(true);
      setPreviewUrl(URL.createObjectURL(f));
    } else {
      setIsPreviewImage(false);
      setPreviewUrl(FILE_ICON);
    }
  };

  const clearFile = () => {
    setCloseFile(null);
    setPreviewUrl("");
    setPreviewName("");
  };

  const save = async (e: React.FormEvent) => {
    e.preventDefault();

    const fd = new FormData();
    fd.append("status", status);
    fd.append("action_remarks", remarks);
    if (closeFile) fd.append("close_image", closeFile);

    if (!id) return;
    await complaintApi.update(id, fd, {
      headers: { "Content-Type": "multipart/form-data" },
    });
    Swal.fire("Updated", "Complaint updated", "success");
    navigate(ENC_LIST_PATH);
  };

  if (!data) return <div>Loading…</div>;

  return (
    <ComponentCard title="Update Complaint">
      <form onSubmit={save}>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">

          <div>
            <Label>Status</Label>
            <Select
              value={status}
              onChange={(v) => setStatus(v)}
              options={[
                { value: "PROGRESSING", label: "Progressing" },
                { value: "CLOSED", label: "Closed" },
              ]}
            />
          </div>

          <div>
            <Label>Action Remarks</Label>
            <Input
              value={remarks}
              onChange={(e) => setRemarks(e.target.value)}
            />
          </div>

          <div className="md:col-span-2">
            <Label>Close Image / Document</Label>

            <input
              type="file"
              accept=".jpg,.jpeg,.png,.webp,.pdf,.doc,.docx"
              onChange={upload}
              className="hidden"
              id="closeFileInput"
            />

            {/* Upload Box */}
            <div
              className="border border-gray-300 rounded flex flex-col items-center justify-center p-3 cursor-pointer bg-gray-50 hover:bg-gray-100 relative group transition-all duration-200 w-60 h-32"
              onClick={() =>
                document.getElementById("closeFileInput")?.click()
              }
            >
              {previewUrl ? (
                <>
                  {isPreviewImage ? (
                    <img
                      src={previewUrl}
                      alt="Preview"
                      className="w-full h-full object-contain rounded"
                    />
                  ) : (
                    <img
                      src={FILE_ICON}
                      alt="File icon"
                      className="w-16 h-16 opacity-80"
                    />
                  )}
                </>
              ) : (
                <>
                  <img
                    src={FILE_ICON}
                    alt="Upload"
                    className="w-10 h-10 opacity-60"
                  />
                  <p className="text-gray-500 text-sm mt-1 text-center">
                    Drag & drop or click to upload
                  </p>
                </>
              )}
            </div>

            {/* PREVIEW + REMOVE BUTTONS */}
            {previewUrl && (
              <div className="flex items-center gap-3 mt-3">

                {/* Preview with filename */}
                <button
                  type="button"
                  onClick={() => {
                    if (isPreviewImage) {
                      window.open(previewUrl, "_blank");
                    } else {
                      window.open(
                        closeFile
                          ? URL.createObjectURL(closeFile)
                          : previewUrl,
                        "_blank"
                      );
                    }
                  }}
                  className="bg-blue-600 text-white px-3 py-1 rounded text-sm"
                >
                  Preview ({previewName || "File"})
                </button>

                {/* Remove */}
                <button
                  type="button"
                  onClick={clearFile}
                  className="bg-red-500 text-white px-3 py-1 rounded text-sm"
                >
                  Remove
                </button>

              </div>
            )}
          </div>
        </div>

        <div className="flex justify-end gap-3 mt-6">
          <button className="bg-green-custom text-white px-4 py-2 rounded">
            Update
          </button>

          <button
            type="button"
            onClick={() => navigate(ENC_LIST_PATH)}
            className="bg-red-400 text-white px-4 py-2 rounded"
          >
            Cancel
          </button>
        </div>
      </form>
    </ComponentCard>
  );
}
