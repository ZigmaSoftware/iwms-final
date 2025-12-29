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
import { useTranslation } from "react-i18next";

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
    const { t } = useTranslation();
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
                Swal.fire(
                    t("common.error"),
                    t("common.load_failed"),
                    "error"
                );
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
                Swal.fire(
                    t("common.error"),
                    t("common.load_failed"),
                    "error"
                );
            }
        })();
    }, [id, isEdit]);

    /* =========================================
        SUBMIT HANDLER
    ========================================= */
    const handleSubmit = async (e: FormEvent) => {
        e.preventDefault();

        if (!mainscreenId || !userScreenName.trim() || !folderName.trim()) {
            Swal.fire(
                t("common.warning"),
                t("common.missing_fields"),
                "warning"
            );
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
                Swal.fire(t("common.success"), t("common.updated_success"), "success");
            } else {
                await userScreenApi.create(payload);
                Swal.fire(t("common.success"), t("common.added_success"), "success");
            }

            navigate(ENC_LIST_PATH);
        } catch (err: any) {
            Swal.fire(
                t("common.save_failed"),
                t("common.save_failed_desc"),
                "error"
            );
        } finally {
            setLoading(false);
        }
    };

    /* =========================================
        JSX
    ========================================= */
    return (
        <ComponentCard
            title={
                isEdit
                    ? t("common.edit_item", { item: t("admin.nav.user_screen") })
                    : t("common.add_item", { item: t("admin.nav.user_screen") })
            }
        >
            <form onSubmit={handleSubmit} noValidate>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">

                    {/* Mainscreen */}
                    <div>
                        <Label>{t("admin.nav.main_screen")} *</Label>
                        <Select
                            value={mainscreenId}
                            onValueChange={(val) => setMainscreenId(val)}
                        >
                            <SelectTrigger className="input-validate w-full">
                                <SelectValue
                                    placeholder={t("common.select_item_placeholder", {
                                        item: t("admin.nav.main_screen"),
                                    })}
                                />
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
                        <Label>
                            {t("common.item_name", {
                                item: t("admin.nav.user_screen"),
                            })}{" "}
                            *
                        </Label>
                        <Input
                            value={userScreenName}
                            onChange={(e) => setUserScreenName(e.target.value)}
                            placeholder={t("common.enter_item_name", {
                                item: t("admin.nav.user_screen"),
                            })}
                            required
                            className="input-validate w-full"
                        />
                    </div>

                    {/* Folder Name */}
                    <div>
                        <Label>{t("common.folder_path")} *</Label>
                        <Input
                            value={folderName}
                            onChange={(e) => setFolderName(e.target.value)}
                            placeholder={t("common.folder_path_placeholder")}
                            required
                            className="input-validate w-full"
                        />
                    </div>

                    {/* Icon Name */}
                    <div>
                        <Label>{t("common.icon_name")}</Label>
                        <Input
                            value={iconName}
                            onChange={(e) => setIconName(e.target.value)}
                            placeholder={t("common.enter_icon_name")}
                            className="input-validate w-full"
                        />
                    </div>

                    {/* Order No */}
                    <div>
                        <Label>{t("common.order_no")}</Label>
                        <Input
                            type="number"
                            value={orderNo}
                            onChange={(e) => setOrderNo(e.target.value)}
                            placeholder={t("common.order_no_placeholder")}
                            className="input-validate w-full"
                        />
                    </div>

                    {/* Description */}
                    <div className="md:col-span-2">
                        <Label>{t("common.description")}</Label>
                        <Input
                            value={description}
                            onChange={(e) => setDescription(e.target.value)}
                            placeholder={t("common.description_optional")}
                            className="input-validate w-full"
                        />
                    </div>

                    {/* Status */}
                    <div>
                        <Label>{t("common.status")} *</Label>
                        <Select
                            value={isActive ? "true" : "false"}
                            onValueChange={(v) => setIsActive(v === "true")}
                        >
                            <SelectTrigger className="input-validate w-full">
                                <SelectValue placeholder={t("common.select_status")} />
                            </SelectTrigger>

                            <SelectContent>
                                <SelectItem value="true">
                                    {t("common.active")}
                                </SelectItem>
                                <SelectItem value="false">
                                    {t("common.inactive")}
                                </SelectItem>
                            </SelectContent>
                        </Select>
                    </div>
                </div>

                {/* Buttons */}
                <div className="flex justify-end gap-3 mt-6">
                    <Button type="submit" disabled={loading}>
                        {loading
                            ? isEdit
                                ? t("common.updating")
                                : t("common.saving")
                            : isEdit
                                ? t("common.update")
                                : t("common.save")}
                    </Button>

                    <Button
                        type="button"
                        variant="destructive"
                        onClick={() => navigate(ENC_LIST_PATH)}
                    >
                        {t("common.cancel")}
                    </Button>
                </div>
            </form>
        </ComponentCard>
    );
}
