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

/* -----------------------------------------
   ROUTES
----------------------------------------- */
const encAdmins = encryptSegment("admins");
const encUserScreen = encryptSegment("userscreens");
const ENC_LIST_PATH = `/${encAdmins}/${encUserScreen}`;

/* -----------------------------------------
   APIS
----------------------------------------- */

import {
  userScreenApi,
  mainScreenApi
} from "@/helpers/admin";


/* =========================================
    FORM COMPONENT
========================================= */
export default function UserScreenForm() {
    /* FORM FIELDS */
    const [mainscreenId, setMainscreenId] = useState("");
    const [userScreenName, setUserScreenName] = useState("");
    const [folderName, setFolderName] = useState("");
    const [iconName, setIconName] = useState("");
    const [orderNo, setOrderNo] = useState("");
    const [description, setDescription] = useState("");
    const [isActive, setIsActive] = useState(true);

    /* MASTER DROPDOWN */
    const [mainScreens, setMainScreens] = useState<
        { value: string; label: string }[]
    >([]);

    /* STATE */
    const [loading, setLoading] = useState(false);

    const navigate = useNavigate();
    const { id } = useParams<{ id: string }>();
    const isEdit = Boolean(id);

    /* =========================================
        LOAD MAINSCREENS FOR DROPDOWN
    ========================================= */
    useEffect(() => {
        (async () => {
            try {
                const res = await mainScreenApi.list();
                const mapped = res
                    .filter((x: any) => x.is_active)
                    .map((x: any) => ({
                        value: x.unique_id,
                        label: x.mainscreen_name,
                    }));

                setMainScreens(mapped);
            } catch (err) {
                Swal.fire("Error", "Failed to load mainscreens", "error");
            }
        })();
    }, []);

    /* =========================================
        EDIT MODE — LOAD EXISTING RECORD
    ========================================= */
    useEffect(() => {
        if (!isEdit || !id) return;

        (async () => {
            try {
                const data = await userScreenApi.get(id);

                setMainscreenId(data.mainscreen_id ?? "");
                setUserScreenName(data.userscreen_name ?? "");
                setFolderName(data.folder_name ?? "");
                setIconName(data.icon_name ?? "");
                setOrderNo(String(data.order_no ?? ""));
                setDescription(data.description ?? "");
                setIsActive(Boolean(data.is_active));
            } catch (err) {
                Swal.fire("Error", "Unable to load record.", "error");
            }
        })();
    }, [id, isEdit]);

    /* =========================================
        SUBMIT HANDLER
    ========================================= */
    const handleSubmit = async (e: FormEvent) => {
        e.preventDefault();

        if (!mainscreenId || !userScreenName.trim() || !folderName.trim()) {
            Swal.fire("Missing Fields", "Please fill all required fields.", "warning");
            return;
        }

        setLoading(true);

        try {
            const payload = {
                mainscreen_id: mainscreenId,
                userscreen_name: userScreenName.trim(),
                folder_name: folderName.trim(),
                icon_name: iconName.trim(),
                order_no: Number(orderNo),
                description: description.trim(),
                is_active: isActive,
            };

            if (isEdit && id) {
                await userScreenApi.update(id, payload);
                Swal.fire("Success", "Updated successfully!", "success");
            } else {
                await userScreenApi.create(payload);
                Swal.fire("Success", "Added successfully!", "success");
            }

            navigate(ENC_LIST_PATH);
        } catch (err: any) {
            Swal.fire("Save failed", "Unable to save record.", "error");
        } finally {
            setLoading(false);
        }
    };

    /* =========================================
        JSX
    ========================================= */
    return (
        <ComponentCard
            title={isEdit ? "Edit User Screen" : "Add User Screen"}
        >
            <form onSubmit={handleSubmit} noValidate>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">

                    {/* Mainscreen */}
                    <div>
                        <Label>Main Screen *</Label>
                        <Select
                            value={mainscreenId}
                            onValueChange={(val) => setMainscreenId(val)}
                        >
                            <SelectTrigger className="input-validate w-full">
                                <SelectValue placeholder="Select main screen" />
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

                    {/* User Screen Name */}
                    <div>
                        <Label>User Screen Name *</Label>
                        <Input
                            value={userScreenName}
                            onChange={(e) => setUserScreenName(e.target.value)}
                            placeholder="Enter screen name"
                            required
                            className="input-validate w-full"
                        />
                    </div>

                    {/* Folder Name */}
                    <div>
                        <Label>Folder Path *</Label>
                        <Input
                            value={folderName}
                            onChange={(e) => setFolderName(e.target.value)}
                            placeholder="/your-path"
                            required
                            className="input-validate w-full"
                        />
                    </div>

                    {/* Icon Name */}
                    <div>
                        <Label>Icon Name</Label>
                        <Input
                            value={iconName}
                            onChange={(e) => setIconName(e.target.value)}
                            placeholder="Enter icon name"
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
                            placeholder="Enter display order"
                            className="input-validate w-full"
                        />
                    </div>

                    {/* Description */}
                    <div className="md:col-span-2">
                        <Label>Description</Label>
                        <Input
                            value={description}
                            onChange={(e) => setDescription(e.target.value)}
                            placeholder="Description (optional)"
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
