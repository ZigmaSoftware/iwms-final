import { useTranslation } from "react-i18next";

export default function VehicleCreationList() {
  const { t } = useTranslation();

  return <div>{t("admin.vehicle_creation.title")}</div>;
}
